import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { generateQR, scanQR, revokeQR, getMyQRCodes } from '../controllers/qr.controller';

const router = Router();

// GET /api/v1/qr/scan/:accessCode — Public: scan a QR code (no auth needed)
router.get('/scan/:accessCode', scanQR);

// All routes below require auth
router.use(authenticate);

// POST /api/v1/qr/generate — Patient generates a QR code
router.post('/generate', requireRoles('PATIENT'), generateQR);

// GET /api/v1/qr/mine — Patient views their QR codes
router.get('/mine', requireRoles('PATIENT'), getMyQRCodes);

// DELETE /api/v1/qr/:id — Patient revokes a QR code
router.delete('/:id', requireRoles('PATIENT'), revokeQR);

export default router;
