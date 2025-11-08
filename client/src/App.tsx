// SIN JAPAN MANAGER - Main App Component with Replit Auth integration
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { AiConsoleBar } from "@/components/ai-console-bar";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Businesses from "@/pages/businesses";
import BusinessDetail from "@/pages/business-detail";
import Tasks from "@/pages/tasks";
import Finance from "@/pages/finance";
import BusinessPL from "@/pages/business-pl";
import Marketing from "@/pages/marketing";
import Communications from "@/pages/communications";
import AiConsole from "@/pages/ai-console";
import Contract from "@/pages/contract";
import Document from "@/pages/document";
import Recruitment from "@/pages/recruitment";
import Applicants from "@/pages/applicants";
import CompanyProfile from "@/pages/company-profile";
import SystemSettings from "@/pages/system-settings";
import Permissions from "@/pages/permissions";
import EmployeePortal from "@/pages/employee-portal";
import EmployeeSalaries from "@/pages/employee-salaries";
import AdminNotifications from "@/pages/admin-notifications";
import CRMCustomers from "@/pages/crm-customers";
import CRMLeads from "@/pages/crm-leads";
import CRMDeals from "@/pages/crm-deals";
import Memos from "@/pages/memos";
import Integrations from "@/pages/integrations";
import Workflows from "@/pages/workflows";
import WorkflowEditor from "@/pages/workflow-editor";
import Users from "@/pages/users";
import FileStorage from "@/pages/file-storage";
import Payments from "@/pages/payments";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "64px",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-xl font-bold text-primary-foreground">SJ</span>
          </div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar user={user} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <AiConsoleBar />
              <header className="flex items-center justify-between px-6 py-3 border-b border-border">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <div className="max-w-screen-2xl mx-auto px-8 py-6">
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/businesses" component={Businesses} />
                    <Route path="/business/:id" component={BusinessDetail} />
                    <Route path="/tasks" component={Tasks} />
                    <Route path="/finance" component={Finance} />
                    <Route path="/business-pl" component={BusinessPL} />
                    <Route path="/marketing" component={Marketing} />
                    <Route path="/communications" component={Communications} />
                    <Route path="/ai-console" component={AiConsole} />
                    <Route path="/contract" component={Contract} />
                    <Route path="/document" component={Document} />
                    <Route path="/recruitment" component={Recruitment} />
                    <Route path="/applicants" component={Applicants} />
                    <Route path="/crm/customers" component={CRMCustomers} />
                    <Route path="/crm/leads" component={CRMLeads} />
                    <Route path="/crm/deals" component={CRMDeals} />
                    <Route path="/memos" component={Memos} />
                    <Route path="/integrations" component={Integrations} />
                    <Route path="/workflows" component={Workflows} />
                    <Route path="/workflows/:id/edit" component={WorkflowEditor} />
                    <Route path="/workflows/:id/view" component={WorkflowEditor} />
                    <Route path="/employee-portal" component={EmployeePortal} />
                    <Route path="/employee-salaries" component={EmployeeSalaries} />
                    <Route path="/admin-notifications" component={AdminNotifications} />
                    <Route path="/users" component={Users} />
                    <Route path="/file-storage" component={FileStorage} />
                    <Route path="/payments" component={Payments} />
                    <Route path="/company-profile" component={CompanyProfile} />
                    <Route path="/system-settings" component={SystemSettings} />
                    <Route path="/settings/permissions" component={Permissions} />
                    <Route component={NotFound} />
                  </Switch>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <Switch>
          <Route path="/" component={Landing} />
          <Route component={NotFound} />
        </Switch>
      )}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
