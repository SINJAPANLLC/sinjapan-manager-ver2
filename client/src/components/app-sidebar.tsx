// Shadcn Sidebar for SIN JAPAN MANAGER
import {
  Building2,
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  MessageSquare,
  Bot,
  Settings,
  ChevronRight,
  FileText,
  Sparkles,
  Info,
  Briefcase,
  Users,
  User,
  Wallet,
  Bell,
  UserPlus,
  TrendingUp,
  StickyNote,
  Zap,
  Workflow,
  LogOut,
  Shield,
  Upload,
  CreditCard,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const MAIN_NAV_ITEMS = [
  { title: "ダッシュボード", url: "/", icon: LayoutDashboard, testId: "nav-dashboard", roles: ["CEO", "Manager", "Staff", "staff", "Agency", "Client", "AI"] },
  { title: "事業部門", url: "/businesses", icon: Building2, testId: "nav-businesses", roles: ["CEO", "Manager"] },
  { title: "タスク管理", url: "/tasks", icon: CheckSquare, testId: "nav-tasks", roles: ["CEO", "Manager", "Staff", "staff"] },
  { title: "財務管理", url: "/finance", icon: DollarSign, testId: "nav-finance", roles: ["CEO", "Manager"] },
  { title: "マーケティング", url: "/marketing", icon: Sparkles, testId: "nav-marketing", roles: ["CEO", "Manager"] },
  { title: "契約管理", url: "/contract", icon: FileText, testId: "nav-contract", roles: ["CEO", "Manager", "Agency"] },
  { title: "文書生成", url: "/document", icon: Sparkles, testId: "nav-document", roles: ["CEO", "Manager", "Staff", "staff"] },
  { title: "メモ", url: "/memos", icon: StickyNote, testId: "nav-memos", roles: ["CEO", "Manager", "Staff", "staff", "Agency", "Client", "AI"] },
  { title: "外部サービス連携", url: "/integrations", icon: Zap, testId: "nav-integrations", roles: ["CEO", "Manager"] },
  { title: "ワークフロー", url: "/workflows", icon: Workflow, testId: "nav-workflows", roles: ["CEO", "Manager", "Staff", "staff"] },
  { title: "求人管理", url: "/recruitment", icon: Briefcase, testId: "nav-recruitment", roles: ["CEO", "Manager"] },
  { title: "応募者管理", url: "/applicants", icon: Users, testId: "nav-applicants", roles: ["CEO", "Manager"] },
  { title: "コミュニケーション", url: "/communications", icon: MessageSquare, testId: "nav-communications", roles: ["CEO", "Manager", "Staff", "staff", "Agency", "Client", "AI"] },
  { title: "AIコンソール", url: "/ai-console", icon: Bot, testId: "nav-ai-console", roles: ["CEO", "Manager", "AI"] },
];

const CRM_NAV_ITEMS = [
  { title: "顧客管理", url: "/crm/customers", icon: Building2, testId: "nav-crm-customers", roles: ["CEO", "Manager", "Agency", "AI"] },
  { title: "リード管理", url: "/crm/leads", icon: UserPlus, testId: "nav-crm-leads", roles: ["CEO", "Manager", "Agency", "AI"] },
  { title: "商談管理", url: "/crm/deals", icon: TrendingUp, testId: "nav-crm-deals", roles: ["CEO", "Manager", "Agency", "AI"] },
];

const EMPLOYEE_NAV_ITEMS = [
  { title: "従業員ポータル", url: "/employee-portal", icon: User, testId: "nav-employee-portal", roles: ["CEO", "Manager", "Staff", "staff"] },
  { title: "給与情報", url: "/employee-salaries", icon: Wallet, testId: "nav-employee-salaries", roles: ["CEO", "Manager"] },
];

const SYSTEM_NAV_ITEMS = [
  { title: "ファイルストレージ", url: "/file-storage", icon: Upload, testId: "nav-file-storage", roles: ["CEO", "Manager", "Staff", "staff"] },
  { title: "決済管理", url: "/payments", icon: CreditCard, testId: "nav-payments", roles: ["CEO", "Manager"] },
];

const ADMIN_NAV_ITEMS = [
  { title: "ユーザー管理", url: "/users", icon: Users, testId: "nav-users", roles: ["CEO"] },
  { title: "権限管理", url: "/settings/permissions", icon: Shield, testId: "nav-permissions", roles: ["CEO"] },
  { title: "通知管理", url: "/admin-notifications", icon: Bell, testId: "nav-admin-notifications", roles: ["CEO", "Manager"] },
];

interface AppSidebarProps {
  user: UserType | null | undefined;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: businesses, isLoading: businessesLoading } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "ログアウトエラー",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">SJ</span>
          </div>
          <div>
            <h2 className="text-base font-bold">SIN JAPAN</h2>
            <p className="text-xs text-muted-foreground">MANAGER</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メインメニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                    className="hover-elevate active-elevate-2"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>事業部門 ({businesses?.length || 0})</span>
            <ChevronRight className="h-3 w-3" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessesLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <SidebarMenuItem key={`skeleton-${i}`}>
                      <div className="px-2 py-1">
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              ) : businesses && businesses.length > 0 ? (
                businesses.map((business) => (
                  <SidebarMenuItem key={business.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/business/${business.id}`}
                      className="hover-elevate active-elevate-2"
                      data-testid={`nav-business-${business.id}`}
                    >
                      <Link href={`/business/${business.id}`}>
                        <Building2 className="h-3 w-3" />
                        <span className="text-xs">{business.nameJa || business.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    事業部門がありません
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {CRM_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {CRM_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                      className="hover-elevate active-elevate-2"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {EMPLOYEE_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>従業員機能</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {EMPLOYEE_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                      className="hover-elevate active-elevate-2"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {SYSTEM_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>システム</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SYSTEM_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                      className="hover-elevate active-elevate-2"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {ADMIN_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>管理者機能</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                      className="hover-elevate active-elevate-2"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>設定</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/company-profile"}
                  data-testid="nav-company-profile"
                  className="hover-elevate active-elevate-2"
                >
                  <Link href="/company-profile">
                    <Info className="h-4 w-4" />
                    <span>会社概要</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/system-settings"}
                  data-testid="nav-system-settings"
                  className="hover-elevate active-elevate-2"
                >
                  <Link href="/system-settings">
                    <Settings className="h-4 w-4" />
                    <span>システム設定</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-md border border-sidebar-border bg-sidebar hover-elevate">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="user-name">
              {user?.firstName || user?.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user?.email?.split("@")[0] || "ユーザー"}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-role">
              {user?.role === "CEO" && "CEO"}
              {user?.role === "Manager" && "マネージャー"}
              {user?.role === "Staff" && "スタッフ"}
              {user?.role === "staff" && "スタッフ"}
              {user?.role === "Agency" && "代理店"}
              {user?.role === "Client" && "クライアント"}
              {user?.role === "AI" && "AIエージェント"}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
              data-testid="button-settings"
            >
              <Link href="/system-settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
