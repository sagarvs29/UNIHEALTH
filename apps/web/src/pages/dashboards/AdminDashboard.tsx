import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, UserCheck, Users, Settings, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
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
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              Hospital Admin
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
            Admin Control Panel 🔧
          </h1>
          <p className="text-gray-500 mt-1">Manage your hospital staff and operations</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: UserCheck, title: 'Verify Doctors & Staff', phase: 4, description: 'Approve and verify doctor license numbers and staff credentials.' },
            { icon: Users, title: 'Staff Management', phase: 4, description: 'Add, remove, and manage hospital staff roles and departments.' },
            { icon: BarChart3, title: 'Hospital Analytics', phase: 4, description: 'View hospital-wide statistics and audit logs.' },
            { icon: Settings, title: 'Hospital Settings', phase: 4, description: 'Update hospital profile, contact info, and registration details.' },
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
