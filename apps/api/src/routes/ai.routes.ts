import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { getClinicalSummary } from '../controllers/ai.controller';

const router = Router();

router.use(authenticate);

// GET /api/v1/ai/clinical-summary/:uhid — Doctor gets AI clinical summary for patient
router.get(
  '/clinical-summary/:uhid',
  requireRoles('DOCTOR'),
  getClinicalSummary
);

export default router;
