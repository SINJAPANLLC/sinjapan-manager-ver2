import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Edit2, Search, UserCog, X, Mail, Calendar, Building, DollarSign, Clock, CreditCard, Plus, Trash2, Check, ArrowLeft, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

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

interface StaffSalary {
  id: number;
  employeeId: number;
  month: string;
  baseSalary: string;
  overtime: string;
  bonus: string;
  deductions: string;
  netSalary: string;
  paidAt?: string;
  status: string;
  notes?: string;
}

interface StaffShift {
  id: number;
  employeeId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  breakMinutes: number;
  workHours: string;
  status: string;
  notes?: string;
}

interface AdvancePayment {
  id: number;
  employeeId: number;
  amount: string;
  requestedAt: string;
  reason?: string;
  status: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

type DetailTab = 'info' | 'salary' | 'shift' | 'advance';

export function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  
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

  const [salaryForm, setSalaryForm] = useState({
    month: format(new Date(), 'yyyy-MM'),
    baseSalary: '',
    overtime: '0',
    bonus: '0',
    deductions: '0',
    notes: '',
  });

  const [shiftForm, setShiftForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    notes: '',
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: '',
  });

  const canManage = user?.role === 'admin' || user?.role === 'ceo' || user?.role === 'manager';

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      if (detailTab === 'salary') fetchSalaries();
      else if (detailTab === 'shift') fetchShifts();
      else if (detailTab === 'advance') fetchAdvancePayments();
    }
  }, [selectedEmployee, detailTab]);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    if (res.ok) {
      setEmployees(await res.json());
    }
  };

  const fetchSalaries = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/salaries`);
      if (res.ok) setSalaries(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/shifts`);
      if (res.ok) setShifts(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdvancePayments = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/advance-payments`);
      if (res.ok) setAdvancePayments(await res.json());
    } finally {
      setIsLoading(false);
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

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    const baseSalary = parseFloat(salaryForm.baseSalary) || 0;
    const overtime = parseFloat(salaryForm.overtime) || 0;
    const bonus = parseFloat(salaryForm.bonus) || 0;
    const deductions = parseFloat(salaryForm.deductions) || 0;
    const netSalary = baseSalary + overtime + bonus - deductions;

    const res = await fetch(`/api/employees/${selectedEmployee.id}/salaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...salaryForm,
        netSalary: netSalary.toString(),
        status: 'pending',
      }),
    });

    if (res.ok) {
      fetchSalaries();
      setShowSalaryForm(false);
      setSalaryForm({ month: format(new Date(), 'yyyy-MM'), baseSalary: '', overtime: '0', bonus: '0', deductions: '0', notes: '' });
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const start = shiftForm.startTime.split(':').map(Number);
    const end = shiftForm.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const workMinutes = endMinutes - startMinutes - shiftForm.breakMinutes;
    const workHours = (workMinutes / 60).toFixed(2);

    const res = await fetch(`/api/employees/${selectedEmployee.id}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...shiftForm,
        workHours,
        status: 'scheduled',
      }),
    });

    if (res.ok) {
      fetchShifts();
      setShowShiftForm(false);
      setShiftForm({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '18:00', breakMinutes: 60, notes: '' });
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const res = await fetch(`/api/employees/${selectedEmployee.id}/advance-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...advanceForm,
        status: 'pending',
      }),
    });

    if (res.ok) {
      fetchAdvancePayments();
      setShowAdvanceForm(false);
      setAdvanceForm({ amount: '', reason: '' });
    }
  };

  const handleUpdateSalaryStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/salaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paidAt: status === 'paid' ? new Date().toISOString() : null }),
    });
    if (res.ok) fetchSalaries();
  };

  const handleUpdateShiftStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchShifts();
  };

  const handleUpdateAdvanceStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/advance-payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchAdvancePayments();
  };

  const handleDeleteSalary = async (id: number) => {
    if (!confirm('この給料記録を削除しますか？')) return;
    const res = await fetch(`/api/salaries/${id}`, { method: 'DELETE' });
    if (res.ok) fetchSalaries();
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm('このシフトを削除しますか？')) return;
    const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchShifts();
  };

  const handleDeleteAdvance = async (id: number) => {
    if (!confirm('この前払い申請を削除しますか？')) return;
    const res = await fetch(`/api/advance-payments/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAdvancePayments();
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

  const openDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailTab('info');
  };

  const closeDetail = () => {
    setSelectedEmployee(null);
    setSalaries([]);
    setShifts([]);
    setAdvancePayments([]);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeNumber?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'absent': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return '支払済';
      case 'approved': return '承認済';
      case 'pending': return '保留中';
      case 'rejected': return '却下';
      case 'completed': return '完了';
      case 'scheduled': return '予定';
      case 'absent': return '欠勤';
      default: return status;
    }
  };

  if (selectedEmployee) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{selectedEmployee.user?.name}</h1>
            <p className="text-slate-500 text-sm">{selectedEmployee.user?.position || '-'} · {selectedEmployee.user?.department || '-'}</p>
          </div>
        </div>

        <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
          {[
            { id: 'info' as DetailTab, label: '基本情報', icon: UserCog },
            { id: 'salary' as DetailTab, label: '給料', icon: DollarSign },
            { id: 'shift' as DetailTab, label: 'シフト', icon: Clock },
            { id: 'advance' as DetailTab, label: '前払い申請', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                detailTab === tab.id ? "bg-primary-500 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {detailTab === 'info' && (
          <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold text-slate-800">基本情報</h2>
              {canManage && (
                <button onClick={() => openModal(selectedEmployee)} className="btn-secondary text-sm">
                  <Edit2 size={14} />
                  編集
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">社員番号</p>
                  <p className="font-medium text-slate-800">{selectedEmployee.employeeNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">入社日</p>
                  <p className="font-medium text-slate-800">
                    {selectedEmployee.hireDate ? format(new Date(selectedEmployee.hireDate), 'yyyy/MM/dd') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">基本給</p>
                  <p className="font-medium text-slate-800">¥{selectedEmployee.salary ? Number(selectedEmployee.salary).toLocaleString() : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">メールアドレス</p>
                  <p className="font-medium text-slate-800">{selectedEmployee.user?.email || '-'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">銀行口座</p>
                  <p className="font-medium text-slate-800">
                    {selectedEmployee.bankName ? `${selectedEmployee.bankName} ${selectedEmployee.bankBranch || ''}` : '-'}
                  </p>
                  {selectedEmployee.bankAccountNumber && (
                    <p className="text-sm text-slate-600">
                      {selectedEmployee.bankAccountType} {selectedEmployee.bankAccountNumber}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">緊急連絡先</p>
                  <p className="font-medium text-slate-800">{selectedEmployee.emergencyContact || '-'}</p>
                  {selectedEmployee.emergencyPhone && (
                    <p className="text-sm text-slate-600">{selectedEmployee.emergencyPhone}</p>
                  )}
                </div>
                {selectedEmployee.notes && (
                  <div>
                    <p className="text-xs text-slate-400">備考</p>
                    <p className="text-sm text-slate-600">{selectedEmployee.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'salary' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">給料記録</h2>
              {canManage && (
                <button onClick={() => setShowSalaryForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  給料を追加
                </button>
              )}
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
              ) : salaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">給料記録がありません</div>
              ) : (
                <div className="space-y-3">
                  {salaries.map((salary) => (
                    <div key={salary.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">{salary.month}</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(salary.status))}>
                            {getStatusLabel(salary.status)}
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            {salary.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateSalaryStatus(salary.id, 'paid')}
                                className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                                title="支払済にする"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteSalary(salary.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div><span className="text-slate-400">基本給:</span> <span className="font-medium">¥{Number(salary.baseSalary).toLocaleString()}</span></div>
                        <div><span className="text-slate-400">残業代:</span> <span className="font-medium">¥{Number(salary.overtime).toLocaleString()}</span></div>
                        <div><span className="text-slate-400">賞与:</span> <span className="font-medium">¥{Number(salary.bonus).toLocaleString()}</span></div>
                        <div><span className="text-slate-400">控除:</span> <span className="font-medium text-red-600">-¥{Number(salary.deductions).toLocaleString()}</span></div>
                        <div><span className="text-slate-400">支給額:</span> <span className="font-bold text-primary-600">¥{Number(salary.netSalary).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'shift' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">シフト管理</h2>
              {canManage && (
                <button onClick={() => setShowShiftForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  シフトを追加
                </button>
              )}
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">シフトがありません</div>
              ) : (
                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-800">{format(new Date(shift.date), 'yyyy/MM/dd (E)')}</span>
                          <span className="text-slate-600">{shift.startTime} ~ {shift.endTime}</span>
                          <span className="text-slate-500 text-sm">休憩: {shift.breakMinutes}分</span>
                          <span className="text-primary-600 font-medium">{shift.workHours}h</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(shift.status))}>
                            {getStatusLabel(shift.status)}
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            {shift.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handleUpdateShiftStatus(shift.id, 'completed')}
                                  className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                                  title="完了"
                                >
                                  <Check size={16} />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'advance' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">前払い申請</h2>
              <button onClick={() => setShowAdvanceForm(true)} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={16} />
                申請を追加
              </button>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
              ) : advancePayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">前払い申請がありません</div>
              ) : (
                <div className="space-y-3">
                  {advancePayments.map((payment) => (
                    <div key={payment.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary-600">¥{Number(payment.amount).toLocaleString()}</span>
                          <span className="text-slate-500 text-sm">{format(new Date(payment.requestedAt), 'yyyy/MM/dd HH:mm')}</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(payment.status))}>
                            {getStatusLabel(payment.status)}
                          </span>
                          {payment.reason && <span className="text-slate-600 text-sm">理由: {payment.reason}</span>}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            {payment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateAdvanceStatus(payment.id, 'approved')}
                                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                                >
                                  承認
                                </button>
                                <button
                                  onClick={() => handleUpdateAdvanceStatus(payment.id, 'rejected')}
                                  className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                                >
                                  却下
                                </button>
                              </>
                            )}
                            {payment.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateAdvanceStatus(payment.id, 'paid')}
                                className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100"
                              >
                                支払済
                              </button>
                            )}
                            <button onClick={() => handleDeleteAdvance(payment.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showSalaryForm && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">給料を追加</h2>
                <button onClick={() => setShowSalaryForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleSalarySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">対象月</label>
                  <input type="month" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">基本給</label>
                    <input type="number" value={salaryForm.baseSalary} onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">残業代</label>
                    <input type="number" value={salaryForm.overtime} onChange={(e) => setSalaryForm({ ...salaryForm, overtime: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">賞与</label>
                    <input type="number" value={salaryForm.bonus} onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">控除</label>
                    <input type="number" value={salaryForm.deductions} onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                  <textarea value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} className="input-field" rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowSalaryForm(false)} className="btn-secondary flex-1">キャンセル</button>
                  <button type="submit" className="btn-primary flex-1">追加</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showShiftForm && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">シフトを追加</h2>
                <button onClick={() => setShowShiftForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleShiftSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">日付</label>
                  <input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始時間</label>
                    <input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">終了時間</label>
                    <input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">休憩時間（分）</label>
                  <input type="number" value={shiftForm.breakMinutes} onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                  <textarea value={shiftForm.notes} onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })} className="input-field" rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowShiftForm(false)} className="btn-secondary flex-1">キャンセル</button>
                  <button type="submit" className="btn-primary flex-1">追加</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAdvanceForm && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">前払い申請を追加</h2>
                <button onClick={() => setShowAdvanceForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdvanceSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">金額</label>
                  <input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} className="input-field" required placeholder="例: 50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">理由</label>
                  <textarea value={advanceForm.reason} onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} className="input-field" rows={3} placeholder="前払いを希望する理由" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAdvanceForm(false)} className="btn-secondary flex-1">キャンセル</button>
                  <button type="submit" className="btn-primary flex-1">申請</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">スタッフ管理</h1>
          <p className="text-slate-500 text-sm mt-1">スタッフの登録・管理</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="名前、メール、部署で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((employee) => (
          <div 
            key={employee.id} 
            className="card p-6 group cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => openDetail(employee)}
          >
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
                onClick={(e) => { e.stopPropagation(); openModal(employee); }}
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

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={(e) => { e.stopPropagation(); openDetail(employee); }}
                className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                詳細を見る（給料・シフト・前払い）
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <UserCog size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">スタッフが見つかりません</p>
        </div>
      )}

      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                スタッフ情報を編集: {editingEmployee.user?.name}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">基本給</label>
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
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
