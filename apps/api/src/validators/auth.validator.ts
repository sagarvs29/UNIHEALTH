import { z } from 'zod';

// ─── Common ───────────────────────────────────────────────────────────────────

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email address')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
  .optional();

// ─── Role-specific profile schemas ───────────────────────────────────────────

const patientProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date of birth'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
    required_error: 'Gender is required',
  }),
  bloodGroup: z
    .enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'O_POS', 'O_NEG', 'AB_POS', 'AB_NEG', 'UNKNOWN'])
    .optional()
    .default('UNKNOWN'),
});

const doctorProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  licenseNumber: z.string().min(1, 'Medical license number is required').trim(),
  specialty: z.string().min(1, 'Specialty is required').trim(),
  subSpecialty: z.string().trim().optional(),
  qualifications: z
    .array(z.string().min(1))
    .min(1, 'At least one qualification is required'),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  department: z.string().trim().optional(),
});

const staffProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  staffType: z.enum(
    ['RECEPTIONIST', 'LAB_TECHNICIAN', 'NURSE', 'PHARMACIST', 'RADIOLOGIST', 'ADMIN_STAFF'],
    { required_error: 'Staff type is required' }
  ),
  department: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
});

const adminProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
});

const insuranceProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  agentId: z.string().min(1, 'Agent ID is required').trim(),
  companyName: z.string().min(1, 'Company name is required').trim(),
  companyCode: z.string().trim().optional(),
});

// ─── Register Schema (discriminated union by role) ────────────────────────────

export const registerSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('PATIENT'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    profile: patientProfileSchema,
  }),
  z.object({
    role: z.literal('DOCTOR'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    profile: doctorProfileSchema,
  }),
  z.object({
    role: z.literal('HOSPITAL_STAFF'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    profile: staffProfileSchema,
  }),
  z.object({
    role: z.literal('HOSPITAL_ADMIN'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    profile: adminProfileSchema,
  }),
  z.object({
    role: z.literal('INSURANCE_PROVIDER'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    profile: insuranceProfileSchema,
  }),
]);

// ─── Login Schema ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

// ─── Refresh Token Schema ─────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
