import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

// ─── Augment Express Request ──────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        isVerified: boolean;
      };
    }
  }
}

// ─── JWT Payload Shape ────────────────────────────────────────────────────────

interface JwtPayload {
  sub: string;   // user.id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── authenticate ─────────────────────────────────────────────────────────────

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the user to req.user on success.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Fetch user from DB to ensure they're still active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isVerified: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Account not found or deactivated' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Access token expired' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid access token' });
    }
  }
}

// ─── requireRoles ─────────────────────────────────────────────────────────────

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticate().
 *
 * Usage: router.get('/route', authenticate, requireRoles('DOCTOR', 'HOSPITAL_ADMIN'), handler)
 */
export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

// ─── requireVerified ──────────────────────────────────────────────────────────

/**
 * Ensures the authenticated user has verified their account.
 * Must be used AFTER authenticate().
 */
export function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      message: 'Please verify your account before accessing this resource',
    });
    return;
  }

  next();
}
