import { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  X,
  Building2,
  Loader2,
  Eye,
  DollarSign,
  Clock,
  CreditCard,
  ArrowLeft,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Staff {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  position?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  isActive: boolean;
  createdAt: string;
}

interface Employee {
  id: number;
  userId: number;
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
  user?: Staff;
}

interface Salary {
  id: number;
  year: number;
  month: number;
  baseSalary: string;
  overtimePay?: string;
  bonus?: string;
  deductions?: string;
  netSalary: string;
  notes?: string;
}

interface Shift {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  workMinutes?: number;
  notes?: string;
}

interface AdvancePayment {
  id: number;
  amount: string;
  reason?: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

type DetailTab = 'info' | 'salary' | 'shift' | 'advance';

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '' });
  const [shiftForm, setShiftForm] = useState({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, notes: '' });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    department: '',
    position: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });

  const fetchStaff = async () => {
    setIsLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      setStaff(users.filter((u: Staff) => u.role === 'staff'));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('名前とメールアドレスは必須です');
      return;
    }
    if (!editingStaff && !form.password) {
      alert('パスワードは必須です');
      return;
    }

    const url = editingStaff ? `/api/users/${editingStaff.id}` : '/api/users';
    const method = editingStaff ? 'PATCH' : 'POST';
    const body = editingStaff 
      ? { ...form, password: form.password || undefined }
      : { ...form, role: 'staff' };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      setEditingStaff(null);
      setForm({ email: '', name: '', password: '', phone: '', department: '', position: '', bankName: '', bankBranch: '', bankAccountType: '普通', bankAccountNumber: '', bankAccountHolder: '' });
      fetchStaff();
    } else {
      const data = await res.json();
      alert(data.message || 'エラーが発生しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このスタッフを削除しますか？')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchStaff();
    }
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setForm({
      email: s.email,
      name: s.name,
      password: '',
      phone: s.phone || '',
      department: s.department || '',
      position: s.position || '',
      bankName: s.bankName || '',
      bankBranch: s.bankBranch || '',
      bankAccountType: s.bankAccountType || '普通',
      bankAccountNumber: s.bankAccountNumber || '',
      bankAccountHolder: s.bankAccountHolder || '',
    });
    setShowModal(true);
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDetail = async (s: Staff) => {
    setSelectedStaff(s);
    setDetailTab('info');
    setSalaries([]);
    setShifts([]);
    setAdvancePayments([]);
    setEmployeeData(null);

    // Fetch or auto-create employee record for this user
    try {
      const empRes = await fetch('/api/employees', { credentials: 'include' });
      if (empRes.ok) {
        const employees = await empRes.json();
        let emp = employees.find((e: Employee) => e.userId === s.id);
        
        // Auto-create employee record if not exists
        if (!emp) {
          const createRes = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: s.id,
              employeeNumber: '',
              hireDate: new Date().toISOString().split('T')[0],
              salary: '0',
              bankName: s.bankName || '',
              bankBranch: s.bankBranch || '',
              bankAccountType: s.bankAccountType || '普通',
              bankAccountNumber: s.bankAccountNumber || '',
              bankAccountHolder: s.bankAccountHolder || '',
            }),
          });
          if (createRes.ok) {
            emp = await createRes.json();
          }
        }
        
        if (emp) {
          setEmployeeData(emp);
          // Fetch salaries, shifts, advance payments
          const [salRes, shiftRes, advRes] = await Promise.all([
            fetch(`/api/employees/${emp.id}/salaries`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/shifts`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/advance-payments`, { credentials: 'include' }),
          ]);
          if (salRes.ok) setSalaries(await salRes.json());
          if (shiftRes.ok) setShifts(await shiftRes.json());
          if (advRes.ok) setAdvancePayments(await advRes.json());
        }
      }
    } catch (err) {
      console.error('Failed to fetch employee data:', err);
    }
  };

  const closeDetail = () => {
    setSelectedStaff(null);
    setEmployeeData(null);
  };

  const handleAddSalary = async () => {
    if (!employeeData || !salaryForm.baseSalary) return;
    const netSalary = Number(salaryForm.baseSalary) + Number(salaryForm.overtimePay || 0) + Number(salaryForm.bonus || 0) - Number(salaryForm.deductions || 0);
    const res = await fetch(`/api/employees/${employeeData.id}/salaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...salaryForm, netSalary: netSalary.toString() }),
    });
    if (res.ok) {
      const newSal = await res.json();
      setSalaries([newSal, ...salaries]);
      setShowSalaryForm(false);
      setSalaryForm({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '' });
    }
  };

  const handleAddShift = async () => {
    if (!employeeData || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) return;
    const start = shiftForm.startTime.split(':').map(Number);
    const end = shiftForm.endTime.split(':').map(Number);
    const workMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]) - (shiftForm.breakMinutes || 0);
    const res = await fetch(`/api/employees/${employeeData.id}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...shiftForm, workMinutes }),
    });
    if (res.ok) {
      const newShift = await res.json();
      setShifts([newShift, ...shifts]);
      setShowShiftForm(false);
      setShiftForm({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, notes: '' });
    }
  };

  const handleAddAdvance = async () => {
    if (!employeeData || !advanceForm.amount) return;
    const res = await fetch(`/api/employees/${employeeData.id}/advance-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...advanceForm, status: 'pending' }),
    });
    if (res.ok) {
      const newAdv = await res.json();
      setAdvancePayments([newAdv, ...advancePayments]);
      setShowAdvanceForm(false);
      setAdvanceForm({ amount: '', reason: '' });
    }
  };

  const createEmployeeRecord = async () => {
    if (!selectedStaff) return;
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: selectedStaff.id,
        employeeNumber: '',
        hireDate: new Date().toISOString().split('T')[0],
        salary: '0',
        bankName: selectedStaff.bankName || '',
        bankBranch: selectedStaff.bankBranch || '',
        bankAccountType: selectedStaff.bankAccountType || '普通',
        bankAccountNumber: selectedStaff.bankAccountNumber || '',
        bankAccountHolder: selectedStaff.bankAccountHolder || '',
      }),
    });
    if (res.ok) {
      const newEmp = await res.json();
      setEmployeeData(newEmp);
    } else {
      alert('従業員レコードの作成に失敗しました');
    }
  };

  // Detail view
  if (selectedStaff) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={closeDetail}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{selectedStaff.name}</h1>
            <p className="text-slate-500 text-sm">{selectedStaff.position || 'スタッフ'} · {selectedStaff.department || '-'}</p>
          </div>
        </div>

        <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
          {[
            { id: 'info' as DetailTab, label: '基本情報', icon: UserCheck },
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
            <h2 className="text-lg font-bold text-slate-800 mb-6">基本情報</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">メールアドレス</p>
                  <p className="font-medium text-slate-800">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">電話番号</p>
                  <p className="font-medium text-slate-800">{selectedStaff.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">部署</p>
                  <p className="font-medium text-slate-800">{selectedStaff.department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">役職</p>
                  <p className="font-medium text-slate-800">{selectedStaff.position || '-'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">銀行口座</p>
                  <p className="font-medium text-slate-800">
                    {selectedStaff.bankName ? `${selectedStaff.bankName} ${selectedStaff.bankBranch || ''}` : '-'}
                  </p>
                  {selectedStaff.bankAccountNumber && (
                    <p className="text-sm text-slate-600">
                      {selectedStaff.bankAccountType} {selectedStaff.bankAccountNumber}
                    </p>
                  )}
                </div>
                {employeeData && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400">社員番号</p>
                      <p className="font-medium text-slate-800">{employeeData.employeeNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">入社日</p>
                      <p className="font-medium text-slate-800">
                        {employeeData.hireDate ? format(new Date(employeeData.hireDate), 'yyyy/MM/dd') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">基本給</p>
                      <p className="font-medium text-slate-800">
                        ¥{employeeData.salary ? Number(employeeData.salary).toLocaleString() : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'salary' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">給料記録</h2>
              {employeeData && (
                <button onClick={() => setShowSalaryForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  給料を追加
                </button>
              )}
            </div>
            {showSalaryForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500">年</label>
                    <input type="number" className="input-field text-sm" value={salaryForm.year} onChange={(e) => setSalaryForm({ ...salaryForm, year: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">月</label>
                    <input type="number" min="1" max="12" className="input-field text-sm" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">基本給 *</label>
                    <input type="number" className="input-field text-sm" placeholder="300000" value={salaryForm.baseSalary} onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">残業代</label>
                    <input type="number" className="input-field text-sm" value={salaryForm.overtimePay} onChange={(e) => setSalaryForm({ ...salaryForm, overtimePay: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">賞与</label>
                    <input type="number" className="input-field text-sm" value={salaryForm.bonus} onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">控除</label>
                    <input type="number" className="input-field text-sm" value={salaryForm.deductions} onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddSalary} className="btn-primary text-sm">保存</button>
                  <button onClick={() => setShowSalaryForm(false)} className="btn-secondary text-sm">キャンセル</button>
                </div>
              </div>
            )}
            {!employeeData && (
              <div className="p-8 text-center">
                <p className="text-slate-400 mb-4">従業員データが登録されていません</p>
                <button onClick={createEmployeeRecord} className="btn-primary">
                  従業員として登録する
                </button>
              </div>
            )}
            {employeeData && salaries.length === 0 && !showSalaryForm && (
              <div className="p-8 text-center text-slate-400">
                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                <p>給料記録がありません</p>
              </div>
            )}
            {salaries.length > 0 && (
              <div className="divide-y divide-slate-100">
                {salaries.map((sal) => (
                  <div key={sal.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{sal.year}年{sal.month}月</p>
                      <p className="text-sm text-slate-500">
                        基本給: ¥{Number(sal.baseSalary).toLocaleString()}
                        {sal.overtimePay && ` + 残業: ¥${Number(sal.overtimePay).toLocaleString()}`}
                      </p>
                    </div>
                    <p className="font-bold text-lg text-primary-600">
                      ¥{Number(sal.netSalary).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab === 'shift' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">シフト記録</h2>
              {employeeData && (
                <button onClick={() => setShowShiftForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  シフトを追加
                </button>
              )}
            </div>
            {showShiftForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500">日付 *</label>
                    <input type="date" className="input-field text-sm" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">開始時間 *</label>
                    <input type="time" className="input-field text-sm" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">終了時間 *</label>
                    <input type="time" className="input-field text-sm" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">休憩(分)</label>
                    <input type="number" className="input-field text-sm" value={shiftForm.breakMinutes} onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddShift} className="btn-primary text-sm">保存</button>
                  <button onClick={() => setShowShiftForm(false)} className="btn-secondary text-sm">キャンセル</button>
                </div>
              </div>
            )}
            {!employeeData && (
              <div className="p-8 text-center">
                <p className="text-slate-400 mb-4">従業員データが登録されていません</p>
                <button onClick={createEmployeeRecord} className="btn-primary">
                  従業員として登録する
                </button>
              </div>
            )}
            {employeeData && shifts.length === 0 && !showShiftForm && (
              <div className="p-8 text-center text-slate-400">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>シフト記録がありません</p>
              </div>
            )}
            {shifts.length > 0 && (
              <div className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <div key={shift.id} className="p-4">
                    <p className="font-medium text-slate-800">
                      {format(new Date(shift.date), 'yyyy/MM/dd')}
                    </p>
                    <p className="text-sm text-slate-500">
                      {shift.startTime} - {shift.endTime}
                      {shift.workMinutes && ` (${Math.floor(shift.workMinutes / 60)}時間${shift.workMinutes % 60}分)`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab === 'advance' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">前払い申請</h2>
              {employeeData && (
                <button onClick={() => setShowAdvanceForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  前払い申請
                </button>
              )}
            </div>
            {showAdvanceForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500">金額 *</label>
                    <input type="number" className="input-field text-sm" placeholder="50000" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">理由</label>
                    <input type="text" className="input-field text-sm" placeholder="緊急の出費のため" value={advanceForm.reason} onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddAdvance} className="btn-primary text-sm">申請する</button>
                  <button onClick={() => setShowAdvanceForm(false)} className="btn-secondary text-sm">キャンセル</button>
                </div>
              </div>
            )}
            {!employeeData && (
              <div className="p-8 text-center">
                <p className="text-slate-400 mb-4">従業員データが登録されていません</p>
                <button onClick={createEmployeeRecord} className="btn-primary">
                  従業員として登録する
                </button>
              </div>
            )}
            {employeeData && advancePayments.length === 0 && !showAdvanceForm && (
              <div className="p-8 text-center text-slate-400">
                <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                <p>前払い申請がありません</p>
              </div>
            )}
            {advancePayments.length > 0 && (
              <div className="divide-y divide-slate-100">
                {advancePayments.map((adv) => (
                  <div key={adv.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">
                        ¥{Number(adv.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">{adv.reason || '-'}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(adv.requestedAt), 'yyyy/MM/dd HH:mm')}
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      adv.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      adv.status === 'approved' && "bg-blue-100 text-blue-700",
                      adv.status === 'paid' && "bg-green-100 text-green-700",
                      adv.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {adv.status === 'pending' && '申請中'}
                      {adv.status === 'approved' && '承認済'}
                      {adv.status === 'paid' && '支払済'}
                      {adv.status === 'rejected' && '却下'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <UserCheck size={28} />
            スタッフ管理
          </h1>
          <p className="text-slate-500 mt-1">スタッフの登録・管理</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setForm({ email: '', name: '', password: '', phone: '', department: '', position: '', bankName: '', bankBranch: '', bankAccountType: '普通', bankAccountNumber: '', bankAccountHolder: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新規登録
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="名前、メール、部署で検索..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((s) => (
            <div key={s.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{s.name}</h3>
                    <p className="text-sm text-slate-500">{s.position || 'スタッフ'}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {s.isActive ? '有効' : '無効'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} />
                  <span>{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.department && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 size={14} />
                    <span>{s.department}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => openDetail(s)}
                  className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Eye size={14} />
                  詳細を見る（給料・シフト・前払い）
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(s)}
                    className="flex-1 btn-secondary text-sm py-1.5"
                  >
                    <Edit size={14} className="inline mr-1" />
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="btn-secondary text-sm py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredStaff.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <UserCheck size={48} className="mx-auto mb-2 opacity-50" />
              <p>スタッフが見つかりません</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingStaff ? 'スタッフ編集' : '新規スタッフ登録'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">名前 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">メールアドレス *</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  パスワード {editingStaff ? '(変更する場合のみ)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">電話番号</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">部署</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">役職</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-medium text-slate-700 mb-3">口座情報</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">銀行名</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="例: みずほ銀行"
                        value={form.bankName}
                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">支店名</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="例: 渋谷支店"
                        value={form.bankBranch}
                        onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">口座種別</label>
                      <select
                        className="input-field"
                        value={form.bankAccountType}
                        onChange={(e) => setForm({ ...form, bankAccountType: e.target.value })}
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                        <option value="貯蓄">貯蓄</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">口座番号</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="1234567"
                        value={form.bankAccountNumber}
                        onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">口座名義</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="カタカナで入力"
                      value={form.bankAccountHolder}
                      onChange={(e) => setForm({ ...form, bankAccountHolder: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleSubmit} className="flex-1 btn-primary">
                  {editingStaff ? '更新' : '登録'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
