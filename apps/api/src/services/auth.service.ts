import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { Role } from '@prisma/client';
import type { RegisterInput } from '../validators/auth.validator';

// ─── Token Config ─────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── UHID Generator ───────────────────────────────────────────────────────────

/**
 * Generates a unique UHID like "UH-847291"
 * Checks DB for collisions.
 */
async function generateUHID(): Promise<string> {
  let uhid: string;
  let attempts = 0;

  do {
    const num = Math.floor(100000 + Math.random() * 900000); // 6-digit
    uhid = `UH-${num}`;
    const existing = await prisma.patient.findUnique({ where: { uhid } });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Failed to generate unique UHID. Please try again.');
  }

  return uhid;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

function generateAccessToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ sub: userId, email, role }, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Stores refresh token in Redis with 7-day TTL.
 * Key: refresh:<userId>
 * This allows logout to invalidate the token server-side.
 */
async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await redis.set(`refresh:${userId}`, refreshToken, { ex: REFRESH_EXPIRES_SECONDS });
}

async function deleteRefreshToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}

async function getStoredRefreshToken(userId: string): Promise<string | null> {
  return await redis.get<string>(`refresh:${userId}`);
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerService(data: RegisterInput) {
  const { email, phone, password, role, profile } = data;

  // 1. Check for existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new Error('This phone number is already registered');
    }
  }

  // 2. Hash password with argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  // 3. Create user + role profile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the base user
    const user = await tx.user.create({
      data: {
        email,
        phone: phone || null,
        passwordHash,
        role,
        isVerified: false, // Will be true after OTP verification (Phase 1.5)
        isActive: true,
      },
    });

    // Create role-specific profile
    let roleProfile: Record<string, unknown> = {};

    if (role === 'PATIENT') {
      const p = profile as Extract<RegisterInput, { role: 'PATIENT' }>['profile'];
      const uhid = await generateUHID();

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          uhid,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date(p.dateOfBirth),
          gender: p.gender,
          bloodGroup: p.bloodGroup ?? 'UNKNOWN',
        },
      });
      roleProfile = { uhid: patient.uhid };

    } else if (role === 'DOCTOR') {
      const p = profile as Extract<RegisterInput, { role: 'DOCTOR' }>['profile'];

      // Verify hospital exists
      const hospital = await tx.hospital.findUnique({ where: { id: p.hospitalId } });
      if (!hospital) throw new Error('Hospital not found. Please check the hospital ID.');

      // Check license uniqueness
      const existingLicense = await tx.doctor.findUnique({
        where: { licenseNumber: p.licenseNumber },
      });
      if (existingLicense) throw new Error('A doctor with this license number already exists.');

      await tx.doctor.create({
        data: {
          userId: user.id,
          firstName: p.firstName,
          lastName: p.lastName,
          licenseNumber: p.licenseNumber,
          specialty: p.specialty,
          subSpecialty: p.subSpecialty,
          qualifications: p.qualifications,
          hospitalId: p.hospitalId,
          department: p.department,
          isVerified: false,
        },
      });

    } else if (role === 'HOSPITAL_STAFF') {
      const p = profile as Extract<RegisterInput, { role: 'HOSPITAL_STAFF' }>['profile'];

      const hospital = await tx.hospital.findUnique({ where: { id: p.hospitalId } });
      if (!hospital) throw new Error('Hospital not found. Please check the hospital ID.');

      await tx.hospitalStaff.create({
        data: {
          userId: user.id,
          firstName: p.firstName,
          lastName: p.lastName,
          staffType: p.staffType,
          department: p.department,
          employeeId: p.employeeId,
          hospitalId: p.hospitalId,
          isVerified: false,
        },
      });

    } else if (role === 'HOSPITAL_ADMIN') {
      const p = profile as Extract<RegisterInput, { role: 'HOSPITAL_ADMIN' }>['profile'];

      const hospital = await tx.hospital.findUnique({ where: { id: p.hospitalId } });
      if (!hospital) throw new Error('Hospital not found. Please check the hospital ID.');

      await tx.hospitalAdmin.create({
        data: {
          userId: user.id,
          firstName: p.firstName,
          lastName: p.lastName,
          hospitalId: p.hospitalId,
        },
      });

    } else if (role === 'INSURANCE_PROVIDER') {
      const p = profile as Extract<RegisterInput, { role: 'INSURANCE_PROVIDER' }>['profile'];

      const existingAgent = await tx.insuranceProvider.findUnique({
        where: { agentId: p.agentId },
      });
      if (existingAgent) throw new Error('An agent with this Agent ID already exists.');

      await tx.insuranceProvider.create({
        data: {
          userId: user.id,
          firstName: p.firstName,
          lastName: p.lastName,
          agentId: p.agentId,
          companyName: p.companyName,
          companyCode: p.companyCode,
          isVerified: false,
        },
      });
    }

    // 4. Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        userRole: role,
        action: 'REGISTER',
        details: { email } as Prisma.JsonObject,
        ipAddress: null,
      },
    });

    return { user, roleProfile };
  });

  // 5. Generate tokens
  const accessToken = generateAccessToken(result.user.id, result.user.email, result.user.role);
  const refreshToken = generateRefreshToken(result.user.id);
  await storeRefreshToken(result.user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      isVerified: result.user.isVerified,
      ...result.roleProfile,
    },
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginService(email: string, password: string, ipAddress?: string) {
  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    // Use generic message to prevent email enumeration
    throw new Error('Invalid email or password');
  }

  // 2. Verify password
  const isValid = await argon2.verify(user.passwordHash, password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // 3. Fetch role profile for display name
  const profileInfo = await getRoleProfile(user.id, user.role);

  // 4. Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN',
      details: { email } as Prisma.JsonObject,
      ipAddress: ipAddress || null,
    },
  });

  // 6. Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      ...profileInfo,
    },
  };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshTokenService(refreshToken: string) {
  // 1. Verify JWT signature
  let payload: { sub: string };
  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const userId = payload.sub;

  // 2. Check Redis — token must match what's stored (prevents token reuse after logout)
  const stored = await getStoredRefreshToken(userId);
  if (!stored || stored !== refreshToken) {
    throw new Error('Refresh token has been revoked or replaced');
  }

  // 3. Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isVerified: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error('Account not found or deactivated');
  }

  // 4. Issue new access token (refresh token rotation is optional — kept same here)
  const newAccessToken = generateAccessToken(user.id, user.email, user.role);

  return {
    accessToken: newAccessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutService(userId: string) {
  // Delete refresh token from Redis — this invalidates all sessions
  await deleteRefreshToken(userId);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      userRole: (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))!.role,
      action: 'LOGOUT',
      details: {} as Prisma.JsonObject,
      ipAddress: null,
    },
  });
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          uhid: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          profilePhotoUrl: true,
          allergies: true,
          chronicConditions: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          specialty: true,
          subSpecialty: true,
          qualifications: true,
          profilePhotoUrl: true,
          isVerified: true,
          department: true,
          hospital: { select: { id: true, name: true, city: true } },
        },
      },
      hospitalStaff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffType: true,
          department: true,
          isVerified: true,
          hospital: { select: { id: true, name: true, city: true } },
        },
      },
      hospitalAdmin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hospital: { select: { id: true, name: true, city: true } },
        },
      },
      insuranceProvider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          agentId: true,
          companyName: true,
          isVerified: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');

  return user;
}

// ─── Internal: Get role profile display info ──────────────────────────────────

async function getRoleProfile(
  userId: string,
  role: Role
): Promise<Record<string, unknown>> {
  switch (role) {
    case 'PATIENT': {
      const p = await prisma.patient.findUnique({
        where: { userId },
        select: { uhid: true, firstName: true, lastName: true, profilePhotoUrl: true },
      });
      return p ?? {};
    }
    case 'DOCTOR': {
      const d = await prisma.doctor.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true, specialty: true, isVerified: true, profilePhotoUrl: true },
      });
      return d ?? {};
    }
    case 'HOSPITAL_STAFF': {
      const s = await prisma.hospitalStaff.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true, staffType: true, isVerified: true },
      });
      return s ?? {};
    }
    case 'HOSPITAL_ADMIN': {
      const a = await prisma.hospitalAdmin.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true },
      });
      return a ?? {};
    }
    case 'INSURANCE_PROVIDER': {
      const i = await prisma.insuranceProvider.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true, companyName: true, isVerified: true },
      });
      return i ?? {};
    }
    default:
      return {};
  }
}
