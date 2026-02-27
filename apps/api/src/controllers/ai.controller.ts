import { Request, Response } from 'express';
import { decodeRecordService, getClinicalSummaryService } from '../services/ai.service';

// ─── Decode a medical record (patient-facing AI summary) ─────────────────────

export async function decodeRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await decodeRecordService(id, req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Decode failed';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : message.includes('unavailable') ? 503 : 400;
    res.status(status).json({ success: false, message });
  }
}

// ─── Get clinical summary (doctor-facing) ────────────────────────────────────

export async function getClinicalSummary(req: Request, res: Response): Promise<void> {
  try {
    const { uhid } = req.params;
    const result = await getClinicalSummaryService(uhid, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clinical summary failed';
    const status = message.includes('not found') ? 404 : message.includes('consent') ? 403 : message.includes('unavailable') ? 503 : 400;
    res.status(status).json({ success: false, message });
  }
}
