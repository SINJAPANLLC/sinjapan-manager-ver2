import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Link } from 'wouter';
import { Users, ClipboardList, Bell, Building2, TrendingUp, MessageSquare, Plus, ArrowUpRight, Sparkles } from 'lucide-react';

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
          { href: '/customers', label: '顧客を追加', icon: Plus, description: '新規顧客を登録' },
          { href: '/tasks', label: 'タスクを作成', icon: ClipboardList, description: 'タスクを管理' },
          { href: '/notifications', label: '通知を送信', icon: Bell, description: 'お知らせを配信' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, description: 'メッセージを確認' },
        ];
      case 'staff':
        return [
          { href: '/customers', label: '顧客一覧', icon: Building2, description: '顧客情報を確認' },
          { href: '/tasks', label: 'タスク一覧', icon: ClipboardList, description: 'タスクを管理' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, description: 'メッセージを確認' },
        ];
      case 'agency':
        return [
          { href: '/agency-sales', label: '売上を確認', icon: TrendingUp, description: '売上データを確認' },
          { href: '/customers', label: '顧客一覧', icon: Building2, description: '顧客情報を確認' },
          { href: '/chat', label: 'チャットを開く', icon: MessageSquare, description: 'メッセージを確認' },
        ];
      case 'client':
        return [
          { href: '/chat', label: '担当者に連絡', icon: MessageSquare, description: 'メッセージを送信' },
          { href: '/notifications', label: '通知を確認', icon: Bell, description: 'お知らせを確認' },
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-card border border-primary-100/50 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-600 mb-2">
            <Sparkles size={18} />
            <span className="text-sm font-medium">{getRoleLabel(user?.role || '')}としてログイン中</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            {getWelcomeMessage()}、
            <span className="gradient-text">{user?.name}</span>さん
          </h1>
          <p className="text-slate-500 mt-2">
            今日も素晴らしい一日をお過ごしください
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Building2 className="text-primary-600" size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-800">{stats.customers}</p>
              <p className="text-slate-500 text-sm font-medium mt-1">顧客数</p>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="text-emerald-600" size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-800">{stats.tasks}</p>
              <p className="text-slate-500 text-sm font-medium mt-1">タスク数</p>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="text-amber-600" size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-800">{stats.pendingTasks}</p>
              <p className="text-slate-500 text-sm font-medium mt-1">未完了タスク</p>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Bell className="text-violet-600" size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-800">{stats.unreadNotifications}</p>
              <p className="text-slate-500 text-sm font-medium mt-1">未読通知</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-5">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="card-interactive p-6 group"
              >
                <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Icon className="text-primary-600" size={24} />
                </div>
                <h3 className="font-semibold text-slate-800 mt-4">{action.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
