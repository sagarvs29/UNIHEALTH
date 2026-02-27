import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  requestConsentSchema,
  approveConsentSchema,
  consentActionSchema,
} from '../validators/consent.validator';
import {
  requestConsent,
  approveConsent,
  denyConsent,
  revokeConsent,
  getMyConsents,
  getDoctorConsents,
} from '../controllers/consent.controller';

const router = Router();

router.use(authenticate);

// POST /api/v1/consents/request — Doctor or Insurance requests patient consent
router.post(
  '/request',
  requireRoles('DOCTOR', 'INSURANCE_PROVIDER'),
  validate(requestConsentSchema),
  requestConsent
);

// POST /api/v1/consents/approve — Patient approves via OTP
router.post(
  '/approve',
  requireRoles('PATIENT'),
  validate(approveConsentSchema),
  approveConsent
);

// POST /api/v1/consents/deny — Patient denies a pending consent
router.post(
  '/deny',
  requireRoles('PATIENT'),
  validate(consentActionSchema),
  denyConsent
);

// DELETE /api/v1/consents/:id — Patient revokes an active consent
router.delete(
  '/:id',
  requireRoles('PATIENT'),
  revokeConsent
);

// GET /api/v1/consents/mine — Patient: get all their consents
router.get(
  '/mine',
  requireRoles('PATIENT'),
  getMyConsents
);

// GET /api/v1/consents/doctor — Doctor: get consents they requested
router.get(
  '/doctor',
  requireRoles('DOCTOR'),
  getDoctorConsents
);

export default router;
