import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, Upload, Search, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffDashboard() {
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
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Hospital Staff
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
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
            Hospital Staff Portal 🏥
          </h1>
          <p className="text-gray-500 mt-1">
            Role:{' '}
            <span className="font-medium text-gray-700">
              {user?.staffType?.replace('_', ' ') || '—'}
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/staff/upload">
            <Card className="border border-blue-100 bg-white hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Upload lab reports, X-rays, discharge summaries and other patient documents.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Patient Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Search patients by their UHID for record access.
                <br /><span className="text-primary-500 font-medium">Use Upload page to search →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Record Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Manage uploaded records and verification status.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 3 →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ward Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Track patient admissions and bed allocation.
                <br /><span className="text-primary-500 font-medium">Coming in Phase 4 →</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

