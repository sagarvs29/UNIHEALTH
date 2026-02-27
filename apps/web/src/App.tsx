import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import InsuranceDashboard from './pages/dashboards/InsuranceDashboard';

// ── Placeholder for pages not yet built ──────────────────────────────────────

const ComingSoon = ({ label }: { label: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-6xl mb-4">🏥</div>
      <h1 className="text-3xl font-bold text-primary-600 mb-2">UniHealth ID</h1>
      <p className="text-gray-500 text-lg">{label} — coming soon</p>
    </div>
  </div>
);

// ── App Router ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/*"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <ComingSoon label="Patient section" />
            </ProtectedRoute>
          }
        />

        {/* Doctor routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/*"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <ComingSoon label="Doctor section" />
            </ProtectedRoute>
          }
        />

        {/* Hospital Staff routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOSPITAL_STAFF']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['HOSPITAL_STAFF']}>
              <ComingSoon label="Staff section" />
            </ProtectedRoute>
          }
        />

        {/* Hospital Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
              <ComingSoon label="Admin section" />
            </ProtectedRoute>
          }
        />

        {/* Insurance routes */}
        <Route
          path="/insurance/dashboard"
          element={
            <ProtectedRoute allowedRoles={['INSURANCE_PROVIDER']}>
              <InsuranceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insurance/*"
          element={
            <ProtectedRoute allowedRoles={['INSURANCE_PROVIDER']}>
              <ComingSoon label="Insurance section" />
            </ProtectedRoute>
          }
        />

        {/* Emergency QR (public, no login required) */}
        <Route path="/emergency/:code" element={<ComingSoon label="Emergency QR scan" />} />

        {/* 404 */}
        <Route path="*" element={<ComingSoon label="404 — Page not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
