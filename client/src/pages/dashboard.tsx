import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Users, ClipboardList, Bell, Building2, TrendingUp, MessageSquare, Plus, ArrowUpRight, Sparkles, Calendar, Bot, FileText, DollarSign, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Memo {
  id: number;
  content: string;
  color: string;
  date: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Stats {
  customers: number;
  tasks: number;
  pendingTasks: number;
  unreadNotifications: number;
  todayMemos: Memo[];
  recentTasks: Task[];
  recentNotifications: Notification[];
  totalRevenue: string;
  totalExpense: string;
  aiLogCount: number;
  seoArticleCount: number;
  publishedArticleCount: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.role === 'client') {
      setLocation('/communication');
      return;
    }
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, [user, setLocation]);

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

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(num);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'in_progress':
        return <Clock size={14} className="text-amber-500" />;
      default:
        return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '未着手',
      in_progress: '進行中',
      completed: '完了',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const canViewSales = user && ['admin', 'ceo', 'manager'].includes(user.role);
  const canViewAllStats = user && ['admin', 'ceo', 'manager'].includes(user.role);
  const isStaff = user?.role === 'staff';
  const isAgency = user?.role === 'agency';
  const isClient = user?.role === 'client';

  const getQuickActions = () => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
      case 'ceo':
      case 'manager':
        return [
          { href: '/customers', label: '顧客を追加', icon: Plus, description: '新規顧客を登録' },
          { href: '/tasks', label: 'タスクを作成', icon: ClipboardList, description: 'タスクを管理' },
          { href: '/ai', label: 'AIを使う', icon: Bot, description: 'AI機能を活用' },
          { href: '/chat', label: 'チャット', icon: MessageSquare, description: 'メッセージを確認' },
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
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-card border border-primary-100/50 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Sparkles size={18} />
              <span className="text-sm font-medium">{getRoleLabel(user?.role || '')}としてログイン中</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              {getWelcomeMessage()}、
              <span className="gradient-text">{user?.name}</span>さん
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">{format(new Date(), 'yyyy年MM月dd日 (EEEE)')}</p>
          </div>
        </div>
      </div>

      {stats && (
        <>
          <div className={cn("grid gap-4", 
            canViewAllStats ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : 
            isClient ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
          )}>
            {!isClient && (
              <Link href="/customers" className="stat-card group">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="text-primary-600" size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-800">{stats.customers}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{isStaff ? '担当顧客' : '顧客数'}</p>
                </div>
              </Link>
            )}

            {!isClient && !isAgency && (
              <Link href="/tasks" className="stat-card group">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <ClipboardList className="text-amber-600" size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-800">{stats.pendingTasks}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{isStaff ? 'マイタスク' : '未完了タスク'}</p>
                </div>
              </Link>
            )}

            <Link href="/notifications" className="stat-card group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Bell className="text-violet-600" size={20} />
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">{stats.unreadNotifications}</p>
                <p className="text-slate-500 text-xs font-medium mt-0.5">未読通知</p>
              </div>
            </Link>

            {!isAgency && (
              <Link href="/calendar" className="stat-card group">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="text-rose-600" size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-800">{stats.todayMemos?.length || 0}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">今日の予定</p>
                </div>
              </Link>
            )}

            {canViewAllStats && (
              <>
                <Link href="/ai" className="stat-card group">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Bot className="text-cyan-600" size={20} />
                    </div>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-800">{stats.aiLogCount}</p>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">AI利用回数</p>
                  </div>
                </Link>

                <Link href="/ai" className="stat-card group">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FileText className="text-teal-600" size={20} />
                    </div>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-800">{stats.publishedArticleCount}/{stats.seoArticleCount}</p>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">SEO記事</p>
                  </div>
                </Link>
              </>
            )}
          </div>

          {canViewSales && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/business" className="card p-5 group hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                      <TrendingUp className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">総売上</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={20} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>

              <Link href="/business" className="card p-5 group hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                      <TrendingDown className="text-red-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">総経費</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={20} className="text-slate-300 group-hover:text-red-400 transition-colors" />
                </div>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary-600" />
                  最近のタスク
                </h3>
                <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  すべて見る
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.recentTasks?.length > 0 ? (
                  stats.recentTasks.map((task) => (
                    <div key={task.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-xs px-1.5 py-0.5 rounded", getPriorityColor(task.priority))}>
                              {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                            </span>
                            <span className="text-xs text-slate-400">{getStatusLabel(task.status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">タスクはありません</div>
                )}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={18} className="text-rose-600" />
                  今日の予定
                </h3>
                <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  カレンダー
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.todayMemos?.length > 0 ? (
                  stats.todayMemos.map((memo) => (
                    <div key={memo.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5", `bg-${memo.color || 'blue'}-500`)} />
                        <p className="text-sm text-slate-700">{memo.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">今日の予定はありません</div>
                )}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Bell size={18} className="text-violet-600" />
                  最近の通知
                </h3>
                <Link href="/notifications" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  すべて見る
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.recentNotifications?.length > 0 ? (
                  stats.recentNotifications.map((notification) => (
                    <div key={notification.id} className={cn("p-3 hover:bg-slate-50 transition-colors", !notification.isRead && "bg-primary-50/30")}>
                      <p className="text-sm font-medium text-slate-700 truncate">{notification.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(notification.createdAt), 'MM/dd HH:mm')}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">通知はありません</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="card-interactive p-5 group"
              >
                <div className="p-2.5 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Icon className="text-primary-600" size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 mt-3 text-sm">{action.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
