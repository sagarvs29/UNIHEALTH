# UniHealth ID (UHID) - Implementation Phases

> **Version:** 1.0  
> **Last Updated:** February 26, 2026  
> **Status:** Planning Phase  
> **Total Duration:** 16 Weeks  
> **Target:** Final Year Project Submission

---

## 📋 Table of Contents

1. [Project Timeline Overview](#project-timeline-overview)
2. [Phase 0 - Project Setup](#phase-0-project-setup-week-0)
3. [Phase 1 - Foundation](#phase-1-foundation-weeks-1-3)
4. [Phase 2 - Core Features](#phase-2-core-features-weeks-4-8)
5. [Phase 3 - AI Features](#phase-3-ai-features-weeks-9-11)
6. [Phase 4 - Advanced Features](#phase-4-advanced-features-weeks-12-14)
7. [Phase 5 - Testing & Deployment](#phase-5-testing--deployment-weeks-15-16)
8. [Milestone Summary](#milestone-summary)
9. [Risk Management](#risk-management)
10. [Future Scope (Post Submission)](#future-scope)

---

## Project Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     16-WEEK IMPLEMENTATION TIMELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  WEEK  │ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │10  │11  │12  │13  │14  │15  │16  │
│  ──────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│  P0    │████│    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │
│  P1    │    │████│████│████│    │    │    │    │    │    │    │    │    │    │    │    │    │
│  P2    │    │    │    │    │████│████│████│████│████│    │    │    │    │    │    │    │    │
│  P3    │    │    │    │    │    │    │    │    │    │████│████│████│    │    │    │    │    │
│  P4    │    │    │    │    │    │    │    │    │    │    │    │    │████│████│████│    │    │
│  P5    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │████│████│
│                                                                               │
│  LEGEND:                                                                      │
│  P0 = Setup   P1 = Foundation   P2 = Core Features                           │
│  P3 = AI      P4 = Advanced     P5 = Testing & Deploy                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Project Setup (Week 0)

> **Goal:** Initialize project structure, configure all tools, ensure everyone can run the project locally.

### Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 0 - PROJECT SETUP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📁 MONOREPO STRUCTURE SETUP                                     │
│  ├── Initialize root package.json                                │
│  ├── Setup workspace config (npm workspaces)                     │
│  ├── Create apps/ and packages/ directories                      │
│  └── Configure shared TypeScript settings                        │
│                                                                   │
│  🛠️ TOOL CONFIGURATION                                           │
│  ├── ESLint + Prettier (code formatting)                         │
│  ├── Husky (pre-commit hooks)                                    │
│  ├── GitHub repository + branch strategy                         │
│  ├── VS Code workspace settings                                  │
│  └── concurrently (run all services in one terminal)            │
│                                                                   │
│  �️ LOCAL SERVICE INSTALLATION                                   │
│  ├── PostgreSQL  → Install locally (official installer)         │
│  ├── Redis       → Install locally (or Memurai on Windows)      │
│  ├── MinIO       → Download single binary, run directly         │
│  └── Test all services are reachable on localhost               │
│                                                                   │
│  ⚠️  NO DOCKER  →  This is a college demo project               │
│     Docker adds complexity with zero benefit for a              │
│     single-machine presentation to faculty evaluators.          │
│     Services run directly on localhost instead.                 │
│                                                                   │
│  🗂️ DATABASE INITIALIZATION                                       │
│  ├── Create PostgreSQL database (uhid_db)                        │
│  ├── Setup Prisma schema skeleton                                │
│  ├── Run first migration (npx prisma migrate dev)               │
│  └── Seed file for test/demo data                               │
│                                                                   │
│  📄 ENVIRONMENT SETUP                                             │
│  ├── Create .env file (DB URL, JWT secrets, API keys)           │
│  ├── Create .env.example (safe to commit)                        │
│  └── Add .env to .gitignore                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Project Folder Structure

```
UHID/
├── apps/
│   ├── web/                        # React.js Frontend
│   │   ├── src/
│   │   │   ├── components/         # Reusable UI components
│   │   │   ├── pages/              # Role-based pages
│   │   │   │   ├── patient/
│   │   │   │   ├── doctor/
│   │   │   │   ├── hospital-staff/
│   │   │   │   ├── hospital-admin/
│   │   │   │   └── insurance/
│   │   │   ├── store/              # Zustand state stores
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── lib/                # Utilities, API clients
│   │   │   └── types/              # TypeScript types
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── api/                        # Node.js Backend
│   │   ├── src/
│   │   │   ├── routes/             # API route handlers
│   │   │   ├── middleware/         # Auth, RBAC, validation
│   │   │   ├── services/           # Business logic
│   │   │   ├── prisma/             # Prisma schema + migrations
│   │   │   └── utils/              # Helpers, logger
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── ai-service/                 # Python AI Service
│       ├── src/
│       │   ├── routes/             # FastAPI endpoints
│       │   ├── services/           # OCR, LLM, drug check
│       │   └── models/             # Pydantic models
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   ├── shared/                     # Shared TS types (frontend + backend)
│   │   └── src/types/
│   │       ├── patient.ts
│   │       ├── medical-record.ts
│   │       ├── prescription.ts
│   │       └── roles.ts
│   └── ui/                         # Shared UI components
│
├── docs/
│   ├── features.md
│   ├── tech-stack.md
│   └── phases.md
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

### Deliverables

| Deliverable | Status |
|-------------|--------|
| Monorepo initialized | ⬜ |
| PostgreSQL running locally | ⬜ |
| Redis running locally | ⬜ |
| MinIO binary running locally | ⬜ |
| `npm run dev` starts all 3 services | ⬜ |
| GitHub repo with branch protection | ⬜ |
| First Prisma migration runs | ⬜ |

---

## Phase 1: Foundation (Weeks 1–3)

> **Goal:** Build the authentication system, user roles, UHID generation, and base API structure. By end of Phase 1, users can register, login, and be identified by role.

### Week 1 — Authentication System

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 1 - AUTHENTICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /auth/register        → Create new user account       │
│  ├── POST /auth/login           → Return JWT + Refresh Token    │
│  ├── POST /auth/refresh         → Rotate access token           │
│  ├── POST /auth/logout          → Invalidate refresh token      │
│  ├── POST /auth/send-otp        → Send OTP to phone/email       │
│  ├── POST /auth/verify-otp      → Verify OTP from Redis         │
│  ├── Argon2 password hashing                                     │
│  ├── JWT middleware (protect routes)                             │
│  └── Redis: store refresh tokens + OTPs                         │
│                                                                   │
│  FRONTEND                                                         │
│  ├── Login Page (all roles)                                      │
│  ├── Registration Page                                           │
│  ├── OTP verification screen                                     │
│  ├── Auth store (Zustand)                                        │
│  └── Protected route wrapper                                     │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── users table                                                 │
│  │   ├── id (UUID)                                               │
│  │   ├── email                                                   │
│  │   ├── phone                                                   │
│  │   ├── password_hash (Argon2)                                  │
│  │   ├── role (ENUM)                                             │
│  │   └── is_verified                                             │
│  └── otp_logs table (for audit)                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 2 — UHID Generation & Patient Registration

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 2 - UHID SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /patients/register    → Create patient + gen UHID     │
│  ├── GET  /patients/:uhid       → Get patient by UHID           │
│  ├── PUT  /patients/:uhid       → Update patient profile        │
│  ├── UHID generation algorithm:                                  │
│  │   └── 6-char alphanumeric, unique, collision-checked         │
│  └── Aadhaar verification mock (OTP simulation)                 │
│                                                                   │
│  FRONTEND                                                         │
│  ├── Patient Registration Form                                   │
│  ├── UHID display screen (after registration)                    │
│  ├── Patient Profile page                                        │
│  └── UHID Card (printable)                                       │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── patients table                                              │
│  │   ├── id (UUID)                                               │
│  │   ├── uhid (CHAR 6, UNIQUE)                                   │
│  │   ├── user_id (FK → users)                                    │
│  │   ├── full_name                                               │
│  │   ├── date_of_birth                                           │
│  │   ├── gender                                                  │
│  │   ├── blood_group (ENUM)                                      │
│  │   ├── allergies (TEXT[])                                      │
│  │   ├── chronic_conditions (TEXT[])                             │
│  │   ├── emergency_contact (JSONB)                               │
│  │   └── created_at                                              │
│  └── aadhaar_verifications table                                 │
│                                                                   │
│  UHID GENERATION ALGORITHM                                        │
│  ├── Generate 6-char alphanumeric ID                             │
│  ├── Check uniqueness in DB                                      │
│  ├── Retry if collision (max 5 retries)                          │
│  └── Example outputs: 847291, K3X9M2, TY4821                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 3 — Role-Based Access Control (RBAC) + Base Dashboards

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 3 - RBAC + DASHBOARDS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── RBAC middleware                                             │
│  │   └── requireRole('doctor', 'hospital_staff')                │
│  ├── Hospital registration + staff management                    │
│  ├── POST /hospitals/register                                    │
│  ├── POST /hospitals/:id/staff  → Add staff member              │
│  ├── GET  /hospitals/:id/staff  → List staff                    │
│  └── Doctor registration + hospital linking                      │
│                                                                   │
│  FRONTEND                                                         │
│  ├── Role-based routing (after login redirect)                   │
│  │   ├── Patient     → /patient/dashboard                       │
│  │   ├── Doctor      → /doctor/dashboard                        │
│  │   ├── H. Staff    → /staff/dashboard                         │
│  │   ├── H. Admin    → /admin/dashboard                         │
│  │   └── Insurance   → /insurance/dashboard                     │
│  ├── Base dashboard shell for each role                          │
│  ├── Sidebar navigation (role-specific menu)                     │
│  └── User profile menu + logout                                  │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── hospitals table                                             │
│  ├── hospital_staff table                                        │
│  ├── doctors table                                               │
│  └── insurance_companies table                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1 Deliverables

| Deliverable | Week | Status |
|-------------|------|--------|
| User registration + login working | W1 | ⬜ |
| JWT auth with refresh token rotation | W1 | ⬜ |
| OTP send + verify via Redis | W1 | ⬜ |
| Patient registration + UHID generation | W2 | ⬜ |
| Patient profile page | W2 | ⬜ |
| UHID printable card | W2 | ⬜ |
| RBAC middleware on all routes | W3 | ⬜ |
| 5 role-based dashboards (shell) | W3 | ⬜ |
| Hospital + staff management | W3 | ⬜ |

---

## Phase 2: Core Features (Weeks 4–8)

> **Goal:** Build the main functionality - record upload, patient lookup, prescriptions, Pharma-Check, consent system, and QR codes.

### Week 4 — Hospital Staff: File Upload + OCR Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 4 - FILE UPLOAD + OCR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /records/upload       → Upload medical document       │
│  ├── GET  /records/:uhid        → Get all records for patient   │
│  ├── GET  /records/:id          → Get single record             │
│  ├── Multer: handle PDF/image upload                             │
│  ├── MinIO: store file + return secure URL                       │
│  └── Queue job → AI service for OCR processing                  │
│                                                                   │
│  AI SERVICE                                                       │
│  ├── POST /ai/ocr               → Extract text from document    │
│  ├── Tesseract OCR pipeline                                      │
│  ├── Extract key medical values (regex + NLP)                    │
│  └── Return structured JSON of extracted data                   │
│                                                                   │
│  FRONTEND (Hospital Staff)                                        │
│  ├── Upload Medical Record form                                  │
│  │   ├── Search patient by UHID                                  │
│  │   ├── Select record type (Lab, Imaging, Prescription)         │
│  │   ├── File upload with drag-and-drop                          │
│  │   └── Metadata fields (date, doctor, department)             │
│  ├── OCR results review screen                                   │
│  │   ├── Show extracted values                                   │
│  │   ├── Edit/confirm before saving                              │
│  │   └── Confirm & Save button                                   │
│  └── Upload history list                                         │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── medical_records table                                       │
│  │   ├── id (UUID)                                               │
│  │   ├── uhid (FK → patients)                                    │
│  │   ├── record_type (ENUM)                                      │
│  │   ├── file_url (MinIO path)                                   │
│  │   ├── extracted_data (JSONB)                                  │
│  │   ├── uploaded_by (FK → hospital_staff)                       │
│  │   ├── hospital_id                                             │
│  │   ├── record_date                                             │
│  │   └── created_at                                             │
│  └── upload_audit_logs table                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 5 — Patient: View Records + Medical History

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 5 - PATIENT RECORD VIEWER                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── GET /patients/:uhid/records → Paginated record list        │
│  ├── GET /patients/:uhid/records?type=lab_report                │
│  ├── GET /records/:id/download  → Pre-signed MinIO URL          │
│  └── GET /patients/:uhid/summary → Medical history overview     │
│                                                                   │
│  FRONTEND (Patient)                                               │
│  ├── My Records page                                             │
│  │   ├── Filter by type, hospital, date range                    │
│  │   ├── Record cards with key info                              │
│  │   ├── View full report (PDF viewer)                           │
│  │   └── Download record as PDF                                  │
│  ├── Medical History Timeline                                    │
│  │   ├── Chronological view of all records                       │
│  │   ├── Grouped by year/month                                   │
│  │   └── Filter by category                                      │
│  └── Health Overview cards                                       │
│      ├── Blood group, allergies, conditions                      │
│      └── Current medications                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 6 — Consent Management System

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 6 - CONSENT SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /consents/request     → Doctor requests access        │
│  ├── POST /consents/approve     → Patient approves via OTP      │
│  ├── POST /consents/deny        → Patient denies request        │
│  ├── DELETE /consents/:id       → Revoke access                 │
│  ├── GET /consents/active       → List active permissions       │
│  ├── GET /consents/history      → Full consent history          │
│  ├── Consent session in Redis (with TTL)                         │
│  └── Real-time notification via Socket.io                        │
│                                                                   │
│  FRONTEND (Patient)                                               │
│  ├── Consent Management page                                     │
│  │   ├── Active permissions list                                 │
│  │   ├── Pending requests (approve/deny)                         │
│  │   ├── OTP confirmation popup                                  │
│  │   └── Revoke access button                                    │
│  └── Push notification for new requests                          │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── Request access button on patient search                     │
│  └── Access pending / granted status indicator                  │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── consents table                                              │
│  │   ├── id (UUID)                                               │
│  │   ├── patient_uhid                                            │
│  │   ├── granted_to_id (doctor or insurance)                    │
│  │   ├── granted_to_role                                         │
│  │   ├── access_scope (JSONB) → which records                   │
│  │   ├── status (pending/approved/denied/revoked)               │
│  │   ├── expires_at                                              │
│  │   └── created_at                                             │
│  └── consent_audit_logs table                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 7 — Doctor: Patient Lookup + Clinical Notes

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 7 - DOCTOR PORTAL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── GET  /patients/lookup/:uhid → Doctor lookup patient        │
│  ├── POST /clinical-notes        → Add consultation notes       │
│  ├── GET  /clinical-notes/:uhid  → Get all notes for patient    │
│  ├── Verify consent before returning patient data               │
│  └── GET  /doctors/:id/patients  → Doctor's patient history     │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── Patient Lookup page                                         │
│  │   ├── UHID search input                                       │
│  │   ├── QR code scanner (via camera)                            │
│  │   └── Consent status indicator                                │
│  ├── Patient Dashboard (after consent)                           │
│  │   ├── Profile overview (allergies, conditions, blood group)  │
│  │   ├── Recent lab reports with values                          │
│  │   ├── Medical history timeline                                │
│  │   ├── Current medications list                                │
│  │   └── Action buttons: Add Prescription, Add Notes            │
│  ├── Add Clinical Notes form                                     │
│  │   ├── Chief complaint                                         │
│  │   ├── Examination findings                                    │
│  │   ├── ICD-10 diagnosis search                                 │
│  │   └── Treatment plan                                          │
│  └── My Patients list (all consulted patients)                  │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── clinical_notes table                                        │
│  │   ├── id, patient_uhid, doctor_id                            │
│  │   ├── chief_complaint, examination                            │
│  │   ├── diagnosis (ICD-10 code + label)                        │
│  │   ├── treatment_plan                                          │
│  │   └── visit_date, created_at                                 │
│  └── doctor_patient_history table                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 8 — Pharma-Check Engine + Prescriptions

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 8 - PHARMA-CHECK + PRESCRIPTIONS         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /prescriptions         → Save prescription            │
│  ├── GET  /prescriptions/:uhid   → Get patient prescriptions    │
│  ├── POST /pharma-check          → Check drug interactions      │
│  └── GET  /medications/search    → Search drug database         │
│                                                                   │
│  AI SERVICE                                                       │
│  ├── POST /ai/pharma-check                                       │
│  │   ├── Input: current_drugs[], new_drug, patient_conditions[] │
│  │   ├── Query DrugBank + RxNorm database                       │
│  │   ├── Check drug-drug interactions                            │
│  │   ├── Check drug-allergy conflicts                            │
│  │   ├── Check drug-condition contraindications                  │
│  │   └── Return: severity, description, alternatives[]          │
│  └── POST /ai/drug-search        → Normalize drug names        │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── New Prescription Form                                       │
│  │   ├── Auto-load current medications from patient profile      │
│  │   ├── Add new medicines (name, dose, frequency, duration)    │
│  │   ├── Medicine autocomplete with drug database               │
│  │   └── "Check & Save" button triggers Pharma-Check           │
│  ├── Pharma-Check Alert Modal                                    │
│  │   ├── 🔴 Critical interactions (with details)                │
│  │   ├── 🟡 Moderate warnings                                   │
│  │   ├── 🟢 Safe combinations                                   │
│  │   ├── Suggested alternatives                                  │
│  │   └── [Proceed Anyway] [Modify] [Cancel] buttons            │
│  └── Saved prescription viewer (printable)                       │
│                                                                   │
│  PHARMA-CHECK FLOW                                               │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Doctor adds: Warfarin 5mg                             │     │
│  │       │                                                 │     │
│  │       ▼                                                 │     │
│  │  API call → AI Service                                  │     │
│  │  Input: {                                               │     │
│  │    current: ['Metformin', 'Lisinopril', 'Aspirin'],    │     │
│  │    new_drug: 'Warfarin',                               │     │
│  │    allergies: ['Penicillin'],                          │     │
│  │    conditions: ['Diabetes', 'Hypertension']            │     │
│  │  }                                                      │     │
│  │       │                                                 │     │
│  │       ▼                                                 │     │
│  │  Response: {                                            │     │
│  │    interactions: [{                                     │     │
│  │      drugs: ['Warfarin', 'Aspirin'],                   │     │
│  │      severity: 'HIGH',                                  │     │
│  │      description: 'Increased bleeding risk',           │     │
│  │      alternatives: ['Clopidogrel', 'Rivaroxaban']     │     │
│  │    }]                                                   │     │
│  │  }                                                      │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── prescriptions table                                         │
│  ├── prescription_items table (each drug)                        │
│  ├── pharma_check_logs table (all checks + results)             │
│  └── drugs_cache table (local drug database)                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2 Deliverables

| Deliverable | Week | Status |
|-------------|------|--------|
| Hospital staff file upload (PDF/Image) | W4 | ⬜ |
| OCR text extraction working | W4 | ⬜ |
| MinIO file storage integrated | W4 | ⬜ |
| Patient record viewer with filters | W5 | ⬜ |
| Medical history timeline | W5 | ⬜ |
| Consent request + OTP approval | W6 | ⬜ |
| Real-time consent notifications | W6 | ⬜ |
| Doctor UHID lookup + patient dashboard | W7 | ⬜ |
| QR code scanner for doctor | W7 | ⬜ |
| Clinical notes (add + view) | W7 | ⬜ |
| Prescription creation form | W8 | ⬜ |
| Pharma-Check engine (drug interactions) | W8 | ⬜ |
| Pharma-Check alert modal | W8 | ⬜ |

---

## Phase 3: AI Features (Weeks 9–11)

> **Goal:** Implement all AI-powered features — Report Decoder, AI Clinical Summary, QR Code system, and Emergency Access.

### Week 9 — Report Decoder (AI-Powered)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 9 - REPORT DECODER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AI SERVICE                                                       │
│  ├── POST /ai/decode-report                                      │
│  │   ├── Input: extracted_data (from OCR), report_type          │
│  │   ├── Build prompt with medical context                       │
│  │   ├── Call OpenAI GPT-4o API                                  │
│  │   ├── Parse response into structured sections                 │
│  │   └── Output: { summary, concerns, recommendations }         │
│  └── Prompt Engineering:                                         │
│      ├── System: "You are a medical interpreter for patients..." │
│      ├── Include: patient age, gender, conditions                │
│      ├── Instruct: simple language, no jargon                   │
│      └── Include: disclaimer to consult doctor                  │
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /records/:id/decode   → Trigger AI decode             │
│  ├── GET  /records/:id/summary  → Get cached AI summary         │
│  └── Cache decoded summaries in DB (avoid re-processing)        │
│                                                                   │
│  FRONTEND (Patient)                                               │
│  ├── "Get AI Summary" button on each record                      │
│  ├── Loading state (AI processing indicator)                     │
│  ├── AI Summary display:                                         │
│  │   ├── 📌 What This Means (plain language)                    │
│  │   ├── 🔴 Areas of Concern (abnormal values)                  │
│  │   ├── ✅ Good News (normal values)                            │
│  │   ├── 💡 Simple Recommendations                              │
│  │   └── ⚠️ Disclaimer (AI guidance, consult doctor)           │
│  └── Share summary with doctor button                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 10 — AI Clinical Summary (for Doctors)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 10 - AI CLINICAL SUMMARY                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AI SERVICE                                                       │
│  ├── POST /ai/clinical-summary                                   │
│  │   ├── Input: full patient history, records, prescriptions    │
│  │   ├── GPT-4o prompt (clinical context for doctors)           │
│  │   └── Output: key points, concerns, medication review        │
│  └── POST /ai/risk-score                                         │
│      ├── Calculate patient risk score                            │
│      └── Based on conditions, age, lab trends                   │
│                                                                   │
│  BACKEND                                                          │
│  ├── GET /patients/:uhid/ai-summary → Doctor's clinical view    │
│  └── POST /patients/:uhid/ai-summary → Regenerate summary       │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── AI Summary panel on Patient Dashboard                       │
│  │   ├── Key Conditions summary                                  │
│  │   ├── Recent Concerns (trending values)                       │
│  │   ├── Medication Review (current meds analysis)              │
│  │   ├── Risk Score indicator                                    │
│  │   └── Refresh AI Summary button                              │
│  └── Lab Trend Charts                                            │
│      ├── HbA1c over time (Recharts)                             │
│      ├── Blood pressure trends                                   │
│      └── Cholesterol history                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 11 — QR Code System + Emergency Access

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 11 - QR + EMERGENCY ACCESS               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND - QR SYSTEM                                             │
│  ├── POST /qr/generate          → Generate QR token             │
│  │   ├── Input: scope, duration, patient UHID                   │
│  │   ├── Create signed JWT (short-lived)                         │
│  │   └── Store in Redis with TTL                                │
│  ├── GET  /qr/scan/:token       → Validate + return data        │
│  └── DELETE /qr/:token          → Revoke QR early              │
│                                                                   │
│  BACKEND - EMERGENCY ACCESS                                      │
│  ├── GET  /emergency/:uhid      → Public emergency info         │
│  │   └── Returns: blood group, allergies, emergency contact     │
│  ├── POST /emergency/override   → Doctor emergency access       │
│  │   ├── Requires: reason, hospital verification                │
│  │   ├── Grants: 4-hour temporary access                        │
│  │   └── Logs: full audit entry                                  │
│  └── POST /emergency/sos        → Patient SOS activation        │
│      ├── Alert emergency contacts (SMS)                          │
│      ├── Generate emergency access code                          │
│      └── Notify nearby hospitals                                 │
│                                                                   │
│  FRONTEND (Patient)                                               │
│  ├── QR Code Generator page                                      │
│  │   ├── Select scope (what to share)                            │
│  │   ├── Set duration                                            │
│  │   ├── Display QR code                                         │
│  │   └── Download / Share QR                                     │
│  ├── Emergency Health Card                                       │
│  │   ├── Always-visible critical info                            │
│  │   └── Printable physical card                                 │
│  └── SOS Button                                                  │
│      ├── Large red button in app                                 │
│      ├── Confirm activation dialog                               │
│      └── SOS active screen with emergency info                  │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── QR Scanner (patient check-in)                               │
│  └── Emergency Override Request form                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3 Deliverables

| Deliverable | Week | Status |
|-------------|------|--------|
| Report Decoder with GPT-4o | W9 | ⬜ |
| AI summary display for patients | W9 | ⬜ |
| AI clinical summary for doctors | W10 | ⬜ |
| Lab trend charts | W10 | ⬜ |
| Patient risk score | W10 | ⬜ |
| QR code generation + scanning | W11 | ⬜ |
| Emergency public QR info page | W11 | ⬜ |
| Doctor emergency override | W11 | ⬜ |
| Patient SOS activation | W11 | ⬜ |

---

## Phase 4: Advanced Features (Weeks 12–14)

> **Goal:** Insurance portal, hospital admin panel, audit logs, and telehealth integration.

### Week 12 — Insurance Portal

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 12 - INSURANCE PORTAL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── POST /insurance/claims              → Create new claim     │
│  ├── GET  /insurance/claims              → List claims          │
│  ├── GET  /insurance/claims/:id          → Claim details        │
│  ├── PUT  /insurance/claims/:id/decision → Approve/Reject       │
│  ├── POST /insurance/request-access      → Request patient data │
│  └── GET  /insurance/verify/:uhid        → Verify record hashes │
│                                                                   │
│  FRONTEND (Insurance)                                             │
│  ├── Insurance Dashboard                                         │
│  │   ├── Claims summary (pending/approved/rejected counts)      │
│  │   └── Recent claims list                                      │
│  ├── New Claim form                                              │
│  │   ├── Patient UHID input                                      │
│  │   ├── Claim type, amount, policy number                      │
│  │   └── Request access to specific records                     │
│  ├── Claim Verification page                                     │
│  │   ├── Verified records list with blockchain hash             │
│  │   ├── AI Fraud Check results                                  │
│  │   └── Approve / Reject / Hold decision                       │
│  └── Claim Analytics dashboard                                   │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── insurance_claims table                                      │
│  ├── claim_records table (linked records)                        │
│  └── claim_decisions table (audit trail)                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 13 — Hospital Admin Panel + Audit Logs

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 13 - ADMIN PANEL + AUDIT                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND                                                          │
│  ├── GET  /admin/staff                → List all staff          │
│  ├── POST /admin/staff/verify/:id     → Verify staff member     │
│  ├── DELETE /admin/staff/:id          → Deactivate staff        │
│  ├── GET  /admin/analytics            → Hospital statistics     │
│  ├── GET  /admin/audit-logs           → Full audit logs         │
│  └── GET  /admin/compliance-report    → Generate PDF report     │
│                                                                   │
│  FRONTEND (Hospital Admin)                                        │
│  ├── Admin Dashboard                                             │
│  │   ├── Total patients, records, staff statistics              │
│  │   ├── Records uploaded this month                            │
│  │   └── Pharma-Check alerts statistics                          │
│  ├── Staff Management                                            │
│  │   ├── Staff table with roles, departments                    │
│  │   ├── Pending verification queue                             │
│  │   └── Add/deactivate staff                                   │
│  ├── Audit Log Viewer                                            │
│  │   ├── Searchable, filterable log table                       │
│  │   ├── Filter by user, action, date                           │
│  │   └── Export to CSV                                           │
│  └── Compliance Report Generator                                 │
│                                                                   │
│  AUDIT LOG SCHEMA                                                 │
│  ├── audit_logs table                                            │
│  │   ├── id, timestamp                                           │
│  │   ├── user_id, user_role, hospital_id                        │
│  │   ├── action (ENUM: VIEW, UPLOAD, PRESCRIBE, etc.)          │
│  │   ├── resource_type, resource_id                             │
│  │   ├── ip_address                                              │
│  │   └── metadata (JSONB)                                        │
│  └── All CREATE/READ/UPDATE actions auto-logged via middleware  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 14 — Telehealth + Notifications

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 14 - TELEHEALTH + NOTIFICATIONS          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BACKEND - TELEHEALTH                                             │
│  ├── POST /telehealth/appointments  → Book consultation         │
│  ├── GET  /telehealth/appointments  → List appointments         │
│  ├── PUT  /telehealth/appointments/:id → Update status          │
│  └── GET  /telehealth/room/:id      → Get video room token      │
│      └── Integrate: Daily.co or Agora.io SDK                    │
│                                                                   │
│  BACKEND - NOTIFICATIONS                                          │
│  ├── Socket.io events:                                           │
│  │   ├── consent:request     → Patient gets consent alert      │
│  │   ├── consent:approved    → Doctor gets access granted       │
│  │   ├── record:uploaded     → Patient notified of new record  │
│  │   ├── appointment:booked  → Both parties notified           │
│  │   └── emergency:sos       → Hospital gets SOS alert         │
│  └── Email notifications (Nodemailer + SMTP)                     │
│                                                                   │
│  FRONTEND (Patient)                                               │
│  ├── Book Consultation page                                      │
│  │   ├── Browse doctors by specialty                             │
│  │   ├── View available slots                                    │
│  │   └── Confirm booking + payment mock                          │
│  ├── My Appointments page                                        │
│  │   ├── Upcoming + past appointments                            │
│  │   └── Join Call button (opens video)                          │
│  └── Notification center (bell icon)                             │
│                                                                   │
│  FRONTEND (Doctor)                                                │
│  ├── Today's Appointments list                                   │
│  └── Join Consultation button (opens video)                     │
│                                                                   │
│  DATABASE SCHEMA                                                  │
│  ├── appointments table                                          │
│  └── notifications table                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4 Deliverables

| Deliverable | Week | Status |
|-------------|------|--------|
| Insurance claim creation + verification | W12 | ⬜ |
| AI fraud detection for claims | W12 | ⬜ |
| Hospital admin staff management | W13 | ⬜ |
| Audit log viewer + export | W13 | ⬜ |
| Hospital analytics dashboard | W13 | ⬜ |
| Telehealth appointment booking | W14 | ⬜ |
| Video consultation integration | W14 | ⬜ |
| Real-time notifications | W14 | ⬜ |

---

## Phase 5: Testing & Deployment (Weeks 15–16)

> **Goal:** Comprehensive testing, bug fixing, performance optimization, and final deployment.

### Week 15 — Testing + Security Hardening

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 15 - TESTING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  UNIT TESTING (Backend)                                           │
│  ├── Tool: Jest + Supertest                                      │
│  ├── Auth routes (login, register, OTP)                          │
│  ├── UHID generation (uniqueness, format)                        │
│  ├── Pharma-Check engine (known interactions)                    │
│  ├── Consent logic (approve/deny/revoke)                         │
│  └── RBAC middleware (role enforcement)                          │
│                                                                   │
│  INTEGRATION TESTING                                              │
│  ├── Full upload → OCR → Save → View flow                       │
│  ├── Doctor consent → view records → prescribe → check flow     │
│  ├── Insurance request → patient approve → view → claim flow    │
│  └── Emergency override → access → audit log flow               │
│                                                                   │
│  FRONTEND TESTING                                                 │
│  ├── Tool: React Testing Library + Vitest                        │
│  ├── Pharma-Check alert modal rendering                          │
│  ├── Consent management UI flows                                 │
│  └── Role-based route protection                                 │
│                                                                   │
│  SECURITY TESTING                                                 │
│  ├── Test RBAC: patient cannot access doctor routes             │
│  ├── Test consent: doctor blocked without approval              │
│  ├── Test rate limiting: block after 10 failed logins           │
│  ├── Test JWT expiry: expired token rejected                     │
│  └── Test input validation: SQL injection, XSS attempts         │
│                                                                   │
│  PERFORMANCE TESTING                                              │
│  ├── API response times < 200ms (non-AI endpoints)              │
│  ├── AI endpoints < 5s                                           │
│  ├── File upload < 30s for 10MB                                  │
│  └── Concurrent user simulation (50 users)                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Week 16 — Deployment + Demo Preparation

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEK 16 - DEPLOYMENT + DEMO                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  DEPLOYMENT                                                       │
│  ├── Setup production server (VPS / cloud)                      │
│  ├── Configure Nginx + SSL (Let's Encrypt)                      │
│  ├── Deploy with Docker Compose (production config)             │
│  ├── Setup environment variables (.env.production)              │
│  ├── Configure GitHub Actions CI/CD pipeline                    │
│  │   ├── On push to main: run tests → build → deploy           │
│  │   └── Slack/email notification on deploy                     │
│  ├── Database backup strategy (daily pg_dump)                   │
│  └── Monitor: Uptime check (UptimeRobot free tier)              │
│                                                                   │
│  DEMO DATA PREPARATION                                            │
│  ├── Seed synthetic patient profiles (10 patients)              │
│  ├── Upload sample reports (CBC, Lipid, X-Ray, ECG)            │
│  ├── Create demo doctor + hospital accounts                      │
│  ├── Pre-create sample prescriptions with interactions          │
│  └── Sample insurance claim ready for demo                      │
│                                                                   │
│  DOCUMENTATION                                                    │
│  ├── README.md (setup + run instructions)                        │
│  ├── API documentation (Swagger auto-generated)                  │
│  ├── Project report writeup                                      │
│  └── Presentation slides                                          │
│                                                                   │
│  DEMO SCRIPT                                                      │
│  ├── 1. Register patient → get UHID (1 min)                     │
│  ├── 2. Hospital staff uploads lab report → OCR (2 min)         │
│  ├── 3. Patient views report → clicks AI Decoder (2 min)        │
│  ├── 4. Doctor looks up UHID → patient approves consent (2 min) │
│  ├── 5. Doctor prescribes drug → Pharma-Check fires (2 min)     │
│  ├── 6. Patient generates QR → doctor scans (1 min)             │
│  ├── 7. Insurance views verified records → approves (2 min)     │
│  └── 8. Patient activates SOS → emergency flow (1 min)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 5 Deliverables

| Deliverable | Week | Status |
|-------------|------|--------|
| Unit tests for all core modules | W15 | ⬜ |
| Integration tests for all key flows | W15 | ⬜ |
| Security penetration tests | W15 | ⬜ |
| Performance benchmarks met | W15 | ⬜ |
| Production deployment live | W16 | ⬜ |
| CI/CD pipeline working | W16 | ⬜ |
| Demo data seeded | W16 | ⬜ |
| API docs (Swagger) complete | W16 | ⬜ |
| Project report complete | W16 | ⬜ |
| Demo presentation ready | W16 | ⬜ |

---

## Milestone Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEY MILESTONES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🏁 MILESTONE 1 — Week 0                                         │
│     "Infrastructure Ready"                                        │
│     ✓ Docker running all services                                │
│     ✓ GitHub repo + CI/CD configured                             │
│     ✓ Database schema initialized                                │
│                                                                   │
│  🏁 MILESTONE 2 — Week 3                                         │
│     "Identity System Complete"                                    │
│     ✓ All 5 roles can register and login                         │
│     ✓ Patients have UHID                                         │
│     ✓ RBAC middleware protecting all routes                       │
│     ✓ Role-specific dashboards loading                           │
│                                                                   │
│  🏁 MILESTONE 3 — Week 8                                         │
│     "Core Medical System Working"                                 │
│     ✓ Hospital staff can upload records                          │
│     ✓ OCR extracting data from documents                         │
│     ✓ Patients can view their records                            │
│     ✓ Consent system fully working                               │
│     ✓ Doctors can access patient data with consent              │
│     ✓ Pharma-Check alerting on drug interactions                │
│                                                                   │
│  🏁 MILESTONE 4 — Week 11                                        │
│     "AI Features Integrated"                                      │
│     ✓ Report Decoder generating plain-language summaries         │
│     ✓ AI Clinical Summary for doctors                            │
│     ✓ QR code generation and scanning                            │
│     ✓ Emergency access system working                            │
│                                                                   │
│  🏁 MILESTONE 5 — Week 14                                        │
│     "Full System Feature Complete"                                │
│     ✓ Insurance portal with claim verification                   │
│     ✓ Hospital admin panel                                       │
│     ✓ Telehealth appointment booking                             │
│     ✓ Real-time notifications                                    │
│                                                                   │
│  🏁 MILESTONE 6 — Week 16                                        │
│     "Submission Ready"                                            │
│     ✓ All tests passing                                          │
│     ✓ System deployed and live                                   │
│     ✓ Demo data ready                                            │
│     ✓ Documentation complete                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| OpenAI API cost overrun | 🟡 Medium | 🔴 High | Set API usage limits + switch to Gemini fallback |
| Scope creep (too many features) | 🔴 High | 🔴 High | Strictly follow phase order, mark extras as future scope |
| DrugBank API access denied | 🟡 Medium | 🟡 Medium | Use RxNorm (free NIH database) as primary instead |
| OCR accuracy poor | 🟡 Medium | 🟡 Medium | Use Google Vision for low-quality documents |
| Deployment issues week 16 | 🟡 Medium | 🔴 High | Start deployment setup in week 14 |
| Team member unavailable | 🟢 Low | 🟡 Medium | Prioritize solo-achievable MVP features first |
| Database performance issues | 🟢 Low | 🟡 Medium | Add indexes early, monitor query times |

---

## Future Scope

> Features planned post-submission (React Native + advanced features)

```
POST-SUBMISSION ROADMAP:

v2.0 — React Native Patient App
├── Native Emergency SOS with background GPS
├── Lock screen emergency health card
├── Native push notifications
├── QR code scanner with native camera
└── Fully offline mode with encrypted local storage

v2.1 — Containerization & Deployment
├── Docker + Docker Compose (now it makes sense)
├── Nginx reverse proxy + SSL (Let's Encrypt)
├── Deploy to VPS / cloud server
└── CI/CD with GitHub Actions (auto deploy on push)

v2.2 — Advanced AI
├── Local LLM deployment (Llama 3) for privacy
├── Predictive health risk scoring
├── Medication adherence reminders
└── Symptom checker chatbot

v2.3 — Interoperability
├── HL7 FHIR standard integration
├── Lab system direct integration
├── Government health portal connectivity
└── Cross-hospital record sharing

v2.4 — Blockchain
├── Immutable audit logs on blockchain
├── Record tamper detection
└── Decentralized patient identity

v3.0 — Scale
├── Kubernetes for orchestration
├── Multi-region deployment
└── 100,000+ patient load capacity
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 26, 2026 | Project Team | Initial phases documentation |

---

*This document outlines the implementation phases for UniHealth ID. Feature specifications in features.md, technology decisions in tech-stack.md*
