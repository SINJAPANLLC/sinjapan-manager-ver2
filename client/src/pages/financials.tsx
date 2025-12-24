import { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Building2, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Business {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
}

interface Sale {
  id: number;
  type: string;
  amount: string;
  description?: string;
  saleDate: string;
}

interface Investment {
  id: number;
  businessId?: string;
  type: string;
  category?: string;
  amount: string;
  description?: string;
  investmentDate: string;
}

interface FinancialSummary {
  staffSalaryTotal: number;
  agencyRevenueTotal: number;
  agencyCommissionTotal: number;
  staffCount: number;
  agencySalesCount: number;
}

type TabType = 'pl' | 'bs' | 'cf';

export function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pl');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [sales, setSales] = useState<Sale[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    staffSalaryTotal: 0,
    agencyRevenueTotal: 0,
    agencyCommissionTotal: 0,
    staffCount: 0,
    agencySalesCount: 0,
  });
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investFormData, setInvestFormData] = useState({
    businessId: '',
    type: 'asset_purchase',
    category: '',
    amount: '',
    description: '',
    investmentDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchBusinesses();
    fetchInvestments();
    fetchFinancialSummary();
  }, []);

  useEffect(() => {
    if (selectedBusiness !== 'all') {
      fetchSales(selectedBusiness);
    } else {
      setSales([]);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    fetchFinancialSummary();
  }, [dateRange]);

  const fetchFinancialSummary = async () => {
    const res = await fetch(`/api/financials/summary?start=${dateRange.start}&end=${dateRange.end}`, { credentials: 'include' });
    if (res.ok) {
      setFinancialSummary(await res.json());
    }
  };

  const fetchInvestments = async () => {
    const res = await fetch('/api/investments');
    if (res.ok) {
      setInvestments(await res.json());
    }
  };

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investFormData.amount) return;
    
    await fetch('/api/investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investFormData),
    });
    
    fetchInvestments();
    setIsInvestModalOpen(false);
    setInvestFormData({
      businessId: '',
      type: 'asset_purchase',
      category: '',
      amount: '',
      description: '',
      investmentDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('この投資記録を削除しますか？')) return;
    await fetch(`/api/investments/${id}`, { method: 'DELETE' });
    fetchInvestments();
  };

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      const data = await res.json();
      const businessesWithTotals = await Promise.all(
        data.map(async (b: any) => {
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

  const businessRevenue = businesses.reduce((sum, b) => sum + b.revenue, 0);
  const businessExpenses = businesses.reduce((sum, b) => sum + b.expenses, 0);
  const totalRevenue = businessRevenue + financialSummary.agencyRevenueTotal;
  const totalExpenses = businessExpenses + financialSummary.staffSalaryTotal + financialSummary.agencyCommissionTotal;
  const totalProfit = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const tabs = [
    { id: 'pl' as TabType, label: 'PL（損益計算書）', icon: TrendingUp },
    { id: 'bs' as TabType, label: 'BS（貸借対照表）', icon: Wallet },
    { id: 'cf' as TabType, label: 'CF（キャッシュフロー）', icon: DollarSign },
  ];

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.saleDate);
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return saleDate >= start && saleDate <= end;
  });

  const periodRevenue = filteredSales.filter(s => s.type === 'revenue').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const periodExpenses = filteredSales.filter(s => s.type === 'expense').reduce((sum, s) => sum + parseFloat(s.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">財務諸表</h1>
          <p className="text-slate-500 text-sm">PL・BS・CFの管理</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-soft border border-slate-100 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 items-center">
        <select
          value={selectedBusiness}
          onChange={(e) => setSelectedBusiness(e.target.value)}
          className="input-field w-64"
        >
          <option value="all">全事業</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input-field"
          />
          <span className="text-slate-400">〜</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">売上高</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedBusiness === 'all' ? totalRevenue : periodRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">経費</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedBusiness === 'all' ? totalExpenses : periodExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <DollarSign size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">営業利益</p>
                  <p className={cn("text-2xl font-bold", (selectedBusiness === 'all' ? totalProfit : periodRevenue - periodExpenses) >= 0 ? "text-primary-600" : "text-red-600")}>
                    {formatCurrency(selectedBusiness === 'all' ? totalProfit : periodRevenue - periodExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                損益計算書（P/L）
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 text-sm font-medium text-slate-500">勘定科目</th>
                    <th className="text-right py-3 text-sm font-medium text-slate-500">金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">売上高</td>
                    <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(selectedBusiness === 'all' ? totalRevenue : periodRevenue)}</td>
                  </tr>
                  {selectedBusiness === 'all' && (
                    <>
                      <tr className="border-b border-slate-50 bg-slate-25">
                        <td className="py-2 pl-6 text-sm text-slate-600">└ 事業売上</td>
                        <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(businessRevenue)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-slate-25">
                        <td className="py-2 pl-6 text-sm text-slate-600">└ 代理店売上（{financialSummary.agencySalesCount}件）</td>
                        <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(financialSummary.agencyRevenueTotal)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">売上原価</td>
                    <td className="py-3 text-right text-slate-600">¥0</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-bold text-slate-800">売上総利益</td>
                    <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(selectedBusiness === 'all' ? totalRevenue : periodRevenue)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">販売費及び一般管理費</td>
                    <td className="py-3 text-right font-semibold text-red-600">{formatCurrency(selectedBusiness === 'all' ? totalExpenses : periodExpenses)}</td>
                  </tr>
                  {selectedBusiness === 'all' && (
                    <>
                      <tr className="border-b border-slate-50 bg-slate-25">
                        <td className="py-2 pl-6 text-sm text-slate-600">└ 事業経費</td>
                        <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(businessExpenses)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-slate-25">
                        <td className="py-2 pl-6 text-sm text-slate-600">└ スタッフ給与（{financialSummary.staffCount}件）</td>
                        <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(financialSummary.staffSalaryTotal)}</td>
                      </tr>
                      <tr className="border-b border-slate-50 bg-slate-25">
                        <td className="py-2 pl-6 text-sm text-slate-600">└ 代理店コミッション（{financialSummary.agencySalesCount}件）</td>
                        <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(financialSummary.agencyCommissionTotal)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-primary-50">
                    <td className="py-4 font-bold text-slate-800 text-lg">営業利益</td>
                    <td className={cn("py-4 text-right font-bold text-lg", (selectedBusiness === 'all' ? totalProfit : periodRevenue - periodExpenses) >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatCurrency(selectedBusiness === 'all' ? totalProfit : periodRevenue - periodExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {selectedBusiness !== 'all' && filteredSales.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">取引明細</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", sale.type === 'revenue' ? "bg-emerald-100" : "bg-red-100")}>
                        {sale.type === 'revenue' ? <ArrowUpRight size={16} className="text-emerald-600" /> : <ArrowDownRight size={16} className="text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{sale.description || (sale.type === 'revenue' ? '売上' : '経費')}</p>
                        <p className="text-xs text-slate-500">{format(new Date(sale.saleDate), 'yyyy/MM/dd')}</p>
                      </div>
                    </div>
                    <p className={cn("font-semibold", sale.type === 'revenue' ? "text-emerald-600" : "text-red-600")}>
                      {sale.type === 'revenue' ? '+' : '-'}{formatCurrency(parseFloat(sale.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" />
                貸借対照表（B/S）
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b-2 border-blue-500">資産の部</h4>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">現金及び預金</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(totalProfit > 0 ? totalProfit : 0)}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">売掛金</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">棚卸資産</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-blue-50">
                        <td className="py-3 font-bold text-slate-800">流動資産合計</td>
                        <td className="py-3 text-right font-bold text-blue-600">{formatCurrency(totalProfit > 0 ? totalProfit : 0)}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">有形固定資産</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">無形固定資産</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="py-3 font-bold text-slate-800">資産合計</td>
                        <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(totalProfit > 0 ? totalProfit : 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b-2 border-red-500">負債・純資産の部</h4>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">買掛金</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">短期借入金</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-red-50">
                        <td className="py-3 font-bold text-slate-800">負債合計</td>
                        <td className="py-3 text-right font-bold text-red-600">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">資本金</td>
                        <td className="py-2 text-right font-medium">¥0</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">利益剰余金</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(totalProfit)}</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-emerald-50">
                        <td className="py-3 font-bold text-slate-800">純資産合計</td>
                        <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(totalProfit)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="py-3 font-bold text-slate-800">負債・純資産合計</td>
                        <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(totalProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cf' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsInvestModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              投資を記録
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <TrendingUp size={18} className="text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">営業CF</span>
              </div>
              <p className={cn("text-xl font-bold", totalProfit >= 0 ? "text-blue-600" : "text-red-600")}>{formatCurrency(totalProfit)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Building2 size={18} className="text-emerald-600" />
                </div>
                <span className="text-sm text-slate-500">投資CF</span>
              </div>
              <p className="text-xl font-bold text-red-600">-{formatCurrency(investments.reduce((sum, i) => sum + parseFloat(i.amount), 0))}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <Wallet size={18} className="text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">財務CF</span>
              </div>
              <p className="text-xl font-bold text-slate-600">¥0</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DollarSign size={18} className="text-purple-600" />
                キャッシュフロー計算書（C/F）
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 text-sm font-medium text-slate-500">項目</th>
                    <th className="text-right py-3 text-sm font-medium text-slate-500">金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={2} className="py-3 font-bold text-slate-800 bg-blue-50">営業活動によるキャッシュフロー</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pl-4 text-slate-600">税引前当期純利益</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(totalProfit)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pl-4 text-slate-600">減価償却費</td>
                    <td className="py-2 text-right font-medium">¥0</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">営業活動CF小計</td>
                    <td className={cn("py-3 text-right font-semibold", totalProfit >= 0 ? "text-blue-600" : "text-red-600")}>{formatCurrency(totalProfit)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-3 font-bold text-slate-800 bg-emerald-50">投資活動によるキャッシュフロー</td>
                  </tr>
                  {investments.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-600">{inv.description || inv.category || '投資'}</td>
                      <td className="py-2 text-right font-medium text-red-600">-{formatCurrency(parseFloat(inv.amount))}</td>
                    </tr>
                  ))}
                  {investments.length === 0 && (
                    <tr className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-400 italic">投資記録なし</td>
                      <td className="py-2 text-right font-medium">¥0</td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">投資活動CF小計</td>
                    <td className="py-3 text-right font-semibold text-red-600">-{formatCurrency(investments.reduce((sum, i) => sum + parseFloat(i.amount), 0))}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-3 font-bold text-slate-800 bg-purple-50">財務活動によるキャッシュフロー</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pl-4 text-slate-600">借入金の増減</td>
                    <td className="py-2 text-right font-medium">¥0</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">財務活動CF小計</td>
                    <td className="py-3 text-right font-semibold text-slate-600">¥0</td>
                  </tr>
                  <tr className="bg-primary-100">
                    <td className="py-4 font-bold text-slate-800 text-lg">現金及び現金同等物の増減額</td>
                    <td className={cn("py-4 text-right font-bold text-lg", (totalProfit - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0)) >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatCurrency(totalProfit - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {investments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">投資記録一覧</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {investments.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Building2 size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{inv.description || inv.category || '投資'}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(inv.investmentDate), 'yyyy/MM/dd')}
                          {inv.businessId && businesses.find(b => b.id === inv.businessId) && ` - ${businesses.find(b => b.id === inv.businessId)?.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-red-600">-{formatCurrency(parseFloat(inv.amount))}</p>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isInvestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] flex flex-col my-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">投資を記録</h2>
              <button
                onClick={() => setIsInvestModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleInvestSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">投資先事業（任意）</label>
                <select
                  value={investFormData.businessId}
                  onChange={(e) => setInvestFormData({ ...investFormData, businessId: e.target.value })}
                  className="input-field"
                >
                  <option value="">選択しない</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">投資種類</label>
                <select
                  value={investFormData.type}
                  onChange={(e) => setInvestFormData({ ...investFormData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="asset_purchase">固定資産の取得</option>
                  <option value="asset_sale">固定資産の売却</option>
                  <option value="securities">有価証券</option>
                  <option value="reinvestment">利益再投資</option>
                  <option value="other">その他投資</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">カテゴリ</label>
                <input
                  type="text"
                  value={investFormData.category}
                  onChange={(e) => setInvestFormData({ ...investFormData, category: e.target.value })}
                  className="input-field"
                  placeholder="例: 機械設備、ソフトウェア"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">金額 *</label>
                <input
                  type="number"
                  value={investFormData.amount}
                  onChange={(e) => setInvestFormData({ ...investFormData, amount: e.target.value })}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={investFormData.description}
                  onChange={(e) => setInvestFormData({ ...investFormData, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="投資内容の詳細"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">投資日</label>
                <input
                  type="date"
                  value={investFormData.investmentDate}
                  onChange={(e) => setInvestFormData({ ...investFormData, investmentDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvestModalOpen(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  記録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
