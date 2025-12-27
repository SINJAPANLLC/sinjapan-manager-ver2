import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Headphones, 
  Plus, 
  Search, 
  Receipt, 
  TrendingUp, 
  Edit, 
  Trash2, 
  X,
  ClipboardList,
  GitBranch,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';

type TabId = 'tasks' | 'workflows' | 'assignments' | 'invoices' | 'sales';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'tasks', label: '業務一覧', icon: <ClipboardList size={16} /> },
  { id: 'workflows', label: '業務フロー', icon: <GitBranch size={16} /> },
  { id: 'assignments', label: 'アサイン', icon: <UserCheck size={16} /> },
  { id: 'invoices', label: '請求', icon: <Receipt size={16} /> },
  { id: 'sales', label: '売上', icon: <TrendingUp size={16} /> },
];

const fetchApi = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('データの取得に失敗しました');
  return res.json();
};

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function TasksTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['/api/bpo/tasks'], queryFn: () => fetchApi('/api/bpo/tasks') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bpo/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/tasks'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/bpo/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/tasks'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bpo/tasks/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/bpo/tasks'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredTasks = tasks.filter((t: any) => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { active: '進行中', paused: '一時停止', completed: '完了', cancelled: 'キャンセル' };
  const typeLabels: Record<string, string> = { regular: '通常', onetime: '単発', recurring: '定期' };
  const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="業務名・クライアント名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="active">進行中</option>
          <option value="paused">一時停止</option>
          <option value="completed">完了</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> 業務追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">業務名</th>
              <th className="text-left p-3 font-medium">クライアント</th>
              <th className="text-left p-3 font-medium">カテゴリ</th>
              <th className="text-left p-3 font-medium">種別</th>
              <th className="text-left p-3 font-medium">優先度</th>
              <th className="text-left p-3 font-medium">単価</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredTasks.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3">{item.clientName || '-'}</td>
                  <td className="p-3">{item.category || '-'}</td>
                  <td className="p-3">{typeLabels[item.type] || item.type}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.priority === 'urgent' ? 'bg-red-100 text-red-700' : item.priority === 'high' ? 'bg-orange-100 text-orange-700' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>{priorityLabels[item.priority] || item.priority}</span></td>
                  <td className="p-3">{item.unitPrice ? `¥${Number(item.unitPrice).toLocaleString()}` : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : item.status === 'completed' ? 'bg-blue-100 text-blue-700' : item.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('削除しますか？')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '業務編集' : '業務追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">業務名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">クライアント名</label><input name="clientName" defaultValue={editingItem?.clientName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">カテゴリ</label><input name="category" defaultValue={editingItem?.category} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">種別</label><select name="type" defaultValue={editingItem?.type || 'regular'} className="w-full px-3 py-2 border rounded-lg">
              <option value="regular">通常</option><option value="onetime">単発</option><option value="recurring">定期</option>
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'active'} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">進行中</option><option value="paused">一時停止</option><option value="completed">完了</option><option value="cancelled">キャンセル</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">優先度</label><select name="priority" defaultValue={editingItem?.priority || 'medium'} className="w-full px-3 py-2 border rounded-lg">
              <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">緊急</option>
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">単価</label><input name="unitPrice" type="number" defaultValue={editingItem?.unitPrice} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">見積時間</label><input name="estimatedHours" type="number" step="0.5" defaultValue={editingItem?.estimatedHours} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function WorkflowsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({ queryKey: ['/api/bpo/workflows'], queryFn: () => fetchApi('/api/bpo/workflows') });
  const { data: tasks = [] } = useQuery({ queryKey: ['/api/bpo/tasks'], queryFn: () => fetchApi('/api/bpo/tasks') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bpo/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/workflows'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/bpo/workflows/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/workflows'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bpo/workflows/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/bpo/workflows'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.taskId) data.taskId = parseInt(data.taskId);
    if (data.stepNumber) data.stepNumber = parseInt(data.stepNumber);
    if (data.estimatedMinutes) data.estimatedMinutes = parseInt(data.estimatedMinutes);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredWorkflows = workflows.filter((w: any) => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || w.stepName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusLabels: Record<string, string> = { pending: '未着手', in_progress: '進行中', completed: '完了', skipped: 'スキップ' };
  const getTaskName = (id: number) => tasks.find((t: any) => t.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="フロー名・ステップ名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> フロー追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">フロー名</th>
              <th className="text-left p-3 font-medium">業務</th>
              <th className="text-left p-3 font-medium">ステップNo</th>
              <th className="text-left p-3 font-medium">ステップ名</th>
              <th className="text-left p-3 font-medium">所要時間</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredWorkflows.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3">{item.taskId ? getTaskName(item.taskId) : '-'}</td>
                  <td className="p-3">{item.stepNumber}</td>
                  <td className="p-3">{item.stepName}</td>
                  <td className="p-3">{item.estimatedMinutes ? `${item.estimatedMinutes}分` : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('削除しますか？')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWorkflows.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'フロー編集' : 'フロー追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">フロー名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">業務</label><select name="taskId" defaultValue={editingItem?.taskId || ''} className="w-full px-3 py-2 border rounded-lg">
            <option value="">選択してください</option>
            {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">ステップNo *</label><input name="stepNumber" type="number" defaultValue={editingItem?.stepNumber || 1} required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">所要時間 (分)</label><input name="estimatedMinutes" type="number" defaultValue={editingItem?.estimatedMinutes} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">ステップ名 *</label><input name="stepName" defaultValue={editingItem?.stepName} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ステップ説明</label><textarea name="stepDescription" defaultValue={editingItem?.stepDescription} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'pending'} className="w-full px-3 py-2 border rounded-lg">
            <option value="pending">未着手</option><option value="in_progress">進行中</option><option value="completed">完了</option><option value="skipped">スキップ</option>
          </select></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function AssignmentsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({ queryKey: ['/api/bpo/assignments'], queryFn: () => fetchApi('/api/bpo/assignments') });
  const { data: tasks = [] } = useQuery({ queryKey: ['/api/bpo/tasks'], queryFn: () => fetchApi('/api/bpo/tasks') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bpo/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/assignments'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/bpo/assignments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/assignments'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bpo/assignments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/bpo/assignments'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.taskId) data.taskId = parseInt(data.taskId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredAssignments = assignments.filter((a: any) => {
    const matchesSearch = a.assigneeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { assigned: 'アサイン済', in_progress: '進行中', completed: '完了', cancelled: 'キャンセル' };
  const getTaskName = (id: number) => tasks.find((t: any) => t.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="担当者名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="assigned">アサイン済</option>
          <option value="in_progress">進行中</option>
          <option value="completed">完了</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> アサイン追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">業務</th>
              <th className="text-left p-3 font-medium">担当者</th>
              <th className="text-left p-3 font-medium">役割</th>
              <th className="text-left p-3 font-medium">開始日</th>
              <th className="text-left p-3 font-medium">終了日</th>
              <th className="text-left p-3 font-medium">稼働時間</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredAssignments.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{item.taskId ? getTaskName(item.taskId) : '-'}</td>
                  <td className="p-3 font-medium">{item.assigneeName || '-'}</td>
                  <td className="p-3">{item.role || '-'}</td>
                  <td className="p-3">{item.startDate ? format(new Date(item.startDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3">{item.endDate ? format(new Date(item.endDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3">{item.hoursWorked ? `${Number(item.hoursWorked).toFixed(1)}h` : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('削除しますか？')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssignments.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'アサイン編集' : 'アサイン追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">業務</label><select name="taskId" defaultValue={editingItem?.taskId || ''} className="w-full px-3 py-2 border rounded-lg">
            <option value="">選択してください</option>
            {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium mb-1">担当者名 *</label><input name="assigneeName" defaultValue={editingItem?.assigneeName} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">役割</label><input name="role" defaultValue={editingItem?.role} placeholder="例: リーダー、メンバー" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">開始日</label><input name="startDate" type="date" defaultValue={editingItem?.startDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">終了日</label><input name="endDate" type="date" defaultValue={editingItem?.endDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">稼働時間</label><input name="hoursWorked" type="number" step="0.5" defaultValue={editingItem?.hoursWorked} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'assigned'} className="w-full px-3 py-2 border rounded-lg">
              <option value="assigned">アサイン済</option><option value="in_progress">進行中</option><option value="completed">完了</option><option value="cancelled">キャンセル</option>
            </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function InvoicesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['/api/bpo/invoices'], queryFn: () => fetchApi('/api/bpo/invoices') });
  const { data: tasks = [] } = useQuery({ queryKey: ['/api/bpo/tasks'], queryFn: () => fetchApi('/api/bpo/tasks') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bpo/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/bpo/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bpo/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/bpo/invoices'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.taskId) data.taskId = parseInt(data.taskId);
    const amount = parseFloat(data.amount) || 0;
    const tax = parseFloat(data.tax) || 0;
    data.totalAmount = (amount + tax).toString();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { draft: '下書き', sent: '送付済み', paid: '入金済み', overdue: '期限超過', cancelled: 'キャンセル' };
  const getTaskName = (id: number) => tasks.find((t: any) => t.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="請求書番号・クライアント名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="draft">下書き</option>
          <option value="sent">送付済み</option>
          <option value="paid">入金済み</option>
          <option value="overdue">期限超過</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> 請求書追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">請求書番号</th>
              <th className="text-left p-3 font-medium">クライアント</th>
              <th className="text-left p-3 font-medium">業務</th>
              <th className="text-left p-3 font-medium">金額</th>
              <th className="text-left p-3 font-medium">発行日</th>
              <th className="text-left p-3 font-medium">支払期限</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredInvoices.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{item.invoiceNumber}</td>
                  <td className="p-3">{item.clientName || '-'}</td>
                  <td className="p-3">{item.taskId ? getTaskName(item.taskId) : '-'}</td>
                  <td className="p-3">¥{Number(item.totalAmount).toLocaleString()}</td>
                  <td className="p-3">{item.issueDate ? format(new Date(item.issueDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3">{item.dueDate ? format(new Date(item.dueDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'paid' ? 'bg-green-100 text-green-700' : item.status === 'sent' ? 'bg-blue-100 text-blue-700' : item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('削除しますか？')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '請求書編集' : '請求書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">請求書番号 *</label><input name="invoiceNumber" defaultValue={editingItem?.invoiceNumber} required placeholder="例: BPO-2024-001" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">クライアント名</label><input name="clientName" defaultValue={editingItem?.clientName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">業務</label><select name="taskId" defaultValue={editingItem?.taskId || ''} className="w-full px-3 py-2 border rounded-lg">
            <option value="">選択してください</option>
            {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">金額 (税抜) *</label><input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">消費税</label><input name="tax" type="number" defaultValue={editingItem?.tax || 0} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">発行日</label><input name="issueDate" type="date" defaultValue={editingItem?.issueDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">支払期限</label><input name="dueDate" type="date" defaultValue={editingItem?.dueDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'draft'} className="w-full px-3 py-2 border rounded-lg">
            <option value="draft">下書き</option><option value="sent">送付済み</option><option value="paid">入金済み</option><option value="overdue">期限超過</option><option value="cancelled">キャンセル</option>
          </select></div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function SalesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({ queryKey: ['/api/bpo/sales'], queryFn: () => fetchApi('/api/bpo/sales') });
  const { data: summary = { totalSales: 0, taskCount: 0, monthlyRevenue: 0 } } = useQuery({ queryKey: ['/api/bpo/sales/summary'], queryFn: () => fetchApi('/api/bpo/sales/summary') });
  const { data: tasks = [] } = useQuery({ queryKey: ['/api/bpo/tasks'], queryFn: () => fetchApi('/api/bpo/tasks') });
  const { data: invoices = [] } = useQuery({ queryKey: ['/api/bpo/invoices'], queryFn: () => fetchApi('/api/bpo/invoices') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bpo/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/bpo/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bpo/sales/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/bpo/sales/summary'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.taskId) data.taskId = parseInt(data.taskId);
    if (data.invoiceId) data.invoiceId = parseInt(data.invoiceId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredSales = sales.filter((s: any) => {
    const matchesSearch = s.description?.toLowerCase().includes(searchTerm.toLowerCase()) || s.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeLabels: Record<string, string> = { service: 'サービス', project: 'プロジェクト', recurring: '定期' };
  const getTaskName = (id: number) => tasks.find((t: any) => t.id === id)?.name || '-';

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-80">総売上</div>
          <div className="text-2xl font-bold">¥{Number(summary.totalSales).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-80">今月の売上</div>
          <div className="text-2xl font-bold">¥{Number(summary.monthlyRevenue).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-80">取引件数</div>
          <div className="text-2xl font-bold">{summary.taskCount}件</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="説明・クライアント名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全タイプ</option>
          <option value="service">サービス</option>
          <option value="project">プロジェクト</option>
          <option value="recurring">定期</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> 売上追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">売上日</th>
              <th className="text-left p-3 font-medium">タイプ</th>
              <th className="text-left p-3 font-medium">クライアント</th>
              <th className="text-left p-3 font-medium">業務</th>
              <th className="text-left p-3 font-medium">金額</th>
              <th className="text-left p-3 font-medium">説明</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredSales.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{item.saleDate ? format(new Date(item.saleDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3"><span className="px-2 py-1 text-xs bg-slate-100 rounded-full">{typeLabels[item.type] || item.type}</span></td>
                  <td className="p-3">{item.clientName || '-'}</td>
                  <td className="p-3">{item.taskId ? getTaskName(item.taskId) : '-'}</td>
                  <td className="p-3 font-medium text-green-600">¥{Number(item.amount).toLocaleString()}</td>
                  <td className="p-3">{item.description || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => { if(confirm('削除しますか？')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '売上編集' : '売上追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">タイプ</label><select name="type" defaultValue={editingItem?.type || 'service'} className="w-full px-3 py-2 border rounded-lg">
              <option value="service">サービス</option><option value="project">プロジェクト</option><option value="recurring">定期</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">売上日</label><input name="saleDate" type="date" defaultValue={editingItem?.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">クライアント名</label><input name="clientName" defaultValue={editingItem?.clientName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">業務</label><select name="taskId" defaultValue={editingItem?.taskId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium mb-1">請求書</label><select name="invoiceId" defaultValue={editingItem?.invoiceId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>)}
            </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">金額 *</label><input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default function BPOPage() {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks': return <TasksTab />;
      case 'workflows': return <WorkflowsTab />;
      case 'assignments': return <AssignmentsTab />;
      case 'invoices': return <InvoicesTab />;
      case 'sales': return <SalesTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Headphones className="text-primary-500" size={28} />
          BPO
        </h1>
        <p className="text-slate-500 mt-1">BPO業務管理</p>
      </div>

      <div className="glass-card p-2 mb-6">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
