import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Bell, Check, CheckCheck, Send, X, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const canSendBulk = user && ['admin', 'ceo', 'manager'].includes(user.role);

  useEffect(() => {
    fetchNotifications();
    if (canSendBulk) {
      fetchUsers();
    }
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      setNotifications(await res.json());
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    fetchNotifications();
  };

  const handleBulkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      alert('送信先を選択してください');
      return;
    }

    await fetch('/api/notifications/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: selectedUsers,
        ...formData,
      }),
    });

    setIsModalOpen(false);
    setSelectedUsers([]);
    setFormData({ title: '', message: '', type: 'info' });
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-600" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-600" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />;
      default:
        return <Info className="text-primary-600" size={20} />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'error':
        return 'bg-red-50 border-red-100';
      default:
        return 'bg-primary-50 border-primary-100';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">通知</h1>
          {unreadCount > 0 && (
            <p className="text-slate-500 text-sm mt-1">{unreadCount}件の未読通知があります</p>
          )}
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck size={18} />
              全て既読
            </button>
          )}
          {canSendBulk && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Send size={18} />
              一括送信
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-5 transition-all duration-200',
                  !notification.isRead 
                    ? 'bg-gradient-to-r from-primary-50/50 to-white' 
                    : 'hover:bg-slate-50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl border",
                    getTypeStyle(notification.type)
                  )}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{notification.title}</h3>
                        <p className="text-slate-600 mt-1 text-sm">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105 shrink-0"
                          title="既読にする"
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(notification.createdAt), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">通知はありません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">通知を一括送信</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleBulkSend} className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    送信先 <span className="text-primary-600">({selectedUsers.length}人選択中)</span>
                  </label>
                  <button
                    type="button"
                    onClick={selectAllUsers}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {selectedUsers.length === users.length ? '全て解除' : '全て選択'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                        selectedUsers.includes(u.id) 
                          ? "bg-primary-50" 
                          : "hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{u.name}</span>
                      <span className="text-xs text-slate-400">({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メッセージ *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="input-field resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">タイプ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="info">情報</option>
                  <option value="success">成功</option>
                  <option value="warning">警告</option>
                  <option value="error">エラー</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  送信
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
