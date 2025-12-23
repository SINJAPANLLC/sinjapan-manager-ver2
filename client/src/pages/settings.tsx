import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { User, Lock, Save, Loader2, CheckCircle, Building2, CreditCard, Plus, Pencil, Trash2, X, Phone, Mail, Globe, Landmark, Calendar, Users, Shield, CheckCircle2, XCircle, MapPin, RefreshCw, Link2, Key, Eye, EyeOff, Copy, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface SquareLocation {
  id: string;
  name: string;
  status: string;
  address?: {
    addressLine1?: string;
    locality?: string;
    country?: string;
  };
}

interface SquareStatus {
  connected: boolean;
  message?: string;
  locations?: SquareLocation[];
}

interface PaymentLink {
  id: string;
  url: string;
  longUrl?: string;
  createdAt: string;
}

interface SquareSettings {
  hasSettings: boolean;
  applicationId: string;
  environment: string;
  locationId: string;
  accessTokenMasked: string;
}

function PaymentTab() {
  const [status, setStatus] = useState<SquareStatus | null>(null);
  const [settings, setSettings] = useState<SquareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    name: '',
    amount: '',
    description: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    accessToken: '',
    applicationId: '',
    environment: 'sandbox',
    locationId: '',
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/square/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.hasSettings) {
          setSettingsForm({
            accessToken: '',
            applicationId: data.applicationId || '',
            environment: data.environment || 'sandbox',
            locationId: data.locationId || '',
          });
        }
      }
    } catch (error) {
      console.error('Fetch Square settings error:', error);
    }
  };

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/square/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      setStatus({ connected: false, message: 'Square APIへの接続に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/square/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        await fetchSettings();
        await fetchStatus();
        setShowSettingsForm(false);
      }
    } catch (error) {
      console.error('Save Square settings error:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, []);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.name || !linkForm.amount) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/square/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: linkForm.name,
          amount: parseInt(linkForm.amount),
          description: linkForm.description,
        }),
      });
      
      if (res.ok) {
        const link = await res.json();
        setCreatedLink(link);
        setLinkForm({ name: '', amount: '', description: '' });
        setShowLinkForm(false);
      }
    } catch (error) {
      console.error('Create payment link error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Square API設定 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800">Square API設定</h3>
            <p className="text-sm text-slate-500">
              {settings?.hasSettings 
                ? `設定済み (トークン: ${settings.accessTokenMasked})`
                : '未設定 - APIキーを入力してください'}
            </p>
          </div>
          <button
            onClick={() => setShowSettingsForm(!showSettingsForm)}
            className="btn-secondary flex items-center gap-2"
          >
            <Pencil size={16} />
            {settings?.hasSettings ? '設定を変更' : '設定する'}
          </button>
        </div>

        {showSettingsForm && (
          <form onSubmit={handleSaveSettings} className="space-y-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                アクセストークン {settings?.hasSettings && <span className="text-slate-400">(変更する場合のみ入力)</span>}
              </label>
              <input
                type="password"
                value={settingsForm.accessToken}
                onChange={(e) => setSettingsForm({ ...settingsForm, accessToken: e.target.value })}
                className="input-field"
                placeholder={settings?.hasSettings ? '変更しない場合は空白のまま' : 'EAAAAAAxxxxxxxx...'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">アプリケーションID *</label>
              <input
                type="text"
                value={settingsForm.applicationId}
                onChange={(e) => setSettingsForm({ ...settingsForm, applicationId: e.target.value })}
                className="input-field"
                placeholder="sq0idp-xxxxxxxxxxxxxxxx"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">環境</label>
                <select
                  value={settingsForm.environment}
                  onChange={(e) => setSettingsForm({ ...settingsForm, environment: e.target.value })}
                  className="input-field"
                >
                  <option value="sandbox">サンドボックス（テスト）</option>
                  <option value="production">本番環境</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ロケーションID（任意）</label>
                <input
                  type="text"
                  value={settingsForm.locationId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, locationId: e.target.value })}
                  className="input-field"
                  placeholder="自動取得する場合は空白"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowSettingsForm(false)} className="btn-secondary">
                キャンセル
              </button>
              <button type="submit" disabled={isSavingSettings} className="btn-primary flex items-center gap-2">
                {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                設定を保存
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Square接続状態 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              status?.connected ? "bg-green-100" : "bg-red-100"
            )}>
              {status?.connected ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <XCircle size={24} className="text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Square 決済</h3>
              <p className={cn(
                "text-sm",
                status?.connected ? "text-green-600" : "text-red-600"
              )}>
                {status?.connected ? '接続済み' : (status?.message || '未接続')}
              </p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            更新
          </button>
        </div>

        {status?.connected && status.locations && status.locations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">店舗情報</h4>
            <div className="space-y-3">
              {status.locations.map((loc) => (
                <div key={loc.id} className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <MapPin size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{loc.name}</p>
                    {loc.address && (
                      <p className="text-sm text-slate-500">
                        {loc.address.addressLine1}
                        {loc.address.locality && `, ${loc.address.locality}`}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    "ml-auto px-2 py-1 rounded-full text-xs font-medium",
                    loc.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {loc.status === 'ACTIVE' ? '稼働中' : loc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {status?.connected && (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">決済リンクを作成</h4>
              <button
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                新規作成
              </button>
            </div>

            {showLinkForm && (
              <form onSubmit={handleCreateLink} className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">商品・サービス名 *</label>
                  <input
                    type="text"
                    value={linkForm.name}
                    onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                    className="input-field"
                    placeholder="例: コンサルティング料金"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">金額（円） *</label>
                  <input
                    type="number"
                    value={linkForm.amount}
                    onChange={(e) => setLinkForm({ ...linkForm, amount: e.target.value })}
                    className="input-field"
                    placeholder="例: 10000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">説明</label>
                  <textarea
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="決済に関するメモ"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowLinkForm(false)} className="btn-secondary">
                    キャンセル
                  </button>
                  <button type="submit" disabled={isCreating} className="btn-primary flex items-center gap-2">
                    {isCreating ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                    決済リンクを作成
                  </button>
                </div>
              </form>
            )}

            {createdLink && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="font-medium text-green-800">決済リンクを作成しました</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={createdLink.url}
                    readOnly
                    className="input-field flex-1 bg-white"
                  />
                  <button
                    onClick={() => copyToClipboard(createdLink.url)}
                    className="btn-secondary"
                  >
                    コピー
                  </button>
                  <a
                    href={createdLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    開く
                  </a>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!status?.connected && (
        <div className="card p-6 bg-amber-50 border-amber-200">
          <h4 className="font-medium text-amber-800 mb-2">Square APIキーの設定</h4>
          <p className="text-sm text-amber-700">
            Square決済を利用するには、管理者がSquare Developer DashboardからAPIキーを取得し、
            環境変数に設定する必要があります。
          </p>
          <a
            href="https://developer.squareup.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-amber-800 font-medium hover:underline"
          >
            Square Developer Dashboard →
          </a>
        </div>
      )}
    </div>
  );
}

interface SiteCredential {
  id: number;
  siteName: string;
  siteUrl?: string;
  loginUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  notes?: string;
  category?: string;
  createdAt: string;
}

function SiteCredentialsTab() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<SiteCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<SiteCredential | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [showApiKey, setShowApiKey] = useState<{ [key: number]: boolean }>({});
  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
    loginUrl: '',
    username: '',
    password: '',
    apiKey: '',
    notes: '',
    category: 'general',
  });

  const canEdit = user?.role === 'admin' || user?.role === 'ceo' || user?.role === 'manager';

  const categories = [
    { value: 'general', label: '一般' },
    { value: 'hosting', label: 'ホスティング' },
    { value: 'analytics', label: 'アナリティクス' },
    { value: 'social', label: 'SNS' },
    { value: 'advertising', label: '広告' },
    { value: 'payment', label: '決済' },
    { value: 'email', label: 'メール' },
    { value: 'api', label: 'API' },
    { value: 'other', label: 'その他' },
  ];

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/site-credentials');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCredential
        ? `/api/site-credentials/${editingCredential.id}`
        : '/api/site-credentials';
      const method = editingCredential ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchCredentials();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save credential:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このサイト情報を削除してもよろしいですか？')) return;
    try {
      const res = await fetch(`/api/site-credentials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to delete credential:', error);
    }
  };

  const openModal = (credential?: SiteCredential) => {
    if (credential) {
      setEditingCredential(credential);
      setFormData({
        siteName: credential.siteName,
        siteUrl: credential.siteUrl || '',
        loginUrl: credential.loginUrl || '',
        username: credential.username || '',
        password: credential.password || '',
        apiKey: credential.apiKey || '',
        notes: credential.notes || '',
        category: credential.category || 'general',
      });
    } else {
      setEditingCredential(null);
      setFormData({
        siteName: '',
        siteUrl: '',
        loginUrl: '',
        username: '',
        password: '',
        apiKey: '',
        notes: '',
        category: 'general',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCredential(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-button">
              <Key size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">サイト情報</h2>
              <p className="text-sm text-slate-500">各種サイトのURL、ログイン情報、APIキーを管理</p>
            </div>
          </div>
          {canEdit && (
            <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              追加
            </button>
          )}
        </div>

        <div className="p-6">
          {credentials.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Key size={48} className="mx-auto mb-4 text-slate-300" />
              <p>サイト情報がありません</p>
              {canEdit && (
                <button onClick={() => openModal()} className="mt-4 text-primary-600 hover:underline">
                  最初のサイト情報を追加する
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((cred) => (
                <div key={cred.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-800">{cred.siteName}</h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {getCategoryLabel(cred.category || 'general')}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        {cred.siteUrl && (
                          <div className="flex items-center gap-2">
                            <Link2 size={14} className="text-slate-400" />
                            <span className="text-slate-600">サイトURL:</span>
                            <a href={cred.siteUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">
                              {cred.siteUrl}
                            </a>
                            <button onClick={() => copyToClipboard(cred.siteUrl!)} className="p-1 hover:bg-slate-100 rounded">
                              <Copy size={12} className="text-slate-400" />
                            </button>
                          </div>
                        )}
                        
                        {cred.loginUrl && (
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-slate-400" />
                            <span className="text-slate-600">ログインURL:</span>
                            <a href={cred.loginUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">
                              {cred.loginUrl}
                            </a>
                            <button onClick={() => copyToClipboard(cred.loginUrl!)} className="p-1 hover:bg-slate-100 rounded">
                              <Copy size={12} className="text-slate-400" />
                            </button>
                          </div>
                        )}
                        
                        {cred.username && (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="text-slate-600">ユーザー名:</span>
                            <span className="text-slate-800">{cred.username}</span>
                            <button onClick={() => copyToClipboard(cred.username!)} className="p-1 hover:bg-slate-100 rounded">
                              <Copy size={12} className="text-slate-400" />
                            </button>
                          </div>
                        )}
                        
                        {cred.password && (
                          <div className="flex items-center gap-2">
                            <Lock size={14} className="text-slate-400" />
                            <span className="text-slate-600">パスワード:</span>
                            <span className="text-slate-800 font-mono">
                              {showPassword[cred.id] ? cred.password : '••••••••'}
                            </span>
                            <button 
                              onClick={() => setShowPassword(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              {showPassword[cred.id] ? <EyeOff size={12} className="text-slate-400" /> : <Eye size={12} className="text-slate-400" />}
                            </button>
                            <button onClick={() => copyToClipboard(cred.password!)} className="p-1 hover:bg-slate-100 rounded">
                              <Copy size={12} className="text-slate-400" />
                            </button>
                          </div>
                        )}
                        
                        {cred.apiKey && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Key size={14} className="text-slate-400" />
                            <span className="text-slate-600">APIキー:</span>
                            <span className="text-slate-800 font-mono truncate max-w-[300px]">
                              {showApiKey[cred.id] ? cred.apiKey : '••••••••••••••••'}
                            </span>
                            <button 
                              onClick={() => setShowApiKey(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              {showApiKey[cred.id] ? <EyeOff size={12} className="text-slate-400" /> : <Eye size={12} className="text-slate-400" />}
                            </button>
                            <button onClick={() => copyToClipboard(cred.apiKey!)} className="p-1 hover:bg-slate-100 rounded">
                              <Copy size={12} className="text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {cred.notes && (
                        <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">{cred.notes}</p>
                      )}
                    </div>
                    
                    {canEdit && (
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => openModal(cred)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil size={16} className="text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(cred.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCredential ? 'サイト情報を編集' : 'サイト情報を追加'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">サイト名 *</label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="input-field"
                  required
                  placeholder="例: Google Analytics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">カテゴリ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">サイトURL</label>
                <input
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ログインURL</label>
                <input
                  type="url"
                  value={formData.loginUrl}
                  onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/login"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ユーザー名/ID</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">パスワード</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">APIキー</label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="input-field"
                  placeholder="API key or secret"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メモ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="追加情報やメモを入力"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  キャンセル
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingCredential ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface Company {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  representativeName?: string;
  establishedDate?: string;
  capital?: string;
  businessDescription?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  position?: string;
  createdAt: string;
}

type TabType = 'profile' | 'companies' | 'payment' | 'users' | 'credentials';

export function SettingsPage() {
  const { user, refetch } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyFormData, setCompanyFormData] = useState<Partial<Company>>({
    name: '',
    slug: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    address: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    representativeName: '',
    establishedDate: '',
    capital: '',
    businessDescription: '',
    bankName: '',
    bankBranch: '',
    bankAccountType: '普通',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    department: '',
    position: '',
  });

  const canManageCompanies = user && ['admin', 'ceo'].includes(user.role);
  const canViewCompanies = user && ['admin', 'ceo', 'manager'].includes(user.role);
  const canManageUsers = user && ['admin', 'ceo'].includes(user.role);

  useEffect(() => {
    if (canViewCompanies) {
      fetchCompanies();
    }
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canViewCompanies, canManageUsers]);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies');
    if (res.ok) {
      setCompanies(await res.json());
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        await refetch();
        setMessage({ type: 'success', text: 'アイコンを更新しました' });
      } else {
        setMessage({ type: 'error', text: 'アップロードに失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        await refetch();
        setMessage({ type: 'success', text: 'プロフィールを更新しました' });
      } else {
        setMessage({ type: 'error', text: '更新に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '新しいパスワードが一致しません' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword }),
      });

      if (res.ok) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'パスワードを変更しました' });
      } else {
        setMessage({ type: 'error', text: 'パスワードの変更に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies';
      const method = editingCompany ? 'PUT' : 'POST';
      
      const requestData = editingCompany 
        ? companyFormData 
        : { ...companyFormData, admin: adminFormData };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        fetchCompanies();
        setIsCompanyModalOpen(false);
        setEditingCompany(null);
        resetCompanyForm();
        setMessage({ type: 'success', text: editingCompany ? '会社情報を更新しました' : '会社と管理者アカウントを作成しました' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.message || '保存に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('この会社を削除しますか？')) return;

    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCompanies();
        setMessage({ type: 'success', text: '会社を削除しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name,
      slug: company.slug || '',
      logoUrl: company.logoUrl || '',
      primaryColor: company.primaryColor || '#3B82F6',
      secondaryColor: company.secondaryColor || '#1E40AF',
      address: company.address || '',
      phone: company.phone || '',
      fax: company.fax || '',
      email: company.email || '',
      website: company.website || '',
      representativeName: company.representativeName || '',
      establishedDate: company.establishedDate ? company.establishedDate.split('T')[0] : '',
      capital: company.capital || '',
      businessDescription: company.businessDescription || '',
      bankName: company.bankName || '',
      bankBranch: company.bankBranch || '',
      bankAccountType: company.bankAccountType || '普通',
      bankAccountNumber: company.bankAccountNumber || '',
      bankAccountHolder: company.bankAccountHolder || '',
    });
    setIsCompanyModalOpen(true);
  };

  const resetCompanyForm = () => {
    setCompanyFormData({
      name: '',
      slug: '',
      logoUrl: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      address: '',
      phone: '',
      fax: '',
      email: '',
      website: '',
      representativeName: '',
      establishedDate: '',
      capital: '',
      businessDescription: '',
      bankName: '',
      bankBranch: '',
      bankAccountType: '普通',
      bankAccountNumber: '',
      bankAccountHolder: '',
    });
    setAdminFormData({
      name: '',
      email: '',
      password: '',
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (editingUser) {
        const updateData: any = { ...userFormData };
        if (!updateData.password) delete updateData.password;
        
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          fetchUsers();
          setIsUserModalOpen(false);
          setEditingUser(null);
          resetUserForm();
          setMessage({ type: 'success', text: 'ユーザーを更新しました' });
        } else {
          setMessage({ type: 'error', text: '更新に失敗しました' });
        }
      } else {
        if (!userFormData.password) {
          setMessage({ type: 'error', text: 'パスワードを入力してください' });
          setIsLoading(false);
          return;
        }
        
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userFormData),
        });

        if (res.ok) {
          fetchUsers();
          setIsUserModalOpen(false);
          resetUserForm();
          setMessage({ type: 'success', text: 'ユーザーを作成しました' });
        } else {
          const data = await res.json();
          setMessage({ type: 'error', text: data.error || '作成に失敗しました' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === user?.id) {
      setMessage({ type: 'error', text: '自分自身は削除できません' });
      return;
    }
    if (!confirm('このユーザーを削除しますか？')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
        setMessage({ type: 'success', text: 'ユーザーを削除しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const openEditUserModal = (u: UserItem) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
      department: u.department || '',
      position: u.position || '',
    });
    setIsUserModalOpen(true);
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      department: '',
      position: '',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'ceo': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'staff': return 'bg-green-100 text-green-700';
      case 'agency': return 'bg-orange-100 text-orange-700';
      case 'client': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'ceo': return 'CEO';
      case 'manager': return 'マネージャー';
      case 'staff': return 'スタッフ';
      case 'agency': return '代理店';
      case 'client': return 'クライアント';
      default: return role;
    }
  };

  const isStaff = user?.role === 'staff';
  const tabs = [
    { id: 'profile' as TabType, label: 'プロフィール', icon: User },
    ...(canManageUsers ? [{ id: 'users' as TabType, label: 'ユーザー管理', icon: Users }] : []),
    ...(canViewCompanies ? [{ id: 'companies' as TabType, label: '会社情報', icon: Building2 }] : []),
    ...(!isStaff ? [{ id: 'payment' as TabType, label: '決済管理', icon: CreditCard }] : []),
    ...(!isStaff ? [{ id: 'credentials' as TabType, label: 'サイト情報', icon: Key }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">設定</h1>
        <p className="text-slate-500 text-sm mt-1">アカウントと会社の設定を管理</p>
      </div>

      {message && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center gap-3 animate-fade-in',
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-red-50 text-red-700 border border-red-100'
          )}
        >
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === tab.id ? "bg-primary-500 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-8">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-button">
                <User size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">プロフィール</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200">
                    {isUploadingAvatar ? (
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    ) : (
                      <Camera size={16} className="text-slate-600" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">プロフィール画像</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF（最大5MB）</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">名前</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1.5">メールアドレスは変更できません</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">部署</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">役職</label>
                <input
                  type="text"
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  保存
                </button>
              </div>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-100 to-white flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-soft">
                <Lock size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">パスワード変更</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">新しいパスワード</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 hover:shadow-soft flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                  変更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'companies' && canViewCompanies && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">登録会社一覧</h2>
            {canManageCompanies && (
              <button
                onClick={() => {
                  resetCompanyForm();
                  setEditingCompany(null);
                  setIsCompanyModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                会社を追加
              </button>
            )}
          </div>

          {companies.length > 0 ? (
            <div className="grid gap-4">
              {companies.map((company) => (
                <div key={company.id} className="card p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {company.logoUrl && (
                          <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-lg object-contain" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{company.name}</h3>
                          {company.slug && (
                            <p className="text-sm text-blue-600">{company.slug}.sinjapan-manager.com</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {company.address && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Building2 size={14} className="text-slate-400" />
                            {company.address}
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            {company.phone}
                          </div>
                        )}
                        {company.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            {company.email}
                          </div>
                        )}
                        {company.website && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Globe size={14} className="text-slate-400" />
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              {company.website}
                            </a>
                          </div>
                        )}
                        {company.representativeName && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <User size={14} className="text-slate-400" />
                            代表: {company.representativeName}
                          </div>
                        )}
                        {company.establishedDate && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar size={14} className="text-slate-400" />
                            設立: {format(new Date(company.establishedDate), 'yyyy年MM月dd日')}
                          </div>
                        )}
                        {company.bankName && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Landmark size={14} className="text-slate-400" />
                            {company.bankName} {company.bankBranch} {company.bankAccountType} {company.bankAccountNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    {canManageCompanies && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(company)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Building2 size={28} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">登録されている会社はありません</p>
              {canManageCompanies && (
                <button
                  onClick={() => {
                    resetCompanyForm();
                    setEditingCompany(null);
                    setIsCompanyModalOpen(true);
                  }}
                  className="mt-4 btn-primary"
                >
                  会社を追加
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && canManageUsers && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">ユーザー一覧</h2>
            <button
              onClick={() => {
                resetUserForm();
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              ユーザーを追加
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield size={16} />
                各ロールによってアクセスできる機能が異なります
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getRoleBadgeColor(u.role))}>
                          {getRoleLabel(u.role)}
                        </span>
                        {u.id === user?.id && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            あなた
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      {(u.department || u.position) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {u.department}{u.department && u.position && ' / '}{u.position}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditUserModal(u)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Shield size={18} className="text-primary-600" />
              ロール別アクセス権限
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-red-50 rounded-xl">
                <p className="font-medium text-red-700">管理者 / CEO</p>
                <p className="text-red-600 text-xs mt-1">全機能にアクセス可能</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="font-medium text-blue-700">マネージャー</p>
                <p className="text-blue-600 text-xs mt-1">顧客、タスク、従業員、ユーザー一覧</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="font-medium text-green-700">スタッフ</p>
                <p className="text-green-600 text-xs mt-1">自分の顧客、タスク、チャット</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="font-medium text-orange-700">代理店</p>
                <p className="text-orange-600 text-xs mt-1">売上、顧客、チャット</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-700">クライアント</p>
                <p className="text-slate-600 text-xs mt-1">書類、チャット、通知のみ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <PaymentTab />
      )}

      {activeTab === 'credentials' && (
        <SiteCredentialsTab />
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCompany ? '会社情報を編集' : '会社を追加'}
              </h2>
              <button
                onClick={() => {
                  setIsCompanyModalOpen(false);
                  setEditingCompany(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCompanySubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">会社名 *</label>
                <input
                  type="text"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Globe size={16} />
                  テナント設定（OEM）
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      サブドメイン（slug）
                      <span className="text-slate-400 font-normal ml-2">例: companya → companya.sinjapan-manager.com</span>
                    </label>
                    <input
                      type="text"
                      value={companyFormData.slug || ''}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="input-field"
                      placeholder="companya"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ロゴURL</label>
                    <input
                      type="url"
                      value={companyFormData.logoUrl || ''}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, logoUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">メインカラー</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={companyFormData.primaryColor || '#3B82F6'}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={companyFormData.primaryColor || '#3B82F6'}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, primaryColor: e.target.value })}
                          className="input-field flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">サブカラー</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={companyFormData.secondaryColor || '#1E40AF'}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, secondaryColor: e.target.value })}
                          className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={companyFormData.secondaryColor || '#1E40AF'}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, secondaryColor: e.target.value })}
                          className="input-field flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">代表者名</label>
                  <input
                    type="text"
                    value={companyFormData.representativeName}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, representativeName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">設立日</label>
                  <input
                    type="date"
                    value={companyFormData.establishedDate}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, establishedDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">住所</label>
                <input
                  type="text"
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                  <input
                    type="tel"
                    value={companyFormData.phone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">FAX</label>
                  <input
                    type="tel"
                    value={companyFormData.fax}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, fax: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス</label>
                  <input
                    type="email"
                    value={companyFormData.email}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Webサイト</label>
                  <input
                    type="url"
                    value={companyFormData.website}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                    className="input-field"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">資本金</label>
                <input
                  type="text"
                  value={companyFormData.capital}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, capital: e.target.value })}
                  className="input-field"
                  placeholder="10000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">事業内容</label>
                <textarea
                  value={companyFormData.businessDescription}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, businessDescription: e.target.value })}
                  className="input-field min-h-[80px]"
                  rows={3}
                />
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Landmark size={16} />
                  銀行口座情報
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">銀行名</label>
                    <input
                      type="text"
                      value={companyFormData.bankName}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, bankName: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">支店名</label>
                    <input
                      type="text"
                      value={companyFormData.bankBranch}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, bankBranch: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座種別</label>
                    <select
                      value={companyFormData.bankAccountType}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, bankAccountType: e.target.value })}
                      className="input-field"
                    >
                      <option value="普通">普通</option>
                      <option value="当座">当座</option>
                      <option value="貯蓄">貯蓄</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座番号</label>
                    <input
                      type="text"
                      value={companyFormData.bankAccountNumber}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, bankAccountNumber: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">口座名義</label>
                    <input
                      type="text"
                      value={companyFormData.bankAccountHolder}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, bankAccountHolder: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {!editingCompany && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <User size={16} />
                    初期管理者アカウント *
                  </h4>
                  <p className="text-sm text-green-600 mb-4">この会社の管理者としてログインできるアカウントを作成します</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">管理者名 *</label>
                      <input
                        type="text"
                        value={adminFormData.name}
                        onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス *</label>
                      <input
                        type="email"
                        value={adminFormData.email}
                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">パスワード *</label>
                      <input
                        type="password"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                        className="input-field"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-slate-400 mt-1">6文字以上</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompanyModalOpen(false);
                    setEditingCompany(null);
                  }}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingCompany ? '保存' : '会社と管理者を作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-slide-up my-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
              </h2>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">名前 *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="input-field"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-slate-400 mt-1">メールアドレスは変更できません</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  パスワード {editingUser ? '（変更する場合のみ）' : '*'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ロール *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="admin">管理者</option>
                  <option value="ceo">CEO</option>
                  <option value="manager">マネージャー</option>
                  <option value="staff">スタッフ</option>
                  <option value="agency">代理店</option>
                  <option value="client">クライアント</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
                  <input
                    type="text"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">部署</label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">役職</label>
                <input
                  type="text"
                  value={userFormData.position}
                  onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
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
