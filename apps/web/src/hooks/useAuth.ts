import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore, AuthUser, Role } from '../stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  role: Role;
  email: string;
  phone?: string;
  password: string;
  profile: Record<string, unknown>;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

// ─── Dashboard path by role ───────────────────────────────────────────────────

function getDashboardPath(role: Role): string {
  switch (role) {
    case 'PATIENT':          return '/patient/dashboard';
    case 'DOCTOR':           return '/doctor/dashboard';
    case 'HOSPITAL_STAFF':   return '/staff/dashboard';
    case 'HOSPITAL_ADMIN':   return '/admin/dashboard';
    case 'INSURANCE_PROVIDER': return '/insurance/dashboard';
    default:                 return '/login';
  }
}

// ─── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await api.post<AuthResponse>('/auth/login', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const { accessToken, refreshToken, user } = data.data;
      setAuth(user, accessToken, refreshToken);
      navigate(getDashboardPath(user.role), { replace: true });
    },
  });
}

// ─── useRegister ──────────────────────────────────────────────────────────────

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await api.post<AuthResponse>('/auth/register', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const { accessToken, refreshToken, user } = data.data;
      setAuth(user, accessToken, refreshToken);
      navigate(getDashboardPath(user.role), { replace: true });
    },
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────────

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      // Always clear client state, even if API call fails
      clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

// ─── useMe ────────────────────────────────────────────────────────────────────

export function useMe() {
  const { isAuthenticated, updateUser } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data.user as AuthUser;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    select: (data) => {
      updateUser(data);
      return data;
    },
  });
}
