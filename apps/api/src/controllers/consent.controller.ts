import { Request, Response } from 'express';
import {
  requestConsentService,
  approveConsentService,
  denyConsentService,
  revokeConsentService,
  getPatientConsentsService,
  getDoctorConsentsService,
} from '../services/consent.service';

// ─── Request consent (doctor / insurance) ────────────────────────────────────

export async function requestConsent(req: Request, res: Response): Promise<void> {
  try {
    const result = await requestConsentService(req.user!.id, req.user!.role, req.body);
    res.status(201).json({ success: true, message: 'Consent request created', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to request consent';
    const status = message.includes('not found') ? 404 : message.includes('already exists') ? 409 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Approve consent (patient only) ──────────────────────────────────────────

export async function approveConsent(req: Request, res: Response): Promise<void> {
  try {
    const consent = await approveConsentService(req.user!.id, req.body);
    res.json({ success: true, message: 'Consent approved successfully', data: consent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to approve consent';
    const status = message.includes('not found') ? 404 : message.includes('OTP') || message.includes('Invalid') ? 400 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Deny consent (patient only) ─────────────────────────────────────────────

export async function denyConsent(req: Request, res: Response): Promise<void> {
  try {
    const consent = await denyConsentService(req.user!.id, req.body.consentId);
    res.json({ success: true, message: 'Consent denied', data: consent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to deny consent';
    res.status(400).json({ success: false, message });
  }
}

// ─── Revoke consent (patient only) ───────────────────────────────────────────

export async function revokeConsent(req: Request, res: Response): Promise<void> {
  try {
    const consent = await revokeConsentService(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Consent revoked', data: consent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to revoke consent';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get my consents (patient) ────────────────────────────────────────────────

export async function getMyConsents(req: Request, res: Response): Promise<void> {
  try {
    const data = await getPatientConsentsService(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch consents';
    res.status(400).json({ success: false, message });
  }
}

// ─── Get consents I created (doctor) ─────────────────────────────────────────

export async function getDoctorConsents(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDoctorConsentsService(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch consents';
    res.status(400).json({ success: false, message });
  }
}
