import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Building2, TrendingUp, TrendingDown, Target, ExternalLink, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface Business {
  id: number;
  name: string;
  description?: string;
  url?: string;
  revenue?: string;
  expenses?: string;
  profit?: string;
  targetRevenue?: string;
  status: string;
}

export function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    revenue: '',
    expenses: '',
    targetRevenue: '',
    status: 'active',
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      setBusinesses(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBusiness ? `/api/businesses/${editingBusiness.id}` : '/api/businesses';
    const method = editingBusiness ? 'PATCH' : 'POST';
    
    const revenue = parseFloat(formData.revenue) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const profit = revenue - expenses;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        revenue: formData.revenue || null,
        expenses: formData.expenses || null,
        profit: profit || null,
        targetRevenue: formData.targetRevenue || null,
      }),
    });

    if (res.ok) {
      fetchBusinesses();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この事業を削除しますか？')) return;
    await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
    fetchBusinesses();
  };

  const openModal = (business?: Business) => {
    if (business) {
      setEditingBusiness(business);
      setFormData({
        name: business.name,
        description: business.description || '',
        url: business.url || '',
        revenue: business.revenue || '',
        expenses: business.expenses || '',
        targetRevenue: business.targetRevenue || '',
        status: business.status,
      });
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        revenue: '',
        expenses: '',
        targetRevenue: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBusiness(null);
  };

  const formatCurrency = (value?: string) => {
    if (!value) return '¥0';
    const num = parseFloat(value);
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(num);
  };

  const calculateProgress = (revenue?: string, target?: string) => {
    if (!revenue || !target) return 0;
    const r = parseFloat(revenue);
    const t = parseFloat(target);
    if (t === 0) return 0;
    return Math.min(100, (r / t) * 100);
  };

  const totalRevenue = businesses.reduce((sum, b) => sum + (parseFloat(b.revenue || '0') || 0), 0);
  const totalExpenses = businesses.reduce((sum, b) => sum + (parseFloat(b.expenses || '0') || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">事業管理</h1>
          <p className="text-slate-500 text-sm mt-1">事業の追加・編集・数値管理</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          新規事業
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">総売上</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue.toString())}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-slate-500">総経費</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpenses.toString())}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary-100 rounded-xl">
              <DollarSign size={20} className="text-primary-600" />
            </div>
            <span className="text-sm text-slate-500">総利益</span>
          </div>
          <p className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
            {formatCurrency(totalProfit.toString())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => {
          const progress = calculateProgress(business.revenue, business.targetRevenue);
          const profit = (parseFloat(business.revenue || '0') || 0) - (parseFloat(business.expenses || '0') || 0);
          
          return (
            <div key={business.id} className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden hover:shadow-card transition-all duration-300">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                      <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{business.name}</h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        business.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {business.status === 'active' ? '稼働中' : '停止中'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(business)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 size={14} className="text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(business.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {business.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{business.description}</p>
                )}

                {business.url && (
                  <a 
                    href={business.url.startsWith('http') ? business.url : `https://${business.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-3"
                  >
                    <ExternalLink size={14} />
                    {business.url}
                  </a>
                )}

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">売上</span>
                    <span className="font-medium text-slate-700">{formatCurrency(business.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">経費</span>
                    <span className="font-medium text-slate-700">{formatCurrency(business.expenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">利益</span>
                    <span className={cn("font-medium", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {formatCurrency(profit.toString())}
                    </span>
                  </div>
                </div>

                {business.targetRevenue && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1">
                        <Target size={12} />
                        目標達成率
                      </span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-primary-500" : "bg-amber-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {businesses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
            <Building2 size={48} className="mb-3 opacity-50" />
            <p>事業がまだ登録されていません</p>
            <button onClick={() => openModal()} className="mt-3 text-primary-600 hover:text-primary-700 font-medium">
              最初の事業を追加
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBusiness ? '事業を編集' : '新規事業'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">事業名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <ExternalLink size={14} className="inline mr-1" />
                  URL
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">売上 (¥)</label>
                  <input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">経費 (¥)</label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">目標売上 (¥)</label>
                <input
                  type="number"
                  value={formData.targetRevenue}
                  onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ステータス</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="active">稼働中</option>
                  <option value="inactive">停止中</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  {editingBusiness ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
