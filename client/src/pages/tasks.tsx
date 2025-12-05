import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: number;
  createdBy?: number;
  customerId?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/chat/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      }),
    });
    
    if (res.ok) {
      fetchTasks();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このタスクを削除しますか？')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        assignedTo: task.assignedTo?.toString() || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-600" size={18} />;
      case 'in_progress':
        return <Clock className="text-primary-600" size={18} />;
      default:
        return <AlertCircle className="text-amber-600" size={18} />;
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'medium':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  };

  const getColumnStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'from-amber-50 to-white border-amber-200';
      case 'in_progress':
        return 'from-primary-50 to-white border-primary-200';
      case 'completed':
        return 'from-emerald-50 to-white border-emerald-200';
      default:
        return 'from-slate-50 to-white border-slate-200';
    }
  };

  const getColumnHeaderStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-700 bg-amber-50';
      case 'in_progress':
        return 'text-primary-700 bg-primary-50';
      case 'completed':
        return 'text-emerald-700 bg-emerald-50';
      default:
        return 'text-slate-700 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">タスク管理</h1>
          <p className="text-slate-500 text-sm mt-1">タスクの作成と進捗管理</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新規タスク
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['pending', 'in_progress', 'completed'].map((status) => (
          <div key={status} className={cn(
            "bg-gradient-to-b rounded-2xl border shadow-soft overflow-hidden",
            getColumnStyle(status)
          )}>
            <div className={cn(
              'px-5 py-4 font-semibold border-b flex items-center gap-2',
              getColumnHeaderStyle(status)
            )}>
              {getStatusIcon(status)}
              {getStatusLabel(status)} 
              <span className="ml-auto bg-white/80 px-2 py-0.5 rounded-full text-xs">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {tasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-xl border border-slate-100 shadow-soft hover:shadow-card transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800">{task.title}</h3>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getPriorityBadge(task.priority))}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                        <Clock size={12} />
                        期限: {format(new Date(task.dueDate), 'yyyy/MM/dd')}
                      </p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                      >
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(task)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {tasks.filter((t) => t.status === status).length === 0 && (
                <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                  タスクなし
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTask ? 'タスクを編集' : '新規タスク'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">優先度</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">期限</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">担当者</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="input-field"
                >
                  <option value="">未割り当て</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingTask ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
