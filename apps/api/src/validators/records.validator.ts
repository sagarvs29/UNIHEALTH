import { z } from 'zod';

export const uploadRecordSchema = z.object({
  patientUhid: z.string().min(1, 'Patient UHID is required'),
  recordType: z.enum(['LAB_REPORT', 'IMAGING', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'VACCINATION', 'ECG', 'OTHER']),
  recordSubType: z.enum([
    'CBC', 'LIPID_PROFILE', 'LFT', 'KFT', 'HBA1C', 'THYROID_PROFILE',
    'BLOOD_SUGAR', 'URINE_ROUTINE', 'XRAY', 'MRI', 'CT_SCAN',
    'ULTRASOUND', 'PET_SCAN', 'ECG_REPORT', 'OTHER',
  ]).optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  testDate: z.string().datetime().optional(),
  labName: z.string().max(200).optional(),
});

export const getRecordsQuerySchema = z.object({
  recordType: z.enum(['LAB_REPORT', 'IMAGING', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'VACCINATION', 'ECG', 'OTHER']).optional(),
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 10),
});

export type UploadRecordInput = z.infer<typeof uploadRecordSchema>;
export type GetRecordsQuery = z.infer<typeof getRecordsQuerySchema>;
