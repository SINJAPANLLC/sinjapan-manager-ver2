import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, TrendingUp, DollarSign, X } from 'lucide-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'paid':
        return 'bg-blue-100 text-blue-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const totalCommission = sales.reduce((sum, s) => sum + parseFloat(s.commission || '0'), 0);
  const approvedSales = sales.filter((s) => s.status === 'approved' || s.status === 'paid');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {isAgency ? '売上管理' : '代理店売上'}
        </h1>
        {isAgency && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Plus size={20} />
            売上を登録
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{sales.length}</p>
              <p className="text-gray-500 text-sm">総売上件数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                ¥{totalSales.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm">総売上金額</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                ¥{totalCommission.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm">総コミッション</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日付</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">説明</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">金額</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">コミッション</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ステータス</th>
                {canManage && <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">
                    {format(new Date(sale.saleDate), 'yyyy/MM/dd')}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {sale.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">
                    ¥{parseFloat(sale.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {sale.commission ? `¥${parseFloat(sale.commission).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(sale.status))}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <select
                        value={sale.status}
                        onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
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
          <div className="p-12 text-center text-gray-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>売上データがありません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">売上を登録</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">顧客</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">選択してください</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例: 100000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">コミッション</label>
                <input
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例: 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800"
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
