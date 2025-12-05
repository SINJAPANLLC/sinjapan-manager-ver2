import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import {
  Home,
  Users,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ClipboardList,
  UserCog,
  TrendingUp,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getMenuItems = () => {
    const baseItems = [
      { href: '/', label: 'ダッシュボード', icon: Home },
    ];

    if (!user) return baseItems;

    switch (user.role) {
      case 'admin':
      case 'ceo':
        return [
          ...baseItems,
          { href: '/customers', label: '顧客管理', icon: Building2 },
          { href: '/tasks', label: 'タスク管理', icon: ClipboardList },
          { href: '/employees', label: '従業員管理', icon: UserCog },
          { href: '/users', label: 'ユーザー管理', icon: Users },
          { href: '/chat', label: 'チャット', icon: MessageSquare },
          { href: '/notifications', label: '通知', icon: Bell },
          { href: '/agency-sales', label: '代理店売上', icon: TrendingUp },
          { href: '/settings', label: '設定', icon: Settings },
        ];
      case 'manager':
        return [
          ...baseItems,
          { href: '/customers', label: '顧客管理', icon: Building2 },
          { href: '/tasks', label: 'タスク管理', icon: ClipboardList },
          { href: '/employees', label: '従業員管理', icon: UserCog },
          { href: '/users', label: 'ユーザー管理', icon: Users },
          { href: '/chat', label: 'チャット', icon: MessageSquare },
          { href: '/notifications', label: '通知', icon: Bell },
        ];
      case 'staff':
        return [
          ...baseItems,
          { href: '/customers', label: '顧客管理', icon: Building2 },
          { href: '/tasks', label: 'タスク管理', icon: ClipboardList },
          { href: '/chat', label: 'チャット', icon: MessageSquare },
          { href: '/notifications', label: '通知', icon: Bell },
        ];
      case 'agency':
        return [
          ...baseItems,
          { href: '/agency-sales', label: '売上管理', icon: TrendingUp },
          { href: '/customers', label: '顧客管理', icon: Building2 },
          { href: '/chat', label: 'チャット', icon: MessageSquare },
          { href: '/notifications', label: '通知', icon: Bell },
        ];
      case 'client':
        return [
          ...baseItems,
          { href: '/documents', label: '書類', icon: FileText },
          { href: '/chat', label: 'チャット', icon: MessageSquare },
          { href: '/notifications', label: '通知', icon: Bell },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          "bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-blue-500/30">
            <h1 className="text-2xl font-bold text-white">SIN JAPAN</h1>
            <p className="text-blue-200 text-sm mt-1">Manager System</p>
          </div>

          {user && (
            <div className="p-4 mx-4 mt-4 bg-blue-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-blue-200 capitalize">{user.role}</p>
                </div>
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
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-white text-blue-700 shadow-lg"
                      : "text-blue-100 hover:bg-blue-500/30"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-blue-500/30">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-blue-100 hover:bg-blue-500/30 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
