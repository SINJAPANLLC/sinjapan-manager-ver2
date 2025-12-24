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
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

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
    return getAgencySales(agencyId).reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  };

  const filteredAgencies = agencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {a.isActive ? '有効' : '無効'}
                  </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="card p-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-orange-500" />
              代理店一覧
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {agencies.map((a) => {
                const agencyIncentives = incentives.filter(i => i.targetAgencyId === a.id || !i.targetAgencyId);
                return (
                  <div 
                    key={a.id} 
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgency(a)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {a.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{a.name}</p>
                        <p className="text-xs text-slate-500 truncate">{a.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">適用中: {agencyIncentives.filter(i => i.status === 'active').length}件</span>
                      <span className="text-green-600 font-medium">
                        ¥{getAgencyTotalSales(a.id).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              {agencies.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">代理店がありません</p>
                </div>
              )}
            </div>
          </div>
          <div className="card overflow-hidden lg:col-span-3">
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
