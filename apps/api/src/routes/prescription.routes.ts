import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  pharmaCheckSchema,
  createPrescriptionSchema,
  createClinicalNoteSchema,
} from '../validators/prescription.validator';
import {
  runPharmaCheck,
  createPrescription,
  getPatientPrescriptions,
  createClinicalNote,
  getClinicalNotes,
} from '../controllers/prescription.controller';

const router = Router();

router.use(authenticate);

// POST /api/v1/prescriptions/pharma-check — Doctor runs interaction check
router.post(
  '/pharma-check',
  requireRoles('DOCTOR'),
  validate(pharmaCheckSchema),
  runPharmaCheck
);

// POST /api/v1/prescriptions — Doctor creates a prescription
router.post(
  '/',
  requireRoles('DOCTOR'),
  validate(createPrescriptionSchema),
  createPrescription
);

// GET /api/v1/prescriptions/patient/:uhid — Get prescriptions for patient
router.get(
  '/patient/:uhid',
  requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL_STAFF', 'HOSPITAL_ADMIN', 'INSURANCE_PROVIDER'),
  getPatientPrescriptions
);

// POST /api/v1/prescriptions/clinical-notes — Doctor adds a clinical note
router.post(
  '/clinical-notes',
  requireRoles('DOCTOR'),
  validate(createClinicalNoteSchema),
  createClinicalNote
);

// GET /api/v1/prescriptions/clinical-notes/:uhid — Get clinical notes for patient
router.get(
  '/clinical-notes/:uhid',
  requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL_STAFF', 'HOSPITAL_ADMIN'),
  getClinicalNotes
);

export default router;
