import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, Users, FileText, Activity, Calendar } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">UH</span>
            </div>
            <span className="font-semibold text-gray-800">UniHealth ID</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              Doctor
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Dr. {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, Dr. {user?.firstName}! 👨‍⚕️
          </h1>
          <p className="text-gray-500 mt-1">
            Specialty:{' '}
            <span className="font-medium text-gray-700">{user?.specialty || '—'}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Patients Today', value: '0', icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Pending Consents', value: '0', icon: FileText, color: 'text-amber-600 bg-amber-50' },
            { label: 'Prescriptions', value: '0', icon: Activity, color: 'text-purple-600 bg-purple-50' },
            { label: 'Appointments', value: '0', icon: Calendar, color: 'text-green-600 bg-green-50' },
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

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Users, title: 'Patient Records Access', phase: 2, description: 'View consented patient medical history and records.' },
            { icon: Activity, title: 'Prescriptions & Pharma-Check', phase: 2, description: 'Write prescriptions with AI-powered drug interaction checks.' },
            { icon: Calendar, title: 'Telehealth Appointments', phase: 4, description: 'Schedule and conduct video consultations.' },
            { icon: FileText, title: 'Clinical Notes (ICD-10)', phase: 2, description: 'Document patient visits with structured ICD-10 codes.' },
          ].map((item) => (
            <Card key={item.title} className="border-dashed border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  {item.description}
                  <br /><span className="text-primary-500 font-medium">Coming in Phase {item.phase} →</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
