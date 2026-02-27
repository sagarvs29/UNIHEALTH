import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// POST /api/v1/auth/logout  (requires valid access token)
router.post('/logout', authenticate, logout);

// GET /api/v1/auth/me  (requires valid access token)
router.get('/me', authenticate, getMe);

export default router;
