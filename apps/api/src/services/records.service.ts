import { prisma } from '../lib/prisma';
import { cloudinary } from '../lib/cloudinary';
import { Prisma, RecordType, RecordSubType } from '@prisma/client';
import type { UploadedFile } from '../types/express';

// ─── Upload a medical record ──────────────────────────────────────────────────

export async function uploadRecordService(
  staffUserId: string,
  data: {
    patientUhid: string;
    recordType: string;
    recordSubType?: string;
    title: string;
    description?: string;
    testDate?: string;
    labName?: string;
  },
  file: UploadedFile
) {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { uhid: data.patientUhid },
    select: { id: true, uhid: true, firstName: true, lastName: true },
  });
  if (!patient) throw new Error('Patient not found');

  // Get staff profile
  const staff = await prisma.hospitalStaff.findUnique({
    where: { userId: staffUserId },
    select: { id: true, hospitalId: true },
  });
  if (!staff) throw new Error('Staff profile not found');

  // Upload to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `uhid/records/${patient.uhid}`,
        resource_type: 'auto',
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(file.buffer);
  });

  // Save record to DB
  const record = await prisma.medicalRecord.create({
    data: {
      patientId: patient.id,
      recordType: data.recordType as RecordType,
      recordSubType: data.recordSubType as RecordSubType | undefined,
      title: data.title,
      description: data.description,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      fileMimeType: file.mimetype,
      fileSizeBytes: file.size,
      testDate: data.testDate ? new Date(data.testDate) : undefined,
      labName: data.labName,
      uploadedByStaffId: staff.id,
      hospitalId: staff.hospitalId,
    },
    include: {
      patient: { select: { uhid: true, firstName: true, lastName: true } },
      uploadedByStaff: { select: { firstName: true, lastName: true, staffType: true } },
    },
  });

  return record;
}

// ─── Get patient records ──────────────────────────────────────────────────────

export async function getPatientRecordsService(
  patientId: string,
  query: { recordType?: string; page: number; limit: number }
) {
  const { recordType, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicalRecordWhereInput = {
    patientId,
    ...(recordType ? { recordType: recordType as Prisma.EnumRecordTypeFilter['equals'] } : {}),
  };

  const [records, total] = await prisma.$transaction([
    prisma.medicalRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedByStaff: { select: { firstName: true, lastName: true } },
        aiSummary: { select: { riskLevel: true, summaryText: true } },
      },
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get single record ────────────────────────────────────────────────────────

export async function getRecordByIdService(recordId: string, requestingUserId: string, requestingRole: string) {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      patient: {
        select: {
          id: true, uhid: true, firstName: true, lastName: true,
          userId: true,
        },
      },
      uploadedByStaff: { select: { firstName: true, lastName: true, staffType: true } },
      aiSummary: true,
    },
  });

  if (!record) throw new Error('Record not found');

  // Patients can only access their own records
  if (requestingRole === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { userId: requestingUserId }, select: { id: true } });
    if (!patient || record.patientId !== patient.id) throw new Error('Access denied');
  }

  return record;
}

// ─── Delete a record ──────────────────────────────────────────────────────────

export async function deleteRecordService(recordId: string, staffUserId: string) {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    select: { id: true, filePublicId: true, uploadedByStaff: { select: { userId: true } } },
  });
  if (!record) throw new Error('Record not found');
  if (record.uploadedByStaff?.userId !== staffUserId) throw new Error('Access denied');

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(record.filePublicId, { resource_type: 'auto' });

  await prisma.medicalRecord.delete({ where: { id: recordId } });
}
