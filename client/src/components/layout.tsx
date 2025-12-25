import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { useTenant } from '../hooks/use-tenant';
import {
  Home,
  Users,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  Calendar,
  Briefcase,
  Bot,
  UserCheck,
  Target,
  FileSpreadsheet,
  TrendingUp,
  Compass,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

interface BadgeCounts {
  notifications: number;
  messages: number;
  tasks: number;
  staffApprovals: number;
  agencySales: number;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [location] = useLocation();
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ notifications: 0, messages: 0, tasks: 0, staffApprovals: 0, agencySales: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const [notifRes, msgRes, taskRes, staffRes, agencySalesRes] = await Promise.all([
          fetch('/api/notifications/unread-count', { credentials: 'include' }),
          fetch('/api/chat/unread-count', { credentials: 'include' }),
          fetch('/api/tasks/pending-count', { credentials: 'include' }),
          fetch('/api/staff/pending-approvals-count', { credentials: 'include' }),
          fetch('/api/agency/sales/pending-count', { credentials: 'include' }),
        ]);
        
        const notifications = notifRes.ok ? await notifRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const messages = msgRes.ok ? await msgRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const tasks = taskRes.ok ? await taskRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const staffApprovals = staffRes.ok ? await staffRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const agencySales = agencySalesRes.ok ? await agencySalesRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        
        setBadgeCounts({
          notifications: notifications.count || 0,
          messages: messages.count || 0,
          tasks: tasks.count || 0,
          staffApprovals: staffApprovals.count || 0,
          agencySales: agencySales.count || 0,
        });
      } catch (err) {
        console.error('Failed to fetch badge counts:', err);
      }
    };

    if (user) {
      fetchBadgeCounts();
      const interval = setInterval(fetchBadgeCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const getBadgeCount = (href: string): number => {
    switch (href) {
      case '/notifications': return badgeCounts.notifications;
      case '/communication': return badgeCounts.messages;
      case '/tasks': return badgeCounts.tasks;
      case '/staff': return badgeCounts.staffApprovals;
      case '/agency': return badgeCounts.agencySales;
      default: return 0;
    }
  };

  const allMenuItems = [
    { href: '/', label: 'ホーム', icon: Home, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/tasks', label: 'タスク', icon: ClipboardList, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/calendar', label: 'カレンダー', icon: Calendar, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/communication', label: 'コミュニケーション', icon: MessageSquare, roles: ['admin', 'ceo', 'manager', 'staff', 'agency', 'client'] },
    { href: '/business', label: '事業', icon: Briefcase, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/designs', label: '設計', icon: Compass, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/marketing', label: 'マーケティング', icon: TrendingUp, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/financials', label: 'PL BS CF', icon: FileSpreadsheet, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/ai', label: 'AI', icon: Bot, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/staff', label: 'スタッフ', icon: UserCheck, roles: ['admin', 'ceo', 'manager', 'staff', 'client'] },
    { href: '/agency', label: '代理店', icon: Building2, roles: ['admin', 'ceo', 'manager', 'agency', 'client'] },
    { href: '/clients', label: 'クライアント', icon: Users, roles: ['admin', 'ceo', 'manager', 'client'] },
    { href: '/notifications', label: '通知', icon: Bell, roles: ['admin', 'ceo', 'manager', 'staff', 'agency', 'client'] },
    { href: '/settings', label: '設定', icon: Settings, roles: ['admin', 'ceo', 'manager', 'staff', 'agency', 'client'] },
  ];

  const menuItems = allMenuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-sidebar shadow-soft px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl && (
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name} 
              className="w-8 h-8 object-contain rounded-lg"
            />
          )}
          <h1 className="text-lg font-bold gradient-text">
            {tenant?.name || 'SIN JAPAN'}
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-primary-50 text-slate-600 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 glass-sidebar shadow-soft transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          <div className="hidden lg:block p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {tenant?.logoUrl && (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name} 
                  className="w-10 h-10 object-contain rounded-lg"
                />
              )}
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  {tenant?.name || 'SIN JAPAN'}
                </h1>
                <p className="text-slate-400 text-xs font-medium tracking-wide">MANAGER SYSTEM</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              const badgeCount = getBadgeCount(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button"
                      : "text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                  )}
                >
                  <Icon size={20} className={cn(
                    "transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={cn(
                      "ml-auto min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5",
                      isActive
                        ? "bg-white text-primary-600"
                        : "bg-primary-500 text-white"
                    )}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
