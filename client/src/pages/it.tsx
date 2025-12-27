import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Monitor, 
  Plus, 
  Search, 
  FileText, 
  Receipt, 
  TrendingUp, 
  Edit, 
  Trash2, 
  X,
  Briefcase,
  Users,
  Building2,
  Globe,
  Code
} from 'lucide-react';
import { format } from 'date-fns';

type TabId = 'systems' | 'projects' | 'clients' | 'vendors' | 'invoices' | 'sales';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'systems', label: 'システム一覧', icon: <Monitor size={16} /> },
  { id: 'projects', label: '案件一覧', icon: <Briefcase size={16} /> },
  { id: 'clients', label: 'クライアント一覧', icon: <Building2 size={16} /> },
  { id: 'vendors', label: '外注一覧', icon: <Users size={16} /> },
  { id: 'invoices', label: '請求書', icon: <Receipt size={16} /> },
  { id: 'sales', label: '売上', icon: <TrendingUp size={16} /> },
];

const fetchApi = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('データの取得に失敗しました');
  return res.json();
};

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function SystemsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: systems = [], isLoading } = useQuery({ 
    queryKey: ['/api/it/systems'], 
    queryFn: () => fetchApi('/api/it/systems') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/systems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/systems'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/systems/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/systems'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/systems/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/it/systems'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSystems = systems.filter((s: any) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.technology?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { active: '稼働中', maintenance: 'メンテナンス中', deprecated: '廃止' };
  const typeLabels: Record<string, string> = { web: 'Web', mobile: 'モバイル', desktop: 'デスクトップ', api: 'API', other: 'その他' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="システム名・技術で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="active">稼働中</option>
          <option value="maintenance">メンテナンス中</option>
          <option value="deprecated">廃止</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> システム追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">システム名</th>
              <th className="text-left p-3 font-medium">種別</th>
              <th className="text-left p-3 font-medium">技術</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredSystems.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">{item.name}</div>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1"><Globe size={12} />{item.url}</a>}
                  </td>
                  <td className="p-3">{typeLabels[item.type] || item.type}</td>
                  <td className="p-3">{item.technology || '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
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
          {filteredSystems.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'システム編集' : 'システム追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">システム名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">種別</label><select name="type" defaultValue={editingItem?.type || 'web'} className="w-full px-3 py-2 border rounded-lg">
              <option value="web">Web</option><option value="mobile">モバイル</option><option value="desktop">デスクトップ</option><option value="api">API</option><option value="other">その他</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'active'} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">稼働中</option><option value="maintenance">メンテナンス中</option><option value="deprecated">廃止</option>
            </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">技術スタック</label><input name="technology" defaultValue={editingItem?.technology} placeholder="例: React, Node.js, PostgreSQL" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">URL</label><input name="url" defaultValue={editingItem?.url} type="url" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">リポジトリURL</label><input name="repositoryUrl" defaultValue={editingItem?.repositoryUrl} type="url" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function ProjectsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({ queryKey: ['/api/it/projects'], queryFn: () => fetchApi('/api/it/projects') });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/it/clients'], queryFn: () => fetchApi('/api/it/clients') });
  const { data: systems = [] } = useQuery({ queryKey: ['/api/it/systems'], queryFn: () => fetchApi('/api/it/systems') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/projects'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/projects'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/projects/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/it/projects'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.clientId) data.clientId = parseInt(data.clientId);
    if (data.systemId) data.systemId = parseInt(data.systemId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredProjects = projects.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { pending: '未着手', in_progress: '進行中', completed: '完了', cancelled: 'キャンセル' };
  const typeLabels: Record<string, string> = { development: '開発', maintenance: '保守', consulting: 'コンサルティング', support: 'サポート' };
  const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' };

  const getClientName = (id: number) => clients.find((c: any) => c.id === id)?.name || '-';
  const getSystemName = (id: number) => systems.find((s: any) => s.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="案件名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="pending">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> 案件追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">案件名</th>
              <th className="text-left p-3 font-medium">クライアント</th>
              <th className="text-left p-3 font-medium">種別</th>
              <th className="text-left p-3 font-medium">優先度</th>
              <th className="text-left p-3 font-medium">予算</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredProjects.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3"><div className="font-medium">{item.name}</div>{item.systemId && <div className="text-sm text-slate-500">システム: {getSystemName(item.systemId)}</div>}</td>
                  <td className="p-3">{item.clientId ? getClientName(item.clientId) : '-'}</td>
                  <td className="p-3">{typeLabels[item.type] || item.type}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.priority === 'urgent' ? 'bg-red-100 text-red-700' : item.priority === 'high' ? 'bg-orange-100 text-orange-700' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>{priorityLabels[item.priority] || item.priority}</span></td>
                  <td className="p-3">{item.budget ? `¥${Number(item.budget).toLocaleString()}` : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : item.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
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
          {filteredProjects.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '案件編集' : '案件追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">案件名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">クライアント</label><select name="clientId" defaultValue={editingItem?.clientId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium mb-1">システム</label><select name="systemId" defaultValue={editingItem?.systemId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {systems.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">種別</label><select name="type" defaultValue={editingItem?.type || 'development'} className="w-full px-3 py-2 border rounded-lg">
              <option value="development">開発</option><option value="maintenance">保守</option><option value="consulting">コンサルティング</option><option value="support">サポート</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'pending'} className="w-full px-3 py-2 border rounded-lg">
              <option value="pending">未着手</option><option value="in_progress">進行中</option><option value="completed">完了</option><option value="cancelled">キャンセル</option>
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">優先度</label><select name="priority" defaultValue={editingItem?.priority || 'medium'} className="w-full px-3 py-2 border rounded-lg">
              <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">緊急</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">予算</label><input name="budget" type="number" defaultValue={editingItem?.budget} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function ClientsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['/api/it/clients'], queryFn: () => fetchApi('/api/it/clients') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/clients'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/clients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/clients'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/clients/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/it/clients'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredClients = clients.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.contactName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { active: 'アクティブ', inactive: '非アクティブ', prospect: '見込み' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="会社名・担当者名で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="active">アクティブ</option>
          <option value="inactive">非アクティブ</option>
          <option value="prospect">見込み</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> クライアント追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">会社名</th>
              <th className="text-left p-3 font-medium">担当者</th>
              <th className="text-left p-3 font-medium">メール</th>
              <th className="text-left p-3 font-medium">電話</th>
              <th className="text-left p-3 font-medium">業種</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredClients.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3">{item.contactName || '-'}</td>
                  <td className="p-3">{item.email || '-'}</td>
                  <td className="p-3">{item.phone || '-'}</td>
                  <td className="p-3">{item.industry || '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : item.status === 'prospect' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
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
          {filteredClients.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'クライアント編集' : 'クライアント追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">会社名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">担当者名</label><input name="contactName" defaultValue={editingItem?.contactName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">メール</label><input name="email" type="email" defaultValue={editingItem?.email} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">電話</label><input name="phone" defaultValue={editingItem?.phone} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">業種</label><input name="industry" defaultValue={editingItem?.industry} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'active'} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">アクティブ</option><option value="inactive">非アクティブ</option><option value="prospect">見込み</option>
            </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">住所</label><textarea name="address" defaultValue={editingItem?.address} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

function VendorsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({ queryKey: ['/api/it/vendors'], queryFn: () => fetchApi('/api/it/vendors') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/vendors'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/vendors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/vendors'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/vendors/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/it/vendors'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.rating) data.rating = parseInt(data.rating);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredVendors = vendors.filter((v: any) => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { active: 'アクティブ', inactive: '非アクティブ' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="会社名・専門分野で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全ステータス</option>
          <option value="active">アクティブ</option>
          <option value="inactive">非アクティブ</option>
        </select>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          <Plus size={18} /> 外注追加
        </button>
      </div>

      {isLoading ? <p className="text-center py-8">読み込み中...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">会社名/名前</th>
              <th className="text-left p-3 font-medium">担当者</th>
              <th className="text-left p-3 font-medium">専門分野</th>
              <th className="text-left p-3 font-medium">単価</th>
              <th className="text-left p-3 font-medium">評価</th>
              <th className="text-left p-3 font-medium">ステータス</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredVendors.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3">{item.contactName || '-'}</td>
                  <td className="p-3">{item.specialty || '-'}</td>
                  <td className="p-3">{item.hourlyRate ? `¥${Number(item.hourlyRate).toLocaleString()}/h` : '-'}</td>
                  <td className="p-3">{item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '-'}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></td>
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
          {filteredVendors.length === 0 && <p className="text-center py-8 text-slate-500">データがありません</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '外注編集' : '外注追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">会社名/名前 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">担当者名</label><input name="contactName" defaultValue={editingItem?.contactName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">メール</label><input name="email" type="email" defaultValue={editingItem?.email} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">電話</label><input name="phone" defaultValue={editingItem?.phone} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">専門分野</label><input name="specialty" defaultValue={editingItem?.specialty} placeholder="例: フロントエンド, バックエンド, デザイン" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">時間単価</label><input name="hourlyRate" type="number" defaultValue={editingItem?.hourlyRate} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">評価 (1-5)</label><select name="rating" defaultValue={editingItem?.rating || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">未評価</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium mb-1">ステータス</label><select name="status" defaultValue={editingItem?.status || 'active'} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">アクティブ</option><option value="inactive">非アクティブ</option>
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

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['/api/it/invoices'], queryFn: () => fetchApi('/api/it/invoices') });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/it/clients'], queryFn: () => fetchApi('/api/it/clients') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/it/projects'], queryFn: () => fetchApi('/api/it/projects') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/it/invoices'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.clientId) data.clientId = parseInt(data.clientId);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    const amount = parseFloat(data.amount) || 0;
    const tax = parseFloat(data.tax) || 0;
    data.totalAmount = (amount + tax).toString();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { draft: '下書き', sent: '送付済み', paid: '入金済み', overdue: '期限超過', cancelled: 'キャンセル' };
  const getClientName = (id: number) => clients.find((c: any) => c.id === id)?.name || '-';
  const getProjectName = (id: number) => projects.find((p: any) => p.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="請求書番号で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
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
              <th className="text-left p-3 font-medium">案件</th>
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
                  <td className="p-3">{item.clientId ? getClientName(item.clientId) : '-'}</td>
                  <td className="p-3">{item.projectId ? getProjectName(item.projectId) : '-'}</td>
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
          <div><label className="block text-sm font-medium mb-1">請求書番号 *</label><input name="invoiceNumber" defaultValue={editingItem?.invoiceNumber} required placeholder="例: INV-2024-001" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">クライアント</label><select name="clientId" defaultValue={editingItem?.clientId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium mb-1">案件</label><select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          </div>
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

  const { data: sales = [], isLoading } = useQuery({ queryKey: ['/api/it/sales'], queryFn: () => fetchApi('/api/it/sales') });
  const { data: summary = { totalSales: 0, projectCount: 0, monthlyRevenue: 0 } } = useQuery({ queryKey: ['/api/it/sales/summary'], queryFn: () => fetchApi('/api/it/sales/summary') });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/it/clients'], queryFn: () => fetchApi('/api/it/clients') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/it/projects'], queryFn: () => fetchApi('/api/it/projects') });
  const { data: invoices = [] } = useQuery({ queryKey: ['/api/it/invoices'], queryFn: () => fetchApi('/api/it/invoices') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/it/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/it/sales/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/it/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/it/sales/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/it/sales/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/it/sales'] }); queryClient.invalidateQueries({ queryKey: ['/api/it/sales/summary'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.clientId) data.clientId = parseInt(data.clientId);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (data.invoiceId) data.invoiceId = parseInt(data.invoiceId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredSales = sales.filter((s: any) => {
    const matchesSearch = s.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeLabels: Record<string, string> = { project: 'プロジェクト', maintenance: '保守', consulting: 'コンサルティング', support: 'サポート' };
  const getClientName = (id: number) => clients.find((c: any) => c.id === id)?.name || '-';
  const getProjectName = (id: number) => projects.find((p: any) => p.id === id)?.name || '-';

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
          <div className="text-2xl font-bold">{summary.projectCount}件</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="説明で検索" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">全タイプ</option>
          <option value="project">プロジェクト</option>
          <option value="maintenance">保守</option>
          <option value="consulting">コンサルティング</option>
          <option value="support">サポート</option>
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
              <th className="text-left p-3 font-medium">案件</th>
              <th className="text-left p-3 font-medium">金額</th>
              <th className="text-left p-3 font-medium">説明</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {filteredSales.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{item.saleDate ? format(new Date(item.saleDate), 'yyyy/MM/dd') : '-'}</td>
                  <td className="p-3"><span className="px-2 py-1 text-xs bg-slate-100 rounded-full">{typeLabels[item.type] || item.type}</span></td>
                  <td className="p-3">{item.clientId ? getClientName(item.clientId) : '-'}</td>
                  <td className="p-3">{item.projectId ? getProjectName(item.projectId) : '-'}</td>
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
            <div><label className="block text-sm font-medium mb-1">タイプ</label><select name="type" defaultValue={editingItem?.type || 'project'} className="w-full px-3 py-2 border rounded-lg">
              <option value="project">プロジェクト</option><option value="maintenance">保守</option><option value="consulting">コンサルティング</option><option value="support">サポート</option>
            </select></div>
            <div><label className="block text-sm font-medium mb-1">売上日</label><input name="saleDate" type="date" defaultValue={editingItem?.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">クライアント</label><select name="clientId" defaultValue={editingItem?.clientId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium mb-1">案件</label><select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">請求書</label><select name="invoiceId" defaultValue={editingItem?.invoiceId || ''} className="w-full px-3 py-2 border rounded-lg">
            <option value="">選択してください</option>
            {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium mb-1">金額 *</label><input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">{editingItem ? '更新' : '追加'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default function ITPage() {
  const [activeTab, setActiveTab] = useState<TabId>('systems');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'systems': return <SystemsTab />;
      case 'projects': return <ProjectsTab />;
      case 'clients': return <ClientsTab />;
      case 'vendors': return <VendorsTab />;
      case 'invoices': return <InvoicesTab />;
      case 'sales': return <SalesTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Monitor className="text-primary-500" size={28} />
          IT
        </h1>
        <p className="text-slate-500 mt-1">IT管理・システム開発</p>
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
