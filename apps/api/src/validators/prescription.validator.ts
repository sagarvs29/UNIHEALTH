import { z } from 'zod';

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),        // e.g. "500mg"
  frequency: z.string().min(1, 'Frequency is required'),  // e.g. "Twice daily"
  duration: z.string().min(1, 'Duration is required'),    // e.g. "30 days"
  route: z.string().optional(),                           // e.g. "Oral"
  instructions: z.string().optional(),                    // e.g. "Take after meals"
  rxcui: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientUhid: z.string().min(1, 'Patient UHID is required'),
  diagnosis: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine is required'),
  overrideInteraction: z.boolean().optional().default(false),
  overrideReason: z.string().max(500).optional(),
});

export const pharmaCheckSchema = z.object({
  patientUhid: z.string().min(1, 'Patient UHID is required'),
  newDrug: z.string().min(1, 'Drug name is required'),
  newDrugDosage: z.string().optional(),
});

export const createClinicalNoteSchema = z.object({
  patientUhid: z.string().min(1, 'Patient UHID is required'),
  visitType: z.string().min(1).default('OPD'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().optional(),
  examinationFindings: z.string().optional(),
  vitalSigns: z.object({
    bp: z.string().optional(),
    pulse: z.string().optional(),
    temp: z.string().optional(),
    spo2: z.string().optional(),
    weight: z.string().optional(),
  }).optional(),
  icd10Code: z.string().optional(),
  diagnosisName: z.string().optional(),
  differentialDiagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  followUpNotes: z.string().optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type PharmaCheckInput = z.infer<typeof pharmaCheckSchema>;
export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteSchema>;
