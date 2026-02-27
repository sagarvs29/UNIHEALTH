import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, Role } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

/**
 * Wraps any route that requires authentication.
 * Optionally restricts access to specific roles.
 *
 * - Not logged in → redirect to /login (with ?from= for post-login redirect)
 * - Wrong role → redirect to their own dashboard
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardMap: Record<Role, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      HOSPITAL_STAFF: '/staff/dashboard',
      HOSPITAL_ADMIN: '/admin/dashboard',
      INSURANCE_PROVIDER: '/insurance/dashboard',
    };
    return <Navigate to={dashboardMap[user.role]} replace />;
  }

  return <>{children}</>;
}
