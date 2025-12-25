import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  X,
  DollarSign,
  TrendingUp,
  Loader2,
  Calendar,
  BarChart3,
  Gift,
  Users,
  Save,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Settings,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../hooks/use-auth';

interface Agency {
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

interface AgencySale {
  id: number;
  agencyId: number;
  businessId?: string;
  clientName: string;
  projectName?: string;
  amount: string;
  commission: string;
  status: string;
  saleDate: string;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
}

interface AgencyIncentive {
  id: number;
  projectName: string;
  description?: string;
  incentiveType: string;
  incentiveValue: string;
  targetAgencyId?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export function AgencyPage() {
  const { user } = useAuth();
  const isAgencyUser = user?.role === 'agency';
  const canManage = user && ['admin', 'ceo', 'manager'].includes(user.role);
  
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [sales, setSales] = useState<AgencySale[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [incentives, setIncentives] = useState<AgencyIncentive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'incentive' | 'sales'>('list');
  const [selfTab, setSelfTab] = useState<'profile' | 'sales' | 'incentives' | 'tasks' | 'system' | 'memo'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSelfSaleModal, setShowSelfSaleModal] = useState(false);
  const [agencyTasks, setAgencyTasks] = useState<any[]>([]);
  const [agencyMemos, setAgencyMemos] = useState<any[]>([]);
  const [showMemoForm, setShowMemoForm] = useState(false);
  const [memoContent, setMemoContent] = useState('');
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  const [selfSaleForm, setSelfSaleForm] = useState({
    clientName: '',
    projectName: '',
    amount: '',
    commission: '',
    saleDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [profileForm, setProfileForm] = useState({
    phone: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });
  
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

  const [saleForm, setSaleForm] = useState({
    agencyId: 0,
    businessId: '',
    clientName: '',
    projectName: '',
    amount: '',
    commission: '',
    status: 'pending',
    saleDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [incentiveForm, setIncentiveForm] = useState({
    projectName: '',
    description: '',
    incentiveType: 'percentage',
    incentiveValue: '',
    targetAgencyId: '',
    status: 'active',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
  });

  const fetchAgencies = async () => {
    setIsLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      setAgencies(users.filter((u: Agency) => u.role === 'agency'));
    }
    setIsLoading(false);
  };

  const fetchSales = async () => {
    const res = await fetch('/api/agency/sales', { credentials: 'include' });
    if (res.ok) {
      setSales(await res.json());
    }
  };

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses', { credentials: 'include' });
    if (res.ok) {
      setBusinesses(await res.json());
    }
  };

  const fetchIncentives = async () => {
    const res = await fetch('/api/agency/incentives', { credentials: 'include' });
    if (res.ok) {
      setIncentives(await res.json());
    }
  };

  useEffect(() => {
    fetchAgencies();
    fetchSales();
    fetchBusinesses();
    fetchIncentives();
  }, []);

  useEffect(() => {
    if (isAgencyUser && user) {
      setProfileForm({
        phone: user.phone || '',
        bankName: user.bankName || '',
        bankBranch: user.bankBranch || '',
        bankAccountType: user.bankAccountType || '普通',
        bankAccountNumber: user.bankAccountNumber || '',
        bankAccountHolder: user.bankAccountHolder || '',
      });
    }
  }, [isAgencyUser, user]);

  const handleProfileSave = async () => {
    if (!user) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      setIsEditingProfile(false);
      alert('プロフィールを更新しました');
    } else {
      alert('更新に失敗しました');
    }
  };

  const mySales = isAgencyUser && user ? sales.filter(s => s.agencyId === user.id) : [];
  const myIncentives = isAgencyUser && user ? incentives.filter(i => !i.targetAgencyId || i.targetAgencyId === user.id) : [];

  const fetchAgencyTasks = async () => {
    if (!user) return;
    const res = await fetch('/api/tasks', { credentials: 'include' });
    if (res.ok) {
      const tasks = await res.json();
      setAgencyTasks(tasks.filter((t: any) => t.assignedTo === user.id || t.createdBy === user.id));
    }
  };

  const fetchAgencyMemos = async () => {
    if (!user) return;
    const res = await fetch('/api/agency/memos', { credentials: 'include' });
    if (res.ok) {
      setAgencyMemos(await res.json());
    }
  };

  useEffect(() => {
    if (isAgencyUser && user) {
      fetchAgencyTasks();
      fetchAgencyMemos();
    }
  }, [isAgencyUser, user]);

  const handleSelfSaleSubmit = async () => {
    if (!user || !selfSaleForm.clientName || !selfSaleForm.amount) {
      alert('顧客名と売上額は必須です');
      return;
    }
    const res = await fetch('/api/agency/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...selfSaleForm,
        agencyId: user.id,
        status: 'pending',
      }),
    });
    if (res.ok) {
      fetchSales();
      setShowSelfSaleModal(false);
      setSelfSaleForm({ clientName: '', projectName: '', amount: '', commission: '', saleDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleAddMemo = async () => {
    if (!user || !memoContent.trim()) return;
    const res = await fetch('/api/agency/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: memoContent }),
    });
    if (res.ok) {
      fetchAgencyMemos();
      setMemoContent('');
      setShowMemoForm(false);
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('このメモを削除しますか？')) return;
    const res = await fetch(`/api/agency/memos/${memoId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      fetchAgencyMemos();
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchAgencyTasks();
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '-';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-500';
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('名前とメールアドレスは必須です');
      return;
    }
    if (!editingAgency && !form.password) {
      alert('パスワードは必須です');
      return;
    }

    const url = editingAgency ? `/api/users/${editingAgency.id}` : '/api/users';
    const method = editingAgency ? 'PATCH' : 'POST';
    const body = editingAgency 
      ? { ...form, password: form.password || undefined }
      : { ...form, role: 'agency' };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      setEditingAgency(null);
      setForm({ email: '', name: '', password: '', phone: '', bankName: '', bankBranch: '', bankAccountType: '普通', bankAccountNumber: '', bankAccountHolder: '' });
      fetchAgencies();
    } else {
      const data = await res.json();
      alert(data.message || 'エラーが発生しました');
    }
  };

  const handleSaleSubmit = async () => {
    if (!saleForm.clientName || !saleForm.amount) {
      alert('顧客名と金額は必須です');
      return;
    }

    const res = await fetch('/api/agency/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(saleForm),
    });

    if (res.ok) {
      setShowSaleModal(false);
      setSaleForm({
        agencyId: 0,
        businessId: '',
        clientName: '',
        projectName: '',
        amount: '',
        commission: '',
        status: 'pending',
        saleDate: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchSales();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この代理店を削除しますか？')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchAgencies();
    }
  };

  const handleToggleAgencyStatus = async (agency: Agency) => {
    const newStatus = !agency.isActive;
    const res = await fetch(`/api/users/${agency.id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: newStatus }),
    });
    if (res.ok) {
      fetchAgencies();
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('この売上記録を削除しますか？')) return;
    const res = await fetch(`/api/agency/sales/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchSales();
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/agency/sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchSales();
    }
  };

  const handleIncentiveSubmit = async () => {
    if (!incentiveForm.projectName || !incentiveForm.incentiveValue) {
      alert('案件名とインセンティブ値は必須です');
      return;
    }

    const res = await fetch('/api/agency/incentives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...incentiveForm,
        targetAgencyId: incentiveForm.targetAgencyId ? parseInt(incentiveForm.targetAgencyId) : null,
      }),
    });

    if (res.ok) {
      setShowIncentiveModal(false);
      setIncentiveForm({
        projectName: '',
        description: '',
        incentiveType: 'percentage',
        incentiveValue: '',
        targetAgencyId: '',
        status: 'active',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
      });
      fetchIncentives();
    } else {
      const data = await res.json();
      alert(data.error || 'エラーが発生しました');
    }
  };

  const handleDeleteIncentive = async (id: number) => {
    if (!confirm('このインセンティブを削除しますか？')) return;
    const res = await fetch(`/api/agency/incentives/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchIncentives();
    }
  };

