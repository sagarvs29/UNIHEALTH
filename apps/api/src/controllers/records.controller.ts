import { Request, Response } from 'express';
import {
  uploadRecordService,
  getPatientRecordsService,
  getRecordByIdService,
  deleteRecordService,
} from '../services/records.service';
import { prisma } from '../lib/prisma';

// ─── Upload a medical record (staff only) ────────────────────────────────────

export async function uploadRecord(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'File is required' });
      return;
    }

    const record = await uploadRecordService(req.user!.id, req.body, {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    });

    res.status(201).json({ success: true, message: 'Record uploaded successfully', data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get patient records ──────────────────────────────────────────────────────

export async function getRecords(req: Request, res: Response): Promise<void> {
  try {
    const { uhid } = req.params;

    // Find patient by UHID
    const patient = await prisma.patient.findUnique({
      where: { uhid },
      select: { id: true, userId: true },
    });
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    // Patients can only view their own records
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const result = await getPatientRecordsService(patient.id, {
      recordType: req.query.recordType as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch records';
    res.status(400).json({ success: false, message });
  }
}

// ─── Get single record ────────────────────────────────────────────────────────

export async function getRecord(req: Request, res: Response): Promise<void> {
  try {
    const record = await getRecordByIdService(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Record not found';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Delete a record ──────────────────────────────────────────────────────────

export async function deleteRecord(req: Request, res: Response): Promise<void> {
  try {
    await deleteRecordService(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, message });
  }
}
