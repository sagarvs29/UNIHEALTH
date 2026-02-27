# UniHealth ID (UHID) — Phase 0 Completion Report

> **Phase:** 0 — Project Setup  
> **Status:** ✅ COMPLETED  
> **Completed On:** February 27, 2026  
> **Duration:** 1 Day  

---

## 📋 Table of Contents

1. [What Was Achieved](#what-was-achieved)
2. [Files Created](#files-created)
3. [Cloud Services Configured](#cloud-services-configured)
4. [Database — Tables Created](#database--tables-created)
5. [Demo Accounts Seeded](#demo-accounts-seeded)
6. [Environment Variables](#environment-variables)
7. [How to Run](#how-to-run)
8. [Known Issues Resolved](#known-issues-resolved)
9. [What Phase 0 Does NOT Include](#what-phase-0-does-not-include)

---

## What Was Achieved

```
┌─────────────────────────────────────────────────────────────────┐
│               PHASE 0 — COMPLETED CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅  Monorepo folder structure created (api + web + ai)          │
│  ✅  Root package.json with npm workspaces configured            │
│  ✅  concurrently setup (1 command runs all 3 services)          │
│  ✅  .gitignore (protects .env, node_modules, dist)              │
│  ✅  .env.example (safe template for all secrets)                │
│  ✅  README.md with full setup guide                             │
│                                                                   │
│  ✅  Backend (apps/api) fully scaffolded                         │
│  ✅  Frontend (apps/web) fully scaffolded                        │
│  ✅  AI Service (apps/ai) fully scaffolded                       │
│                                                                   │
│  ✅  All npm packages installed (api + web)                      │
│  ✅  Python requirements.txt ready (ai)                          │
│                                                                   │
│  ✅  Prisma schema written (22 models, 14 enums)                 │
│  ✅  Prisma client generated                                      │
│  ✅  All 22 tables created in Supabase PostgreSQL                │
│  ✅  5 demo accounts seeded (all roles)                          │
│                                                                   │
│  ✅  Supabase (PostgreSQL) — connected                           │
│  ✅  Upstash (Redis) — configured                                │
│  ✅  Cloudinary (File Storage) — configured                      │
│  ✅  OpenAI API key — configured                                 │
│                                                                   │
│  ✅  TypeScript errors resolved (0 errors)                       │
│  ✅  Vite client types configured                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### Root Level
```
UHID/
├── package.json          ← npm workspaces (api + web) + concurrently
├── .gitignore            ← Ignores: node_modules, .env, dist, __pycache__
├── .env.example          ← Template with all 15 required env vars
└── README.md             ← Full local setup guide + demo credentials
```

### Backend — `apps/api/`
```
apps/api/
├── package.json          ← 15 dependencies (Express, Prisma, Argon2, JWT...)
├── tsconfig.json         ← TypeScript: ES2022, CommonJS, strict mode
├── .env                  ← All secrets filled (Supabase, Redis, Cloudinary...)
├── prisma/
│   └── schema.prisma     ← 22 models, 14 enums, full UHID database design
└── src/
    ├── index.ts          ← Server entry: DB connect → HTTP listen
    ├── app.ts            ← Express: CORS, Helmet, Rate limiter, routes
    ├── lib/
    │   ├── prisma.ts     ← Prisma client singleton
    │   ├── redis.ts      ← Upstash Redis client
    │   └── cloudinary.ts ← Cloudinary v2 config
    └── prisma/
        └── seed.ts       ← Seeds 5 demo accounts (all 5 roles)
```

### Frontend — `apps/web/`
```
apps/web/
├── package.json          ← 20+ dependencies (React, Tailwind, shadcn, React Query...)
├── tsconfig.json         ← TypeScript: ES2020, DOM, strict, vite/client types
├── tsconfig.node.json    ← TypeScript config for vite.config.ts
├── vite.config.ts        ← Vite: React plugin, port 5173, API proxy → 5000
├── tailwind.config.ts    ← Tailwind: UHID brand colors, shadcn theme
├── postcss.config.js     ← PostCSS: Tailwind + Autoprefixer
├── index.html            ← Root HTML entry point
└── src/
    ├── main.tsx          ← React entry: React Query provider + DevTools
    ├── App.tsx           ← Router: all 5 role routes + emergency QR route
    └── index.css         ← Tailwind base + custom scrollbar utilities
```

### AI Service — `apps/ai/`
```
apps/ai/
├── main.py               ← FastAPI app: CORS, health check, route mounts
├── requirements.txt      ← FastAPI, Uvicorn, OpenAI, Gemini, Tesseract, Pillow
└── .env                  ← OPENAI_API_KEY, GEMINI_API_KEY, AI_PORT
```

---

## Cloud Services Configured

| Service | Provider | Purpose | Status |
|---------|----------|---------|--------|
| **PostgreSQL 15** | Supabase | Main database — all 22 tables | ✅ Connected |
| **Redis 7** | Upstash | JWT refresh tokens, session cache | ✅ Configured |
| **File Storage** | Cloudinary | PDFs, X-rays, images | ✅ Configured |
| **LLM** | OpenAI (GPT-4o) | AI report decoding, pharma check | ✅ Key set |

> **Total monthly cost: ₹0** — all free tier

---

## Database — Tables Created

All 22 tables successfully created in Supabase PostgreSQL:

### Auth & Roles (6 tables)
| Table | Purpose |
|-------|---------|
| `users` | Shared auth for all 5 roles (email, password hash, role) |
| `patients` | UHID, health profile, allergies, chronic conditions, Aadhaar |
| `doctors` | License number, specialty, hospital, verification status |
| `hospital_staff` | Staff type, department, hospital association |
| `hospital_admins` | Admin linked to hospital |
| `insurance_providers` | Agent ID, company name, verification |

### Core Infrastructure (2 tables)
| Table | Purpose |
|-------|---------|
| `hospitals` | Hospital name, address, registration, verification |
| `emergency_contacts` | Patient's emergency contacts (name, phone, relationship) |

### Medical Data (4 tables)
| Table | Purpose |
|-------|---------|
| `medical_records` | Cloudinary file URL, OCR extracted data (JSONB), AI summary |
| `prescriptions` | Doctor prescription with Pharma-Check tracking + override flag |
| `prescription_items` | Individual medicines with RxNorm ID, dosage, frequency |
| `clinical_notes` | ICD-10 codes, vitals (JSONB), visit type, findings |

### Access Control (3 tables)
| Table | Purpose |
|-------|---------|
| `consents` | OTP-verified consent with scope[], expiry, doctor/insurance link |
| `qr_codes` | Scoped QR with expiry, scan count, revocation |
| `emergency_accesses` | SOS activation + doctor override logs |

### AI & Drug Safety (2 tables)
| Table | Purpose |
|-------|---------|
| `pharma_check_logs` | Drug-drug, drug-allergy, drug-condition check results |
| `ai_report_summaries` | Cached GPT-4o simplified report summaries |

### Insurance (2 tables)
| Table | Purpose |
|-------|---------|
| `insurance_claims` | Claim number, amounts (Decimal), AI fraud check result |
| `claim_documents` | Links claim → MedicalRecord with verification status |

### System (3 tables)
| Table | Purpose |
|-------|---------|
| `audit_logs` | Every action logged — indexed by userId, patientId, action, time |
| `appointments` | Telehealth scheduling with meeting link, fee |
| `family_links` | Guardian/family relationships with access type |

---

## Demo Accounts Seeded

> Password for all accounts: **`Demo@1234`**

| Role | Email | Extra Info |
|------|-------|------------|
| 🧑‍⚕️ Patient | `patient@uhid.demo` | UHID: `UH-100001`, Blood: O+, Diabetic |
| 👨‍⚕️ Doctor | `doctor@uhid.demo` | Dr. Priya Sharma, General Medicine, MBBS MD |
| 🏥 Hospital Staff | `staff@uhid.demo` | Lab Technician, Pathology Dept |
| 🔧 Hospital Admin | `admin@uhid.demo` | UHID Demo Hospital |
| 📋 Insurance | `insurance@uhid.demo` | Star Health Insurance, Agent: STAR-AGT-001 |

**Demo Hospital:** UHID Demo Hospital, Chennai, Tamil Nadu

---

## Environment Variables

### `apps/api/.env` — All values set

| Variable | Status | Source |
|----------|--------|--------|
| `DATABASE_URL` | ✅ | Supabase Transaction Pooler (port 6543) |
| `DIRECT_URL` | ✅ | Supabase Session Pooler (port 5432) |
| `JWT_SECRET` | ✅ | Generated (64-byte random) |
| `JWT_REFRESH_SECRET` | ✅ | Generated (different 64-byte random) |
| `JWT_EXPIRES_IN` | ✅ | 15m |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | 7d |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash dashboard |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary dashboard |
| `OPENAI_API_KEY` | ✅ | OpenAI platform |
| `ENCRYPTION_KEY` | ✅ | Generated (32-byte AES-256 key) |
| `ENCRYPTION_IV` | ✅ | Generated (16-byte IV) |
| `PORT` | ✅ | 5000 |
| `NODE_ENV` | ✅ | development |
| `CLIENT_URL` | ✅ | http://localhost:5173 |
| `SMTP_*` | ⏳ | Needed in Phase 1 for OTP emails |
| `GEMINI_API_KEY` | ⏳ | Optional fallback, needed in Phase 3 |

---

## How to Run

### Prerequisites
- Node.js 20 LTS
- Python 3.11+

### Start everything (after Phase 0)
```powershell
# From root UHID/ directory
npm run dev
```

This starts:
- 🔵 **API** → http://localhost:5000
- 🟢 **Web** → http://localhost:5173  
- 🟡 **AI**  → http://localhost:8000

### Useful database commands
```powershell
# Open Prisma Studio (visual DB browser)
cd apps/api
npx prisma studio

# Re-sync schema after changes
npx prisma db push

# Re-seed demo data
npm run db:seed

# Regenerate Prisma client
npx prisma generate
```

---

## Known Issues Resolved

| Issue | Root Cause | Resolution |
|-------|-----------|------------|
| `DATABASE_URL` was project web URL | Copied wrong URL from Supabase | Switched to Transaction Pooler URI (port 6543) |
| `P1001: Can't reach database` | ISP blocks port 5432 to external hosts | Used Session Pooler (port 5432 via pooler) for `db push` |
| `P1017: Server closed connection` | `pgbouncer=true` blocks DDL operations | Removed `?pgbouncer=true` for `db push`, re-added for runtime |
| `FATAL: Tenant or user not found` | Wrong password (`unfied2026uhid`) | Reset Supabase DB password to `UHIDproject2026` |
| `Role` not exported from `@prisma/client` | `db push` didn't fully regenerate enums | Re-ran `npx prisma generate` |
| `Cannot find module './app'` in index.ts | TS language server stale cache | Added `typeRoots` to tsconfig + restarted TS server |
| `Property 'env' does not exist on ImportMeta` | Missing Vite types in web tsconfig | Added `"types": ["vite/client"]` to web tsconfig |

---

## What Phase 0 Does NOT Include

- ❌ No authentication logic (JWT, login, register) — **Phase 1**
- ❌ No React pages or UI components — **Phase 1**
- ❌ No medical record upload — **Phase 2**
- ❌ No consent system — **Phase 2**
- ❌ No prescription / Pharma-Check — **Phase 2**
- ❌ No AI features (report decoder, clinical summary) — **Phase 3**
- ❌ No QR code generation — **Phase 3**
- ❌ No emergency SOS — **Phase 3**
- ❌ No insurance claims — **Phase 4**
- ❌ No admin dashboard — **Phase 4**
- ❌ No deployment to Vercel/Render — **Phase 5**

---

## Next: Phase 1 — Authentication & UHID Registration

**What Phase 1 will deliver:**
- `POST /api/v1/auth/register` — Register all 5 roles
- `POST /api/v1/auth/login` — JWT + Refresh token
- `POST /api/v1/auth/refresh` — Silent token renewal
- `POST /api/v1/auth/logout` — Invalidate Redis token
- `GET  /api/v1/auth/me` — Get current user
- Login page UI (React)
- Register page UI (React)
- 5 role-based protected dashboards (placeholders)
- Zustand auth store
- Axios interceptor for auto token attachment
