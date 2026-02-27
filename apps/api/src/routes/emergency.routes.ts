import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import {
  getEmergencyInfo,
  emergencyOverride,
  activateSos,
  deactivateSos,
} from '../controllers/emergency.controller';

const router = Router();

// ── Public route (no auth) — returns only safe minimal info ──────────────────
// GET /api/v1/emergency/:uhid
router.get('/:uhid', getEmergencyInfo);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.use(authenticate);

// POST /api/v1/emergency/override — Doctor bypasses consent in emergency
router.post('/override', requireRoles('DOCTOR'), emergencyOverride);

// POST /api/v1/emergency/sos — Patient activates SOS
router.post('/sos', requireRoles('PATIENT'), activateSos);

// DELETE /api/v1/emergency/sos — Patient deactivates SOS
router.delete('/sos', requireRoles('PATIENT'), deactivateSos);

export default router;
