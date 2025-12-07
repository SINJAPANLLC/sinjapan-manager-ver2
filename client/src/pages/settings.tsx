import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { User, Lock, Save, Loader2, CheckCircle, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { user, refetch } = useAuth();
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
  const [seoDomain, setSeoDomain] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'ceo') {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.seo_domain) {
            setSeoDomain(data.seo_domain);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSeoDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'seo_domain', value: seoDomain }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'SEOドメインを更新しました' });
      } else {
        setMessage({ type: 'error', text: '更新に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">設定</h1>
        <p className="text-slate-500 text-sm mt-1">アカウント設定の管理</p>
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

      {(user?.role === 'admin' || user?.role === 'ceo') && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-soft">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">SEO設定</h2>
              <p className="text-xs text-slate-500">公開記事やサイトマップで使用するドメイン</p>
            </div>
          </div>
          <form onSubmit={handleSeoDomainSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">独自ドメイン</label>
              <input
                type="url"
                value={seoDomain}
                onChange={(e) => setSeoDomain(e.target.value)}
                placeholder="https://example.com"
                className="input-field"
              />
              <p className="text-xs text-slate-500 mt-2">
                SEO記事の公開ページ、canonical URL、サイトマップで使用されるドメインを設定します。<br />
                設定しない場合は現在のReplit URLが使用されます。
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>独自ドメインを設定するには：</strong><br />
                1. アプリを公開（デプロイ）する<br />
                2. Replit の「Deployments」タブで「Link a domain」を選択<br />
                3. ドメインレジストラで A/TXT レコードを設定<br />
                4. 上記の入力欄に独自ドメインを入力して保存
              </p>
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
      )}
    </div>
  );
}
