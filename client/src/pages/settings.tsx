import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { User, Lock, Save, Loader2, CheckCircle, Building2, CreditCard, Plus, Pencil, Trash2, X, Phone, Mail, Globe, Landmark, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Company {
  id: number;
  name: string;
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
  logoUrl?: string;
}

type TabType = 'profile' | 'companies' | 'payment';

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

  const canManageCompanies = user && ['admin', 'ceo'].includes(user.role);
  const canViewCompanies = user && ['admin', 'ceo', 'manager'].includes(user.role);

  useEffect(() => {
    if (canViewCompanies) {
      fetchCompanies();
    }
  }, [canViewCompanies]);

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies');
    if (res.ok) {
      setCompanies(await res.json());
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
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyFormData),
      });

      if (res.ok) {
        fetchCompanies();
        setIsCompanyModalOpen(false);
        setEditingCompany(null);
        resetCompanyForm();
        setMessage({ type: 'success', text: editingCompany ? '会社情報を更新しました' : '会社を追加しました' });
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
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
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'プロフィール', icon: User },
    ...(canViewCompanies ? [{ id: 'companies' as TabType, label: '会社情報', icon: Building2 }] : []),
    { id: 'payment' as TabType, label: '決済管理', icon: CreditCard },
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
                      <h3 className="text-lg font-bold text-slate-800">{company.name}</h3>
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

      {activeTab === 'payment' && (
        <div className="max-w-2xl">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <CreditCard size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">決済管理</h3>
            <p className="text-slate-500 mb-4">Square決済の連携設定を行います</p>
            <p className="text-sm text-slate-400">Coming Soon - Square APIキーの設定機能を準備中です</p>
          </div>
        </div>
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
