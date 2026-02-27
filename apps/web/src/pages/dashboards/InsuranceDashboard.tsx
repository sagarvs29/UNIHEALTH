import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, FileCheck, Search, BarChart3, ClipboardList } from 'lucide-react';

export default function InsuranceDashboard() {
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
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              Insurance
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
              {user?.companyName && (
                <span className="text-gray-400"> · {user.companyName}</span>
              )}
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
            Insurance Provider Portal 📋
          </h1>
          <p className="text-gray-500 mt-1">
            Agent ID:{' '}
            <span className="font-mono font-medium text-gray-700">—</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: ClipboardList, title: 'Claims Management', phase: 4, description: 'Review, approve, and track insurance claims with AI fraud detection.' },
            { icon: Search, title: 'Patient Record Access', phase: 4, description: 'Access consented patient records for claim verification.' },
            { icon: FileCheck, title: 'Document Verification', phase: 4, description: 'Verify uploaded medical documents linked to claims.' },
            { icon: BarChart3, title: 'Claims Analytics', phase: 4, description: 'Track claim patterns, approval rates, and fraud indicators.' },
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
