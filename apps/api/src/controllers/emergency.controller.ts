import { Request, Response } from 'express';
import {
  getEmergencyInfoService,
  emergencyOverrideService,
  activateSosService,
  deactivateSosService,
} from '../services/emergency.service';

// ─── GET /api/v1/emergency/:uhid — Public emergency info (no auth) ────────────

export async function getEmergencyInfo(req: Request, res: Response): Promise<void> {
  try {
    const { uhid } = req.params;
    const data = await getEmergencyInfoService(uhid);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    res.status(404).json({ success: false, message });
  }
}

// ─── POST /api/v1/emergency/override — Doctor emergency override ──────────────

export async function emergencyOverride(req: Request, res: Response): Promise<void> {
  try {
    const { patientUhid, reason } = req.body;
    if (!patientUhid || !reason) {
      res.status(400).json({ success: false, message: 'patientUhid and reason are required' });
      return;
    }
    const result = await emergencyOverrideService(req.user!.id, patientUhid, reason);
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Override failed';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── POST /api/v1/emergency/sos — Patient activates SOS ──────────────────────

export async function activateSos(req: Request, res: Response): Promise<void> {
  try {
    const result = await activateSosService(req.user!.id);
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SOS activation failed';
    const status = message.includes('already active') ? 409 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── DELETE /api/v1/emergency/sos — Patient deactivates SOS ──────────────────

export async function deactivateSos(req: Request, res: Response): Promise<void> {
  try {
    const result = await deactivateSosService(req.user!.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SOS deactivation failed';
    res.status(400).json({ success: false, message });
  }
}
