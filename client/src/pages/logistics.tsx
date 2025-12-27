import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Truck, 
  Building2, 
  Users, 
  FileText, 
  Calendar, 
  Car, 
  CreditCard, 
  ClipboardList, 
  FileCheck, 
  Receipt, 
  FileOutput, 
  Wallet, 
  TrendingUp,
  Plus,
  Search,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const fetchApi = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('データの取得に失敗しました');
  return res.json();
};

type TabId = 
  | 'shippers' 
  | 'companies' 
  | 'projects' 
  | 'dispatch' 
  | 'vehicles' 
  | 'mastercard' 
  | 'summary' 
  | 'quotation' 
  | 'instructions' 
  | 'invoice' 
  | 'receipt' 
  | 'payment' 
  | 'cashflow';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'shippers', label: '荷主リスト', icon: <Building2 size={16} /> },
  { id: 'companies', label: '自社・協力会社', icon: <Users size={16} /> },
  { id: 'projects', label: '案件一覧', icon: <FileText size={16} /> },
  { id: 'dispatch', label: '配車・シフト表', icon: <Calendar size={16} /> },
  { id: 'vehicles', label: '車両一覧', icon: <Car size={16} /> },
  { id: 'mastercard', label: 'マスターカード', icon: <CreditCard size={16} /> },
  { id: 'summary', label: '案件概要書', icon: <ClipboardList size={16} /> },
  { id: 'quotation', label: '見積書', icon: <FileCheck size={16} /> },
  { id: 'instructions', label: '指示書', icon: <FileOutput size={16} /> },
  { id: 'invoice', label: '請求書', icon: <Receipt size={16} /> },
  { id: 'receipt', label: '受領書', icon: <FileText size={16} /> },
  { id: 'payment', label: '支払書', icon: <Wallet size={16} /> },
  { id: 'cashflow', label: '入出金・売上', icon: <TrendingUp size={16} /> },
];

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

function ShippersTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: shippers = [], isLoading } = useQuery({
    queryKey: ['/api/logistics/shippers'],
    queryFn: () => fetchApi('/api/logistics/shippers'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/shippers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/shippers'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/shippers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/shippers'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/shippers/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/shippers'] }); }
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

  const filteredShippers = shippers.filter((s: any) => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="荷主を検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} /> 荷主追加
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">荷主名</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">担当者</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">電話番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">住所</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : filteredShippers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">荷主データがありません</td></tr>
              ) : (
                filteredShippers.map((shipper: any) => (
                  <tr key={shipper.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{shipper.name}</td>
                    <td className="p-3">{shipper.contactPerson || '-'}</td>
                    <td className="p-3">{shipper.phone || '-'}</td>
                    <td className="p-3 max-w-xs truncate">{shipper.address || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(shipper); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(shipper.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '荷主編集' : '荷主追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">荷主名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">担当者</label><input name="contactPerson" defaultValue={editingItem?.contactPerson} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">電話番号</label><input name="phone" defaultValue={editingItem?.phone} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">メール</label><input name="email" type="email" defaultValue={editingItem?.email} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">住所</label><input name="address" defaultValue={editingItem?.address} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">郵便番号</label><input name="postalCode" defaultValue={editingItem?.postalCode} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">備考</label><textarea name="notes" defaultValue={editingItem?.notes} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CompaniesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({ queryKey: ['/api/logistics/companies'], queryFn: () => fetchApi('/api/logistics/companies') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/companies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/companies/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const ownCompanies = companies.filter((c: any) => c.type === 'own');
  const partnerCompanies = companies.filter((c: any) => c.type === 'partner');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 会社追加</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Building2 size={18} className="text-primary-500" /> 自社</h3>
          {isLoading ? <p className="text-slate-400 text-sm">読み込み中...</p> : ownCompanies.length === 0 ? <p className="text-slate-400 text-sm">自社情報がありません</p> : (
            <div className="space-y-2">
              {ownCompanies.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div><div className="font-medium">{c.name}</div><div className="text-sm text-slate-500">{c.phone}</div></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card p-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Users size={18} className="text-green-500" /> 協力会社</h3>
          {isLoading ? <p className="text-slate-400 text-sm">読み込み中...</p> : partnerCompanies.length === 0 ? <p className="text-slate-400 text-sm">協力会社データがありません</p> : (
            <div className="space-y-2">
              {partnerCompanies.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div><div className="font-medium">{c.name}</div><div className="text-sm text-slate-500">{c.phone}</div></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '会社編集' : '会社追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">種別 *</label>
            <select name="type" defaultValue={editingItem?.type || 'partner'} className="w-full px-3 py-2 border rounded-lg">
              <option value="own">自社</option><option value="partner">協力会社</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">会社名 *</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">担当者</label><input name="contactPerson" defaultValue={editingItem?.contactPerson} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">電話番号</label><input name="phone" defaultValue={editingItem?.phone} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">メール</label><input name="email" type="email" defaultValue={editingItem?.email} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">住所</label><input name="address" defaultValue={editingItem?.address} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-sm font-medium mb-1">銀行名</label><input name="bankName" defaultValue={editingItem?.bankName} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">支店名</label><input name="bankBranch" defaultValue={editingItem?.bankBranch} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-sm font-medium mb-1">口座種別</label><input name="bankAccountType" defaultValue={editingItem?.bankAccountType} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">口座番号</label><input name="bankAccountNumber" defaultValue={editingItem?.bankAccountNumber} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">口座名義</label><input name="bankAccountHolder" defaultValue={editingItem?.bankAccountHolder} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function VehiclesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ['/api/logistics/vehicles'], queryFn: () => fetchApi('/api/logistics/vehicles') });
  const { data: companies = [] } = useQuery({ queryKey: ['/api/logistics/companies'], queryFn: () => fetchApi('/api/logistics/companies') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicles'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/vehicles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicles'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/vehicles/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicles'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.ownerCompanyId) data.ownerCompanyId = parseInt(data.ownerCompanyId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const filteredVehicles = vehicles.filter((v: any) => 
    v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: any = { active: 'bg-green-100 text-green-700', maintenance: 'bg-yellow-100 text-yellow-700', inactive: 'bg-red-100 text-red-700' };
    const labels: any = { active: '稼働中', maintenance: '整備中', inactive: '休止' };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="車両を検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 車両追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">車両番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">種別</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ドライバー</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">積載量</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : filteredVehicles.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">車両データがありません</td></tr>
              ) : (
                filteredVehicles.map((v: any) => (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{v.vehicleNumber}</td>
                    <td className="p-3">{v.vehicleType}</td>
                    <td className="p-3">{v.driverName || '-'}</td>
                    <td className="p-3">{v.capacity || '-'}</td>
                    <td className="p-3">{getStatusBadge(v.status)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(v); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(v.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '車両編集' : '車両追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">車両番号 *</label><input name="vehicleNumber" defaultValue={editingItem?.vehicleNumber} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">車両種別 *</label>
            <select name="vehicleType" defaultValue={editingItem?.vehicleType || 'トラック'} required className="w-full px-3 py-2 border rounded-lg">
              <option value="トラック">トラック</option><option value="バン">バン</option><option value="軽トラック">軽トラック</option><option value="トレーラー">トレーラー</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">積載量</label><input name="capacity" defaultValue={editingItem?.capacity} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">所有会社</label>
            <select name="ownerCompanyId" defaultValue={editingItem?.ownerCompanyId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">ドライバー名</label><input name="driverName" defaultValue={editingItem?.driverName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ドライバー電話</label><input name="driverPhone" defaultValue={editingItem?.driverPhone} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'active'} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">稼働中</option><option value="maintenance">整備中</option><option value="inactive">休止</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
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

  const { data: projects = [], isLoading } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: shippers = [] } = useQuery({ queryKey: ['/api/logistics/shippers'], queryFn: () => fetchApi('/api/logistics/shippers') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/projects'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/projects'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/projects/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/projects'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.shipperId) data.shipperId = parseInt(data.shipperId);
    if (data.amount) data.amount = data.amount;
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = { pending: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    const labels: any = { pending: '保留', in_progress: '進行中', completed: '完了', cancelled: 'キャンセル' };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
  };

  const filteredProjects = projects.filter((p: any) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getShipperName = (id: number) => {
    const shipper = shippers.find((s: any) => s.id === id);
    return shipper?.name || '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg">
            <option value="all">全てのステータス</option><option value="pending">保留</option><option value="in_progress">進行中</option><option value="completed">完了</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="案件を検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg" />
          </div>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 案件追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">タイトル</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">配送日</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">案件データがありません</td></tr>
              ) : (
                filteredProjects.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{p.projectNumber}</td>
                    <td className="p-3">{p.title}</td>
                    <td className="p-3">{getShipperName(p.shipperId)}</td>
                    <td className="p-3">{p.scheduledDate ? format(new Date(p.scheduledDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">{getStatusBadge(p.status)}</td>
                    <td className="p-3">{p.amount ? `¥${Number(p.amount).toLocaleString()}` : '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(p.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '案件編集' : '案件追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">案件番号 *</label><input name="projectNumber" defaultValue={editingItem?.projectNumber || `PRJ-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">タイトル *</label><input name="title" defaultValue={editingItem?.title} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">荷主</label>
            <select name="shipperId" defaultValue={editingItem?.shipperId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {shippers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">配送予定日</label><input name="scheduledDate" type="date" defaultValue={editingItem?.scheduledDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">集荷先</label><input name="pickupAddress" defaultValue={editingItem?.pickupAddress} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">配送先</label><input name="deliveryAddress" defaultValue={editingItem?.deliveryAddress} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">金額</label><input name="amount" type="number" defaultValue={editingItem?.amount} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'pending'} className="w-full px-3 py-2 border rounded-lg">
              <option value="pending">保留</option><option value="in_progress">進行中</option><option value="completed">完了</option><option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DispatchTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: dispatches = [], isLoading } = useQuery({ queryKey: ['/api/logistics/dispatch'], queryFn: () => fetchApi('/api/logistics/dispatch') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: vehicles = [] } = useQuery({ queryKey: ['/api/logistics/vehicles'], queryFn: () => fetchApi('/api/logistics/vehicles') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/dispatch'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/dispatch/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/dispatch'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/dispatch/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/dispatch'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (data.vehicleId) data.vehicleId = parseInt(data.vehicleId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = { scheduled: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    const labels: any = { scheduled: '予定', dispatched: '配車済', completed: '完了', cancelled: 'キャンセル' };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 配車追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">配車日</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">車両</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ドライバー</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">時間</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : dispatches.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">配車データがありません</td></tr>
              ) : (
                dispatches.map((d: any) => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{d.dispatchDate ? format(new Date(d.dispatchDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">{projects.find((p: any) => p.id === d.projectId)?.title || '-'}</td>
                    <td className="p-3">{vehicles.find((v: any) => v.id === d.vehicleId)?.vehicleNumber || '-'}</td>
                    <td className="p-3">{d.driverName || '-'}</td>
                    <td className="p-3">{d.startTime && d.endTime ? `${d.startTime}〜${d.endTime}` : '-'}</td>
                    <td className="p-3">{getStatusBadge(d.status)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(d); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(d.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '配車編集' : '配車追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">配車日 *</label><input name="dispatchDate" type="date" defaultValue={editingItem?.dispatchDate?.split('T')[0]} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">車両</label>
            <select name="vehicleId" defaultValue={editingItem?.vehicleId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">ドライバー</label><input name="driverName" defaultValue={editingItem?.driverName} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-sm font-medium mb-1">開始時間</label><input name="startTime" type="time" defaultValue={editingItem?.startTime} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">終了時間</label><input name="endTime" type="time" defaultValue={editingItem?.endTime} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'scheduled'} className="w-full px-3 py-2 border rounded-lg">
              <option value="scheduled">予定</option><option value="dispatched">配車済</option><option value="completed">完了</option><option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MasterCardTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({ queryKey: ['/api/logistics/master-cards'], queryFn: () => fetchApi('/api/logistics/master-cards') });
  const { data: vehicles = [] } = useQuery({ queryKey: ['/api/logistics/vehicles'], queryFn: () => fetchApi('/api/logistics/vehicles') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/master-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/master-cards'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/master-cards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/master-cards'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/master-cards/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/master-cards'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.vehicleId) data.vehicleId = parseInt(data.vehicleId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> カード追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">種別</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">車両</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">有効期限</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : cards.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">マスターカードデータがありません</td></tr>
              ) : (
                cards.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{c.cardType}</td>
                    <td className="p-3">{vehicles.find((v: any) => v.id === c.vehicleId)?.vehicleNumber || '-'}</td>
                    <td className="p-3">{c.cardNumber || '-'}</td>
                    <td className="p-3">{c.expiryDate ? format(new Date(c.expiryDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'カード編集' : 'カード追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">種別 *</label>
            <select name="cardType" defaultValue={editingItem?.cardType || '車検証'} required className="w-full px-3 py-2 border rounded-lg">
              <option value="車検証">車検証</option><option value="自賠責保険">自賠責保険</option><option value="任意保険">任意保険</option><option value="運転免許証">運転免許証</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">車両</label>
            <select name="vehicleId" defaultValue={editingItem?.vehicleId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">番号</label><input name="cardNumber" defaultValue={editingItem?.cardNumber} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">発行日</label><input name="issueDate" type="date" defaultValue={editingItem?.issueDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">有効期限</label><input name="expiryDate" type="date" defaultValue={editingItem?.expiryDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SummaryTab() {
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: shippers = [] } = useQuery({ queryKey: ['/api/logistics/shippers'], queryFn: () => fetchApi('/api/logistics/shippers') });
  
  const getShipperName = (id: number) => shippers.find((s: any) => s.id === id)?.name || '-';
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full glass-card p-8 text-center text-slate-400">案件概要書がありません</div>
        ) : (
          projects.map((p: any) => (
            <div key={p.id} className="glass-card p-4">
              <h4 className="font-semibold text-lg mb-2">{p.projectNumber}</h4>
              <div className="space-y-1 text-sm">
                <div><span className="text-slate-500">タイトル:</span> {p.title}</div>
                <div><span className="text-slate-500">荷主:</span> {getShipperName(p.shipperId)}</div>
                <div><span className="text-slate-500">集荷先:</span> {p.pickupAddress || '-'}</div>
                <div><span className="text-slate-500">配送先:</span> {p.deliveryAddress || '-'}</div>
                <div><span className="text-slate-500">金額:</span> {p.amount ? `¥${Number(p.amount).toLocaleString()}` : '-'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuotationTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({ queryKey: ['/api/logistics/quotations'], queryFn: () => fetchApi('/api/logistics/quotations') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: shippers = [] } = useQuery({ queryKey: ['/api/logistics/shippers'], queryFn: () => fetchApi('/api/logistics/shippers') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/quotations'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/quotations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/quotations'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/quotations/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/quotations'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (data.shipperId) data.shipperId = parseInt(data.shipperId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 見積書追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">見積番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : quotations.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">見積書データがありません</td></tr>
              ) : (
                quotations.map((q: any) => (
                  <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{q.quotationNumber}</td>
                    <td className="p-3">{projects.find((p: any) => p.id === q.projectId)?.title || '-'}</td>
                    <td className="p-3">{shippers.find((s: any) => s.id === q.shipperId)?.name || '-'}</td>
                    <td className="p-3">{q.total ? `¥${Number(q.total).toLocaleString()}` : '-'}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-slate-100">{q.status}</span></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(q); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(q.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '見積書編集' : '見積書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">見積番号 *</label><input name="quotationNumber" defaultValue={editingItem?.quotationNumber || `QT-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">荷主</label>
            <select name="shipperId" defaultValue={editingItem?.shipperId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {shippers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-sm font-medium mb-1">小計</label><input name="subtotal" type="number" defaultValue={editingItem?.subtotal} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">消費税</label><input name="tax" type="number" defaultValue={editingItem?.tax} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">合計</label><input name="total" type="number" defaultValue={editingItem?.total} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'draft'} className="w-full px-3 py-2 border rounded-lg">
              <option value="draft">下書き</option><option value="sent">送付済</option><option value="accepted">承認</option><option value="rejected">却下</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InstructionsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: instructions = [], isLoading } = useQuery({ queryKey: ['/api/logistics/instructions'], queryFn: () => fetchApi('/api/logistics/instructions') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/instructions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/instructions'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/instructions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/instructions'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/instructions/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/instructions'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 指示書追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">指示書番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">集荷場所</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">配送場所</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : instructions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">指示書データがありません</td></tr>
              ) : (
                instructions.map((i: any) => (
                  <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{i.instructionNumber}</td>
                    <td className="p-3">{projects.find((p: any) => p.id === i.projectId)?.title || '-'}</td>
                    <td className="p-3">{i.pickupLocation || '-'}</td>
                    <td className="p-3">{i.deliveryLocation || '-'}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-slate-100">{i.status}</span></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(i); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(i.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '指示書編集' : '指示書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">指示書番号 *</label><input name="instructionNumber" defaultValue={editingItem?.instructionNumber || `INS-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">集荷場所</label><input name="pickupLocation" defaultValue={editingItem?.pickupLocation} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">配送場所</label><input name="deliveryLocation" defaultValue={editingItem?.deliveryLocation} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">貨物詳細</label><textarea name="cargoDetails" defaultValue={editingItem?.cargoDetails} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">特記事項</label><textarea name="specialInstructions" defaultValue={editingItem?.specialInstructions} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'issued'} className="w-full px-3 py-2 border rounded-lg">
              <option value="issued">発行済</option><option value="acknowledged">確認済</option><option value="completed">完了</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InvoiceTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['/api/logistics/invoices'], queryFn: () => fetchApi('/api/logistics/invoices') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: shippers = [] } = useQuery({ queryKey: ['/api/logistics/shippers'], queryFn: () => fetchApi('/api/logistics/shippers') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/invoices'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/invoices/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/invoices'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (data.shipperId) data.shipperId = parseInt(data.shipperId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = { draft: 'bg-slate-100 text-slate-700', sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700' };
    const labels: any = { draft: '下書き', sent: '送付済', paid: '入金済', overdue: '延滞' };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 請求書追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">請求番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">荷主</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">発行日</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">支払期限</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">請求書データがありません</td></tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="p-3">{shippers.find((s: any) => s.id === inv.shipperId)?.name || '-'}</td>
                    <td className="p-3">{inv.issueDate ? format(new Date(inv.issueDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">{inv.dueDate ? format(new Date(inv.dueDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">{inv.total ? `¥${Number(inv.total).toLocaleString()}` : '-'}</td>
                    <td className="p-3">{getStatusBadge(inv.status)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(inv); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(inv.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '請求書編集' : '請求書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">請求番号 *</label><input name="invoiceNumber" defaultValue={editingItem?.invoiceNumber || `INV-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">荷主</label>
            <select name="shipperId" defaultValue={editingItem?.shipperId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {shippers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">支払期限</label><input name="dueDate" type="date" defaultValue={editingItem?.dueDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-sm font-medium mb-1">小計</label><input name="subtotal" type="number" defaultValue={editingItem?.subtotal} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">消費税</label><input name="tax" type="number" defaultValue={editingItem?.tax} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">合計</label><input name="total" type="number" defaultValue={editingItem?.total} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'draft'} className="w-full px-3 py-2 border rounded-lg">
              <option value="draft">下書き</option><option value="sent">送付済</option><option value="paid">入金済</option><option value="overdue">延滞</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ReceiptTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({ queryKey: ['/api/logistics/receipts'], queryFn: () => fetchApi('/api/logistics/receipts') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/receipts'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/receipts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/receipts'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/receipts/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/receipts'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    data.deliveryConfirmed = data.deliveryConfirmed === 'true';
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 受領書追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">受領番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">受領者</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">発行日</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">確認</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : receipts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">受領書データがありません</td></tr>
              ) : (
                receipts.map((r: any) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{r.receiptNumber}</td>
                    <td className="p-3">{projects.find((p: any) => p.id === r.projectId)?.title || '-'}</td>
                    <td className="p-3">{r.receivedBy || '-'}</td>
                    <td className="p-3">{r.issueDate ? format(new Date(r.issueDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3">{r.deliveryConfirmed ? <span className="text-green-600">確認済</span> : <span className="text-slate-400">未確認</span>}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(r); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(r.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '受領書編集' : '受領書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">受領番号 *</label><input name="receiptNumber" defaultValue={editingItem?.receiptNumber || `RCP-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">受領者</label><input name="receivedBy" defaultValue={editingItem?.receivedBy} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">配送確認</label>
            <select name="deliveryConfirmed" defaultValue={editingItem?.deliveryConfirmed ? 'true' : 'false'} className="w-full px-3 py-2 border rounded-lg">
              <option value="false">未確認</option><option value="true">確認済</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PaymentTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['/api/logistics/payments'], queryFn: () => fetchApi('/api/logistics/payments') });
  const { data: projects = [] } = useQuery({ queryKey: ['/api/logistics/projects'], queryFn: () => fetchApi('/api/logistics/projects') });
  const { data: companies = [] } = useQuery({ queryKey: ['/api/logistics/companies'], queryFn: () => fetchApi('/api/logistics/companies') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/payments'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/payments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/payments'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/payments/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/payments'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (data.projectId) data.projectId = parseInt(data.projectId);
    if (data.partnerCompanyId) data.partnerCompanyId = parseInt(data.partnerCompanyId);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 支払書追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">支払番号</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">協力会社</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">案件</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">支払日</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">ステータス</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">支払書データがありません</td></tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{p.paymentNumber}</td>
                    <td className="p-3">{companies.find((c: any) => c.id === p.partnerCompanyId)?.name || '-'}</td>
                    <td className="p-3">{projects.find((pr: any) => pr.id === p.projectId)?.title || '-'}</td>
                    <td className="p-3">{p.amount ? `¥${Number(p.amount).toLocaleString()}` : '-'}</td>
                    <td className="p-3">{p.paymentDate ? format(new Date(p.paymentDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'paid' ? '支払済' : '未払'}</span></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(p.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '支払書編集' : '支払書追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">支払番号 *</label><input name="paymentNumber" defaultValue={editingItem?.paymentNumber || `PAY-${Date.now()}`} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">協力会社</label>
            <select name="partnerCompanyId" defaultValue={editingItem?.partnerCompanyId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {companies.filter((c: any) => c.type === 'partner').map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">案件</label>
            <select name="projectId" defaultValue={editingItem?.projectId || ''} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選択してください</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectNumber} - {p.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">金額 *</label><input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">支払日</label><input name="paymentDate" type="date" defaultValue={editingItem?.paymentDate?.split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">ステータス</label>
            <select name="status" defaultValue={editingItem?.status || 'pending'} className="w-full px-3 py-2 border rounded-lg">
              <option value="pending">未払</option><option value="paid">支払済</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CashflowTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: cashflow = [], isLoading } = useQuery({ queryKey: ['/api/logistics/cashflow'], queryFn: () => fetchApi('/api/logistics/cashflow') });
  const { data: summary } = useQuery({ queryKey: ['/api/logistics/cashflow/summary'], queryFn: () => fetchApi('/api/logistics/cashflow/summary') });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/logistics/cashflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow'] }); queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/logistics/cashflow/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      if (!res.ok) throw new Error('Failed'); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow'] }); queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow/summary'] }); setIsModalOpen(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logistics/cashflow/${id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow'] }); queryClient.invalidateQueries({ queryKey: ['/api/logistics/cashflow/summary'] }); }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">収入合計</div>
          <div className="text-2xl font-bold text-green-600">¥{(summary?.income || 0).toLocaleString()}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">支出合計</div>
          <div className="text-2xl font-bold text-red-600">¥{(summary?.expense || 0).toLocaleString()}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500">収支</div>
          <div className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>¥{(summary?.balance || 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> 入出金追加</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600">日付</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">種別</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">カテゴリ</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">説明</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">金額</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">読み込み中...</td></tr>
              ) : cashflow.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">入出金データがありません</td></tr>
              ) : (
                cashflow.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{c.transactionDate ? format(new Date(c.transactionDate), 'yyyy/MM/dd') : '-'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${c.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.type === 'income' ? '収入' : '支出'}</span></td>
                    <td className="p-3">{c.category || '-'}</td>
                    <td className="p-3">{c.description || '-'}</td>
                    <td className="p-3 font-medium">{c.amount ? `¥${Number(c.amount).toLocaleString()}` : '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? '入出金編集' : '入出金追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">種別 *</label>
            <select name="type" defaultValue={editingItem?.type || 'income'} required className="w-full px-3 py-2 border rounded-lg">
              <option value="income">収入</option><option value="expense">支出</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">カテゴリ</label><input name="category" defaultValue={editingItem?.category} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">金額 *</label><input name="amount" type="number" defaultValue={editingItem?.amount} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">日付</label><input name="transactionDate" type="date" defaultValue={editingItem?.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">説明</label><textarea name="description" defaultValue={editingItem?.description} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">キャンセル</button>
            <button type="submit" className="btn-primary">{editingItem ? '更新' : '追加'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('shippers');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shippers': return <ShippersTab />;
      case 'companies': return <CompaniesTab />;
      case 'projects': return <ProjectsTab />;
      case 'dispatch': return <DispatchTab />;
      case 'vehicles': return <VehiclesTab />;
      case 'mastercard': return <MasterCardTab />;
      case 'summary': return <SummaryTab />;
      case 'quotation': return <QuotationTab />;
      case 'instructions': return <InstructionsTab />;
      case 'invoice': return <InvoiceTab />;
      case 'receipt': return <ReceiptTab />;
      case 'payment': return <PaymentTab />;
      case 'cashflow': return <CashflowTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Truck className="text-primary-500" />
          物流管理
        </h1>
      </div>
      <div className="glass-card p-2">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${activeTab === tab.id ? 'bg-primary-500 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {renderTabContent()}
    </div>
  );
}
