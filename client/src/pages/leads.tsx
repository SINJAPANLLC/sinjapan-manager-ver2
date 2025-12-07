import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Phone, Mail, Instagram, Twitter, 
  Facebook, MessageCircle, MapPin, Globe, Edit, Trash2, Upload,
  Download, ChevronDown, X, ExternalLink, Clock, Building2
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  category?: string;
  source?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  lineId?: string;
  googleMapsUrl?: string;
  status: string;
  notes?: string;
  score?: number;
  lastContactedAt?: string;
  createdAt: string;
}

const statusOptions = [
  { value: 'new', label: '新規', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: '連絡済み', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interested', label: '興味あり', color: 'bg-green-100 text-green-800' },
  { value: 'negotiating', label: '商談中', color: 'bg-purple-100 text-purple-800' },
  { value: 'converted', label: '成約', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'lost', label: '失注', color: 'bg-red-100 text-red-800' },
];

const sourceOptions = [
  { value: 'meo', label: 'MEO/Googleマップ' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Webサイト' },
  { value: 'referral', label: '紹介' },
  { value: 'other', label: 'その他' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    category: '',
    source: 'meo',
    instagramUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    lineId: '',
    googleMapsUrl: '',
    notes: '',
  });
  const [csvText, setCsvText] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      
      const res = await fetch(`/api/leads?${params}`);
      if (res.ok) {
        setLeads(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter, sourceFilter]);

  const handleSubmit = async () => {
    if (!leadForm.name.trim()) return;
    
    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
      const method = editingLead ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });
      
      if (res.ok) {
        await fetchLeads();
        setShowAddModal(false);
        setEditingLead(null);
        resetForm();
      }
    } catch (error) {
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このリードを削除しますか？')) return;
    
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchLeads();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchLeads();
    }
  };

  const handleCsvImport = async () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      alert('CSVデータが不正です。ヘッダー行とデータ行が必要です。');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leadsData = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const lead: any = { source: 'csv' };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === '名前' || header === 'name') lead.name = value;
        else if (header === '会社' || header === 'company') lead.company = value;
        else if (header === '電話' || header === 'phone') lead.phone = value;
        else if (header === 'メール' || header === 'email') lead.email = value;
        else if (header === 'ウェブサイト' || header === 'website') lead.website = value;
        else if (header === '住所' || header === 'address') lead.address = value;
        else if (header === 'カテゴリ' || header === 'category') lead.category = value;
        else if (header === 'instagram') lead.instagramUrl = value;
        else if (header === 'twitter') lead.twitterUrl = value;
        else if (header === 'facebook') lead.facebookUrl = value;
        else if (header === 'line') lead.lineId = value;
        else if (header === 'googleマップ' || header === 'googlemaps') lead.googleMapsUrl = value;
        else if (header === 'メモ' || header === 'notes') lead.notes = value;
      });

      if (lead.name) {
        leadsData.push(lead);
      }
    }

    if (leadsData.length === 0) {
      alert('有効なリードデータがありません。');
      return;
    }

    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsData }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`${result.count}件のリードを登録しました`);
        await fetchLeads();
        setShowCsvModal(false);
        setCsvText('');
      }
    } catch (error) {
      alert('インポートに失敗しました');
    }
  };

  const logActivity = async (leadId: string, type: string, description: string) => {
    await fetch(`/api/leads/${leadId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description }),
    });
    await fetchLeads();
  };

  const resetForm = () => {
    setLeadForm({
      name: '',
      company: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      category: '',
      source: 'meo',
      instagramUrl: '',
      twitterUrl: '',
      facebookUrl: '',
      lineId: '',
      googleMapsUrl: '',
      notes: '',
    });
  };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name || '',
      company: lead.company || '',
      title: lead.title || '',
      phone: lead.phone || '',
      email: lead.email || '',
      website: lead.website || '',
      address: lead.address || '',
      category: lead.category || '',
      source: lead.source || 'meo',
      instagramUrl: lead.instagramUrl || '',
      twitterUrl: lead.twitterUrl || '',
      facebookUrl: lead.facebookUrl || '',
      lineId: lead.lineId || '',
      googleMapsUrl: lead.googleMapsUrl || '',
      notes: lead.notes || '',
    });
    setShowAddModal(true);
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? opt : { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">リード管理</h1>
          <p className="text-slate-500">見込み客リストの管理・営業活動</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            CSVインポート
          </button>
          <button
            onClick={() => { resetForm(); setEditingLead(null); setShowAddModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            リード追加
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="名前、会社名、電話番号、メールで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">すべてのステータス</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">すべてのソース</option>
            {sourceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        {leads.length}件のリード
      </div>

      <div className="grid gap-4">
        {leads.map(lead => (
          <div key={lead.id} className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-slate-800">{lead.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(lead.status).color}`}>
                    {getStatusBadge(lead.status).label}
                  </span>
                </div>
                {lead.company && (
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Building2 size={14} /> {lead.company}
                    {lead.title && ` - ${lead.title}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} /> {lead.phone}
                    </span>
                  )}
                  {lead.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={14} /> {lead.email}
                    </span>
                  )}
                  {lead.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {lead.address}
                    </span>
                  )}
                </div>
                {lead.lastContactedAt && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    最終連絡: {new Date(lead.lastContactedAt).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={() => logActivity(lead.id, 'call', `${lead.phone}に電話`)}
                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title="電話する"
                  >
                    <Phone size={18} />
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={() => logActivity(lead.id, 'email', `${lead.email}にメール送信`)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="メールする"
                  >
                    <Mail size={18} />
                  </a>
                )}
                {lead.instagramUrl && (
                  <a
                    href={lead.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logActivity(lead.id, 'dm', 'Instagram DM')}
                    className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                    title="Instagram DM"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {lead.twitterUrl && (
                  <a
                    href={lead.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logActivity(lead.id, 'dm', 'Twitter DM')}
                    className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                    title="Twitter DM"
                  >
                    <Twitter size={18} />
                  </a>
                )}
                {lead.facebookUrl && (
                  <a
                    href={lead.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {lead.lineId && (
                  <a
                    href={`https://line.me/ti/p/~${lead.lineId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logActivity(lead.id, 'dm', 'LINE')}
                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title="LINE"
                  >
                    <MessageCircle size={18} />
                  </a>
                )}
                {lead.googleMapsUrl && (
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Googleマップ"
                  >
                    <MapPin size={18} />
                  </a>
                )}
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                    title="ウェブサイト"
                  >
                    <Globe size={18} />
                  </a>
                )}

                <div className="border-l pl-2 ml-2 flex gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => startEdit(lead)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {leads.length === 0 && !isLoading && (
          <div className="text-center py-12 text-slate-500">
            リードがありません。「リード追加」または「CSVインポート」で追加してください。
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingLead ? 'リードを編集' : '新規リード追加'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setEditingLead(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名前 *</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="input-field"
                  placeholder="担当者名または店舗名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">会社名</label>
                <input
                  type="text"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">役職</label>
                <input
                  type="text"
                  value={leadForm.title}
                  onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">電話番号</label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メール</label>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ウェブサイト</label>
                <input
                  type="url"
                  value={leadForm.website}
                  onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                  className="input-field"
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">住所</label>
                <input
                  type="text"
                  value={leadForm.address}
                  onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                <input
                  type="text"
                  value={leadForm.category}
                  onChange={(e) => setLeadForm({ ...leadForm, category: e.target.value })}
                  className="input-field"
                  placeholder="飲食店、美容室など"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ソース</label>
                <select
                  value={leadForm.source}
                  onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                  className="input-field"
                >
                  {sourceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-medium text-slate-700 mb-3">SNS・連絡先</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={leadForm.instagramUrl}
                      onChange={(e) => setLeadForm({ ...leadForm, instagramUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Twitter/X URL</label>
                    <input
                      type="url"
                      value={leadForm.twitterUrl}
                      onChange={(e) => setLeadForm({ ...leadForm, twitterUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={leadForm.facebookUrl}
                      onChange={(e) => setLeadForm({ ...leadForm, facebookUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LINE ID</label>
                    <input
                      type="text"
                      value={leadForm.lineId}
                      onChange={(e) => setLeadForm({ ...leadForm, lineId: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Googleマップ URL</label>
                    <input
                      type="url"
                      value={leadForm.googleMapsUrl}
                      onChange={(e) => setLeadForm({ ...leadForm, googleMapsUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setEditingLead(null); }}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!leadForm.name.trim()}
                className="btn-primary"
              >
                {editingLead ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">CSVインポート</h2>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700 mb-2">CSVフォーマット</h3>
              <p className="text-sm text-slate-600 mb-2">
                以下の列をカンマ区切りで入力してください（1行目はヘッダー）
              </p>
              <code className="text-xs bg-slate-200 px-2 py-1 rounded block overflow-x-auto">
                名前,会社,電話,メール,ウェブサイト,住所,カテゴリ,Instagram,Twitter,Facebook,LINE,Googleマップ,メモ
              </code>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="input-field resize-none font-mono text-sm"
              rows={10}
              placeholder={`名前,会社,電話,メール\n田中太郎,株式会社ABC,03-1234-5678,tanaka@example.com\n佐藤花子,株式会社XYZ,06-9876-5432,sato@example.com`}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCsvModal(false)}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleCsvImport}
                disabled={!csvText.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={18} />
                インポート実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
