import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, User, FileText, Shield, Bell, Activity } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">UH</span>
            </div>
            <span className="font-semibold text-gray-800">UniHealth ID</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Patient'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Your UHID:{' '}
            <span className="font-mono font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
              {user?.uhid || '—'}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Health Records', value: '0', icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active Consents', value: '0', icon: Shield, color: 'text-green-600 bg-green-50' },
            { label: 'Prescriptions', value: '0', icon: Activity, color: 'text-purple-600 bg-purple-50' },
            { label: 'Notifications', value: '0', icon: Bell, color: 'text-amber-600 bg-amber-50' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Upload and manage your lab reports, prescriptions, and medical history.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 2 →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Consent Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Control who can view your medical records. Grant & revoke access anytime.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 2 →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <User className="h-5 w-5" />
                Emergency QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Generate a QR code with your critical health info for emergencies.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 3 →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Get plain-language summaries of your medical reports powered by GPT-4o.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 3 →</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
