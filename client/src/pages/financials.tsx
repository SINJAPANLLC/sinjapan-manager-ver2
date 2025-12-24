import { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Building2, Plus, X, Trash2, Edit2 } from 'lucide-react';
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

interface FinancialEntry {
  id: number;
  statementType: string;
  category: string;
  subCategory?: string;
  amount: string;
  description?: string;
  entryDate: string;
}

interface EntrySummary {
  category: string;
  subCategory: string | null;
  total: number;
}

type TabType = 'pl' | 'bs' | 'cf';

const PL_CATEGORIES = {
  revenue: [
    { value: 'sales_revenue', label: '売上高' },
    { value: 'other_revenue', label: 'その他営業収益' },
  ],
  cost_of_sales: [
    { value: 'material_cost', label: '材料費' },
    { value: 'labor_cost', label: '労務費' },
    { value: 'manufacturing_overhead', label: '製造間接費' },
    { value: 'other_cogs', label: 'その他売上原価' },
  ],
  sg_and_a: [
    { value: 'personnel_expense', label: '人件費' },
    { value: 'advertising_expense', label: '広告宣伝費' },
    { value: 'communication_expense', label: '通信費' },
    { value: 'utilities_expense', label: '水道光熱費' },
    { value: 'rent_expense', label: '地代家賃' },
    { value: 'depreciation_expense', label: '減価償却費' },
    { value: 'insurance_expense', label: '保険料' },
    { value: 'supplies_expense', label: '消耗品費' },
    { value: 'travel_expense', label: '旅費交通費' },
    { value: 'entertainment_expense', label: '接待交際費' },
    { value: 'professional_fees', label: '支払手数料' },
    { value: 'other_sga', label: 'その他販管費' },
  ],
  non_operating: [
    { value: 'interest_income', label: '受取利息' },
    { value: 'dividend_income', label: '受取配当金' },
    { value: 'interest_expense', label: '支払利息' },
    { value: 'other_non_operating', label: 'その他営業外損益' },
  ],
  extraordinary: [
    { value: 'extraordinary_gain', label: '特別利益' },
    { value: 'extraordinary_loss', label: '特別損失' },
  ],
};

const BS_CATEGORIES = {
  current_assets: [
    { value: 'cash', label: '現金及び預金' },
    { value: 'accounts_receivable', label: '売掛金' },
    { value: 'inventory', label: '棚卸資産' },
    { value: 'prepaid_expenses', label: '前払費用' },
    { value: 'other_current_assets', label: 'その他流動資産' },
  ],
  fixed_assets: [
    { value: 'buildings', label: '建物' },
    { value: 'machinery', label: '機械装置' },
    { value: 'vehicles', label: '車両運搬具' },
    { value: 'equipment', label: '工具器具備品' },
    { value: 'land', label: '土地' },
    { value: 'intangible_assets', label: '無形固定資産' },
    { value: 'investments', label: '投資その他の資産' },
  ],
  current_liabilities: [
    { value: 'accounts_payable', label: '買掛金' },
    { value: 'short_term_loans', label: '短期借入金' },
    { value: 'accrued_expenses', label: '未払費用' },
    { value: 'unearned_revenue', label: '前受金' },
    { value: 'other_current_liabilities', label: 'その他流動負債' },
  ],
  long_term_liabilities: [
    { value: 'long_term_loans', label: '長期借入金' },
    { value: 'bonds_payable', label: '社債' },
    { value: 'other_long_term_liabilities', label: 'その他固定負債' },
  ],
  equity: [
    { value: 'capital_stock', label: '資本金' },
    { value: 'capital_surplus', label: '資本剰余金' },
    { value: 'retained_earnings', label: '利益剰余金' },
    { value: 'treasury_stock', label: '自己株式' },
  ],
};

