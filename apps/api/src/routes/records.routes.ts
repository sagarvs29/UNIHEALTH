import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { uploadRecord, getRecords, getRecord, deleteRecord } from '../controllers/records.controller';
import { decodeRecord } from '../controllers/ai.controller';

const router = Router();

// All records routes require auth
router.use(authenticate);

// POST /api/v1/records/upload — Staff uploads a record
router.post(
  '/upload',
  requireRoles('HOSPITAL_STAFF', 'HOSPITAL_ADMIN'),
  upload.single('file'),
  uploadRecord
);

// GET /api/v1/records/patient/:uhid — Get all records for a patient
// (Patient: own records only | Doctor/Staff/Admin: with consent | Insurance: with consent)
router.get(
  '/patient/:uhid',
  requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL_STAFF', 'HOSPITAL_ADMIN', 'INSURANCE_PROVIDER'),
  getRecords
);

// GET /api/v1/records/:id — Get a single record
router.get(
  '/:id',
  requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL_STAFF', 'HOSPITAL_ADMIN', 'INSURANCE_PROVIDER'),
  getRecord
);

// DELETE /api/v1/records/:id — Staff deletes a record they uploaded
router.delete(
  '/:id',
  requireRoles('HOSPITAL_STAFF', 'HOSPITAL_ADMIN'),
  deleteRecord
);

// POST /api/v1/records/:id/decode — AI decode a record (patient/doctor)
router.post(
  '/:id/decode',
  requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN'),
  decodeRecord
);

export default router;
