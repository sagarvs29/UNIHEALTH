import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type { Role } from '../../stores/authStore';

// ─── Role labels & icons ──────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
  {
    value: 'PATIENT',
    label: 'Patient',
    description: 'Manage your health records & consents',
    icon: '🧑‍⚕️',
  },
  {
    value: 'DOCTOR',
    label: 'Doctor',
    description: 'Access patient records with consent',
    icon: '👨‍⚕️',
  },
  {
    value: 'HOSPITAL_STAFF',
    label: 'Hospital Staff',
    description: 'Lab tech, nurse, pharmacist & more',
    icon: '🏥',
  },
  {
    value: 'HOSPITAL_ADMIN',
    label: 'Hospital Admin',
    description: 'Manage hospital staff & doctors',
    icon: '🔧',
  },
  {
    value: 'INSURANCE_PROVIDER',
    label: 'Insurance Provider',
    description: 'Process claims with patient consent',
    icon: '📋',
  },
];

// ─── Step 1 Schema — account info ─────────────────────────────────────────────

const step1Schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase letter')
    .regex(/[a-z]/, 'Needs lowercase letter')
    .regex(/[0-9]/, 'Needs a number')
    .regex(/[^A-Za-z0-9]/, 'Needs a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;

// ─── Patient Profile Schema ───────────────────────────────────────────────────

const patientSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  bloodGroup: z
    .enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'O_POS', 'O_NEG', 'AB_POS', 'AB_NEG', 'UNKNOWN'])
    .default('UNKNOWN'),
});

const doctorSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  licenseNumber: z.string().min(1, 'Required'),
  specialty: z.string().min(1, 'Required'),
  qualifications: z.string().min(1, 'Required'), // comma-separated
  hospitalId: z.string().min(1, 'Required'),
  department: z.string().optional(),
});

const staffSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  staffType: z.enum([
    'RECEPTIONIST',
    'LAB_TECHNICIAN',
    'NURSE',
    'PHARMACIST',
    'RADIOLOGIST',
    'ADMIN_STAFF',
  ]),
  hospitalId: z.string().min(1, 'Required'),
  department: z.string().optional(),
  employeeId: z.string().optional(),
});

const adminSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  hospitalId: z.string().min(1, 'Required'),
});

const insuranceSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  agentId: z.string().min(1, 'Required'),
  companyName: z.string().min(1, 'Required'),
  companyCode: z.string().optional(),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const registerMutation = useRegister();

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  // ── Step 1: Account info ──────────────────────────────────────────────────

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  // ── Step 2: Role selection ────────────────────────────────────────────────

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep(3);
  };

  // ── Step 3: Profile info → submit ─────────────────────────────────────────

  const handleProfileSubmit = (profileData: Record<string, unknown>) => {
    if (!step1Data || !selectedRole) return;

    // Transform qualifications from comma-string to array for doctor
    if (selectedRole === 'DOCTOR' && typeof profileData.qualifications === 'string') {
      profileData.qualifications = profileData.qualifications
        .split(',')
        .map((q: string) => q.trim())
        .filter(Boolean);
    }

    registerMutation.mutate({
      role: selectedRole,
      email: step1Data.email,
      phone: step1Data.phone || undefined,
      password: step1Data.password,
      profile: profileData,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white mb-3 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your UHID account</h1>
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {step === 1 ? 'Account details' : step === 2 ? 'Select your role' : 'Profile information'}
          </p>
        </div>

        {/* ── Step 1 ───────────────────────────────────────────────── */}
        {step === 1 && (
          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Account details</CardTitle>
              <CardDescription>Your login credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...step1Form.register('email')}
                    className={step1Form.formState.errors.email ? 'border-red-400' : ''}
                  />
                  {step1Form.formState.errors.email && (
                    <p className="text-xs text-red-500">{step1Form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    {...step1Form.register('phone')}
                  />
                  {step1Form.formState.errors.phone && (
                    <p className="text-xs text-red-500">{step1Form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      {...step1Form.register('password')}
                      className={step1Form.formState.errors.password ? 'border-red-400 pr-10' : 'pr-10'}
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
                  {step1Form.formState.errors.password && (
                    <p className="text-xs text-red-500">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      {...step1Form.register('confirmPassword')}
                      className={step1Form.formState.errors.confirmPassword ? 'border-red-400 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {step1Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Continue
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Role selection ────────────────────────────────── */}
        {step === 2 && (
          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <CardTitle className="text-lg">Select your role</CardTitle>
                  <CardDescription>Choose how you'll use UniHealth ID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelect(role.value)}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <span className="text-3xl">{role.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-primary-700">
                        {role.label}
                      </p>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Profile form by role ──────────────────────────── */}
        {step === 3 && selectedRole && (
          <ProfileForm
            role={selectedRole}
            isLoading={registerMutation.isPending}
            error={
              registerMutation.isError
                ? (registerMutation.error as Error)?.message
                : null
            }
            onBack={() => setStep(2)}
            onSubmit={handleProfileSubmit}
          />
        )}
      </div>
    </div>
  );
}

// ─── ProfileForm ──────────────────────────────────────────────────────────────

interface ProfileFormProps {
  role: Role;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

function ProfileForm({ role, isLoading, error, onBack, onSubmit }: ProfileFormProps) {
  const getSchema = () => {
    switch (role) {
      case 'PATIENT':          return patientSchema;
      case 'DOCTOR':           return doctorSchema;
      case 'HOSPITAL_STAFF':   return staffSchema;
      case 'HOSPITAL_ADMIN':   return adminSchema;
      case 'INSURANCE_PROVIDER': return insuranceSchema;
    }
  };

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(getSchema()),
  });

  const roleLabel = ROLES.find((r) => r.value === role)?.label;

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <CardTitle className="text-lg">{roleLabel} profile</CardTitle>
            <CardDescription>Fill in your professional details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => onSubmit(d as Record<string, unknown>))} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Common: First + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input placeholder="First" {...register('firstName')} />
              {(errors as Record<string, { message?: string }>).firstName && (
                <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).firstName?.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input placeholder="Last" {...register('lastName')} />
              {(errors as Record<string, { message?: string }>).lastName && (
                <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).lastName?.message}</p>
              )}
            </div>
          </div>

          {/* Patient fields */}
          {role === 'PATIENT' && (
            <>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input type="date" {...register('dateOfBirth')} />
                {(errors as Record<string, { message?: string }>).dateOfBirth && (
                  <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).dateOfBirth?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select onValueChange={(v) => setValue('gender', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {(errors as Record<string, { message?: string }>).gender && (
                  <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).gender?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Blood group</Label>
                <Select onValueChange={(v) => setValue('bloodGroup', v)} defaultValue="UNKNOWN">
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A_POS','A_NEG','B_POS','B_NEG','O_POS','O_NEG','AB_POS','AB_NEG','UNKNOWN'].map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg.replace('_POS', '+').replace('_NEG', '-').replace('UNKNOWN', 'Unknown')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Doctor fields */}
          {role === 'DOCTOR' && (
            <>
              <div className="space-y-1.5">
                <Label>Medical license number</Label>
                <Input placeholder="MH-12345-2020" {...register('licenseNumber')} />
                {(errors as Record<string, { message?: string }>).licenseNumber && (
                  <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).licenseNumber?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Input placeholder="e.g. Cardiology" {...register('specialty')} />
              </div>
              <div className="space-y-1.5">
                <Label>Qualifications <span className="text-gray-400 text-xs">(comma separated)</span></Label>
                <Input placeholder="MBBS, MD, DM Cardiology" {...register('qualifications')} />
              </div>
              <div className="space-y-1.5">
                <Label>Hospital ID</Label>
                <Input placeholder="Hospital CUID from admin" {...register('hospitalId')} />
              </div>
              <div className="space-y-1.5">
                <Label>Department <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input placeholder="e.g. Cardiology Department" {...register('department')} />
              </div>
            </>
          )}

          {/* Staff fields */}
          {role === 'HOSPITAL_STAFF' && (
            <>
              <div className="space-y-1.5">
                <Label>Staff type</Label>
                <Select onValueChange={(v) => setValue('staffType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                    <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="RADIOLOGIST">Radiologist</SelectItem>
                    <SelectItem value="ADMIN_STAFF">Admin Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hospital ID</Label>
                <Input placeholder="Hospital CUID from admin" {...register('hospitalId')} />
              </div>
              <div className="space-y-1.5">
                <Label>Department <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input placeholder="e.g. Pathology Lab" {...register('department')} />
              </div>
              <div className="space-y-1.5">
                <Label>Employee ID <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input placeholder="Internal employee ID" {...register('employeeId')} />
              </div>
            </>
          )}

          {/* Admin fields */}
          {role === 'HOSPITAL_ADMIN' && (
            <div className="space-y-1.5">
              <Label>Hospital ID</Label>
              <Input placeholder="Hospital CUID from admin" {...register('hospitalId')} />
              {(errors as Record<string, { message?: string }>).hospitalId && (
                <p className="text-xs text-red-500">{(errors as Record<string, { message?: string }>).hospitalId?.message}</p>
              )}
            </div>
          )}

          {/* Insurance fields */}
          {role === 'INSURANCE_PROVIDER' && (
            <>
              <div className="space-y-1.5">
                <Label>Agent ID</Label>
                <Input placeholder="e.g. STAR-AGT-001" {...register('agentId')} />
              </div>
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input placeholder="e.g. Star Health Insurance" {...register('companyName')} />
              </div>
              <div className="space-y-1.5">
                <Label>Company code <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input placeholder="Insurer registration code" {...register('companyCode')} />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
