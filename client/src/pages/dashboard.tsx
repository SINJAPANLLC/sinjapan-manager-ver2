import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Link } from 'wouter';
import { Users, ClipboardList, Bell, Building2, TrendingUp, MessageSquare, Plus } from 'lucide-react';

interface Stats {
  customers: number;
  tasks: number;
  pendingTasks: number;
  unreadNotifications: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理者',
      ceo: 'CEO',
      manager: 'マネージャー',
      staff: 'スタッフ',
      agency: '代理店',
      client: 'クライアント',
    };
    return labels[role] || role;
  };

  const getQuickActions = () => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
      case 'ceo':
      case 'manager':
        return [
          { href: '/customers', label: '顧客を追加', icon: Plus, color: 'from-blue-500 to-blue-600' },
          { href: '/tasks', label: 'タスクを作成', icon: ClipboardList, color: 'from-green-500 to-green-600' },
          { href: '/notifications', label: '通知を送信', icon: Bell, color: 'from-purple-500 to-purple-600' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, color: 'from-orange-500 to-orange-600' },
        ];
      case 'staff':
        return [
          { href: '/customers', label: '顧客一覧', icon: Building2, color: 'from-blue-500 to-blue-600' },
          { href: '/tasks', label: 'タスク一覧', icon: ClipboardList, color: 'from-green-500 to-green-600' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, color: 'from-orange-500 to-orange-600' },
        ];
      case 'agency':
        return [
          { href: '/agency-sales', label: '売上を確認', icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
          { href: '/customers', label: '顧客一覧', icon: Building2, color: 'from-green-500 to-green-600' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, color: 'from-orange-500 to-orange-600' },
        ];
      case 'client':
        return [
          { href: '/chat', label: '担当者に連絡', icon: MessageSquare, color: 'from-blue-500 to-blue-600' },
          { href: '/notifications', label: '通知を確認', icon: Bell, color: 'from-purple-500 to-purple-600' },
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          {getWelcomeMessage()}、{user?.name}さん
        </h1>
        <p className="text-blue-100 mt-2">
          {getRoleLabel(user?.role || '')}としてログイン中
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.customers}</p>
                <p className="text-gray-500 text-sm">顧客数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <ClipboardList className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.tasks}</p>
                <p className="text-gray-500 text-sm">タスク数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <ClipboardList className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingTasks}</p>
                <p className="text-gray-500 text-sm">未完了タスク</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Bell className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.unreadNotifications}</p>
                <p className="text-gray-500 text-sm">未読通知</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`block p-6 rounded-2xl bg-gradient-to-r ${action.color} text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}
              >
                <Icon size={28} className="mb-3" />
                <span className="font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
