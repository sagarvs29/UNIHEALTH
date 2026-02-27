# UniHealth ID (UHID)

> Unified Health Identity Platform — Final Year Project

A centralized digital health record platform for patients, doctors, hospitals, and insurance providers with AI-powered features.

---

## 🏗️ Project Structure

```
UHID/
├── apps/
│   ├── api/          → Node.js + Express + TypeScript (Backend)
│   ├── web/          → React.js + TypeScript + Tailwind (Frontend)
│   └── ai/           → Python + FastAPI (AI Microservice)
├── docs/
│   ├── features.md   → Feature documentation (role-based)
│   ├── tech-stack.md → Technology decisions
│   └── phases.md     → 16-week implementation plan
├── .env.example      → Environment variable template
└── package.json      → Root (npm workspaces + concurrently)
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20 LTS | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Git | Latest | https://git-scm.com |

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd UHID

# Install all Node.js dependencies (api + web)
npm install

# Install Python dependencies for AI service
cd apps/ai
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cd ../..
```

### 2. Set Up Environment Variables

```bash
# Copy the template
copy .env.example apps\api\.env

# Then open apps\api\.env and fill in your values:
# - DATABASE_URL      → from Supabase
# - DIRECT_URL        → from Supabase
# - JWT_SECRET        → generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# - UPSTASH_REDIS_REST_URL   → from Upstash
# - UPSTASH_REDIS_REST_TOKEN → from Upstash
# - CLOUDINARY_*      → from Cloudinary dashboard
# - OPENAI_API_KEY    → from platform.openai.com

# Also create AI service env:
copy apps\ai\.env.example apps\ai\.env
# Fill in OPENAI_API_KEY and GEMINI_API_KEY
```

### 3. Set Up the Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables in Supabase)
npx prisma migrate dev --name init

# Seed demo data (5 demo accounts)
npm run db:seed

cd ../..
```

### 4. Run Everything

```bash
# Start all 3 services simultaneously
npm run dev
```

This starts:
- 🔵 **API** → http://localhost:5000
- 🟢 **Web** → http://localhost:5173
- 🟡 **AI**  → http://localhost:8000

---

## 🔑 Demo Accounts (after seeding)

> Password for all: `Demo@1234`

| Role | Email |
|------|-------|
| Patient | patient@uhid.demo |
| Doctor | doctor@uhid.demo |
| Hospital Staff | staff@uhid.demo |
| Hospital Admin | admin@uhid.demo |
| Insurance Provider | insurance@uhid.demo |

---

## ☁️ Cloud Services (Free Tier)

| Service | Provider | What it does |
|---------|----------|-------------|
| PostgreSQL DB | [Supabase](https://supabase.com) | Main database |
| Redis | [Upstash](https://upstash.com) | JWT tokens, cache |
| File Storage | [Cloudinary](https://cloudinary.com) | PDFs, X-rays, images |
| Frontend Deploy | [Vercel](https://vercel.com) | Host React app |
| Backend Deploy | [Render](https://render.com) | Host API + AI |

---

## 📋 API Health Check

```
GET http://localhost:5000/health
GET http://localhost:8000/health
```

---

## 📚 Documentation

- [Features](./docs/features.md) — All features by role
- [Tech Stack](./docs/tech-stack.md) — Technology decisions
- [Phases](./docs/phases.md) — 16-week implementation plan
