import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTenant } from '../hooks/use-tenant';
import { Loader2, ArrowRight, ArrowLeft, User, Building2, Users, Mail, Lock, Phone, UserCircle, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';

const roleOptions = [
  { id: 'staff', label: 'スタッフ', icon: User, color: 'from-emerald-500 to-emerald-600', description: '社内スタッフとして登録' },
  { id: 'agency', label: '代理店', icon: Building2, color: 'from-amber-500 to-amber-600', description: '代理店パートナーとして登録' },
  { id: 'client', label: 'クライアント', icon: Users, color: 'from-sky-500 to-sky-600', description: 'クライアントとして登録' },
];

export function RegisterPage() {
  const { tenant } = useTenant();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedRole) {
      setError('ロールを選択してください');
      return;
    }

    if (!agreedToTerms) {
      setError('利用規約とプライバシーポリシーに同意してください');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (form.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '登録に失敗しました');
      }

      setSuccess('登録が完了しました。管理者の承認をお待ちください。承認後にログインできるようになります。');
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-100/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          {tenant?.logoUrl && (
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name} 
              className="w-16 h-16 object-contain mx-auto mb-4 rounded-xl"
            />
          )}
          <h1 className="text-3xl font-bold gradient-text">{tenant?.name || 'SIN JAPAN'}</h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide text-sm">MANAGER SYSTEM</p>
        </div>

        <div className="glass-card rounded-3xl shadow-card p-8">
          <h2 className="text-xl font-semibold text-slate-800 text-center mb-6">
            新規アカウント登録
          </h2>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                登録タイプを選択
              </label>
              <div className="space-y-3">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-soft'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                        isSelected ? role.color : 'from-slate-200 to-slate-300'
                      )}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          'font-semibold block',
                          isSelected ? 'text-primary-700' : 'text-slate-700'
                        )}>
                          {role.label}
                        </span>
                        <span className="text-xs text-slate-500">{role.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedRole}
                onClick={() => setStep(2)}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
              >
                次へ
                <ArrowRight size={18} />
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setLocation('/login')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  既にアカウントをお持ちですか？ログイン
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-medium animate-fade-in">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <UserCircle size={14} />
                  お名前 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="山田 太郎"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Mail size={14} />
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Phone size={14} />
                  電話番号
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Lock size={14} />
                  パスワード *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="6文字以上"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Lock size={14} />
                  パスワード確認 *
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="パスワードを再入力"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 text-left',
                    agreedToTerms
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  {agreedToTerms ? (
                    <CheckSquare size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square size={20} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-700">
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-700 underline font-medium"
                    >
                      利用規約
                    </a>
                    {' '}および{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-700 underline font-medium"
                    >
                      プライバシーポリシー
                    </a>
                    {' '}に同意します
                  </span>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !agreedToTerms}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      アカウント登録
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
