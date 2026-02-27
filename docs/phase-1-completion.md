# UniHealth ID (UHID) — Phase 1 Completion Report

> **Phase:** 1 — Authentication System  
> **Status:** ✅ COMPLETED  
> **Depends On:** Phase 0 (Project Setup)  
> **TypeScript Errors:** 0 (backend) / 0 (frontend)  

---

## 📋 Table of Contents

1. [What Was Achieved](#what-was-achieved)
2. [Backend — API Endpoints](#backend--api-endpoints)
3. [Frontend — Pages & Components](#frontend--pages--components)
4. [Architecture Decisions](#architecture-decisions)
5. [File Manifest](#file-manifest)
6. [How to Test](#how-to-test)
7. [Demo Accounts](#demo-accounts)
8. [Environment Variables Required](#environment-variables-required)
9. [What Phase 1 Does NOT Include](#what-phase-1-does-not-include)

---

## What Was Achieved

```
┌─────────────────────────────────────────────────────────────────┐
│               PHASE 1 — COMPLETED CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Backend                                                          │
│  ✅ Zod validation schemas (all 5 roles)                          │
│  ✅ Generic validate() middleware                                  │
│  ✅ JWT authenticate middleware                                    │
│  ✅ Role-based access control (requireRoles)                       │
│  ✅ Auth service (register, login, refresh, logout, getMe)         │
│  ✅ Auth controller (5 handlers)                                   │
│  ✅ Auth routes (5 endpoints)                                      │
│  ✅ UHID generator (UH-XXXXXX, collision-safe)                     │
│  ✅ Argon2id password hashing                                      │
│  ✅ Redis refresh token storage (7-day TTL)                        │
│  ✅ AuditLog for every auth action                                 │
│                                                                   │
│  Frontend                                                          │
│  ✅ Axios instance with silent JWT refresh                         │
│  ✅ Zustand auth store (persisted to localStorage)                 │
│  ✅ React Query auth hooks (useLogin, useRegister, useLogout, useMe)│
│  ✅ shadcn/ui components (Button, Input, Label, Card, Select)      │
│  ✅ ProtectedRoute with role-based redirects                       │
│  ✅ Login page with demo account quick-fill                        │
│  ✅ 3-step multi-role registration flow                            │
│  ✅ 5 role-specific dashboards (Patient/Doctor/Staff/Admin/Insurance)│
│  ✅ Full App.tsx routing with protected routes                     │
│  ✅ shadcn CSS variable theme (light + dark tokens)                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend — API Endpoints

Base URL: `http://localhost:5000/api/v1/auth`

| Method | Endpoint     | Auth Required | Description                     |
|--------|--------------|---------------|---------------------------------|
| POST   | `/register`  | No            | Register a new user (all roles) |
| POST   | `/login`     | No            | Login with email + password     |
| POST   | `/refresh`   | No            | Get new access token via refresh token |
| POST   | `/logout`    | Bearer JWT    | Invalidate refresh token (Redis) |
| GET    | `/me`        | Bearer JWT    | Get full profile of current user |

### Request / Response Examples

**POST /register (Patient)**
```json
{
  "email": "newuser@example.com",
  "password": "Secure@123",
  "role": "PATIENT",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "bloodGroup": "O_POSITIVE"
  }
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "PATIENT", "uhid": "UH-483920" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**POST /login**
```json
{
  "email": "patient@uhid.demo",
  "password": "Demo@1234"
}
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "PATIENT", "uhid": "UH-000001", "firstName": "Alex", "lastName": "Morgan" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## Frontend — Pages & Components

### Pages

| Route | Component | Protection |
|-------|-----------|------------|
| `/login` | `LoginPage` | Public (redirect to dashboard if logged in) |
| `/register` | `RegisterPage` | Public |
| `/patient/dashboard` | `PatientDashboard` | PATIENT role only |
| `/doctor/dashboard` | `DoctorDashboard` | DOCTOR role only |
| `/staff/dashboard` | `StaffDashboard` | HOSPITAL_STAFF role only |
| `/admin/dashboard` | `AdminDashboard` | HOSPITAL_ADMIN role only |
| `/insurance/dashboard` | `InsuranceDashboard` | INSURANCE_PROVIDER role only |

### Registration Flow (3 Steps)

```
Step 1: Account Details
  → Email, Phone (optional), Password, Confirm Password
  → Password requirements: 8+ chars, uppercase, lowercase, number, special char

Step 2: Role Selection
  → Cards for: Patient, Doctor, Hospital Staff, Hospital Admin, Insurance Provider
  → Each card shows icon + description

Step 3: Role-Specific Profile
  → PATIENT:            firstName, lastName, dateOfBirth, gender, bloodGroup
  → DOCTOR:             licenseNumber, specialty, qualifications (comma-separated), hospitalId
  → HOSPITAL_STAFF:     staffType (NURSE/RECEPTIONIST/LAB_TECH/PHARMACIST/OTHER), hospitalId
  → HOSPITAL_ADMIN:     hospitalId
  → INSURANCE_PROVIDER: agentId, companyName
```

### Component Library (shadcn/ui)

| Component | Location | Description |
|-----------|----------|-------------|
| `Button` | `components/ui/button.tsx` | 6 variants (default, destructive, outline, secondary, ghost, link) + 4 sizes |
| `Input` | `components/ui/input.tsx` | Styled text input with focus ring |
| `Label` | `components/ui/label.tsx` | Radix UI Label wrapper |
| `Card` | `components/ui/card.tsx` | Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter |
| `Select` | `components/ui/select.tsx` | Full Radix Select with scroll buttons |

---

## Architecture Decisions

### JWT Strategy
- **Access Token**: 15-minute expiry, signed with `JWT_SECRET`
- **Refresh Token**: 7-day expiry, signed with `JWT_REFRESH_SECRET`
- **Storage**: Access token in Zustand memory (not localStorage), Refresh token in Redis (`refresh:{userId}`) AND persisted in Zustand localStorage for silent refresh on page reload
- **Rotation**: On `POST /refresh`, old token is verified against Redis before issuing a new access token (no rotation — same refresh token stays valid until 7 days or logout)

### Password Hashing
- **Algorithm**: Argon2id (winner of PHC, resistant to both GPU and side-channel attacks)
- **Parameters**: memoryCost: 65536 (64MB), timeCost: 3, parallelism: 4

### Silent Refresh
- Axios response interceptor catches 401 errors
- Uses `isRefreshing` flag + `failedQueue` to batch concurrent requests
- On success: retries all queued requests with new token
- On failure: `clearAuth()` + redirect to `/login`

### UHID Generation
- Format: `UH-XXXXXX` (6 random digits, zero-padded)
- Collision check: DB query before assignment
- Max 10 attempts before throwing error (astronomically unlikely to fail)

### Role-Based Routing
- `ProtectedRoute` checks `isAuthenticated` first (redirect to `/login`)
- Then checks `allowedRoles` (redirect to own dashboard)
- Wrong-role redirect uses `getDashboardPath(role)` from `useAuth.ts`

---

## File Manifest

### New Backend Files
```
apps/api/src/
├── validators/
│   └── auth.validator.ts       ← Zod schemas for all 5 roles
├── middlewares/
│   ├── validate.middleware.ts  ← Generic Zod validation middleware
│   └── auth.middleware.ts      ← authenticate, requireRoles, requireVerified
├── services/
│   └── auth.service.ts         ← All auth business logic
├── controllers/
│   └── auth.controller.ts      ← Express request/response handlers
└── routes/
    └── auth.routes.ts          ← Route definitions
```

### Modified Backend Files
```
apps/api/src/
└── app.ts                      ← Added authRoutes (app.use('/api/v1/auth', authRoutes))
```

### New Frontend Files
```
apps/web/src/
├── lib/
│   ├── utils.ts                ← cn() helper (clsx + tailwind-merge)
│   └── axios.ts                ← Configured Axios + auth interceptors
├── stores/
│   └── authStore.ts            ← Zustand auth store (persisted)
├── hooks/
│   └── useAuth.ts              ← React Query auth hooks
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   └── select.tsx
│   └── ProtectedRoute.tsx      ← Auth + RBAC route guard
└── pages/
    ├── auth/
    │   ├── LoginPage.tsx       ← Login form + demo quick-fill
    │   └── RegisterPage.tsx    ← 3-step multi-role registration
    └── dashboards/
        ├── PatientDashboard.tsx
        ├── DoctorDashboard.tsx
        ├── StaffDashboard.tsx
        ├── AdminDashboard.tsx
        └── InsuranceDashboard.tsx
```

### Modified Frontend Files
```
apps/web/src/
├── App.tsx                     ← Full routing with ProtectedRoute wrappers
├── index.css                   ← shadcn CSS variable theme (light + dark)
└── tailwind.config.ts          ← shadcn color tokens added
```

---

## How to Test

### 1. Start Services

```bash
# From root UHID/ directory
npm run dev
```

This starts:
- API server on `http://localhost:5000`
- Web app on `http://localhost:5173`

### 2. Test Login Flow

1. Open `http://localhost:5173`
2. You'll be redirected to `/login`
3. Click any demo account button (e.g. "Patient Demo")
4. Click **Sign In**
5. Should redirect to `/patient/dashboard`

### 3. Test Registration Flow

1. Click "Create account" on the login page
2. Fill in Step 1 (email, password)
3. Select a role in Step 2
4. Fill role-specific profile in Step 3
5. Submit → redirected to dashboard

### 4. Test API Directly

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@uhid.demo","password":"Demo@1234"}'

# Get profile (replace TOKEN with access token from login)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"

# Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

### 5. Test JWT Refresh

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN_FROM_LOGIN"}'
```

---

## Demo Accounts

All passwords: **`Demo@1234`**

| Role | Email | Expected Dashboard |
|------|-------|-------------------|
| Patient | `patient@uhid.demo` | `/patient/dashboard` |
| Doctor | `doctor@uhid.demo` | `/doctor/dashboard` |
| Hospital Staff | `staff@uhid.demo` | `/staff/dashboard` |
| Hospital Admin | `admin@uhid.demo` | `/admin/dashboard` |
| Insurance Provider | `insurance@uhid.demo` | `/insurance/dashboard` |

---

## Environment Variables Required

All of these should already be in `apps/api/.env` from Phase 0:

```env
# JWT
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# Redis (Upstash or local)
REDIS_URL=<your-redis-url>
REDIS_TOKEN=<your-redis-token>  # Only needed for Upstash REST client

# Database
DATABASE_URL=<your-supabase-postgres-url>
```

---

## What Phase 1 Does NOT Include

These are deferred to future phases:

- ❌ **Email verification** — `isVerified` flag exists but no OTP/magic-link flow yet (Phase 3)
- ❌ **Password reset** — No forgot password flow yet (Phase 3)
- ❌ **Google/OAuth login** — Not planned in current phases
- ❌ **2FA / MFA** — Not in scope for Phase 1
- ❌ **Profile photo upload** — Cloudinary integration deferred to Phase 2
- ❌ **Hospital lookup** — Doctor/Staff registration requires `hospitalId` to be known in advance; hospital search UI deferred
- ❌ **Rate limiting on auth endpoints** — Should be added before production

---

## Next: Phase 2 — Medical Records System

Phase 2 will build:
- Medical record upload (PDF, images via Cloudinary)
- Record access control (patient consents)
- Doctor record viewing (with consent check)
- Prescription creation & management
- Notification system (in-app)

See `docs/phases.md` for the full roadmap.
