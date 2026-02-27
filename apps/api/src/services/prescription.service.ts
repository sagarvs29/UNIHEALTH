import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { checkConsentService } from './consent.service';

// ─── Drug interaction check (rule-based + open DB) ───────────────────────────
// Real integration with RxNorm API or local table — for demo: rule-based engine

const KNOWN_INTERACTIONS: Record<string, { drug: string; severity: string; effect: string; alternative?: string }[]> = {
  warfarin: [
    { drug: 'aspirin', severity: 'HIGH', effect: 'Increased bleeding risk', alternative: 'Acetaminophen for pain' },
    { drug: 'ibuprofen', severity: 'HIGH', effect: 'Increased anticoagulant effect and GI bleeding' },
    { drug: 'naproxen', severity: 'HIGH', effect: 'Increased anticoagulant effect' },
  ],
  metformin: [
    { drug: 'alcohol', severity: 'MODERATE', effect: 'Increased risk of lactic acidosis' },
    { drug: 'iodine contrast', severity: 'HIGH', effect: 'Risk of lactic acidosis. Stop 48h before contrast.' },
  ],
  simvastatin: [
    { drug: 'amlodipine', severity: 'MODERATE', effect: 'Increased simvastatin concentration', alternative: 'Rosuvastatin' },
    { drug: 'clarithromycin', severity: 'HIGH', effect: 'Risk of myopathy/rhabdomyolysis', alternative: 'Azithromycin' },
  ],
  ssri: [
    { drug: 'tramadol', severity: 'HIGH', effect: 'Serotonin syndrome risk' },
    { drug: 'maoi', severity: 'CRITICAL', effect: 'Potentially fatal serotonin syndrome' },
  ],
  clopidogrel: [
    { drug: 'omeprazole', severity: 'MODERATE', effect: 'Reduced antiplatelet effect', alternative: 'Pantoprazole' },
  ],
  digoxin: [
    { drug: 'amiodarone', severity: 'HIGH', effect: 'Increased digoxin toxicity — bradycardia risk' },
  ],
};

function normalise(name: string): string {
  return name.toLowerCase().replace(/\s+\d.*$/, '').trim(); // strip dosage
}

export function checkDrugInteractions(
  newDrug: string,
  existingDrugs: string[],
  allergies: string[] = [],
  conditions: string[] = []
) {
  const newDrugNorm = normalise(newDrug);
  const interactions: Array<{ drug1: string; drug2: string; severity: string; effect: string; alternative?: string }> = [];
  const allergyConflicts: Array<{ drug: string; allergy: string }> = [];

  // Check new drug against all existing drugs for interactions
  for (const existing of existingDrugs) {
    const existingNorm = normalise(existing);

    // Check in KNOWN_INTERACTIONS table
    const newDrugInteractions = KNOWN_INTERACTIONS[newDrugNorm] || [];
    for (const interaction of newDrugInteractions) {
      if (existingNorm.includes(interaction.drug) || interaction.drug.includes(existingNorm)) {
        interactions.push({
          drug1: newDrug,
          drug2: existing,
          severity: interaction.severity,
          effect: interaction.effect,
          alternative: interaction.alternative,
        });
      }
    }

    // Check reverse
    const existingInteractions = KNOWN_INTERACTIONS[existingNorm] || [];
    for (const interaction of existingInteractions) {
      if (newDrugNorm.includes(interaction.drug) || interaction.drug.includes(newDrugNorm)) {
        interactions.push({
          drug1: existing,
          drug2: newDrug,
          severity: interaction.severity,
          effect: interaction.effect,
          alternative: interaction.alternative,
        });
      }
    }
  }

  // Check allergy conflicts
  for (const allergy of allergies) {
    const allergyNorm = normalise(allergy);
    if (newDrugNorm.includes(allergyNorm) || allergyNorm.includes(newDrugNorm)) {
      allergyConflicts.push({ drug: newDrug, allergy });
    }
  }

  // Determine highest severity
  const severityOrder = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  let overallSeverity = allergyConflicts.length > 0 ? 'CRITICAL' : 'LOW';
  for (const interaction of interactions) {
    if (severityOrder.indexOf(interaction.severity) > severityOrder.indexOf(overallSeverity)) {
      overallSeverity = interaction.severity;
    }
  }

  return { interactions, allergyConflicts, overallSeverity };
}

// ─── Run pharma check ─────────────────────────────────────────────────────────

export async function pharmaCheckService(
  doctorUserId: string,
  data: { patientUhid: string; newDrug: string; newDrugDosage?: string }
) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const patient = await prisma.patient.findUnique({
    where: { uhid: data.patientUhid },
    select: {
      id: true, uhid: true,
      currentMedications: true,
      allergies: true,
      chronicConditions: true,
    },
  });
  if (!patient) throw new Error('Patient not found');

  const newDrugFull = data.newDrugDosage ? `${data.newDrug} ${data.newDrugDosage}` : data.newDrug;

  const result = checkDrugInteractions(
    newDrugFull,
    patient.currentMedications,
    patient.allergies,
    patient.chronicConditions
  );

  return {
    newDrug: newDrugFull,
    checkedAgainst: patient.currentMedications,
    ...result,
    safe: result.interactions.length === 0 && result.allergyConflicts.length === 0,
  };
}

