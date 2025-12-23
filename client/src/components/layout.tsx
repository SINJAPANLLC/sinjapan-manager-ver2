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
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

interface BadgeCounts {
  notifications: number;
  messages: number;
  tasks: number;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [location] = useLocation();
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ notifications: 0, messages: 0, tasks: 0 });

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const [notifRes, msgRes, taskRes] = await Promise.all([
          fetch('/api/notifications/unread-count', { credentials: 'include' }),
          fetch('/api/chat/unread-count', { credentials: 'include' }),
          fetch('/api/tasks/pending-count', { credentials: 'include' }),
        ]);
        
        const notifications = notifRes.ok ? await notifRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const messages = msgRes.ok ? await msgRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        const tasks = taskRes.ok ? await taskRes.json().catch(() => ({ count: 0 })) : { count: 0 };
        
        setBadgeCounts({
          notifications: notifications.count || 0,
          messages: messages.count || 0,
          tasks: tasks.count || 0,
        });
      } catch (err) {
        console.error('Failed to fetch badge counts:', err);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBadgeCount = (href: string): number => {
    switch (href) {
      case '/notifications': return badgeCounts.notifications;
      case '/communication': return badgeCounts.messages;
      case '/tasks': return badgeCounts.tasks;
      default: return 0;
    }
  };

  const menuItems = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/tasks', label: 'タスク', icon: ClipboardList },
    { href: '/calendar', label: 'カレンダー', icon: Calendar },
    { href: '/communication', label: 'コミュニケーション', icon: MessageSquare },
    { href: '/business', label: '事業', icon: Briefcase },
    { href: '/marketing', label: 'マーケティング', icon: TrendingUp },
    { href: '/financials', label: 'PL BS CF', icon: FileSpreadsheet },
    { href: '/ai', label: 'AI', icon: Bot },
    { href: '/staff', label: 'スタッフ', icon: UserCheck },
    { href: '/agency', label: '代理店', icon: Building2 },
    { href: '/clients', label: 'クライアント', icon: Users },
    { href: '/notifications', label: '通知', icon: Bell },
    { href: '/settings', label: '設定', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <aside className="fixed inset-y-0 left-0 z-40 w-72 glass-sidebar shadow-soft">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100">
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

      <main className="ml-72 min-h-screen">
        <div className="p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
