import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users2, 
  FileText, 
  Receipt, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Briefcase,
  User,
  ChevronRight,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

type TabId = 'jobs' | 'candidates' | 'resumes' | 'invoices' | 'sales';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'jobs', label: '案件一覧', icon: <Briefcase size={16} /> },
  { id: 'candidates', label: '求職者一覧・詳細・進捗', icon: <User size={16} /> },
  { id: 'resumes', label: '職務経歴書', icon: <FileText size={16} /> },
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function JobsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({ 
    queryKey: ['/api/staffing/jobs'], 
    queryFn: () => fetchApi('/api/staffing/jobs') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/jobs'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/jobs'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staffing/jobs/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/jobs'] }); }
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

  const filteredJobs = jobs.filter((j: any) => {
    const matchesSearch = j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = { open: '募集中', closed: '終了', filled: '採用決定', cancelled: 'キャンセル' };
  const employmentLabels: Record<string, string> = { fulltime: '正社員', parttime: 'パート', contract: '契約社員', dispatch: '派遣' };

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="案件名・クライアントで検索..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="border rounded-lg px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">全ステータス</option>
            <option value="open">募集中</option>
            <option value="filled">採用決定</option>
            <option value="closed">終了</option>
          </select>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={18} /> 案件追加
        </button>
      </div>

      <div className="grid gap-4">
        {filteredJobs.map((job: any) => (
          <div key={job.id} className="glass-card p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'filled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[job.status] || job.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{job.clientName}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                  <span>{employmentLabels[job.employmentType] || job.employmentType}</span>
                  {job.location && <span>{job.location}</span>}
                  {job.salary && <span>{job.salary}</span>}
                  {job.positions && <span>募集{job.positions}名</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingItem(job); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                <button onClick={() => deleteMutation.mutate(job.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && <p className="text-center text-slate-500 py-8">案件がありません</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '案件編集' : '案件追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">案件名 *</label>
            <input name="title" defaultValue={editingItem?.title} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">クライアント名</label>
            <input name="clientName" defaultValue={editingItem?.clientName} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">雇用形態</label>
              <select name="employmentType" defaultValue={editingItem?.employmentType || 'fulltime'} className="w-full border rounded-lg px-3 py-2">
                <option value="fulltime">正社員</option>
                <option value="parttime">パート</option>
                <option value="contract">契約社員</option>
                <option value="dispatch">派遣</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select name="status" defaultValue={editingItem?.status || 'open'} className="w-full border rounded-lg px-3 py-2">
                <option value="open">募集中</option>
                <option value="filled">採用決定</option>
                <option value="closed">終了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">勤務地</label>
              <input name="location" defaultValue={editingItem?.location} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">募集人数</label>
              <input name="positions" type="number" defaultValue={editingItem?.positions || 1} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">給与</label>
            <input name="salary" defaultValue={editingItem?.salary} placeholder="例: 月給25万〜35万" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">仕事内容</label>
            <textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">応募要件</label>
            <textarea name="requirements" defaultValue={editingItem?.requirements} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
            {editingItem ? '更新' : '作成'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function CandidatesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading } = useQuery({ 
    queryKey: ['/api/staffing/candidates'], 
    queryFn: () => fetchApi('/api/staffing/candidates') 
  });
  const { data: jobs = [] } = useQuery({ 
    queryKey: ['/api/staffing/jobs'], 
    queryFn: () => fetchApi('/api/staffing/jobs') 
  });
  const { data: applications = [] } = useQuery({ 
    queryKey: ['/api/staffing/applications'], 
    queryFn: () => fetchApi('/api/staffing/applications') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/candidates'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/candidates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/candidates'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staffing/candidates/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/candidates'] }); setSelectedCandidate(null); }
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/applications'] }); }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/applications'] }); }
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

  const filteredCandidates = candidates.filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stageLabels: Record<string, string> = {
    applied: '応募', screening: '書類選考', interview1: '一次面接', interview2: '二次面接', 
    offer: '内定', hired: '採用', rejected: '不採用'
  };

  const getCandidateApplications = (candidateId: number) => applications.filter((a: any) => a.candidateId === candidateId);
  const getJobTitle = (jobId: number) => jobs.find((j: any) => j.id === jobId)?.title || '不明';

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="名前・スキルで検索..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={18} /> 求職者追加
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700">求職者一覧</h3>
          {filteredCandidates.map((candidate: any) => (
            <div 
              key={candidate.id} 
              onClick={() => setSelectedCandidate(candidate)}
              className={`glass-card p-4 cursor-pointer transition hover:shadow-md ${selectedCandidate?.id === candidate.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{candidate.name}</h4>
                  <p className="text-sm text-slate-500">{candidate.email}</p>
                  {candidate.skills && <p className="text-sm text-slate-600 mt-1">{candidate.skills}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${candidate.status === 'active' ? 'bg-green-100 text-green-700' : candidate.status === 'placed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {candidate.status === 'active' ? '活動中' : candidate.status === 'placed' ? '採用済' : '非活動'}
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          ))}
          {filteredCandidates.length === 0 && <p className="text-center text-slate-500 py-8">求職者がいません</p>}
        </div>

        {selectedCandidate && (
          <div className="glass-card p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCandidate.name}</h3>
                <p className="text-slate-500">{selectedCandidate.email} / {selectedCandidate.phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingItem(selectedCandidate); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                <button onClick={() => deleteMutation.mutate(selectedCandidate.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {selectedCandidate.nationality && <div><span className="text-slate-500">国籍:</span> {selectedCandidate.nationality}</div>}
              {selectedCandidate.visaStatus && <div><span className="text-slate-500">在留資格:</span> {selectedCandidate.visaStatus}</div>}
              {selectedCandidate.desiredSalary && <div><span className="text-slate-500">希望給与:</span> {selectedCandidate.desiredSalary}</div>}
              {selectedCandidate.desiredEmploymentType && <div><span className="text-slate-500">希望雇用形態:</span> {selectedCandidate.desiredEmploymentType}</div>}
            </div>

            {selectedCandidate.experience && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-slate-700 mb-1">経験</h4>
                <p className="text-sm text-slate-600">{selectedCandidate.experience}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">応募・進捗</h4>
                <select 
                  className="text-sm border rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      createApplicationMutation.mutate({ candidateId: selectedCandidate.id, jobId: parseInt(e.target.value), stage: 'applied' });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">案件に応募...</option>
                  {jobs.filter((j: any) => j.status === 'open').map((job: any) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {getCandidateApplications(selectedCandidate.id).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <div>
                      <p className="font-medium text-sm">{getJobTitle(app.jobId)}</p>
                      <p className="text-xs text-slate-500">{app.appliedDate ? format(new Date(app.appliedDate), 'yyyy/MM/dd') : '-'}</p>
                    </div>
                    <select 
                      className="text-sm border rounded px-2 py-1"
                      value={app.stage}
                      onChange={(e) => updateApplicationMutation.mutate({ id: app.id, stage: e.target.value })}
                    >
                      {Object.entries(stageLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {getCandidateApplications(selectedCandidate.id).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">応募履歴なし</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '求職者編集' : '求職者追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名前 *</label>
            <input name="name" defaultValue={editingItem?.name} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">メール</label>
              <input name="email" type="email" defaultValue={editingItem?.email} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">電話</label>
              <input name="phone" defaultValue={editingItem?.phone} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">国籍</label>
              <input name="nationality" defaultValue={editingItem?.nationality} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">在留資格</label>
              <input name="visaStatus" defaultValue={editingItem?.visaStatus} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">希望雇用形態</label>
              <input name="desiredEmploymentType" defaultValue={editingItem?.desiredEmploymentType} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">希望給与</label>
              <input name="desiredSalary" defaultValue={editingItem?.desiredSalary} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">スキル</label>
            <input name="skills" defaultValue={editingItem?.skills} placeholder="例: JavaScript, Python, React" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">経験</label>
            <textarea name="experience" defaultValue={editingItem?.experience} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'active'} className="w-full border rounded-lg px-3 py-2">
              <option value="active">活動中</option>
              <option value="inactive">非活動</option>
              <option value="placed">採用済</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
            {editingItem ? '更新' : '作成'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function ResumesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingResume, setViewingResume] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: resumes = [], isLoading } = useQuery({ 
    queryKey: ['/api/staffing/resumes'], 
    queryFn: () => fetchApi('/api/staffing/resumes') 
  });
  const { data: candidates = [] } = useQuery({ 
    queryKey: ['/api/staffing/candidates'], 
    queryFn: () => fetchApi('/api/staffing/candidates') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/resumes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/resumes'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/resumes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/resumes'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staffing/resumes/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/resumes'] }); }
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

  const getCandidateName = (candidateId: number) => candidates.find((c: any) => c.id === candidateId)?.name || '不明';

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold text-slate-700">職務経歴書一覧</h3>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={18} /> 経歴書作成
        </button>
      </div>

      <div className="grid gap-4">
        {resumes.map((resume: any) => (
          <div key={resume.id} className="glass-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{resume.title || '無題'}</h4>
                <p className="text-sm text-slate-500">{getCandidateName(resume.candidateId)}</p>
                {resume.summary && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{resume.summary}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewingResume(resume)} className="p-2 hover:bg-slate-100 rounded"><Eye size={16} /></button>
                <button onClick={() => { setEditingItem(resume); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded"><Edit size={16} /></button>
                <button onClick={() => deleteMutation.mutate(resume.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {resumes.length === 0 && <p className="text-center text-slate-500 py-8">職務経歴書がありません</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '経歴書編集' : '経歴書作成'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">求職者 *</label>
            <select name="candidateId" defaultValue={editingItem?.candidateId} required className="w-full border rounded-lg px-3 py-2">
              <option value="">選択してください</option>
              {candidates.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input name="title" defaultValue={editingItem?.title} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">概要</label>
            <textarea name="summary" defaultValue={editingItem?.summary} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">職歴</label>
            <textarea name="workHistory" defaultValue={editingItem?.workHistory} rows={4} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">学歴</label>
            <textarea name="education" defaultValue={editingItem?.education} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">資格・スキル</label>
            <textarea name="skills" defaultValue={editingItem?.skills} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
            {editingItem ? '更新' : '作成'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!viewingResume} onClose={() => setViewingResume(null)} title="職務経歴書">
        {viewingResume && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{viewingResume.title || '無題'}</h3>
              <p className="text-slate-500">{getCandidateName(viewingResume.candidateId)}</p>
            </div>
            {viewingResume.summary && (
              <div>
                <h4 className="font-medium text-sm text-slate-700">概要</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingResume.summary}</p>
              </div>
            )}
            {viewingResume.workHistory && (
              <div>
                <h4 className="font-medium text-sm text-slate-700">職歴</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingResume.workHistory}</p>
              </div>
            )}
            {viewingResume.education && (
              <div>
                <h4 className="font-medium text-sm text-slate-700">学歴</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingResume.education}</p>
              </div>
            )}
            {viewingResume.skills && (
              <div>
                <h4 className="font-medium text-sm text-slate-700">スキル・資格</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingResume.skills}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InvoicesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({ 
    queryKey: ['/api/staffing/invoices'], 
    queryFn: () => fetchApi('/api/staffing/invoices') 
  });
  const { data: candidates = [] } = useQuery({ 
    queryKey: ['/api/staffing/candidates'], 
    queryFn: () => fetchApi('/api/staffing/candidates') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staffing/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/staffing/invoices'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    const amount = parseFloat(data.amount) || 0;
    const tax = parseFloat(data.tax) || 0;
    data.totalAmount = (amount + tax).toString();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusLabels: Record<string, string> = { draft: '下書き', sent: '送付済', paid: '入金済', overdue: '延滞', cancelled: 'キャンセル' };
  const getCandidateName = (candidateId: number) => candidates.find((c: any) => c.id === candidateId)?.name || '';

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold text-slate-700">請求書一覧</h3>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={18} /> 請求書作成
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">請求番号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">クライアント</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">候補者</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">金額</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">ステータス</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">発行日</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice: any) => (
              <tr key={invoice.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm">{invoice.clientName}</td>
                <td className="px-4 py-3 text-sm">{getCandidateName(invoice.candidateId)}</td>
                <td className="px-4 py-3 text-sm text-right">¥{Number(invoice.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{invoice.issueDate ? format(new Date(invoice.issueDate), 'yyyy/MM/dd') : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(invoice); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded"><Edit size={14} /></button>
                    <button onClick={() => deleteMutation.mutate(invoice.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-center text-slate-500 py-8">請求書がありません</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '請求書編集' : '請求書作成'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">請求番号 *</label>
              <input name="invoiceNumber" defaultValue={editingItem?.invoiceNumber} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select name="status" defaultValue={editingItem?.status || 'draft'} className="w-full border rounded-lg px-3 py-2">
                <option value="draft">下書き</option>
                <option value="sent">送付済</option>
                <option value="paid">入金済</option>
                <option value="overdue">延滞</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">クライアント名 *</label>
            <input name="clientName" defaultValue={editingItem?.clientName} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">候補者</label>
            <select name="candidateId" defaultValue={editingItem?.candidateId || ''} className="w-full border rounded-lg px-3 py-2">
              <option value="">選択してください</option>
              {candidates.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">金額 *</label>
              <input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">消費税</label>
              <input name="tax" type="number" defaultValue={editingItem?.tax || 0} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">発行日</label>
              <input name="issueDate" type="date" defaultValue={editingItem?.issueDate?.split('T')[0]} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">支払期日</label>
              <input name="dueDate" type="date" defaultValue={editingItem?.dueDate?.split('T')[0]} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
            {editingItem ? '更新' : '作成'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SalesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({ 
    queryKey: ['/api/staffing/sales'], 
    queryFn: () => fetchApi('/api/staffing/sales') 
  });
  const { data: summary } = useQuery({ 
    queryKey: ['/api/staffing/sales/summary'], 
    queryFn: () => fetchApi('/api/staffing/sales/summary') 
  });
  const { data: candidates = [] } = useQuery({ 
    queryKey: ['/api/staffing/candidates'], 
    queryFn: () => fetchApi('/api/staffing/candidates') 
  });
  const { data: jobs = [] } = useQuery({ 
    queryKey: ['/api/staffing/jobs'], 
    queryFn: () => fetchApi('/api/staffing/jobs') 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/staffing/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales/summary'] }); 
      setIsModalOpen(false); 
      setEditingItem(null); 
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/staffing/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales/summary'] }); 
      setIsModalOpen(false); 
      setEditingItem(null); 
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staffing/sales/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/staffing/sales/summary'] }); 
    }
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

  const typeLabels: Record<string, string> = { placement: '紹介手数料', monthly: '月額報酬', referral: '紹介料' };
  const getCandidateName = (candidateId: number) => candidates.find((c: any) => c.id === candidateId)?.name || '';
  const getJobTitle = (jobId: number) => jobs.find((j: any) => j.id === jobId)?.title || '';

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">累計売上</p>
          <p className="text-2xl font-bold text-blue-600">¥{Number(summary?.totalSales || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">今月売上</p>
          <p className="text-2xl font-bold text-green-600">¥{Number(summary?.monthlyRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">成約数</p>
          <p className="text-2xl font-bold text-indigo-600">{summary?.placementCount || 0}件</p>
        </div>
      </div>

      <div className="flex justify-between">
        <h3 className="font-semibold text-slate-700">売上一覧</h3>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={18} /> 売上追加
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">日付</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">種別</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">クライアント</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">候補者</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">金額</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((sale: any) => (
              <tr key={sale.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">{sale.saleDate ? format(new Date(sale.saleDate), 'yyyy/MM/dd') : '-'}</td>
                <td className="px-4 py-3 text-sm">{typeLabels[sale.type] || sale.type}</td>
                <td className="px-4 py-3 text-sm">{sale.clientName}</td>
                <td className="px-4 py-3 text-sm">{getCandidateName(sale.candidateId)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">¥{Number(sale.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(sale); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded"><Edit size={14} /></button>
                    <button onClick={() => deleteMutation.mutate(sale.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p className="text-center text-slate-500 py-8">売上がありません</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '売上編集' : '売上追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">種別</label>
              <select name="type" defaultValue={editingItem?.type || 'placement'} className="w-full border rounded-lg px-3 py-2">
                <option value="placement">紹介手数料</option>
                <option value="monthly">月額報酬</option>
                <option value="referral">紹介料</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">売上日</label>
              <input name="saleDate" type="date" defaultValue={editingItem?.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">クライアント名 *</label>
            <input name="clientName" defaultValue={editingItem?.clientName} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">候補者</label>
              <select name="candidateId" defaultValue={editingItem?.candidateId || ''} className="w-full border rounded-lg px-3 py-2">
                <option value="">選択してください</option>
                {candidates.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">案件</label>
              <select name="jobId" defaultValue={editingItem?.jobId || ''} className="w-full border rounded-lg px-3 py-2">
                <option value="">選択してください</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">金額 *</label>
              <input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">手数料率(%)</label>
              <input name="feePercentage" type="number" step="0.01" defaultValue={editingItem?.feePercentage} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
            {editingItem ? '更新' : '作成'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<TabId>('jobs');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jobs': return <JobsTab />;
      case 'candidates': return <CandidatesTab />;
      case 'resumes': return <ResumesTab />;
      case 'invoices': return <InvoicesTab />;
      case 'sales': return <SalesTab />;
      default: return null;
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Users2 className="text-primary-500" size={28} />
          人材
        </h1>
        <p className="text-slate-500 mt-1">人材紹介・派遣管理</p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max bg-slate-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
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
    </>
  );
}
