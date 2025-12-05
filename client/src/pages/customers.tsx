import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, Edit2, Trash2, Search, Building2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Customer {
  id: number;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  assignedTo?: number;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  notes?: string;
}

export function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
    notes: '',
  });

  const canEdit = user && ['admin', 'ceo', 'manager', 'staff'].includes(user.role);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    if (res.ok) {
      setCustomers(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    const method = editingCustomer ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (res.ok) {
      fetchCustomers();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この顧客を削除しますか？')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetchCustomers();
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        companyName: customer.companyName,
        contactName: customer.contactName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        status: customer.status,
        bankName: customer.bankName || '',
        bankBranch: customer.bankBranch || '',
        bankAccountType: customer.bankAccountType || '普通',
        bankAccountNumber: customer.bankAccountNumber || '',
        bankAccountHolder: customer.bankAccountHolder || '',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
        bankName: '',
        bankBranch: '',
        bankAccountType: '普通',
        bankAccountNumber: '',
        bankAccountHolder: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">顧客管理</h1>
          <p className="text-slate-500 text-sm mt-1">顧客情報の一覧と管理</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            新規顧客
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="顧客を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">会社名</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">担当者</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">メール</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">電話</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ステータス</th>
                {canEdit && <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">操作</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg">
                        <Building2 className="text-primary-600" size={18} />
                      </div>
                      <span className="font-semibold text-slate-800">{customer.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{customer.contactName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{customer.email || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{customer.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'badge',
                        customer.status === 'active'
                          ? 'badge-success'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      )}
                    >
                      {customer.status === 'active' ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(customer)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Building2 className="text-slate-400" size={28} />
            </div>
            <p className="text-slate-500 font-medium">顧客が見つかりません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCustomer ? '顧客を編集' : '新規顧客'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">会社名 *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">担当者名</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">メール</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">住所</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">銀行口座情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">銀行名</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">支店名</label>
                    <input
                      type="text"
                      value={formData.bankBranch}
                      onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座種別</label>
                    <select
                      value={formData.bankAccountType}
                      onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
                      className="input-field"
                    >
                      <option value="普通">普通</option>
                      <option value="当座">当座</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座番号</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座名義</label>
                    <input
                      type="text"
                      value={formData.bankAccountHolder}
                      onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCustomer ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
