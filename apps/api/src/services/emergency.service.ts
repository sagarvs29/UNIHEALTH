import { prisma } from '../lib/prisma';

// ─── Get public emergency info for a patient (no auth required) ──────────────
// Only returns blood group, allergies, and emergency contacts — minimal safe data

export async function getEmergencyInfoService(uhid: string) {
  const patient = await prisma.patient.findUnique({
    where: { uhid },
    select: {
      id: true,
      uhid: true,
      firstName: true,
      lastName: true,
      bloodGroup: true,
      allergies: true,
      chronicConditions: true,
      currentMedications: true,
      isSosActive: true,
      sosActivatedAt: true,
      emergencyContacts: {
        select: { name: true, phone: true, relationship: true, isPrimary: true },
        orderBy: { isPrimary: 'desc' },
      },
    },
  });

  if (!patient) throw new Error('Patient not found');

  return {
    uhid: patient.uhid,
    name: `${patient.firstName} ${patient.lastName}`,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    chronicConditions: patient.chronicConditions,
    currentMedications: patient.currentMedications,
    emergencyContacts: patient.emergencyContacts,
    isSosActive: patient.isSosActive,
    sosActivatedAt: patient.sosActivatedAt,
  };
}

// ─── Doctor emergency override (bypasses consent for 4 hours) ────────────────

export async function emergencyOverrideService(
  doctorUserId: string,
  patientUhid: string,
  reason: string
) {
  const patient = await prisma.patient.findUnique({
    where: { uhid: patientUhid },
    select: { id: true, uhid: true, firstName: true, lastName: true },
  });
  if (!patient) throw new Error('Patient not found');

  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true, firstName: true, lastName: true, hospitalId: true },
  });
  if (!doctor) throw new Error('Doctor profile not found');

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

  // Create emergency access record
  const emergencyAccess = await prisma.emergencyAccess.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      accessType: 'DOCTOR_OVERRIDE',
      reason,
      expiresAt,
    },
  });

  // Also create a temporary consent (4-hour scope ALL)
  await prisma.consent.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      grantedToType: 'DOCTOR',
      scope: ['ALL'],
      purpose: `Emergency Override: ${reason}`,
      status: 'ACTIVE',
      isTemporary: true,
      durationHours: 4,
      expiresAt,
      otpVerified: false,
      grantedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: doctorUserId,
      userRole: 'DOCTOR',
      action: 'EMERGENCY_OVERRIDE',
      patientId: patient.id,
      details: { reason, emergencyAccessId: emergencyAccess.id, expiresAt },
    },
  });

  return {
    message: 'Emergency access granted for 4 hours',
    emergencyAccessId: emergencyAccess.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    expiresAt,
  };
}

// ─── Patient SOS activation ──────────────────────────────────────────────────

export async function activateSosService(patientUserId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: {
      id: true, uhid: true, firstName: true, lastName: true,
      isSosActive: true,
      emergencyContacts: {
        where: { isPrimary: true },
        select: { name: true, phone: true },
        take: 1,
      },
    },
  });
  if (!patient) throw new Error('Patient profile not found');

  if (patient.isSosActive) {
    throw new Error('SOS is already active');
  }

  const now = new Date();
  await prisma.patient.update({
    where: { id: patient.id },
    data: { isSosActive: true, sosActivatedAt: now },
  });

  // Create emergency access record
  const emergencyAccess = await prisma.emergencyAccess.create({
    data: {
      patientId: patient.id,
      accessType: 'SOS_ACTIVATED',
      reason: 'Patient activated SOS emergency',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      patientNotified: true,
      notifiedAt: now,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: patientUserId,
      userRole: 'PATIENT',
      action: 'SOS_ACTIVATED',
      patientId: patient.id,
      details: { emergencyAccessId: emergencyAccess.id },
    },
  });

  return {
    message: 'SOS activated. Emergency contacts will be notified.',
    sosAccessCode: emergencyAccess.id.substring(0, 8).toUpperCase(),
    emergencyInfoUrl: `/emergency/${patient.uhid}`,
    primaryContact: patient.emergencyContacts[0] ?? null,
  };
}

// ─── Patient SOS deactivation ────────────────────────────────────────────────

export async function deactivateSosService(patientUserId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true, isSosActive: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  if (!patient.isSosActive) {
    throw new Error('SOS is not currently active');
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: { isSosActive: false, sosActivatedAt: null },
  });

  // Terminate any open emergency accesses
  await prisma.emergencyAccess.updateMany({
    where: {
      patientId: patient.id,
      accessType: 'SOS_ACTIVATED',
      terminatedAt: null,
    },
    data: { terminatedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: patientUserId,
      userRole: 'PATIENT',
      action: 'SOS_DEACTIVATED',
      patientId: patient.id,
    },
  });

  return { message: 'SOS deactivated successfully' };
}
