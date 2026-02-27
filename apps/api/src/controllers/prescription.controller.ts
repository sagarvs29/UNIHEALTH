import { Request, Response } from 'express';
import {
  createPrescriptionService,
  getPatientPrescriptionsService,
  pharmaCheckService,
  createClinicalNoteService,
  getClinicalNotesService,
} from '../services/prescription.service';
import { prisma } from '../lib/prisma';

// ─── Pharma Check ─────────────────────────────────────────────────────────────

export async function runPharmaCheck(req: Request, res: Response): Promise<void> {
  try {
    const result = await pharmaCheckService(req.user!.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pharma check failed';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Create Prescription ──────────────────────────────────────────────────────

export async function createPrescription(req: Request, res: Response): Promise<void> {
  try {
    const result = await createPrescriptionService(req.user!.id, req.body);
    const statusCode = 'saved' in result && result.saved ? 201 : 200;
    res.status(statusCode).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create prescription';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get patient prescriptions ────────────────────────────────────────────────

export async function getPatientPrescriptions(req: Request, res: Response): Promise<void> {
  try {
    const { uhid } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { uhid },
      select: { id: true, userId: true },
    });
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const data = await getPatientPrescriptionsService(patient.id);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch prescriptions';
    res.status(400).json({ success: false, message });
  }
}

// ─── Create Clinical Note ─────────────────────────────────────────────────────

export async function createClinicalNote(req: Request, res: Response): Promise<void> {
  try {
    const note = await createClinicalNoteService(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Clinical note saved', data: note });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save clinical note';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get Clinical Notes ───────────────────────────────────────────────────────

export async function getClinicalNotes(req: Request, res: Response): Promise<void> {
  try {
    const { uhid } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { uhid },
      select: { id: true, userId: true },
    });
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const data = await getClinicalNotesService(patient.id);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch clinical notes';
    res.status(400).json({ success: false, message });
  }
}
