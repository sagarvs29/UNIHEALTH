import { prisma } from '../lib/prisma';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─── Decode a record → call Python AI service ─────────────────────────────────

export async function decodeRecordService(recordId: string, requestingUserId: string, requestingRole: string) {
  // Fetch the record
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      patient: {
        select: {
          id: true, userId: true, uhid: true,
          dateOfBirth: true, gender: true, bloodGroup: true,
          chronicConditions: true, allergies: true,
        },
      },
      aiSummary: true,
    },
  });

  if (!record) throw new Error('Record not found');

  // Access control: patients can only decode their own records
  if (requestingRole === 'PATIENT' && record.patient.userId !== requestingUserId) {
    throw new Error('Access denied');
  }

  // Return cached summary if still valid
  if (record.aiSummary) {
    const isCacheValid = !record.aiSummary.cacheValidUntil || record.aiSummary.cacheValidUntil > new Date();
    if (isCacheValid) {
      return { summary: record.aiSummary, cached: true };
    }
  }

  // Calculate patient age
  const dob = record.patient.dateOfBirth;
  const age = dob
    ? Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : undefined;

  // Call the Python AI service
  const aiPayload = {
    recordType: record.recordType,
    recordSubType: record.recordSubType ?? undefined,
    title: record.title,
    extractedData: record.extractedData ?? undefined,
    rawText: undefined,
    patientContext: {
      age,
      gender: record.patient.gender,
      bloodGroup: record.patient.bloodGroup,
      chronicConditions: record.patient.chronicConditions,
      allergies: record.patient.allergies,
    },
  };

  let aiResult: {
    summaryText: string;
    simplifiedValues?: Record<string, unknown>;
    riskLevel: string;
    concerns: string[];
    goodNews: string[];
    recommendations: string[];
    disclaimer: string;
    modelUsed: string;
  };

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ai/decode`, aiPayload, { timeout: 30000 });
    aiResult = response.data;
  } catch (err) {
    throw new Error('AI service unavailable. Please try again later.');
  }

  // Upsert the AI summary in DB (cache it)
  const summary = await prisma.aIReportSummary.upsert({
    where: { recordId: record.id },
    create: {
      recordId: record.id,
      summaryText: aiResult.summaryText,
      simplifiedValues: (aiResult.simplifiedValues as object) ?? undefined,
      riskLevel: aiResult.riskLevel,
      modelUsed: aiResult.modelUsed,
      cacheValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    update: {
      summaryText: aiResult.summaryText,
      simplifiedValues: (aiResult.simplifiedValues as object) ?? undefined,
      riskLevel: aiResult.riskLevel,
      modelUsed: aiResult.modelUsed,
      cacheValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      generatedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: requestingUserId,
      userRole: requestingRole as never,
      action: 'AI_REPORT_DECODE',
      patientId: record.patient.id,
      details: { recordId: record.id, recordType: record.recordType, riskLevel: aiResult.riskLevel },
    },
  });

  return { summary: { ...summary, concerns: aiResult.concerns, goodNews: aiResult.goodNews, recommendations: aiResult.recommendations, disclaimer: aiResult.disclaimer }, cached: false };
}

// ─── Get AI clinical summary for a patient (doctor-facing) ───────────────────

export async function getClinicalSummaryService(patientUhid: string, doctorUserId: string) {
  const patient = await prisma.patient.findUnique({
    where: { uhid: patientUhid },
    select: {
      id: true, uhid: true, firstName: true, lastName: true,
      dateOfBirth: true, gender: true, bloodGroup: true,
      chronicConditions: true, allergies: true, currentMedications: true,
    },
  });
  if (!patient) throw new Error('Patient not found');

  // Verify doctor has consent
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true, specialty: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const hasConsent = await prisma.consent.findFirst({
    where: {
      patientId: patient.id,
      doctorId: doctor.id,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
  });
  if (!hasConsent) throw new Error('No active consent. Request access from the patient first.');

  // Fetch recent records
  const recentRecords = await prisma.medicalRecord.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { aiSummary: { select: { riskLevel: true } } },
  });

  // Fetch recent prescriptions
  const recentPrescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: { select: { medicineName: true, dosage: true } } },
  });

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : undefined;

  const aiPayload = {
    patientUhid: patient.uhid,
    age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    chronicConditions: patient.chronicConditions,
    allergies: patient.allergies,
    currentMedications: patient.currentMedications,
    recentRecords: recentRecords.map((r) => ({
      recordType: r.recordType,
      recordSubType: r.recordSubType,
      title: r.title,
      testDate: r.testDate?.toISOString().split('T')[0],
      extractedData: r.extractedData as Record<string, unknown>,
      aiSummaryRiskLevel: r.aiSummary?.riskLevel,
    })),
    recentPrescriptions: recentPrescriptions.map((p) => ({
      visitDate: p.visitDate.toISOString().split('T')[0],
      diagnosis: p.diagnosis,
      medicines: p.items.map((i) => `${i.medicineName} ${i.dosage}`),
      hasInteractions: p.hasInteractions,
    })),
    requestingDoctorSpecialty: doctor.specialty,
  };

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ai/clinical-summary`, aiPayload, { timeout: 30000 });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorUserId,
        userRole: 'DOCTOR',
        action: 'AI_CLINICAL_SUMMARY',
        patientId: patient.id,
        details: { riskScore: response.data.riskScore, riskLevel: response.data.riskLevel },
      },
    });

    return response.data;
  } catch (err) {
    throw new Error('AI service unavailable. Please try again later.');
  }
}
