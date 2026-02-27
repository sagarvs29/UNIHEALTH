import { Request, Response } from 'express';
import {
  generateQRService,
  scanQRService,
  revokeQRService,
  getPatientQRCodesService,
} from '../services/qr.service';

// ─── Generate QR code ─────────────────────────────────────────────────────────

export async function generateQR(req: Request, res: Response): Promise<void> {
  try {
    const { scope = ['ALL'], qrType = 'DOCTOR_SESSION', expiresInHours = 1 } = req.body;
    const result = await generateQRService(req.user!.id, scope, qrType, expiresInHours);
    res.status(201).json({ success: true, message: 'QR code generated', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate QR code';
    res.status(400).json({ success: false, message });
  }
}

// ─── Scan / resolve QR code (public — no auth required) ──────────────────────

export async function scanQR(req: Request, res: Response): Promise<void> {
  try {
    const { accessCode } = req.params;
    const result = await scanQRService(accessCode);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid QR code';
    const status = message.includes('not found') ? 404 : message.includes('expired') || message.includes('revoked') ? 410 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Revoke QR code ───────────────────────────────────────────────────────────

export async function revokeQR(req: Request, res: Response): Promise<void> {
  try {
    await revokeQRService(req.user!.id, req.params.id);
    res.json({ success: true, message: 'QR code revoked' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to revoke QR code';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get all QR codes for patient ────────────────────────────────────────────

export async function getMyQRCodes(req: Request, res: Response): Promise<void> {
  try {
    const data = await getPatientQRCodesService(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch QR codes';
    res.status(400).json({ success: false, message });
  }
}
