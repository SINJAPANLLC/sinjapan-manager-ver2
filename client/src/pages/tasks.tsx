import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, X, Sparkles, Loader2, Target, Users2, Expand, ShieldAlert, Workflow, Briefcase, Network } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  businessId?: number;
  dueDate?: string;
  assignedTo?: number;
  createdBy?: number;
  customerId?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
}

interface Business {
  id: number;
  name: string;
  description?: string;
  status: string;
}

interface Employee {
  id: number;
  userId?: number;
  employeeNumber?: string;
  user?: {
    id: number;
    name: string;
    role: string;
    department?: string;
    position?: string;
  };
}

const categories = [
  { id: 'direct', label: '直結', icon: Target, color: 'from-red-500 to-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  { id: 'organization', label: '組織', icon: Users2, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { id: 'expansion', label: '拡張', icon: Expand, color: 'from-green-500 to-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  { id: 'risk', label: 'リスク', icon: ShieldAlert, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { id: 'workflow', label: 'ワークフロー', icon: Workflow, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
];

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('direct');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusinessId, setAiBusinessId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<{title: string; description: string; priority: string}[]>([]);
  const [diagramView, setDiagramView] = useState<'workflow' | 'orgchart'>('workflow');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    category: 'direct',
    businessId: '',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchBusinesses();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/chat/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      setBusinesses(await res.json());
    }
  };

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    if (res.ok) {
      setEmployees(await res.json());
    }
  };

  const workflowNodes: Node[] = useMemo(() => {
    const workflowTasks = tasks.filter(t => t.category === 'workflow');
    const pendingTasks = workflowTasks.filter(t => t.status === 'pending');
    const inProgressTasks = workflowTasks.filter(t => t.status === 'in_progress');
    const completedTasks = workflowTasks.filter(t => t.status === 'completed');
    
    const nodes: Node[] = [
      {
        id: 'start',
        type: 'input',
        data: { label: '開始' },
        position: { x: 250, y: 0 },
        style: { background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 'bold' },
      },
      {
        id: 'pending-group',
        data: { label: `未着手 (${pendingTasks.length})` },
        position: { x: 50, y: 100 },
        style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '10px 20px', minWidth: '150px' },
      },
      {
        id: 'progress-group',
        data: { label: `進行中 (${inProgressTasks.length})` },
        position: { x: 250, y: 100 },
        style: { background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '12px', padding: '10px 20px', minWidth: '150px' },
      },
      {
        id: 'complete-group',
        data: { label: `完了 (${completedTasks.length})` },
        position: { x: 450, y: 100 },
        style: { background: '#d1fae5', border: '2px solid #10b981', borderRadius: '12px', padding: '10px 20px', minWidth: '150px' },
      },
      {
        id: 'end',
        type: 'output',
        data: { label: '完了' },
        position: { x: 250, y: 220 },
        style: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 'bold' },
      },
    ];
    
    return nodes;
  }, [tasks]);

  const workflowEdges: Edge[] = useMemo(() => {
    return [
      { id: 'e-start-pending', source: 'start', target: 'pending-group', animated: true, style: { stroke: '#8b5cf6' } },
      { id: 'e-start-progress', source: 'start', target: 'progress-group', animated: true, style: { stroke: '#8b5cf6' } },
      { id: 'e-pending-progress', source: 'pending-group', target: 'progress-group', animated: true, style: { stroke: '#f59e0b' } },
      { id: 'e-progress-complete', source: 'progress-group', target: 'complete-group', animated: true, style: { stroke: '#3b82f6' } },
      { id: 'e-complete-end', source: 'complete-group', target: 'end', animated: true, style: { stroke: '#10b981' } },
    ];
  }, []);

  const orgChartNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    const admins = employees.filter(e => e.user?.role === 'admin' || e.user?.role === 'ceo');
    const managers = employees.filter(e => e.user?.role === 'manager');
    const staff = employees.filter(e => e.user?.role === 'staff');
    const agencies = employees.filter(e => e.user?.role === 'agency');
    
    nodes.push({
      id: 'company',
      type: 'input',
      data: { label: '会社' },
      position: { x: 300, y: 0 },
      style: { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', borderRadius: '16px', padding: '15px 30px', fontWeight: 'bold', fontSize: '16px' },
    });

    let xOffset = 0;
    const yLevel1 = 100;
    const nodeWidth = 180;
    const gap = 30;
    
    admins.forEach((emp, idx) => {
      nodes.push({
        id: `admin-${emp.id}`,
        data: { label: `${emp.user?.name || '管理者'}\n${emp.user?.position || 'Admin/CEO'}` },
        position: { x: 200 + idx * (nodeWidth + gap), y: yLevel1 },
        style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '10px 15px', minWidth: '150px', textAlign: 'center', whiteSpace: 'pre-line' },
      });
    });

    const yLevel2 = 220;
    managers.forEach((emp, idx) => {
      nodes.push({
        id: `manager-${emp.id}`,
        data: { label: `${emp.user?.name || 'マネージャー'}\n${emp.user?.department || ''} ${emp.user?.position || 'Manager'}` },
        position: { x: 100 + idx * (nodeWidth + gap), y: yLevel2 },
        style: { background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '12px', padding: '10px 15px', minWidth: '150px', textAlign: 'center', whiteSpace: 'pre-line' },
      });
    });

    const yLevel3 = 340;
    staff.forEach((emp, idx) => {
      nodes.push({
        id: `staff-${emp.id}`,
        data: { label: `${emp.user?.name || 'スタッフ'}\n${emp.user?.department || ''} ${emp.user?.position || 'Staff'}` },
        position: { x: 50 + idx * (nodeWidth + gap), y: yLevel3 },
        style: { background: '#d1fae5', border: '2px solid #10b981', borderRadius: '12px', padding: '10px 15px', minWidth: '140px', textAlign: 'center', whiteSpace: 'pre-line' },
      });
    });

    agencies.forEach((emp, idx) => {
      nodes.push({
        id: `agency-${emp.id}`,
        data: { label: `${emp.user?.name || '代理店'}\n${emp.user?.position || 'Agency'}` },
        position: { x: 400 + idx * (nodeWidth + gap), y: yLevel3 },
        style: { background: '#fae8ff', border: '2px solid #a855f7', borderRadius: '12px', padding: '10px 15px', minWidth: '140px', textAlign: 'center', whiteSpace: 'pre-line' },
      });
    });

    if (nodes.length === 1) {
      nodes.push(
        { id: 'placeholder-ceo', data: { label: 'CEO\n（未登録）' }, position: { x: 300, y: yLevel1 }, style: { background: '#f1f5f9', border: '2px dashed #94a3b8', borderRadius: '12px', padding: '10px 15px', minWidth: '150px', textAlign: 'center', whiteSpace: 'pre-line', color: '#64748b' } },
        { id: 'placeholder-manager', data: { label: 'マネージャー\n（未登録）' }, position: { x: 200, y: yLevel2 }, style: { background: '#f1f5f9', border: '2px dashed #94a3b8', borderRadius: '12px', padding: '10px 15px', minWidth: '150px', textAlign: 'center', whiteSpace: 'pre-line', color: '#64748b' } },
        { id: 'placeholder-staff', data: { label: 'スタッフ\n（未登録）' }, position: { x: 150, y: yLevel3 }, style: { background: '#f1f5f9', border: '2px dashed #94a3b8', borderRadius: '12px', padding: '10px 15px', minWidth: '140px', textAlign: 'center', whiteSpace: 'pre-line', color: '#64748b' } },
      );
    }
    
    return nodes;
  }, [employees]);

  const orgChartEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    const admins = employees.filter(e => e.user?.role === 'admin' || e.user?.role === 'ceo');
    const managers = employees.filter(e => e.user?.role === 'manager');
    const staff = employees.filter(e => e.user?.role === 'staff');
    const agencies = employees.filter(e => e.user?.role === 'agency');

    admins.forEach((emp) => {
      edges.push({ id: `e-company-admin-${emp.id}`, source: 'company', target: `admin-${emp.id}`, style: { stroke: '#f59e0b' } });
    });

    managers.forEach((emp) => {
      if (admins.length > 0) {
        edges.push({ id: `e-admin-manager-${emp.id}`, source: `admin-${admins[0].id}`, target: `manager-${emp.id}`, style: { stroke: '#3b82f6' } });
      } else {
        edges.push({ id: `e-company-manager-${emp.id}`, source: 'company', target: `manager-${emp.id}`, style: { stroke: '#3b82f6' } });
      }
    });

    staff.forEach((emp) => {
      if (managers.length > 0) {
        edges.push({ id: `e-manager-staff-${emp.id}`, source: `manager-${managers[0].id}`, target: `staff-${emp.id}`, style: { stroke: '#10b981' } });
      } else if (admins.length > 0) {
        edges.push({ id: `e-admin-staff-${emp.id}`, source: `admin-${admins[0].id}`, target: `staff-${emp.id}`, style: { stroke: '#10b981' } });
      }
    });

    agencies.forEach((emp) => {
      if (managers.length > 0) {
        edges.push({ id: `e-manager-agency-${emp.id}`, source: `manager-${managers[0].id}`, target: `agency-${emp.id}`, style: { stroke: '#a855f7' } });
      } else if (admins.length > 0) {
        edges.push({ id: `e-admin-agency-${emp.id}`, source: `admin-${admins[0].id}`, target: `agency-${emp.id}`, style: { stroke: '#a855f7' } });
      }
    });

    if (edges.length === 0) {
      edges.push(
        { id: 'e-company-ceo', source: 'company', target: 'placeholder-ceo', style: { stroke: '#94a3b8', strokeDasharray: '5,5' } },
        { id: 'e-ceo-manager', source: 'placeholder-ceo', target: 'placeholder-manager', style: { stroke: '#94a3b8', strokeDasharray: '5,5' } },
        { id: 'e-manager-staff', source: 'placeholder-manager', target: 'placeholder-staff', style: { stroke: '#94a3b8', strokeDasharray: '5,5' } },
      );
    }
    
    return edges;
  }, [employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        businessId: formData.businessId ? parseInt(formData.businessId) : null,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      }),
    });
    
    if (res.ok) {
      fetchTasks();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このタスクを削除しますか？')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const generateTasksWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedTasks([]);
    
    try {
      const businessName = aiBusinessId ? businesses.find(b => b.id === parseInt(aiBusinessId))?.name : null;
      const res = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt, 
          category: selectedCategory,
          businessName: businessName
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('AI task generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addGeneratedTask = async (task: {title: string; description: string; priority: string}) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: selectedCategory,
        businessId: aiBusinessId ? parseInt(aiBusinessId) : null,
        status: 'pending',
      }),
    });
    
    if (res.ok) {
      fetchTasks();
      setGeneratedTasks(prev => prev.filter(t => t.title !== task.title));
    }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category || 'direct',
        businessId: task.businessId?.toString() || '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        assignedTo: task.assignedTo?.toString() || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        category: selectedCategory,
        businessId: '',
        dueDate: '',
        assignedTo: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-600" size={16} />;
      case 'in_progress':
        return <Clock className="text-primary-600" size={16} />;
      default:
        return <AlertCircle className="text-amber-600" size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '未着手',
      in_progress: '進行中',
      completed: '完了',
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'medium':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  };

  const getBusinessName = (businessId?: number) => {
    if (!businessId) return null;
    return businesses.find(b => b.id === businessId)?.name;
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const filteredTasks = tasks.filter(t => (t.category || 'direct') === selectedCategory);
  const isWorkflowCategory = selectedCategory === 'workflow';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">タスク管理</h1>
          <p className="text-slate-500 text-sm mt-1">カテゴリ別タスクの管理とAI生成</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-button"
          >
            <Sparkles size={18} />
            AI生成
          </button>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            新規タスク
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          const count = tasks.filter(t => (t.category || 'direct') === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-button`
                  : `${cat.bg} ${cat.text} ${cat.border} border hover:opacity-80`
              )}
            >
              <Icon size={18} />
              {cat.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                isActive ? "bg-white/20" : "bg-white"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isWorkflowCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cn(
            "rounded-2xl border-2 p-6",
            currentCategory?.bg,
            currentCategory?.border
          )}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['pending', 'in_progress', 'completed'].map((status) => (
                <div key={status} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                    {getStatusIcon(status)}
                    <span className="font-semibold text-slate-700">{getStatusLabel(status)}</span>
                    <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs text-slate-600">
                      {filteredTasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 min-h-[120px] max-h-[300px] overflow-y-auto">
                    {filteredTasks
                      .filter((t) => t.status === status)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-white rounded-lg border border-slate-100 shadow-soft hover:shadow-card transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <h3 className="font-medium text-slate-800 text-sm">{task.title}</h3>
                            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getPriorityBadge(task.priority))}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white"
                            >
                              <option value="pending">未着手</option>
                              <option value="in_progress">進行中</option>
                              <option value="completed">完了</option>
                            </select>
                            <div className="flex gap-1">
                              <button onClick={() => openModal(task)} className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDelete(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredTasks.filter((t) => t.status === status).length === 0 && (
                      <div className="flex items-center justify-center h-16 text-slate-400 text-sm">
                        タスクなし
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setDiagramView('workflow')}
                className={cn(
                  "flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors",
                  diagramView === 'workflow' ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Workflow size={18} />
                ワークフロー図
              </button>
              <button
                onClick={() => setDiagramView('orgchart')}
                className={cn(
                  "flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors",
                  diagramView === 'orgchart' ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Network size={18} />
                組織図
              </button>
            </div>
            <div className="h-[400px]">
              {diagramView === 'workflow' ? (
                <ReactFlow
                  nodes={workflowNodes}
                  edges={workflowEdges}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Controls />
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
              ) : (
                <ReactFlow
                  nodes={orgChartNodes}
                  edges={orgChartEdges}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Controls />
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
              )}
            </div>
          </div>
        </div>
      )}

      {!isWorkflowCategory && (
        <div className={cn(
          "rounded-2xl border-2 p-6",
          currentCategory?.bg,
          currentCategory?.border
        )}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['pending', 'in_progress', 'completed'].map((status) => (
              <div key={status} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  {getStatusIcon(status)}
                  <span className="font-semibold text-slate-700">{getStatusLabel(status)}</span>
                  <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs text-slate-600">
                    {filteredTasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <div className="p-3 space-y-2 min-h-[150px] max-h-[400px] overflow-y-auto">
                  {filteredTasks
                    .filter((t) => t.status === status)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-white rounded-lg border border-slate-100 shadow-soft hover:shadow-card transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-medium text-slate-800 text-sm">{task.title}</h3>
                          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getPriorityBadge(task.priority))}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        {getBusinessName(task.businessId) && (
                          <p className="text-xs text-primary-600 mb-2 flex items-center gap-1">
                            <Briefcase size={10} />
                            {getBusinessName(task.businessId)}
                          </p>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(task.dueDate), 'yyyy/MM/dd')}
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white"
                          >
                            <option value="pending">未着手</option>
                            <option value="in_progress">進行中</option>
                            <option value="completed">完了</option>
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openModal(task)}
                              className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {filteredTasks.filter((t) => t.status === status).length === 0 && (
                    <div className="flex items-center justify-center h-20 text-slate-400 text-sm">
                      タスクなし
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTask ? 'タスクを編集' : '新規タスク'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Briefcase size={14} className="inline mr-1" />
                  事業
                </label>
                <select
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  className="input-field"
                >
                  <option value="">事業を選択</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {businesses.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">事業ページで事業を追加してください</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">カテゴリ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">優先度</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">期限</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">担当者</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="input-field"
                  >
                    <option value="">未割り当て</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAIModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">AIタスク生成</h2>
              </div>
              <button 
                onClick={() => { setIsAIModalOpen(false); setGeneratedTasks([]); setAiPrompt(''); setAiBusinessId(''); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Briefcase size={14} className="inline mr-1" />
                  事業を選択
                </label>
                <select
                  value={aiBusinessId}
                  onChange={(e) => setAiBusinessId(e.target.value)}
                  className="input-field"
                >
                  <option value="">事業を選択（任意）</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  どのようなタスクを生成しますか？
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="例: 新規プロジェクトの立ち上げに必要なタスク、顧客対応の改善タスク..."
                  className="input-field resize-none"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>カテゴリ:</span>
                <span className={cn(
                  "px-2 py-1 rounded-lg font-medium",
                  currentCategory?.bg,
                  currentCategory?.text
                )}>
                  {currentCategory?.label}
                </span>
              </div>
              <button
                onClick={generateTasksWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    タスクを生成
                  </>
                )}
              </button>

              {generatedTasks.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700">生成されたタスク:</p>
                  {generatedTasks.map((task, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-slate-800">{task.title}</h4>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getPriorityBadge(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                      <button
                        onClick={() => addGeneratedTask(task)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Plus size={14} />
                        タスクに追加
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
