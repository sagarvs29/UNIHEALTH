import { prisma } from '../lib/prisma';
import { cloudinary } from '../lib/cloudinary';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// ─── Generate QR code for patient ────────────────────────────────────────────

export async function generateQRService(
  patientUserId: string,
  scope: string[],
  qrType: 'DOCTOR_SESSION' | 'EMERGENCY_CARD',
  expiresInHours = 1
) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true, uhid: true, firstName: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  // Generate unique access code
  const accessCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // QR data payload (URL-based for scanner)
  const qrPayload = JSON.stringify({
    type: qrType,
    code: accessCode,
    uhid: patient.uhid,
    exp: expiresAt.toISOString(),
  });

  // Generate QR image as buffer
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
  });

  // Upload QR image to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `uhid/qr/${patient.uhid}`,
        resource_type: 'image',
        public_id: `qr_${accessCode}`,
      },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(qrBuffer);
  });

  // Save QR to DB
  const qrCode = await prisma.qRCode.create({
    data: {
      patientId: patient.id,
      accessCode,
      qrImageUrl: uploadResult.secure_url,
      scope,
      expiresAt,
      qrType,
    },
  });

  return { qrCode, qrImageUrl: uploadResult.secure_url, accessCode };
}

// ─── Scan / resolve QR code ───────────────────────────────────────────────────

export async function scanQRService(accessCode: string) {
  const qr = await prisma.qRCode.findUnique({
    where: { accessCode },
    include: {
      patient: {
        select: {
          uhid: true,
          firstName: true,
          lastName: true,
          bloodGroup: true,
          allergies: true,
          chronicConditions: true,
          currentMedications: true,
          emergencyContacts: {
            select: { name: true, phone: true, relationship: true, isPrimary: true },
          },
        },
      },
    },
  });

  if (!qr) throw new Error('QR code not found');
  if (qr.isRevoked) throw new Error('QR code has been revoked');
  if (qr.expiresAt < new Date()) throw new Error('QR code has expired');

  // Increment scan count
  await prisma.qRCode.update({
    where: { id: qr.id },
    data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
  });

  // Return only the scoped data
  const { patient } = qr;
  const scopedData: Record<string, unknown> = { uhid: patient.uhid };

  if (qr.scope.includes('ALL') || qr.scope.includes('BASIC')) {
    scopedData.name = `${patient.firstName} ${patient.lastName}`;
  }
  if (qr.scope.includes('ALL') || qr.scope.includes('BLOOD_GROUP')) {
    scopedData.bloodGroup = patient.bloodGroup;
  }
  if (qr.scope.includes('ALL') || qr.scope.includes('ALLERGIES')) {
    scopedData.allergies = patient.allergies;
  }
  if (qr.scope.includes('ALL') || qr.scope.includes('CONDITIONS')) {
    scopedData.chronicConditions = patient.chronicConditions;
  }
  if (qr.scope.includes('ALL') || qr.scope.includes('MEDICATIONS')) {
    scopedData.currentMedications = patient.currentMedications;
  }
  if (qr.scope.includes('ALL') || qr.scope.includes('EMERGENCY_CONTACTS')) {
    scopedData.emergencyContacts = patient.emergencyContacts;
  }

  return { data: scopedData, qrType: qr.qrType, expiresAt: qr.expiresAt, scope: qr.scope };
}

// ─── Revoke QR code ───────────────────────────────────────────────────────────

export async function revokeQRService(patientUserId: string, qrId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  const qr = await prisma.qRCode.findUnique({
    where: { id: qrId },
    select: { patientId: true },
  });
  if (!qr) throw new Error('QR code not found');
  if (qr.patientId !== patient.id) throw new Error('Access denied');

  return prisma.qRCode.update({
    where: { id: qrId },
    data: { isRevoked: true, revokedAt: new Date() },
  });
}

// ─── Get patient's QR codes ───────────────────────────────────────────────────

export async function getPatientQRCodesService(patientUserId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new Error('Patient profile not found');

  return prisma.qRCode.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
  });
}
