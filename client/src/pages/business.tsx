import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Building2, TrendingUp, TrendingDown, Target, ExternalLink, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Business {
  id: string;
  name: string;
  description?: string;
  url?: string;
  targetRevenue?: string;
  status: string;
}

interface Sale {
  id: number;
  businessId: string;
  type: string;
  amount: string;
  description?: string;
  saleDate: string;
}

interface BusinessWithTotals extends Business {
  revenue: number;
  expenses: number;
}

export function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessWithTotals[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    targetRevenue: '',
    status: 'active',
  });
  const [saleFormData, setSaleFormData] = useState({
    type: 'revenue',
    amount: '',
    description: '',
    saleDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      const data = await res.json();
      const businessesWithTotals = await Promise.all(
        data.map(async (b: Business) => {
          const totalsRes = await fetch(`/api/businesses/${b.id}/totals`);
          const totals = totalsRes.ok ? await totalsRes.json() : { revenue: 0, expenses: 0 };
          return { ...b, ...totals };
        })
      );
      setBusinesses(businessesWithTotals);
    }
  };

  const fetchSales = async (businessId: string) => {
    const res = await fetch(`/api/businesses/${businessId}/sales`);
    if (res.ok) {
      setSales(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBusiness ? `/api/businesses/${editingBusiness.id}` : '/api/businesses';
    const method = editingBusiness ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        targetRevenue: formData.targetRevenue || null,
      }),
    });

    if (res.ok) {
      fetchBusinesses();
      closeModal();
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    const res = await fetch(`/api/businesses/${selectedBusiness.id}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleFormData),
    });

    if (res.ok) {
      fetchBusinesses();
      fetchSales(selectedBusiness.id);
      setSaleFormData({
        type: 'revenue',
        amount: '',
        description: '',
        saleDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsSaleModalOpen(false);
    }
  };

  const handleDeleteSale = async (businessId: string, saleId: number) => {
    if (!confirm('この記録を削除しますか？')) return;
    await fetch(`/api/businesses/${businessId}/sales/${saleId}`, { method: 'DELETE' });
    fetchBusinesses();
    fetchSales(businessId);
  };

  const handleDelete = async (id: string) => {
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
        targetRevenue: business.targetRevenue || '',
        status: business.status,
      });
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        targetRevenue: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const openSaleModal = (business: Business) => {
    setSelectedBusiness(business);
    setSaleFormData({
      type: 'revenue',
      amount: '',
      description: '',
      saleDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsSaleModalOpen(true);
  };

  const toggleExpand = async (businessId: string) => {
    if (expandedBusiness === businessId) {
      setExpandedBusiness(null);
    } else {
      setExpandedBusiness(businessId);
      await fetchSales(businessId);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBusiness(null);
  };

  const formatCurrency = (value: number | string | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(num);
  };

  const calculateProgress = (revenue: number, target?: string) => {
    if (!target) return 0;
    const t = parseFloat(target);
    if (t === 0) return 0;
    return Math.min(100, (revenue / t) * 100);
  };

  const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalExpenses = businesses.reduce((sum, b) => sum + (b.expenses || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">事業管理</h1>
          <p className="text-slate-500 text-sm mt-1">事業の追加・売上/経費の記録</p>
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
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-slate-500">総経費</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary-100 rounded-xl">
              <DollarSign size={20} className="text-primary-600" />
            </div>
            <span className="text-sm text-slate-500">総利益</span>
          </div>
          <p className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {businesses.map((business) => {
          const profit = business.revenue - business.expenses;
          const progress = calculateProgress(business.revenue, business.targetRevenue);
          const isExpanded = expandedBusiness === business.id;
          
          return (
            <div key={business.id} className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
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
                    <button onClick={() => openSaleModal(business)} className="px-3 py-1.5 bg-primary-50 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-1">
                      <Plus size={14} />
                      記録追加
                    </button>
                    <button onClick={() => openModal(business)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 size={14} className="text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(business.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {business.description && (
                  <p className="text-sm text-slate-500 mb-3">{business.description}</p>
                )}

                {business.url && (
                  <a 
                    href={business.url.startsWith('http') ? business.url : `https://${business.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium text-sm shadow-button hover:shadow-lg transition-all mb-3"
                  >
                    <ExternalLink size={16} />
                    サイトを開く
                  </a>
                )}

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500">売上</span>
                    <p className="font-semibold text-emerald-600">{formatCurrency(business.revenue)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">経費</span>
                    <p className="font-semibold text-red-600">{formatCurrency(business.expenses)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">利益</span>
                    <p className={cn("font-semibold", profit >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatCurrency(profit)}
                    </p>
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

                <button
                  onClick={() => toggleExpand(business.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors py-2"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? '履歴を閉じる' : '履歴を表示'}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">売上/経費履歴</h4>
                  {sales.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {sales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-lg",
                              sale.type === 'revenue' ? "bg-emerald-100" : "bg-red-100"
                            )}>
                              {sale.type === 'revenue' ? (
                                <TrendingUp size={14} className="text-emerald-600" />
                              ) : (
                                <TrendingDown size={14} className="text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium",
                                sale.type === 'revenue' ? "text-emerald-600" : "text-red-600"
                              )}>
                                {sale.type === 'revenue' ? '+' : '-'}{formatCurrency(sale.amount)}
                              </p>
                              {sale.description && <p className="text-xs text-slate-500">{sale.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {format(new Date(sale.saleDate), 'yyyy/MM/dd')}
                            </span>
                            <button
                              onClick={() => handleDeleteSale(business.id, sale.id)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">履歴がありません</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {businesses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
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

      {isSaleModalOpen && selectedBusiness && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">売上/経費を追加</h2>
                <p className="text-sm text-slate-500">{selectedBusiness.name}</p>
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">種類</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaleFormData({ ...saleFormData, type: 'revenue' })}
                    className={cn(
                      "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                      saleFormData.type === 'revenue'
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <TrendingUp size={18} />
                    売上
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleFormData({ ...saleFormData, type: 'expense' })}
                    className={cn(
                      "p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                      saleFormData.type === 'expense'
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <TrendingDown size={18} />
                    経費
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">金額 (¥) *</label>
                <input
                  type="number"
                  value={saleFormData.amount}
                  onChange={(e) => setSaleFormData({ ...saleFormData, amount: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メモ</label>
                <input
                  type="text"
                  value={saleFormData.description}
                  onChange={(e) => setSaleFormData({ ...saleFormData, description: e.target.value })}
                  placeholder="内容を入力..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  日付
                </label>
                <input
                  type="date"
                  value={saleFormData.saleDate}
                  onChange={(e) => setSaleFormData({ ...saleFormData, saleDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className="btn-secondary">
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
