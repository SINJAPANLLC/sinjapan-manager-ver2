import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useTenant } from '../hooks/use-tenant';
import { Loader2, ArrowRight, Shield, User, Building2, Users } from 'lucide-react';
import { cn } from '../lib/utils';

const roleOptions = [
  { id: 'admin', label: '管理者', icon: Shield, color: 'from-violet-500 to-violet-600' },
  { id: 'staff', label: 'スタッフ', icon: User, color: 'from-emerald-500 to-emerald-600' },
  { id: 'agency', label: '代理店', icon: Building2, color: 'from-amber-500 to-amber-600' },
  { id: 'client', label: 'クライアント', icon: Users, color: 'from-sky-500 to-sky-600' },
];

export function LoginPage() {
  const { login } = useAuth();
  const { tenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
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
            アカウントにログイン
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              ログインタイプを選択
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-soft'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      isSelected ? role.color : 'from-slate-200 to-slate-300'
                    )}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary-700' : 'text-slate-600'
                    )}>
                      {role.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  ログイン中...
                </>
              ) : (
                <>
                  ログイン
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-3">アカウントをお持ちでない方</p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              新規アカウント登録
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
