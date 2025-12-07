import { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
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

type TabType = 'pl' | 'bs' | 'cf';

export function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pl');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness !== 'all') {
      fetchSales(selectedBusiness);
    } else {
      setSales([]);
    }
  }, [selectedBusiness]);

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

  const totalRevenue = businesses.reduce((sum, b) => sum + b.revenue, 0);
  const totalExpenses = businesses.reduce((sum, b) => sum + b.expenses, 0);
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
                  <tr className="border-b border-slate-50">
                    <td className="py-2 pl-4 text-slate-600">固定資産の取得</td>
                    <td className="py-2 text-right font-medium">¥0</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">投資活動CF小計</td>
                    <td className="py-3 text-right font-semibold text-slate-600">¥0</td>
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
                    <td className={cn("py-4 text-right font-bold text-lg", totalProfit >= 0 ? "text-primary-600" : "text-red-600")}>{formatCurrency(totalProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
              <p className="text-xl font-bold text-slate-600">¥0</p>
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
        </div>
      )}
    </div>
  );
}
