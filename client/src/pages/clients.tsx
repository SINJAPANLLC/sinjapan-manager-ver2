import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  X,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Client {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  isActive: boolean;
  createdAt: string;
}

interface ClientProject {
  id: number;
  clientId: number;
  name: string;
  description?: string;
  status: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface ClientInvoice {
  id: number;
  clientId: number;
  invoiceNumber: string;
  amount: string;
  status: string;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });

  const [projectForm, setProjectForm] = useState({
    clientId: 0,
    name: '',
    description: '',
    status: 'active',
    budget: '',
    startDate: '',
    endDate: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: 0,
    invoiceNumber: '',
    amount: '',
    status: 'pending',
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const fetchClients = async () => {
    setIsLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      setClients(users.filter((u: Client) => u.role === 'client'));
    }
    setIsLoading(false);
  };

  const fetchProjects = async () => {
    const res = await fetch('/api/client-projects');
    if (res.ok) {
      setProjects(await res.json());
    }
  };

  const fetchInvoices = async () => {
    const res = await fetch('/api/client-invoices');
    if (res.ok) {
      setInvoices(await res.json());
    }
  };

  useEffect(() => {
    fetchClients();
    fetchProjects();
    fetchInvoices();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('名前とメールアドレスは必須です');
      return;
    }
    if (!editingClient && !form.password) {
      alert('パスワードは必須です');
      return;
    }

    const url = editingClient ? `/api/users/${editingClient.id}` : '/api/users';
    const method = editingClient ? 'PUT' : 'POST';
    const body = editingClient 
      ? { ...form, password: form.password || undefined }
      : { ...form, role: 'client' };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      setEditingClient(null);
      setForm({ email: '', name: '', password: '', phone: '', bankName: '', bankBranch: '', bankAccountType: '普通', bankAccountNumber: '', bankAccountHolder: '' });
      fetchClients();
    } else {
      const data = await res.json();
      alert(data.message || 'エラーが発生しました');
    }
  };

  const handleProjectSubmit = async () => {
    if (!projectForm.name || !projectForm.clientId) {
      alert('クライアントと案件名は必須です');
      return;
    }

    const res = await fetch('/api/client-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(projectForm),
    });

    if (res.ok) {
      setShowProjectModal(false);
      setProjectForm({
        clientId: 0,
        name: '',
        description: '',
        status: 'active',
        budget: '',
        startDate: '',
        endDate: '',
      });
      fetchProjects();
    }
  };

  const handleInvoiceSubmit = async () => {
    if (!invoiceForm.invoiceNumber || !invoiceForm.amount || !invoiceForm.clientId) {
      alert('クライアント、請求番号、金額は必須です');
      return;
    }

    const res = await fetch('/api/client-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(invoiceForm),
    });

    if (res.ok) {
      setShowInvoiceModal(false);
      setInvoiceForm({
        clientId: 0,
        invoiceNumber: '',
        amount: '',
        status: 'pending',
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      fetchInvoices();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このクライアントを削除しますか？')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchClients();
    }
  };

  const getClientProjects = (clientId: number) => projects.filter(p => p.clientId === clientId);
  const getClientInvoices = (clientId: number) => invoices.filter(i => i.clientId === clientId);

  const getClientStats = (clientId: number) => {
    const clientProjects = getClientProjects(clientId);
    const clientInvoices = getClientInvoices(clientId);
    const totalBilled = clientInvoices.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);
    const pendingAmount = clientInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);
    return {
      projectCount: clientProjects.length,
      activeProjects: clientProjects.filter(p => p.status === 'active').length,
      totalBilled,
      pendingAmount,
    };
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    active: '進行中',
    completed: '完了',
    on_hold: '保留',
    cancelled: 'キャンセル',
    pending: '未払い',
    paid: '支払済',
    overdue: '期限超過',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Users size={28} />
            クライアント管理
          </h1>
          <p className="text-slate-500 mt-1">クライアントの登録・請求・進捗管理</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingClient(null);
              setForm({ email: '', name: '', password: '', phone: '', bankName: '', bankBranch: '', bankAccountType: '普通', bankAccountNumber: '', bankAccountHolder: '' });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新規登録
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">総クライアント</p>
              <p className="text-xl font-bold text-slate-800">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">進行中案件</p>
              <p className="text-xl font-bold text-slate-800">{projects.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Receipt className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">未払い請求</p>
              <p className="text-xl font-bold text-slate-800">{invoices.filter(i => i.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">完了案件</p>
              <p className="text-xl font-bold text-slate-800">{projects.filter(p => p.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="名前、メールで検索..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setProjectForm({ ...projectForm, clientId: 0 });
              setShowProjectModal(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText size={18} />
            案件追加
          </button>
          <button
            onClick={() => {
              setInvoiceForm({ ...invoiceForm, clientId: 0 });
              setShowInvoiceModal(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Receipt size={18} />
            請求追加
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : selectedClient ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedClient(null)}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            ← クライアント一覧に戻る
          </button>

          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedClient.name}</h2>
                <p className="text-slate-500">{selectedClient.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-primary-500" />
                  案件一覧
                </h3>
                <div className="space-y-2">
                  {getClientProjects(selectedClient.id).map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{p.name}</span>
                        <span className={cn("px-2 py-1 text-xs rounded-full", statusColors[p.status])}>
                          {statusLabels[p.status]}
                        </span>
                      </div>
                      {p.budget && <p className="text-sm text-slate-500 mt-1">予算: ¥{parseFloat(p.budget).toLocaleString()}</p>}
                    </div>
                  ))}
                  {getClientProjects(selectedClient.id).length === 0 && (
                    <p className="text-slate-400 text-center py-4">案件がありません</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-primary-500" />
                  請求一覧
                </h3>
                <div className="space-y-2">
                  {getClientInvoices(selectedClient.id).map(i => (
                    <div key={i.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">#{i.invoiceNumber}</span>
                        <span className={cn("px-2 py-1 text-xs rounded-full", statusColors[i.status])}>
                          {statusLabels[i.status]}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-slate-500">期限: {format(new Date(i.dueDate), 'yyyy/MM/dd')}</span>
                        <span className="text-sm font-medium">¥{parseFloat(i.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {getClientInvoices(selectedClient.id).length === 0 && (
                    <p className="text-slate-400 text-center py-4">請求がありません</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((c) => {
            const stats = getClientStats(c.id);
            return (
              <div 
                key={c.id} 
                className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedClient(c)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{c.name}</h3>
                      <p className="text-sm text-slate-500">クライアント</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {c.isActive ? '有効' : '無効'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} />
                    <span>{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">進行中案件</p>
                    <p className="font-semibold text-slate-800">{stats.activeProjects}件</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">未払い</p>
                    <p className="font-semibold text-red-600">¥{stats.pendingAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setProjectForm({ ...projectForm, clientId: c.id });
                      setShowProjectModal(true);
                    }}
                    className="flex-1 btn-secondary text-sm py-1.5"
                  >
                    <FileText size={14} className="inline mr-1" />
                    案件
                  </button>
                  <button
                    onClick={() => {
                      setInvoiceForm({ ...invoiceForm, clientId: c.id });
                      setShowInvoiceModal(true);
                    }}
                    className="flex-1 btn-secondary text-sm py-1.5"
                  >
                    <Receipt size={14} className="inline mr-1" />
                    請求
                  </button>
                  <button
                    onClick={() => {
                      setEditingClient(c);
                      setForm({ email: c.email, name: c.name, password: '', phone: c.phone || '', bankName: c.bankName || '', bankBranch: c.bankBranch || '', bankAccountType: c.bankAccountType || '普通', bankAccountNumber: c.bankAccountNumber || '', bankAccountHolder: c.bankAccountHolder || '' });
                      setShowModal(true);
                    }}
                    className="btn-secondary text-sm py-1.5"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn-secondary text-sm py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>クライアントが見つかりません</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingClient ? 'クライアント編集' : '新規クライアント登録'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">名前 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">メールアドレス *</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  パスワード {editingClient ? '(変更する場合のみ)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">電話番号</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-medium text-slate-700 mb-3">口座情報（請求書支払先）</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">銀行名</label>
                      <input type="text" className="input-field" placeholder="例: みずほ銀行" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">支店名</label>
                      <input type="text" className="input-field" placeholder="例: 渋谷支店" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">口座種別</label>
                      <select className="input-field" value={form.bankAccountType} onChange={(e) => setForm({ ...form, bankAccountType: e.target.value })}>
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">口座番号</label>
                      <input type="text" className="input-field" placeholder="1234567" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">口座名義</label>
                    <input type="text" className="input-field" placeholder="カタカナで入力" value={form.bankAccountHolder} onChange={(e) => setForm({ ...form, bankAccountHolder: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleSubmit} className="flex-1 btn-primary">
                  {editingClient ? '更新' : '登録'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">案件追加</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">クライアント *</label>
                <select
                  className="input-field"
                  value={projectForm.clientId}
                  onChange={(e) => setProjectForm({ ...projectForm, clientId: parseInt(e.target.value) })}
                >
                  <option value={0}>選択してください</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">案件名 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">説明</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">予算</label>
                  <input
                    type="number"
                    className="input-field"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">ステータス</label>
                  <select
                    className="input-field"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                  >
                    <option value="active">進行中</option>
                    <option value="on_hold">保留</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowProjectModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleProjectSubmit} className="flex-1 btn-primary">
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">請求追加</h2>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">クライアント *</label>
                <select
                  className="input-field"
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: parseInt(e.target.value) })}
                >
                  <option value={0}>選択してください</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">請求番号 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="INV-2024-001"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">金額 *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">支払期限</label>
                  <input
                    type="date"
                    className="input-field"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ステータス</label>
                <select
                  className="input-field"
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                >
                  <option value="pending">未払い</option>
                  <option value="paid">支払済</option>
                  <option value="overdue">期限超過</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowInvoiceModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleInvoiceSubmit} className="flex-1 btn-primary">
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