const CF_CATEGORIES = {
  operating: [
    { value: 'depreciation', label: '減価償却費' },
    { value: 'ar_decrease', label: '売掛金の減少' },
    { value: 'ar_increase', label: '売掛金の増加' },
    { value: 'inventory_decrease', label: '棚卸資産の減少' },
    { value: 'inventory_increase', label: '棚卸資産の増加' },
    { value: 'ap_increase', label: '買掛金の増加' },
    { value: 'ap_decrease', label: '買掛金の減少' },
    { value: 'other_operating', label: 'その他営業CF' },
  ],
  investing: [
    { value: 'purchase_fixed_assets', label: '有形固定資産の取得' },
    { value: 'sale_fixed_assets', label: '有形固定資産の売却' },
    { value: 'purchase_securities', label: '有価証券の取得' },
    { value: 'sale_securities', label: '有価証券の売却' },
    { value: 'loans_made', label: '貸付による支出' },
    { value: 'loans_collected', label: '貸付金の回収' },
    { value: 'other_investing', label: 'その他投資CF' },
  ],
  financing: [
    { value: 'short_term_borrowing', label: '短期借入れによる収入' },
    { value: 'short_term_repayment', label: '短期借入金の返済' },
    { value: 'long_term_borrowing', label: '長期借入れによる収入' },
    { value: 'long_term_repayment', label: '長期借入金の返済' },
    { value: 'stock_issuance', label: '株式発行による収入' },
    { value: 'dividend_paid', label: '配当金の支払' },
    { value: 'other_financing', label: 'その他財務CF' },
  ],
};

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
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [entrySummary, setEntrySummary] = useState<EntrySummary[]>([]);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [entryFormData, setEntryFormData] = useState({
    id: 0,
    statementType: 'pl',
    category: '',
    subCategory: '',
    amount: '',
    description: '',
    entryDate: format(new Date(), 'yyyy-MM-dd'),
  });
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
    fetchFinancialEntries();
    fetchEntrySummary();
  }, [dateRange, activeTab]);

  const fetchFinancialSummary = async () => {
    const res = await fetch(`/api/financials/summary?start=${dateRange.start}&end=${dateRange.end}`, { credentials: 'include' });
    if (res.ok) {
      setFinancialSummary(await res.json());
    }
  };

  const fetchFinancialEntries = async () => {
    const res = await fetch(`/api/financial-entries?statementType=${activeTab}&startDate=${dateRange.start}&endDate=${dateRange.end}`, { credentials: 'include' });
    if (res.ok) {
      setFinancialEntries(await res.json());
    }
  };

  const fetchEntrySummary = async () => {
    const res = await fetch(`/api/financial-entries/summary?statementType=${activeTab}&startDate=${dateRange.start}&endDate=${dateRange.end}`, { credentials: 'include' });
    if (res.ok) {
      setEntrySummary(await res.json());
    }
  };

  const fetchInvestments = async () => {
    const res = await fetch('/api/investments');
    if (res.ok) {
      setInvestments(await res.json());
    }
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryFormData.amount || !entryFormData.category) return;
    
    const url = entryFormData.id ? `/api/financial-entries/${entryFormData.id}` : '/api/financial-entries';
    const method = entryFormData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryFormData),
    });
    
    fetchFinancialEntries();
    fetchEntrySummary();
    setIsEntryModalOpen(false);
    resetEntryForm();
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('この財務データを削除しますか？')) return;
    await fetch(`/api/financial-entries/${id}`, { method: 'DELETE' });
    fetchFinancialEntries();
    fetchEntrySummary();
  };

  const handleEditEntry = (entry: FinancialEntry) => {
    setEntryFormData({
      id: entry.id,
      statementType: entry.statementType,
      category: entry.category,
      subCategory: entry.subCategory || '',
      amount: entry.amount,
      description: entry.description || '',
      entryDate: format(new Date(entry.entryDate), 'yyyy-MM-dd'),
    });
    setIsEntryModalOpen(true);
  };

  const resetEntryForm = () => {
    setEntryFormData({
      id: 0,
      statementType: activeTab,
      category: '',
      subCategory: '',
      amount: '',
      description: '',
      entryDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const openEntryModal = () => {
    resetEntryForm();
    setEntryFormData(prev => ({ ...prev, statementType: activeTab }));
    setIsEntryModalOpen(true);
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

  const getCategoryLabel = (category: string): string => {
    const allCategories = [
      ...PL_CATEGORIES.revenue,
      ...PL_CATEGORIES.cost_of_sales,
      ...PL_CATEGORIES.sg_and_a,
      ...PL_CATEGORIES.non_operating,
      ...PL_CATEGORIES.extraordinary,
      ...BS_CATEGORIES.current_assets,
      ...BS_CATEGORIES.fixed_assets,
      ...BS_CATEGORIES.current_liabilities,
      ...BS_CATEGORIES.long_term_liabilities,
      ...BS_CATEGORIES.equity,
      ...CF_CATEGORIES.operating,
      ...CF_CATEGORIES.investing,
      ...CF_CATEGORIES.financing,
    ];
    return allCategories.find(c => c.value === category)?.label || category;
  };

  const getSummaryTotal = (categories: string[]): number => {
    return entrySummary
      .filter(s => categories.includes(s.category))
      .reduce((sum, s) => sum + s.total, 0);
  };

  const businessRevenue = businesses.reduce((sum, b) => sum + b.revenue, 0);
  const businessExpenses = businesses.reduce((sum, b) => sum + b.expenses, 0);
  
  const plRevenueTotal = getSummaryTotal(PL_CATEGORIES.revenue.map(c => c.value));
  const plCostOfSalesTotal = getSummaryTotal(PL_CATEGORIES.cost_of_sales.map(c => c.value));
  const plSgaTotal = getSummaryTotal(PL_CATEGORIES.sg_and_a.map(c => c.value));
  
  const plNonOperatingIncome = getSummaryTotal(['interest_income', 'dividend_income']);
  const plNonOperatingExpense = getSummaryTotal(['interest_expense', 'other_non_operating']);
  const plNonOperatingTotal = plNonOperatingIncome - plNonOperatingExpense;
  
  const plExtraordinaryGain = getSummaryTotal(['extraordinary_gain']);
  const plExtraordinaryLoss = getSummaryTotal(['extraordinary_loss']);
  const plExtraordinaryTotal = plExtraordinaryGain - plExtraordinaryLoss;
  
  const totalRevenue = businessRevenue + financialSummary.agencyRevenueTotal + plRevenueTotal;
  const totalCostOfSales = plCostOfSalesTotal;
  const grossProfit = totalRevenue - totalCostOfSales;
  const totalSga = businessExpenses + financialSummary.staffSalaryTotal + financialSummary.agencyCommissionTotal + plSgaTotal;
  const operatingProfit = grossProfit - totalSga;
  const ordinaryProfit = operatingProfit + plNonOperatingTotal;
  const netProfit = ordinaryProfit + plExtraordinaryTotal;

  const bsCurrentAssetsTotal = getSummaryTotal(BS_CATEGORIES.current_assets.map(c => c.value));
  const bsFixedAssetsTotal = getSummaryTotal(BS_CATEGORIES.fixed_assets.map(c => c.value));
  const bsCurrentLiabilitiesTotal = getSummaryTotal(BS_CATEGORIES.current_liabilities.map(c => c.value));
  const bsLongTermLiabilitiesTotal = getSummaryTotal(BS_CATEGORIES.long_term_liabilities.map(c => c.value));
  const bsEquityTotal = getSummaryTotal(BS_CATEGORIES.equity.map(c => c.value));

  const cfOperatingInflow = getSummaryTotal(['depreciation', 'ar_decrease', 'inventory_decrease', 'ap_increase']);
  const cfOperatingOutflow = getSummaryTotal(['ar_increase', 'inventory_increase', 'ap_decrease', 'other_operating']);
  const cfOperatingTotal = cfOperatingInflow - cfOperatingOutflow;
  
  const cfInvestingInflow = getSummaryTotal(['sale_fixed_assets', 'sale_securities', 'loans_collected']);
  const cfInvestingOutflow = getSummaryTotal(['purchase_fixed_assets', 'purchase_securities', 'loans_made', 'other_investing']);
  const cfInvestingTotal = cfInvestingInflow - cfInvestingOutflow;
  
  const cfFinancingInflow = getSummaryTotal(['short_term_borrowing', 'long_term_borrowing', 'stock_issuance']);
  const cfFinancingOutflow = getSummaryTotal(['short_term_repayment', 'long_term_repayment', 'dividend_paid', 'other_financing']);
  const cfFinancingTotal = cfFinancingInflow - cfFinancingOutflow;

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

  const getCurrentCategoryOptions = () => {
    if (activeTab === 'pl' || entryFormData.statementType === 'pl') {
      return [
        { group: '売上', items: PL_CATEGORIES.revenue },
        { group: '売上原価', items: PL_CATEGORIES.cost_of_sales },
        { group: '販管費', items: PL_CATEGORIES.sg_and_a },
        { group: '営業外損益', items: PL_CATEGORIES.non_operating },
        { group: '特別損益', items: PL_CATEGORIES.extraordinary },
      ];
    } else if (activeTab === 'bs' || entryFormData.statementType === 'bs') {
      return [
        { group: '流動資産', items: BS_CATEGORIES.current_assets },
        { group: '固定資産', items: BS_CATEGORIES.fixed_assets },
        { group: '流動負債', items: BS_CATEGORIES.current_liabilities },
        { group: '固定負債', items: BS_CATEGORIES.long_term_liabilities },
        { group: '純資産', items: BS_CATEGORIES.equity },
      ];
    } else {
      return [
        { group: '営業活動', items: CF_CATEGORIES.operating },
        { group: '投資活動', items: CF_CATEGORIES.investing },
        { group: '財務活動', items: CF_CATEGORIES.financing },
      ];
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">財務諸表</h1>
          <p className="text-slate-500 text-sm">PL・BS・CFの管理</p>
        </div>
        <button
          onClick={openEntryModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          データを追加
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingDown size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">売上原価</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCostOfSales)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">販管費</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedBusiness === 'all' ? totalSga : periodExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <DollarSign size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">当期純利益</p>
                  <p className={cn("text-2xl font-bold", netProfit >= 0 ? "text-primary-600" : "text-red-600")}>
                    {formatCurrency(netProfit)}
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
                    <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</td>
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
                      {entrySummary.filter(s => PL_CATEGORIES.revenue.map(c => c.value).includes(s.category)).map((s, idx) => (
                        <tr key={idx} className="border-b border-slate-50 bg-slate-25">
                          <td className="py-2 pl-6 text-sm text-slate-600">└ {getCategoryLabel(s.category)}</td>
                          <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(s.total)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">売上原価</td>
                    <td className="py-3 text-right text-orange-600 font-semibold">{formatCurrency(totalCostOfSales)}</td>
                  </tr>
                  {entrySummary.filter(s => PL_CATEGORIES.cost_of_sales.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50 bg-slate-25">
                      <td className="py-2 pl-6 text-sm text-slate-600">└ {getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-bold text-slate-800">売上総利益</td>
                    <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(grossProfit)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">販売費及び一般管理費</td>
                    <td className="py-3 text-right font-semibold text-red-600">{formatCurrency(totalSga)}</td>
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
                      {entrySummary.filter(s => PL_CATEGORIES.sg_and_a.map(c => c.value).includes(s.category)).map((s, idx) => (
                        <tr key={idx} className="border-b border-slate-50 bg-slate-25">
                          <td className="py-2 pl-6 text-sm text-slate-600">└ {getCategoryLabel(s.category)}</td>
                          <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(s.total)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  <tr className="border-b border-slate-100 bg-blue-50">
                    <td className="py-3 font-bold text-slate-800">営業利益</td>
                    <td className={cn("py-3 text-right font-bold", operatingProfit >= 0 ? "text-blue-600" : "text-red-600")}>{formatCurrency(operatingProfit)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">営業外損益</td>
                    <td className={cn("py-3 text-right font-semibold", plNonOperatingTotal >= 0 ? "text-slate-600" : "text-red-600")}>{formatCurrency(plNonOperatingTotal)}</td>
                  </tr>
                  {entrySummary.filter(s => PL_CATEGORIES.non_operating.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50 bg-slate-25">
                      <td className="py-2 pl-6 text-sm text-slate-600">└ {getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-100 bg-indigo-50">
                    <td className="py-3 font-bold text-slate-800">経常利益</td>
                    <td className={cn("py-3 text-right font-bold", ordinaryProfit >= 0 ? "text-indigo-600" : "text-red-600")}>{formatCurrency(ordinaryProfit)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">特別損益</td>
                    <td className={cn("py-3 text-right font-semibold", plExtraordinaryTotal >= 0 ? "text-slate-600" : "text-red-600")}>{formatCurrency(plExtraordinaryTotal)}</td>
                  </tr>
                  {entrySummary.filter(s => PL_CATEGORIES.extraordinary.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50 bg-slate-25">
                      <td className="py-2 pl-6 text-sm text-slate-600">└ {getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right text-sm text-slate-600">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50">
                    <td className="py-4 font-bold text-slate-800 text-lg">当期純利益</td>
                    <td className={cn("py-4 text-right font-bold text-lg", netProfit >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatCurrency(netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {financialEntries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">入力済みデータ一覧</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {financialEntries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <FileSpreadsheet size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{getCategoryLabel(entry.category)}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(entry.entryDate), 'yyyy/MM/dd')}
                          {entry.description && ` - ${entry.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-800">{formatCurrency(parseFloat(entry.amount))}</p>
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
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
                      <tr className="bg-blue-50">
                        <td colSpan={2} className="py-2 px-2 font-semibold text-slate-700">流動資産</td>
                      </tr>
                      {BS_CATEGORIES.current_assets.map((cat) => {
                        const total = entrySummary.find(s => s.category === cat.value)?.total || 0;
                        if (total === 0 && cat.value !== 'cash') return null;
                        return (
                          <tr key={cat.value} className="border-b border-slate-50">
                            <td className="py-2 text-slate-600">{cat.label}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-100 bg-blue-50">
                        <td className="py-3 font-bold text-slate-800">流動資産合計</td>
                        <td className="py-3 text-right font-bold text-blue-600">{formatCurrency(bsCurrentAssetsTotal)}</td>
                      </tr>
                      <tr className="bg-indigo-50">
                        <td colSpan={2} className="py-2 px-2 font-semibold text-slate-700">固定資産</td>
                      </tr>
                      {BS_CATEGORIES.fixed_assets.map((cat) => {
                        const total = entrySummary.find(s => s.category === cat.value)?.total || 0;
                        if (total === 0) return null;
                        return (
                          <tr key={cat.value} className="border-b border-slate-50">
                            <td className="py-2 text-slate-600">{cat.label}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-100 bg-indigo-50">
                        <td className="py-3 font-bold text-slate-800">固定資産合計</td>
                        <td className="py-3 text-right font-bold text-indigo-600">{formatCurrency(bsFixedAssetsTotal)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="py-3 font-bold text-slate-800">資産合計</td>
                        <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(bsCurrentAssetsTotal + bsFixedAssetsTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b-2 border-red-500">負債・純資産の部</h4>
                  <table className="w-full">
                    <tbody>
                      <tr className="bg-red-50">
                        <td colSpan={2} className="py-2 px-2 font-semibold text-slate-700">流動負債</td>
                      </tr>
                      {BS_CATEGORIES.current_liabilities.map((cat) => {
                        const total = entrySummary.find(s => s.category === cat.value)?.total || 0;
                        if (total === 0) return null;
                        return (
                          <tr key={cat.value} className="border-b border-slate-50">
                            <td className="py-2 text-slate-600">{cat.label}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-100 bg-red-50">
                        <td className="py-3 font-bold text-slate-800">流動負債合計</td>
                        <td className="py-3 text-right font-bold text-red-600">{formatCurrency(bsCurrentLiabilitiesTotal)}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td colSpan={2} className="py-2 px-2 font-semibold text-slate-700">固定負債</td>
                      </tr>
                      {BS_CATEGORIES.long_term_liabilities.map((cat) => {
                        const total = entrySummary.find(s => s.category === cat.value)?.total || 0;
                        if (total === 0) return null;
                        return (
                          <tr key={cat.value} className="border-b border-slate-50">
                            <td className="py-2 text-slate-600">{cat.label}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-100 bg-orange-50">
                        <td className="py-3 font-bold text-slate-800">固定負債合計</td>
                        <td className="py-3 text-right font-bold text-orange-600">{formatCurrency(bsLongTermLiabilitiesTotal)}</td>
                      </tr>
                      <tr className="border-b border-slate-100 bg-red-100">
                        <td className="py-3 font-bold text-slate-800">負債合計</td>
                        <td className="py-3 text-right font-bold text-red-600">{formatCurrency(bsCurrentLiabilitiesTotal + bsLongTermLiabilitiesTotal)}</td>
                      </tr>
                      <tr className="bg-emerald-50">
                        <td colSpan={2} className="py-2 px-2 font-semibold text-slate-700">純資産</td>
                      </tr>
                      {BS_CATEGORIES.equity.map((cat) => {
                        const total = entrySummary.find(s => s.category === cat.value)?.total || 0;
                        if (total === 0 && cat.value !== 'retained_earnings') return null;
                        const displayTotal = cat.value === 'retained_earnings' ? total + netProfit : total;
                        return (
                          <tr key={cat.value} className="border-b border-slate-50">
                            <td className="py-2 text-slate-600">{cat.label}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(displayTotal)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-100 bg-emerald-50">
                        <td className="py-3 font-bold text-slate-800">純資産合計</td>
                        <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(bsEquityTotal + netProfit)}</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="py-3 font-bold text-slate-800">負債・純資産合計</td>
                        <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(bsCurrentLiabilitiesTotal + bsLongTermLiabilitiesTotal + bsEquityTotal + netProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {financialEntries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">入力済みデータ一覧</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {financialEntries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Wallet size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{getCategoryLabel(entry.category)}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(entry.entryDate), 'yyyy/MM/dd')}
                          {entry.description && ` - ${entry.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-800">{formatCurrency(parseFloat(entry.amount))}</p>
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
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

      {activeTab === 'cf' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsInvestModalOpen(true)}
              className="btn-secondary flex items-center gap-2"
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
              <p className={cn("text-xl font-bold", (netProfit + cfOperatingTotal) >= 0 ? "text-blue-600" : "text-red-600")}>{formatCurrency(netProfit + cfOperatingTotal)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Building2 size={18} className="text-emerald-600" />
                </div>
                <span className="text-sm text-slate-500">投資CF</span>
              </div>
              <p className={cn("text-xl font-bold", (cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0)) >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0))}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <Wallet size={18} className="text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">財務CF</span>
              </div>
              <p className={cn("text-xl font-bold", cfFinancingTotal >= 0 ? "text-purple-600" : "text-red-600")}>{formatCurrency(cfFinancingTotal)}</p>
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
                    <td className="py-2 text-right font-medium">{formatCurrency(netProfit)}</td>
                  </tr>
                  {entrySummary.filter(s => CF_CATEGORIES.operating.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-600">{getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">営業活動CF小計</td>
                    <td className={cn("py-3 text-right font-semibold", (netProfit + cfOperatingTotal) >= 0 ? "text-blue-600" : "text-red-600")}>{formatCurrency(netProfit + cfOperatingTotal)}</td>
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
                  {entrySummary.filter(s => CF_CATEGORIES.investing.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-600">{getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  {investments.length === 0 && cfInvestingTotal === 0 && (
                    <tr className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-400 italic">投資記録なし</td>
                      <td className="py-2 text-right font-medium">¥0</td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">投資活動CF小計</td>
                    <td className={cn("py-3 text-right font-semibold", (cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0)) >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {formatCurrency(cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0))}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-3 font-bold text-slate-800 bg-purple-50">財務活動によるキャッシュフロー</td>
                  </tr>
                  {entrySummary.filter(s => CF_CATEGORIES.financing.map(c => c.value).includes(s.category)).map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-600">{getCategoryLabel(s.category)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  {cfFinancingTotal === 0 && (
                    <tr className="border-b border-slate-50">
                      <td className="py-2 pl-4 text-slate-400 italic">財務活動なし</td>
                      <td className="py-2 text-right font-medium">¥0</td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">財務活動CF小計</td>
                    <td className={cn("py-3 text-right font-semibold", cfFinancingTotal >= 0 ? "text-purple-600" : "text-red-600")}>{formatCurrency(cfFinancingTotal)}</td>
                  </tr>
                  <tr className="bg-primary-100">
                    <td className="py-4 font-bold text-slate-800 text-lg">現金及び現金同等物の増減額</td>
                    <td className={cn("py-4 text-right font-bold text-lg", (netProfit + cfOperatingTotal + cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0) + cfFinancingTotal) >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatCurrency(netProfit + cfOperatingTotal + cfInvestingTotal - investments.reduce((sum, i) => sum + parseFloat(i.amount), 0) + cfFinancingTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {(financialEntries.length > 0 || investments.length > 0) && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">入力済みデータ・投資記録一覧</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {financialEntries.map((entry) => (
                  <div key={`entry-${entry.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <DollarSign size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{getCategoryLabel(entry.category)}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(entry.entryDate), 'yyyy/MM/dd')}
                          {entry.description && ` - ${entry.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-800">{formatCurrency(parseFloat(entry.amount))}</p>
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {investments.map((inv) => (
                  <div key={`inv-${inv.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
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

      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] flex flex-col my-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">{entryFormData.id ? '財務データを編集' : '財務データを追加'}</h2>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleEntrySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">財務諸表タイプ</label>
                <select
                  value={entryFormData.statementType}
                  onChange={(e) => setEntryFormData({ ...entryFormData, statementType: e.target.value, category: '' })}
                  className="input-field"
                >
                  <option value="pl">PL（損益計算書）</option>
                  <option value="bs">BS（貸借対照表）</option>
                  <option value="cf">CF（キャッシュフロー）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">勘定科目 *</label>
                <select
                  value={entryFormData.category}
                  onChange={(e) => setEntryFormData({ ...entryFormData, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">選択してください</option>
                  {getCurrentCategoryOptions().map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">金額 *</label>
                <input
                  type="number"
                  value={entryFormData.amount}
                  onChange={(e) => setEntryFormData({ ...entryFormData, amount: e.target.value })}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={entryFormData.description}
                  onChange={(e) => setEntryFormData({ ...entryFormData, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="詳細を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">日付</label>
                <input
                  type="date"
                  value={entryFormData.entryDate}
                  onChange={(e) => setEntryFormData({ ...entryFormData, entryDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  {entryFormData.id ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
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
