import { Route, Switch } from 'wouter';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { Layout } from './components/layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { CustomersPage } from './pages/customers';
import { TasksPage } from './pages/tasks';
import { CalendarPage } from './pages/calendar';
import { ChatPage } from './pages/chat';
import { BusinessPage } from './pages/business';
import { FinancialsPage } from './pages/financials';
import { AiPage } from './pages/ai';
import { NotificationsPage } from './pages/notifications';
import { UsersPage } from './pages/users';
import { EmployeesPage } from './pages/employees';
import { AgencySalesPage } from './pages/agency-sales';
import { SettingsPage } from './pages/settings';
import LeadsPage from './pages/leads';
import { StaffPage } from './pages/staff';
import { AgencyPage } from './pages/agency';
import { ClientsPage } from './pages/clients';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={48} />
          <p className="mt-4 text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/communication" component={ChatPage} />
        <Route path="/business" component={BusinessPage} />
        <Route path="/financials" component={FinancialsPage} />
        <Route path="/ai" component={AiPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/agency-sales" component={AgencySalesPage} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/staff" component={StaffPage} />
        <Route path="/agency" component={AgencyPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800">ページが見つかりません</h1>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
