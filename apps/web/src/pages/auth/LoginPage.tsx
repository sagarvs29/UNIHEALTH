import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Demo credentials ─────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  { role: 'Patient',          email: 'patient@uhid.demo' },
  { role: 'Doctor',           email: 'doctor@uhid.demo' },
  { role: 'Hospital Staff',   email: 'staff@uhid.demo' },
  { role: 'Hospital Admin',   email: 'admin@uhid.demo' },
  { role: 'Insurance',        email: 'insurance@uhid.demo' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { isAuthenticated, user } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // If already logged in, redirect to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardMap: Record<string, string> = {
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        HOSPITAL_STAFF: '/staff/dashboard',
        HOSPITAL_ADMIN: '/admin/dashboard',
        INSURANCE_PROVIDER: '/insurance/dashboard',
      };
      navigate(dashboardMap[user.role] ?? '/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Demo@1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">UniHealth ID</h1>
          <p className="text-gray-500 mt-1 text-sm">Your unified health identity platform</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Global error */}
              {loginMutation.isError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {(loginMutation.error as Error)?.message || 'Login failed. Please try again.'}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={errors.password ? 'border-red-400 focus-visible:ring-red-400 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-0">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Demo accounts */}
        <Card className="border border-dashed border-gray-300 bg-white/60">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-600">
              🧪 Demo accounts — password: Demo@1234
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors font-medium"
                >
                  {acc.role}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click a role to auto-fill credentials</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
