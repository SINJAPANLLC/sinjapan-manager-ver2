import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, Edit2, Trash2, Search, Users, X, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff',
    phone: '',
    department: '',
    position: '',
    isActive: true,
  });

  const canDelete = user && ['admin', 'ceo'].includes(user.role);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PATCH' : 'POST';
    
    const payload = { ...formData };
    if (editingUser && !formData.password) {
      delete (payload as any).password;
    }
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      fetchUsers();
      closeModal();
    } else {
      const error = await res.json();
      alert(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このユーザーを削除しますか？関連するデータも影響を受けます。')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const openModal = (userData?: UserData) => {
    if (userData) {
      setEditingUser(userData);
      setFormData({
        email: userData.email,
        password: '',
        name: userData.name,
        role: userData.role,
        phone: userData.phone || '',
        department: userData.department || '',
        position: userData.position || '',
        isActive: userData.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'staff',
        phone: '',
        department: '',
        position: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'ceo':
        return 'bg-violet-50 text-violet-700 border border-violet-100';
      case 'manager':
        return 'bg-primary-50 text-primary-700 border border-primary-100';
      case 'staff':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'agency':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ユーザー管理</h1>
          <p className="text-slate-500 text-sm mt-1">システムユーザーの管理</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新規ユーザー
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="ユーザーを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ユーザー</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">メール</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ロール</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">部署</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ステータス</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-soft">
                        {userData.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{userData.name}</span>
                        {userData.position && (
                          <p className="text-xs text-slate-400">{userData.position}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{userData.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn('badge', getRoleBadge(userData.role))}>
                      {getRoleLabel(userData.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{userData.department || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'badge',
                        userData.isActive ? 'badge-success' : 'bg-red-50 text-red-700 border border-red-100'
                      )}
                    >
                      {userData.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(userData)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <Edit2 size={18} />
                      </button>
                      {canDelete && userData.id !== user?.id && (
                        <button
                          onClick={() => handleDelete(userData.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Users size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">ユーザーが見つかりません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? 'ユーザーを編集' : '新規ユーザー'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">名前 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メール *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  パスワード {editingUser ? '(変更する場合のみ)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ロール *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="admin">管理者</option>
                  <option value="ceo">CEO</option>
                  <option value="manager">マネージャー</option>
                  <option value="staff">スタッフ</option>
                  <option value="agency">代理店</option>
                  <option value="client">クライアント</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">部署</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">役職</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">有効なアカウント</label>
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
                  {editingUser ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
