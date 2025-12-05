import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, TrendingUp, DollarSign, X, ArrowUpRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Sale {
  id: number;
  agencyId?: number;
  customerId?: number;
  amount: string;
  commission?: string;
  status: string;
  description?: string;
  saleDate: string;
}

interface Customer {
  id: number;
  companyName: string;
}

export function AgencySalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    commission: '',
    description: '',
    status: 'pending',
  });

  const isAgency = user?.role === 'agency';
  const canManage = user && ['admin', 'ceo', 'manager'].includes(user.role);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    const res = await fetch('/api/agency/sales');
    if (res.ok) {
      setSales(await res.json());
    }
  };

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    if (res.ok) {
      setCustomers(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/agency/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
      }),
    });
    
    if (res.ok) {
      fetchSales();
      setIsModalOpen(false);
      setFormData({ customerId: '', amount: '', commission: '', description: '', status: 'pending' });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/agency/sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchSales();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '保留中',
      approved: '承認済み',
      paid: '支払済み',
      rejected: '却下',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'paid':
        return 'badge-info';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'badge-warning';
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const totalCommission = sales.reduce((sum, s) => sum + parseFloat(s.commission || '0'), 0);
  const approvedSales = sales.filter((s) => s.status === 'approved' || s.status === 'paid');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAgency ? '売上管理' : '代理店売上'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">売上データの確認と管理</p>
        </div>
        {isAgency && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            売上を登録
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
            <ArrowUpRight size={18} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-800">{sales.length}</p>
            <p className="text-slate-500 text-sm font-medium mt-1">総売上件数</p>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <ArrowUpRight size={18} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-800">
              ¥{totalSales.toLocaleString()}
            </p>
            <p className="text-slate-500 text-sm font-medium mt-1">総売上金額</p>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="text-violet-600" size={24} />
            </div>
            <ArrowUpRight size={18} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-800">
              ¥{totalCommission.toLocaleString()}
            </p>
            <p className="text-slate-500 text-sm font-medium mt-1">総コミッション</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">日付</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">説明</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">金額</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">コミッション</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ステータス</th>
                {canManage && <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">操作</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {format(new Date(sale.saleDate), 'yyyy/MM/dd')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-medium">
                    {sale.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    ¥{parseFloat(sale.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {sale.commission ? `¥${parseFloat(sale.commission).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('badge', getStatusBadge(sale.status))}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <select
                        value={sale.status}
                        onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      >
                        <option value="pending">保留中</option>
                        <option value="approved">承認</option>
                        <option value="paid">支払済み</option>
                        <option value="rejected">却下</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <TrendingUp size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">売上データがありません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">売上を登録</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">顧客</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="input-field"
                >
                  <option value="">選択してください</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">金額 *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field"
                  placeholder="例: 100000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">コミッション</label>
                <input
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="input-field"
                  placeholder="例: 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
