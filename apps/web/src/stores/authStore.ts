import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role =
  | 'PATIENT'
  | 'DOCTOR'
  | 'HOSPITAL_STAFF'
  | 'HOSPITAL_ADMIN'
  | 'INSURANCE_PROVIDER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
  // Patient-specific
  uhid?: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
  // Doctor-specific
  specialty?: string;
  // Staff/Insurance-specific
  companyName?: string;
  staffType?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'uhid-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist refreshToken and user — accessToken is short-lived
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    }
  )
);
