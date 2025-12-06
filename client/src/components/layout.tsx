import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/tasks', label: 'タスク', icon: ClipboardList },
    { href: '/calendar', label: 'カレンダー', icon: Calendar },
    { href: '/communication', label: 'コミュニケーション', icon: MessageSquare },
    { href: '/business', label: '事業', icon: Briefcase },
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
              <div>
                <h1 className="text-xl font-bold gradient-text">SIN JAPAN</h1>
                <p className="text-slate-400 text-xs font-medium tracking-wide">MANAGER SYSTEM</p>
              </div>
            </div>
          </div>

          {user && (
            <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-primary-50 to-white rounded-xl border border-primary-100/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-soft">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-primary-600 font-medium capitalize">{user.role}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
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
