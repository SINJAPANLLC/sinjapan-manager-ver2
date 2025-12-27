import { useState } from 'react';
import { Layout } from '../components/layout';
import { 
  Truck, 
  Building2, 
  Users, 
  FileText, 
  Calendar, 
  Car, 
  CreditCard, 
  ClipboardList, 
  FileCheck, 
  Receipt, 
  FileOutput, 
  Wallet, 
  TrendingUp,
  Plus,
  Search,
  Filter
} from 'lucide-react';

type TabId = 
  | 'shippers' 
  | 'companies' 
  | 'projects' 
  | 'dispatch' 
  | 'vehicles' 
  | 'mastercard' 
  | 'summary' 
  | 'quotation' 
  | 'instructions' 
  | 'invoice' 
  | 'receipt' 
  | 'payment' 
  | 'cashflow';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'shippers', label: '荷主リスト', icon: <Building2 size={16} /> },
  { id: 'companies', label: '自社・協力会社', icon: <Users size={16} /> },
  { id: 'projects', label: '案件一覧', icon: <FileText size={16} /> },
  { id: 'dispatch', label: '配車・シフト表', icon: <Calendar size={16} /> },
  { id: 'vehicles', label: '車両一覧', icon: <Car size={16} /> },
  { id: 'mastercard', label: 'マスターカード', icon: <CreditCard size={16} /> },
  { id: 'summary', label: '案件概要書', icon: <ClipboardList size={16} /> },
  { id: 'quotation', label: '見積書', icon: <FileCheck size={16} /> },
  { id: 'instructions', label: '指示書', icon: <FileOutput size={16} /> },
  { id: 'invoice', label: '請求書', icon: <Receipt size={16} /> },
  { id: 'receipt', label: '受領書', icon: <FileText size={16} /> },
  { id: 'payment', label: '支払書', icon: <Wallet size={16} /> },
  { id: 'cashflow', label: '入出金・売上', icon: <TrendingUp size={16} /> },
];

function ShippersTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="荷主を検索..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          荷主追加
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">荷主名</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">担当者</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">電話番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">住所</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={5} className="p-8 text-center text-slate-400">
                荷主データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompaniesTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="会社を検索..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          会社追加
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-primary-500" />
            自社
          </h3>
          <p className="text-slate-400 text-sm">自社情報がありません</p>
        </div>
        <div className="glass-card p-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Users size={18} className="text-green-500" />
            協力会社
          </h3>
          <p className="text-slate-400 text-sm">協力会社データがありません</p>
        </div>
      </div>
    </div>
  );
}

function ProjectsTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全てのステータス</option>
            <option>進行中</option>
            <option>完了</option>
            <option>保留</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="案件を検索..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          案件追加
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">案件番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">配送日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                案件データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DispatchTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <input 
            type="date" 
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全ての車両</option>
          </select>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          配車追加
        </button>
      </div>
      <div className="glass-card p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-slate-600 mb-2">
          <div>月</div>
          <div>火</div>
          <div>水</div>
          <div>木</div>
          <div>金</div>
          <div className="text-blue-500">土</div>
          <div className="text-red-500">日</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square border border-slate-100 rounded-lg p-1 text-xs hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-400">{(i % 31) + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VehiclesTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="車両を検索..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          車両追加
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">車両番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">車種</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">積載量</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">担当者</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                車両データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MastercardTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="マスターカードを検索..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          カード追加
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <CreditCard size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-400 text-sm">マスターカードがありません</p>
        </div>
      </div>
    </div>
  );
}

function SummaryTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option>案件を選択</option>
        </select>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          概要書作成
        </button>
      </div>
      <div className="glass-card p-6">
        <div className="text-center text-slate-400">
          <ClipboardList size={48} className="mx-auto mb-3 text-slate-300" />
          <p>案件を選択して概要書を作成してください</p>
        </div>
      </div>
    </div>
  );
}

function QuotationTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="見積書を検索..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          見積書作成
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">見積番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">作成日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                見積書データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InstructionsTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="指示書を検索..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          指示書作成
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">指示番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">発行日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ドライバー</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={5} className="p-8 text-center text-slate-400">
                指示書データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全てのステータス</option>
            <option>未送付</option>
            <option>送付済</option>
            <option>入金済</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="請求書を検索..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          請求書作成
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">請求番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">請求日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                請求書データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiptTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="受領書を検索..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          受領書作成
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">受領番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">受領日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">受領者</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={5} className="p-8 text-center text-slate-400">
                受領書データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全てのステータス</option>
            <option>未払い</option>
            <option>支払済</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="支払書を検索..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          支払書作成
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">支払番号</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">協力会社</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">支払日</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                支払書データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashflowTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>今月</option>
            <option>先月</option>
            <option>今年</option>
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全て</option>
            <option>入金</option>
            <option>出金</option>
          </select>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          入出金追加
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">売上</div>
          <div className="text-2xl font-bold text-green-600">¥0</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">支出</div>
          <div className="text-2xl font-bold text-red-600">¥0</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">利益</div>
          <div className="text-2xl font-bold text-blue-600">¥0</div>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-600">日付</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">種別</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">取引先</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">摘要</th>
              <th className="text-right p-3 text-sm font-medium text-slate-600">金額</th>
              <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td colSpan={6} className="p-8 text-center text-slate-400">
                入出金データがありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('shippers');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shippers': return <ShippersTab />;
      case 'companies': return <CompaniesTab />;
      case 'projects': return <ProjectsTab />;
      case 'dispatch': return <DispatchTab />;
      case 'vehicles': return <VehiclesTab />;
      case 'mastercard': return <MastercardTab />;
      case 'summary': return <SummaryTab />;
      case 'quotation': return <QuotationTab />;
      case 'instructions': return <InstructionsTab />;
      case 'invoice': return <InvoiceTab />;
      case 'receipt': return <ReceiptTab />;
      case 'payment': return <PaymentTab />;
      case 'cashflow': return <CashflowTab />;
      default: return <ShippersTab />;
    }
  };

  return (
    <Layout contentClassName="pl-0 pr-2 pt-2 pb-0 sm:pl-0 sm:pr-3 sm:pt-3 lg:pl-0 lg:pr-4 lg:pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Truck className="text-primary-500" size={20} />
          <h1 className="text-base font-bold text-slate-800">物流管理</h1>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">物流業務の総合管理</span>
      </div>

      <div className="mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}
    </Layout>
  );
}
