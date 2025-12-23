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
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Banknote,
  ClipboardList,
  Link2,
  Settings,
  StickyNote,
  Upload,
  FileText,
  ExternalLink,
  MousePointerClick,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../hooks/use-auth';

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
  paidAt?: string;
}

interface Shift {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  workMinutes?: number;
  projectName?: string;
  notes?: string;
}

interface AdvancePayment {
  id: number;
  amount: string;
  feeAmount?: string;
  netAmount?: string;
  reason?: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

interface StaffTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
}

interface TaskEvidence {
  id: number;
  taskId: number;
  fileName?: string;
  fileUrl?: string;
  description?: string;
  submittedAt: string;
}

interface StaffAffiliate {
  id: number;
  affiliateName: string;
  affiliateUrl?: string;
  affiliateCode?: string;
  platform?: string;
  commissionRate?: string;
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: string;
  isActive?: boolean;
  notes?: string;
}

interface StaffMemo {
  id: number;
  content: string;
  category?: string;
  createdAt: string;
}

type DetailTab = 'info' | 'salary' | 'shift' | 'advance' | 'tasks' | 'affiliate' | 'system' | 'memo';

export function StaffPage() {
  const { user } = useAuth();
  const canApprove = user && ['admin', 'ceo', 'manager'].includes(user.role);
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
  const [staffTasks, setStaffTasks] = useState<StaffTask[]>([]);
  const [taskEvidence, setTaskEvidence] = useState<Record<number, TaskEvidence[]>>({});
  const [affiliates, setAffiliates] = useState<StaffAffiliate[]>([]);
  const [staffMemos, setStaffMemos] = useState<StaffMemo[]>([]);
  const [showAffiliateForm, setShowAffiliateForm] = useState(false);
  const [showMemoForm, setShowMemoForm] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({ affiliateName: '', affiliateUrl: '', affiliateCode: '', platform: '', commissionRate: '', notes: '' });
  
  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SJ-${random}`;
  };
  const [memoForm, setMemoForm] = useState({ content: '', category: 'general' });
  const [pendingAdvanceCounts, setPendingAdvanceCounts] = useState<Record<number, number>>({});
  const [editingSystem, setEditingSystem] = useState(false);
  const [systemForm, setSystemForm] = useState({
    salary: '',
    hireDate: '',
    employeeNumber: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
    closingDay: '末日',
    paymentDay: '翌翌月5日',
    paymentMethod: '銀行振込',
    transferFee: '330',
    contractType: 'employee',
    healthInsurance: '',
    pensionInsurance: '',
    employmentInsurance: '',
    incomeTax: '',
    residentTax: '',
    otherDeductions: '',
    deduction1Name: '',
    deduction1Amount: '',
    deduction2Name: '',
    deduction2Amount: '',
    deduction3Name: '',
    deduction3Amount: '',
  });
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({ description: '' });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '', paidAt: '' });
  const [shiftForm, setShiftForm] = useState({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, projectName: '', notes: '' });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });
  const [showBasicInfoEdit, setShowBasicInfoEdit] = useState(false);
  const [shiftCalendarDate, setShiftCalendarDate] = useState(new Date());
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [basicInfoForm, setBasicInfoForm] = useState({
    phone: '',
    department: '',
    position: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
    employeeNumber: '',
    hireDate: '',
    salary: '',
  });
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

  const fetchPendingAdvanceCounts = async () => {
    try {
      const res = await fetch('/api/pending-advance-payments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const counts: Record<number, number> = {};
        data.forEach((item: { userId: number; count: number }) => {
          counts[item.userId] = item.count;
        });
        setPendingAdvanceCounts(counts);
      }
    } catch (err) {
      console.error('Failed to fetch pending advance counts:', err);
    }
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      setStaff(users.filter((u: Staff) => u.role === 'staff'));
    }
    fetchPendingAdvanceCounts();
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'staff') {
      const userData = user as any;
      const currentStaff: Staff = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        position: user.position,
        bankName: userData.bankName || '',
        bankBranch: userData.bankBranch || '',
        bankAccountType: userData.bankAccountType || '普通',
        bankAccountNumber: userData.bankAccountNumber || '',
        bankAccountHolder: userData.bankAccountHolder || '',
        isActive: user.isActive ?? true,
        createdAt: userData.createdAt || new Date().toISOString(),
      };
      setStaff([currentStaff]);
      openDetail(currentStaff);
    } else {
      fetchStaff();
    }
  }, [user]);

  const fetchStaffTasks = async (userId: number) => {
    try {
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (res.ok) {
        const tasks = await res.json();
        const userTasks = tasks.filter((t: any) => t.assignedTo === userId);
        setStaffTasks(userTasks);
        userTasks.forEach((task: any) => fetchTaskEvidence(task.id));
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setStaffTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const fetchTaskEvidence = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/evidence`, { credentials: 'include' });
      if (res.ok) {
        const evidence = await res.json();
        setTaskEvidence(prev => ({ ...prev, [taskId]: evidence }));
      }
    } catch (err) {
      console.error('Failed to fetch task evidence:', err);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!selectedTask) return;
    try {
      const formData = new FormData();
      formData.append('description', evidenceForm.description);
      if (evidenceFile) {
        formData.append('file', evidenceFile);
      }
      const res = await fetch(`/api/tasks/${selectedTask.id}/evidence`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        fetchTaskEvidence(selectedTask.id);
        setShowEvidenceForm(false);
        setSelectedTask(null);
        setEvidenceForm({ description: '' });
        setEvidenceFile(null);
      }
    } catch (err) {
      console.error('Failed to submit evidence:', err);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number, taskId: number) => {
    if (!confirm('このエビデンスを削除しますか？')) return;
    try {
      const res = await fetch(`/api/evidence/${evidenceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchTaskEvidence(taskId);
      }
    } catch (err) {
      console.error('Failed to delete evidence:', err);
    }
  };

  const handleAddAffiliate = async () => {
    if (!employeeData || !affiliateForm.affiliateName) return;
    try {
      const res = await fetch(`/api/employees/${employeeData.id}/affiliates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...affiliateForm,
          isActive: true,
        }),
      });
      if (res.ok) {
        const newAffiliate = await res.json();
        setAffiliates(prev => [...prev, newAffiliate]);
        setAffiliateForm({ affiliateName: '', platform: '', affiliateUrl: '', affiliateCode: '', commissionRate: '', notes: '' });
        setShowAffiliateForm(false);
      }
    } catch (err) {
      console.error('Failed to add affiliate:', err);
    }
  };

  const handleDeleteAffiliate = async (affiliateId: number) => {
    if (!confirm('このアフィリエイトを削除しますか？')) return;
    try {
      const res = await fetch(`/api/affiliates/${affiliateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setAffiliates(prev => prev.filter(a => a.id !== affiliateId));
      }
    } catch (err) {
      console.error('Failed to delete affiliate:', err);
    }
  };

  const handleAddMemo = async () => {
    if (!employeeData || !memoForm.content) return;
    try {
      const res = await fetch(`/api/employees/${employeeData.id}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(memoForm),
      });
      if (res.ok) {
        const newMemo = await res.json();
        setStaffMemos(prev => [newMemo, ...prev]);
        setMemoForm({ category: 'general', content: '' });
        setShowMemoForm(false);
      }
    } catch (err) {
      console.error('Failed to add memo:', err);
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('このメモを削除しますか？')) return;
    try {
      const res = await fetch(`/api/memos/${memoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setStaffMemos(prev => prev.filter(m => m.id !== memoId));
      }
    } catch (err) {
      console.error('Failed to delete memo:', err);
    }
  };

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
    setStaffTasks([]);
    setAffiliates([]);
    setStaffMemos([]);
    setEmployeeData(null);

    // Fetch tasks for this user
    fetchStaffTasks(s.id);

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
              hireDate: null,
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
          // Fetch salaries, shifts, advance payments, affiliates, memos
          const [salRes, shiftRes, advRes, affRes, memoRes] = await Promise.all([
            fetch(`/api/employees/${emp.id}/salaries`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/shifts`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/advance-payments`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/affiliates`, { credentials: 'include' }),
            fetch(`/api/employees/${emp.id}/memos`, { credentials: 'include' }),
          ]);
          if (salRes.ok) setSalaries(await salRes.json());
          if (shiftRes.ok) setShifts(await shiftRes.json());
          if (advRes.ok) setAdvancePayments(await advRes.json());
          if (affRes.ok) setAffiliates(await affRes.json());
          if (memoRes.ok) setStaffMemos(await memoRes.json());
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
    const netSalary = Number(salaryForm.baseSalary) - Number(salaryForm.deductions || 0);
    const payload = {
      ...salaryForm,
      netSalary: netSalary.toString(),
      paidAt: salaryForm.paidAt ? new Date(salaryForm.paidAt) : null,
    };
    const res = await fetch(`/api/employees/${employeeData.id}/salaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const newSal = await res.json();
      setSalaries([newSal, ...salaries]);
      setShowSalaryForm(false);
      setSalaryForm({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '', paidAt: '' });
    }
  };

  const openEditSalary = (salary: Salary) => {
    setEditingSalary(salary);
    setSalaryForm({
      year: salary.year,
      month: salary.month,
      baseSalary: salary.baseSalary,
      overtimePay: salary.overtimePay || '',
      bonus: salary.bonus || '',
      deductions: salary.deductions || '',
      notes: salary.notes || '',
      paidAt: salary.paidAt ? new Date(salary.paidAt).toISOString().split('T')[0] : '',
    });
  };

  const handleUpdateSalary = async () => {
    if (!employeeData || !editingSalary || !salaryForm.baseSalary) return;
    const netSalary = Number(salaryForm.baseSalary) - Number(salaryForm.deductions || 0);
    const payload = {
      ...salaryForm,
      netSalary: netSalary.toString(),
      paidAt: salaryForm.paidAt ? new Date(salaryForm.paidAt) : null,
    };
    const res = await fetch(`/api/salaries/${editingSalary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updatedSal = await res.json();
      setSalaries(salaries.map((s) => (s.id === editingSalary.id ? updatedSal : s)));
      setEditingSalary(null);
      setSalaryForm({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '', paidAt: '' });
    }
  };

  const handleDeleteSalary = async (salaryId: number) => {
    if (!employeeData || !confirm('この給料記録を削除しますか？')) return;
    const res = await fetch(`/api/salaries/${salaryId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setSalaries(salaries.filter((s) => s.id !== salaryId));
      setEditingSalary(null);
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
      setShiftForm({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, projectName: '', notes: '' });
    }
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    const shiftDate = new Date(shift.date);
    setShiftForm({
      date: `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`,
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '18:00',
      breakMinutes: shift.breakMinutes || 60,
      projectName: shift.projectName || '',
      notes: shift.notes || '',
    });
  };

  const handleUpdateShift = async () => {
    if (!employeeData || !editingShift || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) return;
    const start = shiftForm.startTime.split(':').map(Number);
    const end = shiftForm.endTime.split(':').map(Number);
    const workMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]) - (shiftForm.breakMinutes || 0);
    const res = await fetch(`/api/shifts/${editingShift.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...shiftForm, workMinutes }),
    });
    if (res.ok) {
      const updatedShift = await res.json();
      setShifts(shifts.map((s) => (s.id === editingShift.id ? updatedShift : s)));
      setEditingShift(null);
      setShiftForm({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, projectName: '', notes: '' });
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!employeeData || !confirm('このシフトを削除しますか？')) return;
    const res = await fetch(`/api/shifts/${shiftId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setShifts(shifts.filter((s) => s.id !== shiftId));
      setEditingShift(null);
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

  const handleUpdateAdvanceStatus = async (advanceId: number, status: 'approved' | 'rejected' | 'paid') => {
    const res = await fetch(`/api/advance-payments/${advanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAdvancePayments(advancePayments.map(a => a.id === advanceId ? { ...a, ...updated } : a));
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
        hireDate: null,
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

  const startEditBasicInfo = () => {
    if (!selectedStaff) return;
    setBasicInfoForm({
      phone: selectedStaff.phone || '',
      department: selectedStaff.department || '',
      position: selectedStaff.position || '',
      bankName: selectedStaff.bankName || '',
      bankBranch: selectedStaff.bankBranch || '',
      bankAccountType: selectedStaff.bankAccountType || '普通',
      bankAccountNumber: selectedStaff.bankAccountNumber || '',
      bankAccountHolder: selectedStaff.bankAccountHolder || '',
      employeeNumber: employeeData?.employeeNumber || '',
      hireDate: employeeData?.hireDate ? employeeData.hireDate.split('T')[0] : '',
      salary: employeeData?.salary || '',
    });
    setShowBasicInfoEdit(true);
  };

  const handleSaveBasicInfo = async () => {
    if (!selectedStaff) return;
    
    // Update user info
    const userRes = await fetch(`/api/users/${selectedStaff.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        phone: basicInfoForm.phone,
        department: basicInfoForm.department,
        position: basicInfoForm.position,
        bankName: basicInfoForm.bankName,
        bankBranch: basicInfoForm.bankBranch,
        bankAccountType: basicInfoForm.bankAccountType,
        bankAccountNumber: basicInfoForm.bankAccountNumber,
        bankAccountHolder: basicInfoForm.bankAccountHolder,
      }),
    });

    if (userRes.ok) {
      // Directly update local state with form values
      const updatedStaff = {
        ...selectedStaff,
        phone: basicInfoForm.phone,
        department: basicInfoForm.department,
        position: basicInfoForm.position,
        bankName: basicInfoForm.bankName,
        bankBranch: basicInfoForm.bankBranch,
        bankAccountType: basicInfoForm.bankAccountType,
        bankAccountNumber: basicInfoForm.bankAccountNumber,
        bankAccountHolder: basicInfoForm.bankAccountHolder,
      };
      setSelectedStaff(updatedStaff);
      setStaff((prev) => prev.map((s) => (s.id === selectedStaff.id ? updatedStaff : s)));
    }

    // Update employee info if exists
    if (employeeData) {
      const empRes = await fetch(`/api/employees/${employeeData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeNumber: basicInfoForm.employeeNumber,
          hireDate: basicInfoForm.hireDate || null,
          salary: basicInfoForm.salary || '0',
          bankName: basicInfoForm.bankName,
          bankBranch: basicInfoForm.bankBranch,
          bankAccountType: basicInfoForm.bankAccountType,
          bankAccountNumber: basicInfoForm.bankAccountNumber,
          bankAccountHolder: basicInfoForm.bankAccountHolder,
        }),
      });
      if (empRes.ok) {
        // Directly update local state with form values
        setEmployeeData({
          ...employeeData,
          employeeNumber: basicInfoForm.employeeNumber,
          hireDate: basicInfoForm.hireDate || undefined,
          salary: basicInfoForm.salary || '0',
          bankName: basicInfoForm.bankName,
          bankBranch: basicInfoForm.bankBranch,
          bankAccountType: basicInfoForm.bankAccountType,
          bankAccountNumber: basicInfoForm.bankAccountNumber,
          bankAccountHolder: basicInfoForm.bankAccountHolder,
        });
      }
    }

    setShowBasicInfoEdit(false);
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
            { id: 'tasks' as DetailTab, label: 'タスク', icon: ClipboardList },
            { id: 'system' as DetailTab, label: 'システム', icon: Settings },
            { id: 'memo' as DetailTab, label: 'メモ', icon: StickyNote },
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">基本情報</h2>
              {!showBasicInfoEdit && (
                <button onClick={startEditBasicInfo} className="btn-secondary text-sm flex items-center gap-2">
                  <Edit size={14} />
                  編集
                </button>
              )}
            </div>
            
            {showBasicInfoEdit ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">電話番号</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={basicInfoForm.phone}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">部署</label>
                    <input
                      type="text"
                      className="input-field"
                      value={basicInfoForm.department}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">役職</label>
                    <input
                      type="text"
                      className="input-field"
                      value={basicInfoForm.position}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">社員番号</label>
                    <input
                      type="text"
                      className="input-field"
                      value={basicInfoForm.employeeNumber}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, employeeNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">入社日</label>
                    <input
                      type="date"
                      className="input-field"
                      value={basicInfoForm.hireDate}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, hireDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">報酬</label>
                    <input
                      type="number"
                      className="input-field"
                      value={basicInfoForm.salary}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, salary: e.target.value })}
                    />
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">銀行口座情報</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">銀行名</label>
                      <input
                        type="text"
                        className="input-field"
                        value={basicInfoForm.bankName}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">支店名</label>
                      <input
                        type="text"
                        className="input-field"
                        value={basicInfoForm.bankBranch}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bankBranch: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">口座種別</label>
                      <select
                        className="input-field"
                        value={basicInfoForm.bankAccountType}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bankAccountType: e.target.value })}
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">口座番号</label>
                      <input
                        type="text"
                        className="input-field"
                        value={basicInfoForm.bankAccountNumber}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bankAccountNumber: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">口座名義</label>
                      <input
                        type="text"
                        className="input-field"
                        value={basicInfoForm.bankAccountHolder}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bankAccountHolder: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button onClick={handleSaveBasicInfo} className="btn-primary flex items-center gap-2">
                    <Check size={16} />
                    保存
                  </button>
                  <button onClick={() => setShowBasicInfoEdit(false)} className="btn-secondary">
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
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
                        <p className="text-xs text-slate-400">報酬</p>
                        <p className="font-medium text-slate-800">
                          ¥{employeeData.salary ? Number(employeeData.salary).toLocaleString() : '-'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
                    <label className="text-xs text-slate-500">支払日</label>
                    <input type="date" className="input-field text-sm" value={salaryForm.paidAt} onChange={(e) => setSalaryForm({ ...salaryForm, paidAt: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">報酬 *</label>
                    <input type="number" className="input-field text-sm" placeholder="300000" value={salaryForm.baseSalary} onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">控除</label>
                    <input type="number" className="input-field text-sm" value={salaryForm.deductions} onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">備考</label>
                    <input type="text" className="input-field text-sm" placeholder="メモ" value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} />
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
              <>
                <div className="divide-y divide-slate-100">
                  {salaries.map((sal) => (
                    <div
                      key={sal.id}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => openEditSalary(sal)}
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {sal.year}年{sal.month}月
                          {sal.paidAt && <span className="text-sm text-slate-500 ml-2">({format(new Date(sal.paidAt), 'yyyy/MM/dd')})</span>}
                        </p>
                        <p className="text-sm text-slate-500">
                          報酬: ¥{Number(sal.baseSalary).toLocaleString()}
                                                  </p>
                      </div>
                      <p className="font-bold text-lg text-primary-600">
                        ¥{Number(sal.netSalary).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <p className="font-bold text-slate-700">合計</p>
                  <p className="font-bold text-xl text-primary-700">
                    ¥{salaries.reduce((sum, sal) => sum + Number(sal.netSalary), 0).toLocaleString()}
                  </p>
                </div>
              </>
            )}

            {editingSalary && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">給料を編集</h3>
                    <button
                      onClick={() => {
                        setEditingSalary(null);
                        setSalaryForm({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '', paidAt: '' });
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">年 *</label>
                        <input
                          type="number"
                          className="input-field"
                          value={salaryForm.year}
                          onChange={(e) => setSalaryForm({ ...salaryForm, year: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">月 *</label>
                        <select
                          className="input-field"
                          value={salaryForm.month}
                          onChange={(e) => setSalaryForm({ ...salaryForm, month: Number(e.target.value) })}
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                            <option key={m} value={m}>{m}月</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">支払日</label>
                        <input
                          type="date"
                          className="input-field"
                          value={salaryForm.paidAt}
                          onChange={(e) => setSalaryForm({ ...salaryForm, paidAt: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">報酬 *</label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="報酬"
                          value={salaryForm.baseSalary}
                          onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">控除</label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="控除"
                          value={salaryForm.deductions}
                          onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">備考</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="メモ"
                        value={salaryForm.notes}
                        onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button onClick={handleUpdateSalary} className="btn-primary flex items-center gap-2">
                        <Check size={16} />
                        保存
                      </button>
                      <button
                        onClick={() => handleDeleteSalary(editingSalary.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        削除
                      </button>
                      <button
                        onClick={() => {
                          setEditingSalary(null);
                          setSalaryForm({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, baseSalary: '', overtimePay: '', bonus: '', deductions: '', notes: '', paidAt: '' });
                        }}
                        className="btn-secondary"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {detailTab === 'shift' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">シフト記録</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShiftCalendarDate(new Date(shiftCalendarDate.getFullYear(), shiftCalendarDate.getMonth() - 1))}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium text-slate-700 min-w-[100px] text-center">
                    {shiftCalendarDate.getFullYear()}年{shiftCalendarDate.getMonth() + 1}月
                  </span>
                  <button
                    onClick={() => setShiftCalendarDate(new Date(shiftCalendarDate.getFullYear(), shiftCalendarDate.getMonth() + 1))}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              {employeeData && (
                <button onClick={() => setShowShiftForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  シフトを追加
                </button>
              )}
            </div>
            {showShiftForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500">日付 *</label>
                    <input type="date" className="input-field text-sm" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">案件名</label>
                    <input type="text" className="input-field text-sm" placeholder="案件名を入力" value={shiftForm.projectName} onChange={(e) => setShiftForm({ ...shiftForm, projectName: e.target.value })} />
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
            {employeeData && (
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div key={day} className={cn(
                      "text-center text-xs font-medium py-2",
                      i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"
                    )}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const year = shiftCalendarDate.getFullYear();
                    const month = shiftCalendarDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];
                    
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`empty-${i}`} className="h-20 bg-slate-50 rounded" />);
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayShifts = shifts.filter((s) => {
                        const shiftDate = new Date(s.date);
                        return shiftDate.getFullYear() === year && shiftDate.getMonth() === month && shiftDate.getDate() === day;
                      });
                      const dayOfWeek = new Date(year, month, day).getDay();
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      
                      cells.push(
                        <div
                          key={day}
                          className={cn(
                            "h-20 border rounded p-1 text-xs overflow-hidden",
                            isToday ? "border-primary-500 bg-primary-50" : "border-slate-200",
                            dayOfWeek === 0 ? "bg-red-50" : dayOfWeek === 6 ? "bg-blue-50" : ""
                          )}
                        >
                          <div className={cn(
                            "font-medium mb-1",
                            dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-slate-700"
                          )}>
                            {day}
                          </div>
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="bg-primary-500 text-white px-1 py-0.5 rounded text-[10px] truncate mb-0.5 cursor-pointer hover:bg-primary-600"
                              title={shift.projectName || 'クリックで編集'}
                              onClick={() => openEditShift(shift)}
                            >
                              {shift.projectName ? `${shift.projectName} ` : ''}{shift.startTime}-{shift.endTime}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    return cells;
                  })()}
                </div>
              </div>
            )}

            {editingShift && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">シフトを編集</h3>
                    <button
                      onClick={() => {
                        setEditingShift(null);
                        setShiftForm({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, projectName: '', notes: '' });
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">日付 *</label>
                        <input
                          type="date"
                          className="input-field"
                          value={shiftForm.date}
                          onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">案件名</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="案件名を入力"
                          value={shiftForm.projectName}
                          onChange={(e) => setShiftForm({ ...shiftForm, projectName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">開始時間 *</label>
                        <input
                          type="time"
                          className="input-field"
                          value={shiftForm.startTime}
                          onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">終了時間 *</label>
                        <input
                          type="time"
                          className="input-field"
                          value={shiftForm.endTime}
                          onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">休憩(分)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={shiftForm.breakMinutes}
                          onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button onClick={handleUpdateShift} className="btn-primary flex items-center gap-2">
                        <Check size={16} />
                        保存
                      </button>
                      <button
                        onClick={() => handleDeleteShift(editingShift.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        削除
                      </button>
                      <button
                        onClick={() => {
                          setEditingShift(null);
                          setShiftForm({ date: '', startTime: '09:00', endTime: '18:00', breakMinutes: 60, projectName: '', notes: '' });
                        }}
                        className="btn-secondary"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
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
                  <div key={adv.id} className="p-4 flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">
                        申請額: ¥{Number(adv.amount).toLocaleString()}
                      </p>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span>手数料(5%): ¥{Number(adv.feeAmount || (Number(adv.amount) * 0.05)).toLocaleString()}</span>
                        <span className="font-medium text-green-700">
                          支払額: ¥{Number(adv.netAmount || (Number(adv.amount) * 0.95)).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{adv.reason || '-'}</p>
                      <p className="text-xs text-slate-400">
                        申請日: {format(new Date(adv.requestedAt), 'yyyy/MM/dd HH:mm')}
                      </p>
                      {adv.paidAt && (
                        <p className="text-xs text-green-600">
                          振込日: {format(new Date(adv.paidAt), 'yyyy/MM/dd')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canApprove && adv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateAdvanceStatus(adv.id, 'approved')}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 flex items-center gap-1"
                            title="承認"
                          >
                            <CheckCircle size={14} />
                            承認
                          </button>
                          <button
                            onClick={() => handleUpdateAdvanceStatus(adv.id, 'rejected')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 flex items-center gap-1"
                            title="却下"
                          >
                            <XCircle size={14} />
                            却下
                          </button>
                        </>
                      )}
                      {canApprove && adv.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateAdvanceStatus(adv.id, 'paid')}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 flex items-center gap-1"
                          title="振込済みにする"
                        >
                          <Banknote size={14} />
                          振込済み
                        </button>
                      )}
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab === 'tasks' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">タスク一覧</h2>
              <span className="text-sm text-slate-500">{staffTasks.length}件</span>
            </div>
            {staffTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                <p>割り当てられたタスクがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staffTasks.map((task) => (
                  <div key={task.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-800">{task.title}</h3>
                          {task.rewardAmount && parseFloat(task.rewardAmount) > 0 && (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              task.rewardApprovedAt ? "bg-green-100 text-green-700" : 
                              task.status === 'completed' ? "bg-yellow-100 text-yellow-700" : 
                              "bg-amber-100 text-amber-700"
                            )}>
                              ¥{parseInt(task.rewardAmount).toLocaleString()}
                              {task.rewardApprovedAt && " ✓承認済"}
                              {!task.rewardApprovedAt && task.status === 'completed' && " (承認待ち)"}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer",
                            task.status === 'completed' && "bg-green-100 text-green-700",
                            task.status === 'in_progress' && "bg-blue-100 text-blue-700",
                            task.status === 'pending' && "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          <option value="pending">未着手</option>
                          <option value="in_progress">進行中</option>
                          <option value="completed">完了</option>
                        </select>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          task.priority === 'high' && "bg-red-100 text-red-700",
                          task.priority === 'medium' && "bg-orange-100 text-orange-700",
                          task.priority === 'low' && "bg-slate-100 text-slate-700"
                        )}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span>作成日: {format(new Date(task.createdAt), 'yyyy/MM/dd')}</span>
                      {task.dueDate && (
                        <span>期限: {format(new Date(task.dueDate), 'yyyy/MM/dd')}</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">エビデンス</span>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowEvidenceForm(true);
                            fetchTaskEvidence(task.id);
                          }}
                          className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                        >
                          <Upload size={12} />
                          エビデンス提出
                        </button>
                      </div>
                      {taskEvidence[task.id]?.length > 0 && (
                        <div className="space-y-2">
                          {taskEvidence[task.id].map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between bg-slate-50 rounded p-2 text-xs">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-slate-400" />
                                <span>{ev.fileName || ev.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {ev.fileUrl && (
                                  <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600">
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                                <button onClick={() => handleDeleteEvidence(ev.id, task.id)} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showEvidenceForm && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">エビデンス提出</h2>
                <button onClick={() => { setShowEvidenceForm(false); setSelectedTask(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">タスク: {selectedTask.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ファイル</label>
                  <input
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                  <textarea
                    value={evidenceForm.description}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="エビデンスの説明を入力..."
                  />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
                <button onClick={() => { setShowEvidenceForm(false); setSelectedTask(null); }} className="btn-secondary">
                  キャンセル
                </button>
                <button onClick={handleSubmitEvidence} className="btn-primary">
                  提出
                </button>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'system' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">給与システム設定</h2>
              {employeeData && !editingSystem && (
                <button
                  onClick={() => {
                    setEditingSystem(true);
                    setSystemForm({
                      salary: employeeData.salary?.toString() || '',
                      hireDate: employeeData.hireDate || '',
                      employeeNumber: employeeData.employeeNumber || '',
                      bankName: employeeData.bankName || selectedStaff?.bankName || '',
                      bankBranch: employeeData.bankBranch || selectedStaff?.bankBranch || '',
                      bankAccountType: employeeData.bankAccountType || selectedStaff?.bankAccountType || '普通',
                      bankAccountNumber: employeeData.bankAccountNumber || selectedStaff?.bankAccountNumber || '',
                      bankAccountHolder: employeeData.bankAccountHolder || selectedStaff?.bankAccountHolder || '',
                      closingDay: (employeeData as any).closingDay || '末日',
                      paymentDay: (employeeData as any).paymentDay || '翌翌月5日',
                      paymentMethod: (employeeData as any).paymentMethod || '銀行振込',
                      transferFee: (employeeData as any).transferFee?.toString() || '330',
                      contractType: (employeeData as any).contractType || 'employee',
                      healthInsurance: (employeeData as any).healthInsurance?.toString() || '',
                      pensionInsurance: (employeeData as any).pensionInsurance?.toString() || '',
                      employmentInsurance: (employeeData as any).employmentInsurance?.toString() || '',
                      incomeTax: (employeeData as any).incomeTax?.toString() || '',
                      residentTax: (employeeData as any).residentTax?.toString() || '',
                      otherDeductions: (employeeData as any).otherDeductions?.toString() || '',
                      deduction1Name: (employeeData as any).deduction1Name || '',
                      deduction1Amount: (employeeData as any).deduction1Amount?.toString() || '',
                      deduction2Name: (employeeData as any).deduction2Name || '',
                      deduction2Amount: (employeeData as any).deduction2Amount?.toString() || '',
                      deduction3Name: (employeeData as any).deduction3Name || '',
                      deduction3Amount: (employeeData as any).deduction3Amount?.toString() || '',
                    });
                  }}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Edit size={16} />
                  編集
                </button>
              )}
            </div>
            <div className="p-5 space-y-6">
              {editingSystem ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <DollarSign size={18} className="text-primary-500" />
                        基本給与情報
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500">基本給（月）</label>
                          <input
                            type="number"
                            className="input-field text-sm"
                            value={systemForm.salary}
                            onChange={(e) => setSystemForm({ ...systemForm, salary: e.target.value })}
                            placeholder="例: 300000"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">入社日</label>
                          <input
                            type="date"
                            className="input-field text-sm"
                            value={systemForm.hireDate}
                            onChange={(e) => setSystemForm({ ...systemForm, hireDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">社員番号</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={systemForm.employeeNumber}
                            onChange={(e) => setSystemForm({ ...systemForm, employeeNumber: e.target.value })}
                            placeholder="例: EMP001"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <Building2 size={18} className="text-primary-500" />
                        契約・支払い情報
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500">契約タイプ</label>
                          <select
                            className="input-field text-sm"
                            value={systemForm.contractType}
                            onChange={(e) => setSystemForm({ ...systemForm, contractType: e.target.value })}
                          >
                            <option value="employee">正社員</option>
                            <option value="part_time">パート・アルバイト</option>
                            <option value="contractor">業務委託</option>
                            <option value="light_freight">軽貨物ドライバー</option>
                            <option value="freelance">フリーランス</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">締め日</label>
                          <select
                            className="input-field text-sm"
                            value={systemForm.closingDay}
                            onChange={(e) => setSystemForm({ ...systemForm, closingDay: e.target.value })}
                          >
                            <option value="末日">末日</option>
                            <option value="15日">15日</option>
                            <option value="20日">20日</option>
                            <option value="25日">25日</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">支払日</label>
                          <select
                            className="input-field text-sm"
                            value={systemForm.paymentDay}
                            onChange={(e) => setSystemForm({ ...systemForm, paymentDay: e.target.value })}
                          >
                            <option value="翌翌月5日">翌翌月5日</option>
                            <option value="翌翌月末日">翌翌月末日</option>
                            <option value="翌月25日">翌月25日</option>
                            <option value="翌月15日">翌月15日</option>
                            <option value="翌月末日">翌月末日</option>
                            <option value="当月25日">当月25日</option>
                            <option value="当月末日">当月末日</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">振込手数料</label>
                          <div className="flex gap-2 items-center">
                            <span className="text-slate-500">¥</span>
                            <input
                              type="number"
                              className="input-field text-sm"
                              value={systemForm.transferFee}
                              onChange={(e) => setSystemForm({ ...systemForm, transferFee: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">支払方法</label>
                          <select
                            className="input-field text-sm"
                            value={systemForm.paymentMethod}
                            onChange={(e) => setSystemForm({ ...systemForm, paymentMethod: e.target.value })}
                          >
                            <option value="銀行振込">銀行振込</option>
                            <option value="現金">現金</option>
                            <option value="小切手">小切手</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                      <DollarSign size={18} />
                      控除設定（月額）
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-orange-600">健康保険</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.healthInsurance}
                          onChange={(e) => setSystemForm({ ...systemForm, healthInsurance: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">厚生年金</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.pensionInsurance}
                          onChange={(e) => setSystemForm({ ...systemForm, pensionInsurance: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">雇用保険</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.employmentInsurance}
                          onChange={(e) => setSystemForm({ ...systemForm, employmentInsurance: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">所得税</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.incomeTax}
                          onChange={(e) => setSystemForm({ ...systemForm, incomeTax: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">住民税</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.residentTax}
                          onChange={(e) => setSystemForm({ ...systemForm, residentTax: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">その他控除</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={systemForm.otherDeductions}
                          onChange={(e) => setSystemForm({ ...systemForm, otherDeductions: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <h4 className="text-sm font-medium text-orange-700 mb-3">カスタム控除（名目編集可）</h4>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field text-sm flex-1"
                            value={systemForm.deduction1Name}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction1Name: e.target.value })}
                            placeholder="控除項目名1"
                          />
                          <input
                            type="number"
                            className="input-field text-sm w-32"
                            value={systemForm.deduction1Amount}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction1Amount: e.target.value })}
                            placeholder="金額"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field text-sm flex-1"
                            value={systemForm.deduction2Name}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction2Name: e.target.value })}
                            placeholder="控除項目名2"
                          />
                          <input
                            type="number"
                            className="input-field text-sm w-32"
                            value={systemForm.deduction2Amount}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction2Amount: e.target.value })}
                            placeholder="金額"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field text-sm flex-1"
                            value={systemForm.deduction3Name}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction3Name: e.target.value })}
                            placeholder="控除項目名3"
                          />
                          <input
                            type="number"
                            className="input-field text-sm w-32"
                            value={systemForm.deduction3Amount}
                            onChange={(e) => setSystemForm({ ...systemForm, deduction3Amount: e.target.value })}
                            placeholder="金額"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-orange-500 mt-2">
                      合計控除額: ¥{(
                        (parseFloat(systemForm.healthInsurance) || 0) +
                        (parseFloat(systemForm.pensionInsurance) || 0) +
                        (parseFloat(systemForm.employmentInsurance) || 0) +
                        (parseFloat(systemForm.incomeTax) || 0) +
                        (parseFloat(systemForm.residentTax) || 0) +
                        (parseFloat(systemForm.otherDeductions) || 0) +
                        (parseFloat(systemForm.deduction1Amount) || 0) +
                        (parseFloat(systemForm.deduction2Amount) || 0) +
                        (parseFloat(systemForm.deduction3Amount) || 0)
                      ).toLocaleString()}/月
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <CreditCard size={18} />
                      銀行口座情報
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-600">銀行名</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={systemForm.bankName}
                          onChange={(e) => setSystemForm({ ...systemForm, bankName: e.target.value })}
                          placeholder="例: 三菱UFJ銀行"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-blue-600">支店名</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={systemForm.bankBranch}
                          onChange={(e) => setSystemForm({ ...systemForm, bankBranch: e.target.value })}
                          placeholder="例: 渋谷支店"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-blue-600">口座種別</label>
                        <select
                          className="input-field text-sm"
                          value={systemForm.bankAccountType}
                          onChange={(e) => setSystemForm({ ...systemForm, bankAccountType: e.target.value })}
                        >
                          <option value="普通">普通</option>
                          <option value="当座">当座</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-blue-600">口座番号</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={systemForm.bankAccountNumber}
                          onChange={(e) => setSystemForm({ ...systemForm, bankAccountNumber: e.target.value })}
                          placeholder="例: 1234567"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-blue-600">口座名義</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={systemForm.bankAccountHolder}
                          onChange={(e) => setSystemForm({ ...systemForm, bankAccountHolder: e.target.value })}
                          placeholder="例: ヤマダ タロウ"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/employees/${employeeData.id}`, {
                            method: 'PATCH',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              salary: systemForm.salary ? parseFloat(systemForm.salary) : null,
                              hireDate: systemForm.hireDate || null,
                              employeeNumber: systemForm.employeeNumber || null,
                              bankName: systemForm.bankName || null,
                              bankBranch: systemForm.bankBranch || null,
                              bankAccountType: systemForm.bankAccountType || null,
                              bankAccountNumber: systemForm.bankAccountNumber || null,
                              bankAccountHolder: systemForm.bankAccountHolder || null,
                              closingDay: systemForm.closingDay || null,
                              paymentDay: systemForm.paymentDay || null,
                              paymentMethod: systemForm.paymentMethod || null,
                              healthInsurance: systemForm.healthInsurance ? parseFloat(systemForm.healthInsurance) : null,
                              pensionInsurance: systemForm.pensionInsurance ? parseFloat(systemForm.pensionInsurance) : null,
                              employmentInsurance: systemForm.employmentInsurance ? parseFloat(systemForm.employmentInsurance) : null,
                              incomeTax: systemForm.incomeTax ? parseFloat(systemForm.incomeTax) : null,
                              residentTax: systemForm.residentTax ? parseFloat(systemForm.residentTax) : null,
                              otherDeductions: systemForm.otherDeductions ? parseFloat(systemForm.otherDeductions) : null,
                              contractType: systemForm.contractType || 'employee',
                              deduction1Name: systemForm.deduction1Name || null,
                              deduction1Amount: systemForm.deduction1Amount ? parseFloat(systemForm.deduction1Amount) : null,
                              deduction2Name: systemForm.deduction2Name || null,
                              deduction2Amount: systemForm.deduction2Amount ? parseFloat(systemForm.deduction2Amount) : null,
                              deduction3Name: systemForm.deduction3Name || null,
                              deduction3Amount: systemForm.deduction3Amount ? parseFloat(systemForm.deduction3Amount) : null,
                            }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setEmployeeData(updated);
                            setEditingSystem(false);
                          }
                        } catch (err) {
                          console.error('Failed to update system settings:', err);
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingSystem(false)}
                      className="btn-secondary text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <DollarSign size={18} className="text-primary-500" />
                        基本給与情報
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">基本給</span>
                          <span className="font-medium text-slate-800">¥{Number(employeeData?.salary || 0).toLocaleString()}/月</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">入社日</span>
                          <span className="font-medium text-slate-800">{employeeData?.hireDate ? format(new Date(employeeData.hireDate), 'yyyy/MM/dd') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">社員番号</span>
                          <span className="font-medium text-slate-800">{employeeData?.employeeNumber || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <Building2 size={18} className="text-primary-500" />
                        支払い情報
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">契約タイプ</span>
                          <span className="font-medium text-slate-800">
                            {(employeeData as any)?.contractType === 'employee' ? '正社員' :
                             (employeeData as any)?.contractType === 'part_time' ? 'パート・アルバイト' :
                             (employeeData as any)?.contractType === 'contractor' ? '業務委託' :
                             (employeeData as any)?.contractType === 'light_freight' ? '軽貨物ドライバー' :
                             (employeeData as any)?.contractType === 'freelance' ? 'フリーランス' : '正社員'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">締め日</span>
                          <span className="font-medium text-slate-800">毎月{(employeeData as any)?.closingDay || '末日'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">支払日</span>
                          <span className="font-medium text-slate-800">{(employeeData as any)?.paymentDay || '翌翌月5日'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">振込手数料</span>
                          <span className="font-medium text-slate-800">¥{(employeeData as any)?.transferFee || '330'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">支払方法</span>
                          <span className="font-medium text-slate-800">{(employeeData as any)?.paymentMethod || '銀行振込'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                      <DollarSign size={18} />
                      控除設定（月額）
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-orange-600">健康保険</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.healthInsurance || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">厚生年金</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.pensionInsurance || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">雇用保険</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.employmentInsurance || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">所得税</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.incomeTax || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">住民税</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.residentTax || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">その他控除</span>
                        <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.otherDeductions || 0).toLocaleString()}</p>
                      </div>
                      {(employeeData as any)?.deduction1Name && (
                        <div>
                          <span className="text-orange-600">{(employeeData as any)?.deduction1Name}</span>
                          <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.deduction1Amount || 0).toLocaleString()}</p>
                        </div>
                      )}
                      {(employeeData as any)?.deduction2Name && (
                        <div>
                          <span className="text-orange-600">{(employeeData as any)?.deduction2Name}</span>
                          <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.deduction2Amount || 0).toLocaleString()}</p>
                        </div>
                      )}
                      {(employeeData as any)?.deduction3Name && (
                        <div>
                          <span className="text-orange-600">{(employeeData as any)?.deduction3Name}</span>
                          <p className="font-medium text-orange-900">¥{Number((employeeData as any)?.deduction3Amount || 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600 font-medium">合計控除額</span>
                        <span className="font-bold text-orange-800">¥{(
                          Number((employeeData as any)?.healthInsurance || 0) +
                          Number((employeeData as any)?.pensionInsurance || 0) +
                          Number((employeeData as any)?.employmentInsurance || 0) +
                          Number((employeeData as any)?.incomeTax || 0) +
                          Number((employeeData as any)?.residentTax || 0) +
                          Number((employeeData as any)?.otherDeductions || 0) +
                          Number((employeeData as any)?.deduction1Amount || 0) +
                          Number((employeeData as any)?.deduction2Amount || 0) +
                          Number((employeeData as any)?.deduction3Amount || 0)
                        ).toLocaleString()}/月</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <CreditCard size={18} />
                      銀行口座情報
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600">銀行名</span>
                        <p className="font-medium text-blue-900">{employeeData?.bankName || selectedStaff?.bankName || '-'}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">支店名</span>
                        <p className="font-medium text-blue-900">{employeeData?.bankBranch || selectedStaff?.bankBranch || '-'}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">口座種別</span>
                        <p className="font-medium text-blue-900">{employeeData?.bankAccountType || selectedStaff?.bankAccountType || '-'}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">口座番号</span>
                        <p className="font-medium text-blue-900">{employeeData?.bankAccountNumber || selectedStaff?.bankAccountNumber || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-600">口座名義</span>
                        <p className="font-medium text-blue-900">{employeeData?.bankAccountHolder || selectedStaff?.bankAccountHolder || '-'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium text-slate-800 mb-3">給与履歴サマリー</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500">支払済み月数</p>
                    <p className="text-xl font-bold text-slate-800">{salaries.filter(s => s.paidAt).length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">総支給額</p>
                    <p className="text-xl font-bold text-green-600">¥{salaries.reduce((sum, s) => sum + Number(s.netSalary || 0), 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">平均月給</p>
                    <p className="text-xl font-bold text-slate-800">¥{salaries.length > 0 ? Math.round(salaries.reduce((sum, s) => sum + Number(s.netSalary || 0), 0) / salaries.length).toLocaleString() : 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'memo' && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">メモ</h2>
              {employeeData && (
                <button onClick={() => setShowMemoForm(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={16} />
                  メモ追加
                </button>
              )}
            </div>
            {showMemoForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500">カテゴリ</label>
                    <select
                      className="input-field text-sm"
                      value={memoForm.category}
                      onChange={(e) => setMemoForm({ ...memoForm, category: e.target.value })}
                    >
                      <option value="general">一般</option>
                      <option value="performance">パフォーマンス</option>
                      <option value="feedback">フィードバック</option>
                      <option value="goal">目標</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">内容 *</label>
                    <textarea
                      className="input-field text-sm"
                      rows={3}
                      placeholder="メモを入力..."
                      value={memoForm.content}
                      onChange={(e) => setMemoForm({ ...memoForm, content: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddMemo} className="btn-primary text-sm">保存</button>
                  <button onClick={() => setShowMemoForm(false)} className="btn-secondary text-sm">キャンセル</button>
                </div>
              </div>
            )}
            {staffMemos.length === 0 && !showMemoForm ? (
              <div className="p-8 text-center text-slate-400">
                <StickyNote size={32} className="mx-auto mb-2 opacity-50" />
                <p>メモがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staffMemos.map((memo) => (
                  <div key={memo.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            memo.category === 'performance' && "bg-blue-100 text-blue-700",
                            memo.category === 'feedback' && "bg-green-100 text-green-700",
                            memo.category === 'goal' && "bg-purple-100 text-purple-700",
                            memo.category === 'general' && "bg-slate-100 text-slate-700",
                            memo.category === 'other' && "bg-orange-100 text-orange-700"
                          )}>
                            {memo.category === 'performance' ? 'パフォーマンス' :
                             memo.category === 'feedback' ? 'フィードバック' :
                             memo.category === 'goal' ? '目標' :
                             memo.category === 'other' ? 'その他' : '一般'}
                          </span>
                          <span className="text-xs text-slate-400">{format(new Date(memo.createdAt), 'yyyy/MM/dd HH:mm')}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{memo.content}</p>
                      </div>
                      <button onClick={() => handleDeleteMemo(memo.id)} className="text-red-500 hover:text-red-600 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        {user?.role !== 'staff' && (
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
        )}
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
            <div key={s.id} className="card p-4 hover:shadow-lg transition-shadow relative">
              {pendingAdvanceCounts[s.id] > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {pendingAdvanceCounts[s.id]}
                </div>
              )}
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
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {s.isActive ? '有効' : '無効'}
                  </span>
                  {pendingAdvanceCounts[s.id] > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                      <CreditCard size={10} />
                      前払い申請中
                    </span>
                  )}
                </div>
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
                  詳細を見る
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
