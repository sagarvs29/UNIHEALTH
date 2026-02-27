import { z } from 'zod';

// Request consent (doctor or insurance requests access to patient records)
export const requestConsentSchema = z.object({
  patientUhid: z.string().min(1, 'Patient UHID is required'),
  scope: z.array(z.string()).min(1, 'At least one scope item required'),
  purpose: z.string().min(1, 'Purpose is required').max(500),
  durationHours: z.number().int().min(1).max(720).optional().default(24), // max 30 days
});

// Approve consent (patient approves via OTP)
export const approveConsentSchema = z.object({
  consentId: z.string().min(1, 'Consent ID is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Deny / Revoke
export const consentActionSchema = z.object({
  consentId: z.string().min(1, 'Consent ID is required'),
});

export type RequestConsentInput = z.infer<typeof requestConsentSchema>;
export type ApproveConsentInput = z.infer<typeof approveConsentSchema>;
export type ConsentActionInput = z.infer<typeof consentActionSchema>;
