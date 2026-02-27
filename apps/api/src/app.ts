import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';

export const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet: sets secure HTTP headers
app.use(helmet());

// CORS: only allow our frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'UHID API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── API Routes (mounted here as we build them) ───────────────────────────────

app.use('/api/v1/auth', authRoutes);              // ← Phase 1 ✅
// app.use('/api/v1/patients', patientRoutes);    ← Phase 1
// app.use('/api/v1/doctors', doctorRoutes);      ← Phase 2
// app.use('/api/v1/records', recordRoutes);      ← Phase 2
// app.use('/api/v1/consents', consentRoutes);    ← Phase 2
// app.use('/api/v1/prescriptions', rxRoutes);    ← Phase 2
// app.use('/api/v1/qr', qrRoutes);               ← Phase 3
// app.use('/api/v1/emergency', emergencyRoutes); ← Phase 3
// app.use('/api/v1/ai', aiRoutes);               ← Phase 3
// app.use('/api/v1/insurance', insuranceRoutes); ← Phase 4
// app.use('/api/v1/admin', adminRoutes);         ← Phase 4
// app.use('/api/v1/audit', auditRoutes);         ← Phase 4

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
});