// ─── Create prescription ──────────────────────────────────────────────────────

export async function createPrescriptionService(
  doctorUserId: string,
  data: {
    patientUhid: string;
    diagnosis?: string;
    notes?: string;
    items: Array<{
      medicineName: string;
      genericName?: string;
      dosage: string;
      frequency: string;
      duration: string;
      route?: string;
      instructions?: string;
      rxcui?: string;
    }>;
    overrideInteraction?: boolean;
    overrideReason?: string;
  }
) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const patient = await prisma.patient.findUnique({
    where: { uhid: data.patientUhid },
    select: {
      id: true, uhid: true,
      currentMedications: true, allergies: true, chronicConditions: true,
    },
  });
  if (!patient) throw new Error('Patient not found');

  // Run pharma check on all new drugs
  const allNewDrugs = data.items.map(i => `${i.medicineName} ${i.dosage}`);
  let hasInteractions = false;
  let pharmaCheckResult: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
  const allInteractions: ReturnType<typeof checkDrugInteractions>['interactions'] = [];
  const allAllergyConflicts: ReturnType<typeof checkDrugInteractions>['allergyConflicts'] = [];

  for (const drugFull of allNewDrugs) {
    const checkResult = checkDrugInteractions(
      drugFull,
      [...patient.currentMedications, ...allNewDrugs.filter(d => d !== drugFull)],
      patient.allergies,
      patient.chronicConditions
    );
    allInteractions.push(...checkResult.interactions);
    allAllergyConflicts.push(...checkResult.allergyConflicts);
  }

  if (allInteractions.length > 0 || allAllergyConflicts.length > 0) {
    hasInteractions = true;
    pharmaCheckResult = { interactions: allInteractions, allergyConflicts: allAllergyConflicts } as Prisma.JsonObject;
    if (!data.overrideInteraction) {
      // Return check result without saving — doctor must explicitly override
      return {
        saved: false,
        requiresOverride: true,
        pharmaCheck: pharmaCheckResult,
      };
    }
  }

  // Save prescription
  const prescription = await prisma.prescription.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      diagnosis: data.diagnosis,
      notes: data.notes,
      pharmaCheckDone: true,
      pharmaCheckResult,
      hasInteractions,
      overridden: data.overrideInteraction ?? false,
      overrideReason: data.overrideReason,
      items: {
        create: data.items.map(item => ({
          medicineName: item.medicineName,
          genericName: item.genericName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          route: item.route,
          instructions: item.instructions,
          rxcui: item.rxcui,
        })),
      },
    },
    include: {
      items: true,
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
      patient: { select: { uhid: true, firstName: true, lastName: true } },
    },
  });

  // Update patient's currentMedications
  const newMedsList = data.items.map(i => `${i.medicineName} ${i.dosage}`);
  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      currentMedications: {
        set: [...new Set([...patient.currentMedications, ...newMedsList])],
      },
    },
  });

  return { saved: true, prescription };
}

// ─── Get patient prescriptions ────────────────────────────────────────────────

export async function getPatientPrescriptionsService(patientId: string) {
  return prisma.prescription.findMany({
    where: { patientId },
    include: {
      items: true,
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Create clinical note ─────────────────────────────────────────────────────

export async function createClinicalNoteService(
  doctorUserId: string,
  data: {
    patientUhid: string;
    visitType: string;
    chiefComplaint: string;
    historyOfPresentIllness?: string;
    examinationFindings?: string;
    vitalSigns?: Record<string, string>;
    icd10Code?: string;
    diagnosisName?: string;
    differentialDiagnosis?: string;
    treatmentPlan?: string;
    followUpDate?: string;
    followUpNotes?: string;
  }
) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const patient = await prisma.patient.findUnique({
    where: { uhid: data.patientUhid },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient not found');

  return prisma.clinicalNote.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      visitType: data.visitType,
      chiefComplaint: data.chiefComplaint,
      historyOfPresentIllness: data.historyOfPresentIllness,
      examinationFindings: data.examinationFindings,
      vitalSigns: data.vitalSigns as Prisma.JsonObject | undefined,
      icd10Code: data.icd10Code,
      diagnosisName: data.diagnosisName,
      differentialDiagnosis: data.differentialDiagnosis,
      treatmentPlan: data.treatmentPlan,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      followUpNotes: data.followUpNotes,
    },
    include: {
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
      patient: { select: { uhid: true, firstName: true, lastName: true } },
    },
  });
}

// ─── Get clinical notes for patient ──────────────────────────────────────────

export async function getClinicalNotesService(patientId: string) {
  return prisma.clinicalNote.findMany({
    where: { patientId },
    include: {
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
    },
    orderBy: { visitDate: 'desc' },
  });
}
