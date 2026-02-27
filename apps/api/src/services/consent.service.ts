import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { Prisma } from '@prisma/client';

// ─── Generate 6-digit OTP ──────────────────────────────────────────────────────

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Request consent (doctor or insurance) ───────────────────────────────────

export async function requestConsentService(
  requestingUserId: string,
  requestingRole: string,
  data: {
    patientUhid: string;
    scope: string[];
    purpose: string;
    durationHours: number;
  }
) {
  // Find patient
  const patient = await prisma.patient.findUnique({
    where: { uhid: data.patientUhid },
    select: { id: true, uhid: true, firstName: true, lastName: true, userId: true },
  });
  if (!patient) throw new Error('Patient not found');

  const expiresAt = new Date(Date.now() + data.durationHours * 60 * 60 * 1000);

  let doctorId: string | undefined;
  let insuranceProviderId: string | undefined;

  if (requestingRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });
    if (!doctor) throw new Error('Doctor profile not found');
    doctorId = doctor.id;
  } else if (requestingRole === 'INSURANCE_PROVIDER') {
    const insurer = await prisma.insuranceProvider.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });
    if (!insurer) throw new Error('Insurance provider profile not found');
    insuranceProviderId = insurer.id;
  } else {
    throw new Error('Only doctors and insurance providers can request consent');
  }

  // Check for existing active/pending consent from same requester
  const existing = await prisma.consent.findFirst({
    where: {
      patientId: patient.id,
      status: { in: ['ACTIVE', 'PENDING'] },
      ...(doctorId ? { doctorId } : { insuranceProviderId }),
    },
  });
  if (existing) throw new Error('An active or pending consent already exists for this patient');

  // Create consent record
  const consent = await prisma.consent.create({
    data: {
      patientId: patient.id,
      grantedToType: requestingRole === 'DOCTOR' ? 'DOCTOR' : 'INSURANCE_PROVIDER',
      doctorId,
      insuranceProviderId,
      scope: data.scope,
      purpose: data.purpose,
      status: 'PENDING',
      isTemporary: true,
      durationHours: data.durationHours,
      expiresAt,
    },
    include: {
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
      insuranceProvider: { select: { firstName: true, lastName: true, companyName: true } },
    },
  });

  // Generate OTP for patient to approve
  const otp = generateOTP();
  const otpKey = `consent_otp:${consent.id}`;
  await redis.set(otpKey, otp, { ex: 600 }); // 10 minutes

  // In production: send OTP to patient via SMS/email
  // For demo: return OTP in response (dev mode only)
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    consent,
    otp: isDev ? otp : undefined, // Only expose OTP in dev mode
    message: 'Consent request created. Patient will receive OTP to approve.',
  };
}

// ─── Approve consent with OTP ─────────────────────────────────────────────────

export async function approveConsentService(
  patientUserId: string,
  data: { consentId: string; otp: string }
) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  const consent = await prisma.consent.findUnique({
    where: { id: data.consentId },
    select: { id: true, patientId: true, status: true, expiresAt: true },
  });
  if (!consent) throw new Error('Consent not found');
  if (consent.patientId !== patient.id) throw new Error('Access denied');
  if (consent.status !== 'PENDING') throw new Error('Consent is not in pending state');

  // Verify OTP from Redis
  const otpKey = `consent_otp:${consent.id}`;
  const storedOtp = await redis.get(otpKey);
  if (!storedOtp) throw new Error('OTP has expired. Please ask the doctor to resend the request.');
  if (storedOtp !== data.otp) throw new Error('Invalid OTP');

  // Delete OTP from Redis
  await redis.del(otpKey);

  // Approve consent
  const updated = await prisma.consent.update({
    where: { id: consent.id },
    data: {
      status: 'ACTIVE',
      otpVerified: true,
      otpVerifiedAt: new Date(),
      grantedAt: new Date(),
    },
    include: {
      doctor: { select: { firstName: true, lastName: true, specialty: true } },
      insuranceProvider: { select: { firstName: true, lastName: true, companyName: true } },
    },
  });

  return updated;
}

// ─── Deny consent ─────────────────────────────────────────────────────────────

export async function denyConsentService(patientUserId: string, consentId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  const consent = await prisma.consent.findUnique({
    where: { id: consentId },
    select: { id: true, patientId: true, status: true },
  });
  if (!consent) throw new Error('Consent not found');
  if (consent.patientId !== patient.id) throw new Error('Access denied');
  if (!['PENDING', 'ACTIVE'].includes(consent.status)) throw new Error('Consent cannot be denied in its current state');

  return prisma.consent.update({
    where: { id: consentId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });
}

// ─── Revoke consent ───────────────────────────────────────────────────────────

export async function revokeConsentService(patientUserId: string, consentId: string) {
  return denyConsentService(patientUserId, consentId);
}

// ─── Get active consents for patient ─────────────────────────────────────────

export async function getPatientConsentsService(patientUserId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  // Expire old consents first
  await prisma.consent.updateMany({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  const [active, pending, history] = await prisma.$transaction([
    prisma.consent.findMany({
      where: { patientId: patient.id, status: 'ACTIVE' },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        insuranceProvider: { select: { firstName: true, lastName: true, companyName: true } },
      },
      orderBy: { grantedAt: 'desc' },
    }),
    prisma.consent.findMany({
      where: { patientId: patient.id, status: 'PENDING' },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        insuranceProvider: { select: { firstName: true, lastName: true, companyName: true } },
      },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.consent.findMany({
      where: { patientId: patient.id, status: { in: ['REVOKED', 'EXPIRED'] } },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        insuranceProvider: { select: { firstName: true, lastName: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return { active, pending, history };
}

// ─── Check if doctor has active consent for patient ──────────────────────────

export async function checkConsentService(doctorUserId: string, patientId: string): Promise<boolean> {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctor) return false;

  const consent = await prisma.consent.findFirst({
    where: {
      patientId,
      doctorId: doctor.id,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
  });

  return !!consent;
}

// ─── Get consents requested by doctor ────────────────────────────────────────

export async function getDoctorConsentsService(doctorUserId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  return prisma.consent.findMany({
    where: { doctorId: doctor.id },
    include: {
      patient: { select: { uhid: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