  const getAgencySales = (agencyId: number) => {
    return sales.filter(s => s.agencyId === agencyId);
  };

  const getAgencyTotalSales = (agencyId: number) => {
    return getAgencySales(agencyId)
      .filter(s => s.status === 'approved' || s.status === 'completed')
      .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  };

  const filteredAgencies = agencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Only count approved/completed sales for totals
  const approvedSales = mySales.filter(s => s.status === 'approved' || s.status === 'completed');
  const myTotalSales = approvedSales.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const myTotalCommission = approvedSales.reduce((sum, s) => sum + parseFloat(s.commission || '0'), 0);
  const myApprovedSalesCount = approvedSales.length;

  if (isAgencyUser && user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Building2 size={28} />
              マイページ
            </h1>
            <p className="text-slate-500 mt-1">{user.name} さんの代理店情報</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">総売上</p>
                <p className="text-xl font-bold text-slate-800">¥{myTotalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">総コミッション</p>
                <p className="text-xl font-bold text-slate-800">¥{myTotalCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-100">
                <BarChart3 className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">承認済み件数</p>
                <p className="text-xl font-bold text-slate-800">{myApprovedSalesCount}件</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
          {[
            { id: 'profile' as const, label: '基本情報', icon: Users },
            { id: 'sales' as const, label: '売上履歴', icon: TrendingUp },
            { id: 'incentives' as const, label: 'インセンティブ', icon: Gift },
            { id: 'tasks' as const, label: 'タスク', icon: ClipboardList },
            { id: 'system' as const, label: 'システム', icon: Settings },
            { id: 'memo' as const, label: 'メモ', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelfTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                selfTab === tab.id ? "bg-primary-500 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {selfTab === 'profile' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">基本情報</h2>
              {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className="btn-secondary text-sm flex items-center gap-2">
                  <Edit size={14} />
                  編集
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">電話番号</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CreditCard size={16} />
                    振込先情報
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">銀行名</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profileForm.bankName}
                        onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">支店名</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profileForm.bankBranch}
                        onChange={(e) => setProfileForm({ ...profileForm, bankBranch: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">口座種別</label>
                      <select
                        className="input-field"
                        value={profileForm.bankAccountType}
                        onChange={(e) => setProfileForm({ ...profileForm, bankAccountType: e.target.value })}
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">口座番号</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profileForm.bankAccountNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">口座名義</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profileForm.bankAccountHolder}
                        onChange={(e) => setProfileForm({ ...profileForm, bankAccountHolder: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <button onClick={() => setIsEditingProfile(false)} className="btn-secondary">キャンセル</button>
                  <button onClick={handleProfileSave} className="btn-primary flex items-center gap-2">
                    <Save size={16} />
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">名前</p>
                    <p className="text-slate-800">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">メールアドレス</p>
                    <p className="text-slate-800">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">電話番号</p>
                    <p className="text-slate-800">{user.phone || '-'}</p>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CreditCard size={16} />
                    振込先情報
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">銀行名</p>
                      <p className="text-slate-800">{user.bankName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">支店名</p>
                      <p className="text-slate-800">{user.bankBranch || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">口座種別</p>
                      <p className="text-slate-800">{user.bankAccountType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">口座番号</p>
                      <p className="text-slate-800">{user.bankAccountNumber || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-500">口座名義</p>
                      <p className="text-slate-800">{user.bankAccountHolder || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selfTab === 'sales' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">売上履歴</h2>
              <button
                onClick={() => setShowSelfSaleModal(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                売上追加
              </button>
            </div>
            {mySales.length === 0 ? (
              <p className="text-slate-500 text-center py-8">売上データがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">日付</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">顧客名</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">案件名</th>
                      <th className="text-right py-3 px-2 text-slate-600 font-medium">売上</th>
                      <th className="text-right py-3 px-2 text-slate-600 font-medium">コミッション</th>
                      <th className="text-center py-3 px-2 text-slate-600 font-medium">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySales.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">{format(new Date(sale.saleDate), 'yyyy/MM/dd')}</td>
                        <td className="py-3 px-2">{sale.clientName}</td>
                        <td className="py-3 px-2">{sale.projectName || '-'}</td>
                        <td className="py-3 px-2 text-right font-medium">¥{parseFloat(sale.amount).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-green-600 font-medium">¥{parseFloat(sale.commission || '0').toLocaleString()}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            (sale.status === 'approved' || sale.status === 'completed') && "bg-green-100 text-green-700",
                            sale.status === 'paid' && "bg-blue-100 text-blue-700",
                            sale.status === 'pending' && "bg-yellow-100 text-yellow-700",
                            sale.status === 'rejected' && "bg-red-100 text-red-700"
                          )}>
                            {sale.status === 'approved' ? '承認済み' : sale.status === 'completed' ? '完了' : sale.status === 'paid' ? '支払済み' : sale.status === 'pending' ? '保留中' : '却下'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selfTab === 'incentives' && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">インセンティブ</h2>
            {myIncentives.length === 0 ? (
              <p className="text-slate-500 text-center py-8">インセンティブがありません</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myIncentives.map((incentive) => (
                  <div key={incentive.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800">{incentive.projectName}</h3>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        incentive.status === 'active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {incentive.status === 'active' ? '有効' : '無効'}
                      </span>
                    </div>
                    {incentive.description && (
                      <p className="text-sm text-slate-500 mb-2">{incentive.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-primary-600 font-bold">
                        {incentive.incentiveType === 'percentage' ? `${incentive.incentiveValue}%` : `¥${parseFloat(incentive.incentiveValue).toLocaleString()}`}
                      </span>
                      {incentive.startDate && (
                        <span className="text-slate-500">
                          {format(new Date(incentive.startDate), 'yyyy/MM/dd')} ～ {incentive.endDate ? format(new Date(incentive.endDate), 'yyyy/MM/dd') : '期限なし'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selfTab === 'tasks' && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">タスク</h2>
            {agencyTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">タスクがありません</p>
            ) : (
              <div className="space-y-4">
                {agencyTasks.map((task) => (
                  <div key={task.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-lg">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{task.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">報酬</p>
                        <p className="font-bold text-green-600">
                          {task.reward ? `¥${parseFloat(task.reward).toLocaleString()}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">優先度</p>
                        <p className={cn("font-medium", getPriorityColor(task.priority || ''))}>
                          {getPriorityLabel(task.priority || '')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">期限</p>
                        <p className="text-slate-800">
                          {task.dueDate ? format(new Date(task.dueDate), 'yyyy/MM/dd') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">作成日</p>
                        <p className="text-slate-800">
                          {task.createdAt ? format(new Date(task.createdAt), 'yyyy/MM/dd') : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">ステータス:</span>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                          className={cn(
                            "text-sm px-3 py-1 rounded-lg border cursor-pointer",
                            task.status === 'completed' ? "bg-green-100 text-green-700 border-green-200" :
                            task.status === 'in_progress' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          <option value="pending">未着手</option>
                          <option value="in_progress">進行中</option>
                          <option value="completed">完了</option>
                        </select>
                      </div>
                      {task.customer && (
                        <span className="text-xs text-slate-500">
                          顧客: {task.customer.companyName || task.customer.contactName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selfTab === 'system' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">システム設定</h2>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">メールアドレス</p>
                  <p className="text-slate-800">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ユーザー名</p>
                  <p className="text-slate-800">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">登録日</p>
                  <p className="text-slate-800">{user?.createdAt ? format(new Date(user.createdAt), 'yyyy/MM/dd') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ステータス</p>
                  <p className={cn("font-medium", user?.isActive ? "text-green-600" : "text-red-600")}>
                    {user?.isActive ? '有効' : '無効'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selfTab === 'memo' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">メモ</h2>
              <button
                onClick={() => setShowMemoForm(!showMemoForm)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                メモ追加
              </button>
            </div>
            {showMemoForm && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                <textarea
                  className="input-field w-full min-h-[100px]"
                  placeholder="メモを入力..."
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => { setShowMemoForm(false); setMemoContent(''); }} className="btn-secondary text-sm">
                    キャンセル
                  </button>
                  <button onClick={handleAddMemo} className="btn-primary text-sm">
                    保存
                  </button>
                </div>
              </div>
            )}
            {agencyMemos.length === 0 ? (
              <p className="text-slate-500 text-center py-8">メモがありません</p>
            ) : (
              <div className="space-y-3">
                {agencyMemos.map((memo: any) => (
                  <div key={memo.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-slate-800 whitespace-pre-wrap">{memo.content}</p>
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(memo.createdAt), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showSelfSaleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">売上追加</h2>
                <button onClick={() => setShowSelfSaleModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">顧客名 *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={selfSaleForm.clientName}
                    onChange={(e) => setSelfSaleForm({ ...selfSaleForm, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">案件名</label>
                  <input
                    type="text"
                    className="input-field"
                    value={selfSaleForm.projectName}
                    onChange={(e) => setSelfSaleForm({ ...selfSaleForm, projectName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">売上額 *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={selfSaleForm.amount}
                      onChange={(e) => setSelfSaleForm({ ...selfSaleForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">コミッション</label>
                    <input
                      type="number"
                      className="input-field"
                      value={selfSaleForm.commission}
                      onChange={(e) => setSelfSaleForm({ ...selfSaleForm, commission: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">売上日</label>
                  <input
                    type="date"
                    className="input-field"
                    value={selfSaleForm.saleDate}
                    onChange={(e) => setSelfSaleForm({ ...selfSaleForm, saleDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setShowSelfSaleModal(false)} className="btn-secondary flex-1">
                    キャンセル
                  </button>
                  <button onClick={handleSelfSaleSubmit} className="btn-primary flex-1">
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Building2 size={28} />
            代理店管理
          </h1>
          <p className="text-slate-500 mt-1">代理店の登録・売上管理</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              viewMode === 'list' ? "bg-primary-500 text-white" : "btn-secondary"
            )}
          >
            <Users size={18} />
            代理店一覧
          </button>
          <button
            onClick={() => setViewMode('incentive')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              viewMode === 'incentive' ? "bg-primary-500 text-white" : "btn-secondary"
            )}
          >
            <Gift size={18} />
            インセンティブ表
          </button>
          <button
            onClick={() => setViewMode('sales')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              viewMode === 'sales' ? "bg-primary-500 text-white" : "btn-secondary"
            )}
          >
            <BarChart3 size={18} />
            売上一覧
          </button>
          <button
            onClick={() => {
              setEditingAgency(null);
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

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="名前、メールで検索..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgencies.map((a) => {
            const totalSales = getAgencyTotalSales(a.id);
            const agencySalesCount = getAgencySales(a.id).length;
            return (
              <div key={a.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{a.name}</h3>
                      <p className="text-sm text-slate-500">代理店</p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleToggleAgencyStatus(a)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 transition-opacity",
                        a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}
                      title={a.isActive ? 'クリックで無効化' : 'クリックで有効化'}
                    >
                      {a.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {a.isActive ? '有効' : '無効'}
                    </button>
                  )}
                  {!canManage && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {a.isActive ? '有効' : '無効'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} />
                    <span>{a.email}</span>
                  </div>
                  {a.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} />
                      <span>{a.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">売上件数</p>
                    <p className="font-semibold text-slate-800">{agencySalesCount}件</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">総売上</p>
                    <p className="font-semibold text-green-600">¥{totalSales.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSaleForm({ ...saleForm, agencyId: a.id });
                      setShowSaleModal(true);
                    }}
                    className="flex-1 btn-primary text-sm py-1.5"
                  >
                    <DollarSign size={14} className="inline mr-1" />
                    売上追加
                  </button>
                  <button
                    onClick={() => {
                      setEditingAgency(a);
                      setForm({ email: a.email, name: a.name, password: '', phone: a.phone || '', bankName: a.bankName || '', bankBranch: a.bankBranch || '', bankAccountType: a.bankAccountType || '普通', bankAccountNumber: a.bankAccountNumber || '', bankAccountHolder: a.bankAccountHolder || '' });
                      setShowModal(true);
                    }}
                    className="btn-secondary text-sm py-1.5"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="btn-secondary text-sm py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAgencies.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Building2 size={48} className="mx-auto mb-2 opacity-50" />
              <p>代理店が見つかりません</p>
            </div>
          )}
        </div>
      ) : viewMode === 'incentive' ? (
        <div>
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Gift size={20} className="text-primary-500" />
                  インセンティブ管理
                </h2>
                <p className="text-sm text-slate-500 mt-1">案件ごとのインセンティブ設定</p>
              </div>
              <button
                onClick={() => setShowIncentiveModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                インセンティブ登録
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">案件名</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">説明</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">対象代理店</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-600">インセンティブ</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-600">期間</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-600">ステータス</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {incentives.map((incentive) => {
                    const targetAgency = agencies.find(a => a.id === incentive.targetAgencyId);
                    return (
                      <tr key={incentive.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <span className="font-medium text-slate-800">{incentive.projectName}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{incentive.description || '-'}</td>
                        <td className="p-4 text-sm">
                          {targetAgency ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                {targetAgency.name.charAt(0)}
                              </div>
                              <span>{targetAgency.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">全代理店</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {incentive.incentiveType === 'percentage'
                              ? `${incentive.incentiveValue}%`
                              : `¥${parseFloat(incentive.incentiveValue).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm text-slate-500">
                          {incentive.startDate ? format(new Date(incentive.startDate), 'yyyy/MM/dd') : '-'}
                          {incentive.endDate && ` ~ ${format(new Date(incentive.endDate), 'yyyy/MM/dd')}`}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            incentive.status === 'active' ? "bg-green-100 text-green-700" :
                            incentive.status === 'inactive' ? "bg-slate-100 text-slate-600" :
                            "bg-red-100 text-red-700"
                          )}>
                            {incentive.status === 'active' ? '有効' : incentive.status === 'inactive' ? '無効' : '終了'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteIncentive(incentive.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {incentives.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        インセンティブが登録されていません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-slate-600">日付</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">代理店</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">顧客名</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">案件名</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">金額</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">手数料</th>
                <th className="text-center p-4 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-center p-4 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const agency = agencies.find(a => a.id === sale.agencyId);
                return (
                  <tr key={sale.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm">{format(new Date(sale.saleDate), 'yyyy/MM/dd')}</td>
                    <td className="p-4 text-sm font-medium">{agency?.name || '-'}</td>
                    <td className="p-4 text-sm">{sale.clientName}</td>
                    <td className="p-4 text-sm text-slate-500">{sale.projectName || '-'}</td>
                    <td className="p-4 text-sm text-right font-medium">¥{parseFloat(sale.amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-right text-green-600">¥{parseFloat(sale.commission || '0').toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <select
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border-0 cursor-pointer",
                          sale.status === 'completed' ? "bg-green-100 text-green-700" :
                          sale.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}
                        value={sale.status}
                        onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                      >
                        <option value="pending">保留</option>
                        <option value="completed">完了</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    売上記録がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingAgency ? '代理店編集' : '新規代理店登録'}
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
                  パスワード {editingAgency ? '(変更する場合のみ)' : '*'}
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
                <h3 className="font-medium text-slate-700 mb-3">口座情報（手数料振込先）</h3>
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
                  {editingAgency ? '更新' : '登録'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">売上追加</h2>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">代理店 *</label>
                <select
                  className="input-field"
                  value={saleForm.agencyId}
                  onChange={(e) => setSaleForm({ ...saleForm, agencyId: parseInt(e.target.value) })}
                >
                  <option value={0}>選択してください</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">事業</label>
                <select
                  className="input-field"
                  value={saleForm.businessId}
                  onChange={(e) => setSaleForm({ ...saleForm, businessId: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">顧客名 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={saleForm.clientName}
                  onChange={(e) => setSaleForm({ ...saleForm, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">案件名</label>
                <input
                  type="text"
                  className="input-field"
                  value={saleForm.projectName}
                  onChange={(e) => setSaleForm({ ...saleForm, projectName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">金額 *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">手数料</label>
                  <input
                    type="number"
                    className="input-field"
                    value={saleForm.commission}
                    onChange={(e) => setSaleForm({ ...saleForm, commission: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">売上日</label>
                  <input
                    type="date"
                    className="input-field"
                    value={saleForm.saleDate}
                    onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">ステータス</label>
                  <select
                    className="input-field"
                    value={saleForm.status}
                    onChange={(e) => setSaleForm({ ...saleForm, status: e.target.value })}
                  >
                    <option value="pending">保留</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSaleModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleSaleSubmit} className="flex-1 btn-primary">
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIncentiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">インセンティブ登録</h2>
              <button onClick={() => setShowIncentiveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">案件名 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例: Webサイト制作案件"
                  value={incentiveForm.projectName}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, projectName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">説明</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="インセンティブの詳細説明"
                  value={incentiveForm.description}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">対象代理店</label>
                <select
                  className="input-field"
                  value={incentiveForm.targetAgencyId}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, targetAgencyId: e.target.value })}
                >
                  <option value="">全代理店対象</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">インセンティブ種類 *</label>
                  <select
                    className="input-field"
                    value={incentiveForm.incentiveType}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, incentiveType: e.target.value })}
                  >
                    <option value="percentage">パーセント (%)</option>
                    <option value="fixed">固定金額 (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">
                    {incentiveForm.incentiveType === 'percentage' ? 'インセンティブ率 (%) *' : 'インセンティブ金額 (¥) *'}
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder={incentiveForm.incentiveType === 'percentage' ? '例: 10' : '例: 50000'}
                    value={incentiveForm.incentiveValue}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, incentiveValue: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">開始日</label>
                  <input
                    type="date"
                    className="input-field"
                    value={incentiveForm.startDate}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">終了日</label>
                  <input
                    type="date"
                    className="input-field"
                    value={incentiveForm.endDate}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ステータス</label>
                <select
                  className="input-field"
                  value={incentiveForm.status}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, status: e.target.value })}
                >
                  <option value="active">有効</option>
                  <option value="inactive">無効</option>
                  <option value="ended">終了</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowIncentiveModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleIncentiveSubmit} className="flex-1 btn-primary">
                  登録
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
