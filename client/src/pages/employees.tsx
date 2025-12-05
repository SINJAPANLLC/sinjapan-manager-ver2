import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Edit2, Search, UserCog, X, Mail, Calendar, Building } from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
  id: number;
  userId?: number;
  employeeNumber?: string;
  hireDate?: string;
  salary?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    department?: string;
    position?: string;
  };
}

export function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    hireDate: '',
    salary: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    if (res.ok) {
      setEmployees(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const res = await fetch(`/api/employees/${editingEmployee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
      }),
    });

    if (res.ok) {
      fetchEmployees();
      closeModal();
    }
  };

  const openModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeNumber: employee.employeeNumber || '',
      hireDate: employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : '',
      salary: employee.salary || '',
      bankName: employee.bankName || '',
      bankBranch: employee.bankBranch || '',
      bankAccountType: employee.bankAccountType || '普通',
      bankAccountNumber: employee.bankAccountNumber || '',
      bankAccountHolder: employee.bankAccountHolder || '',
      emergencyContact: employee.emergencyContact || '',
      emergencyPhone: employee.emergencyPhone || '',
      notes: employee.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">従業員管理</h1>
          <p className="text-slate-500 text-sm mt-1">HR Hub - 従業員情報の管理</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="従業員を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="card p-6 group">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-button group-hover:scale-105 transition-transform duration-300">
                  {employee.user?.name.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{employee.user?.name || '不明'}</h3>
                  <p className="text-sm text-primary-600 font-medium">{employee.user?.position || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => openModal(employee)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-slate-500 text-xs font-medium">#</span>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">社員番号</p>
                  <p className="text-slate-700 font-medium">{employee.employeeNumber || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Building size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">部署</p>
                  <p className="text-slate-700 font-medium">{employee.user?.department || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">入社日</p>
                  <p className="text-slate-700 font-medium">
                    {employee.hireDate ? format(new Date(employee.hireDate), 'yyyy/MM/dd') : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-400 text-xs">メール</p>
                  <p className="text-slate-700 font-medium truncate">{employee.user?.email || '-'}</p>
                </div>
              </div>
            </div>

            {employee.bankName && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">銀行口座</p>
                <p className="text-sm text-slate-700 font-medium">
                  {employee.bankName} {employee.bankBranch}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <UserCog size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">従業員が見つかりません</p>
        </div>
      )}

      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                従業員情報を編集: {editingEmployee.user?.name}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">社員番号</label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">入社日</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">給与</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="input-field"
                    placeholder="例: 300000"
                  />
                </div>
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

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">緊急連絡先</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">連絡先名</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
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
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
