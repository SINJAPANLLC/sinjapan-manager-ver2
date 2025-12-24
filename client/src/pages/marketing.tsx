import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  Monitor, 
  Share2, 
  Megaphone, 
  ExternalLink, 
  Users, 
  Briefcase,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  X,
  Eye,
  MousePointer,
  ShoppingCart,
  Stethoscope,
  Wrench,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Image,
  Video,
  Globe,
  Mail,
  Phone,
  Printer,
  Target,
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MarketingCampaign {
  id: number;
  companyId: string | null;
  category: string;
  name: string;
  description: string | null;
  status: string;
  budget: string | null;
  spent: string | null;
  startDate: string | null;
  endDate: string | null;
  targetUrl: string | null;
  platform: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: string;
  totalSpent: string;
  totalRevenue: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
}

interface DiagnosticResult {
  score: number;
  items: { label: string; status: 'good' | 'warning' | 'error'; message: string }[];
  recommendations: string[];
}

const categories = [
  { id: 'aio', label: 'AIO', icon: TrendingUp, description: 'AI検索最適化' },
  { id: 'seo', label: 'SEO', icon: Search, description: 'Google検索最適化' },
  { id: 'meo', label: 'MEO', icon: MapPin, description: 'Googleマップ最適化' },
  { id: 'hp', label: 'HP', icon: Monitor, description: 'LP自動生成' },
  { id: 'sns', label: 'SNS', icon: Share2, description: 'SNS運用管理' },
  { id: 'ads', label: '広告', icon: Megaphone, description: '広告キャンペーン' },
  { id: 'external', label: '外部', icon: ExternalLink, description: 'PR・インフルエンサー' },
  { id: 'offline', label: 'オフライン', icon: Users, description: '印刷物・看板' },
  { id: 'sales', label: '営業', icon: Briefcase, description: '営業・代理店・アフィリ' },
];

const BLUE_GRADIENT = 'from-blue-500 to-indigo-600';

const platformOptions: Record<string, string[]> = {
  aio: ['ChatGPT', 'Perplexity', 'Claude', 'Gemini', 'Copilot', 'その他'],
  seo: ['Google', 'Yahoo', 'Bing', 'その他'],
  meo: ['Googleマップ', 'Yahooマップ', 'Apple Maps', 'その他'],
  hp: ['コーポレートサイト', 'LP', 'EC', 'ブログ', 'ポートフォリオ', 'その他'],
  sns: ['X(Twitter)', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'LINE', 'LinkedIn', 'Threads', 'その他'],
  ads: ['Google Ads', 'Yahoo広告', 'Meta広告', 'X広告', 'TikTok広告', 'LINE広告', 'Microsoft広告', 'その他'],
  external: ['PRTIMES', 'ValuePress', 'インフルエンサー', 'ポータルサイト', 'アフィリエイト', 'その他'],
  offline: ['看板', '名刺', 'チラシ', 'パンフレット', 'ポスター', 'DM', 'のぼり', 'その他'],
  sales: ['新規営業', '既存顧客', '代理店', 'アフィリエイト', '紹介', 'テレアポ', 'その他'],
};

export function MarketingPage() {
  const [activeCategory, setActiveCategory] = useState('aio');
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'improve' | 'auto' | 'campaigns'>('diagnosis');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const queryClient = useQueryClient();

  const activeItem = categories.find(c => c.id === activeCategory);

  const { data: campaigns = [], isLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['/api/marketing/campaigns', activeCategory],
    queryFn: async () => {
      const res = await fetch(`/api/marketing/campaigns?category=${activeCategory}`);
      if (!res.ok) throw new Error('キャンペーンの取得に失敗しました');
      return res.json();
    },
  });

  const { data: stats } = useQuery<MarketingStats>({
    queryKey: ['/api/marketing/stats', activeCategory],
    queryFn: async () => {
      const res = await fetch(`/api/marketing/stats?category=${activeCategory}`);
      if (!res.ok) throw new Error('統計の取得に失敗しました');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<MarketingCampaign>) => {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, category: activeCategory }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'キャンペーンの作成に失敗しました' }));
        throw new Error(error.error || 'キャンペーンの作成に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/stats'] });
      setShowForm(false);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MarketingCampaign> }) => {
      const res = await fetch(`/api/marketing/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'キャンペーンの更新に失敗しました' }));
        throw new Error(error.error || 'キャンペーンの更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/stats'] });
      setEditingCampaign(null);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/marketing/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'キャンペーンの削除に失敗しました' }));
        throw new Error(error.error || 'キャンペーンの削除に失敗しました');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/stats'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">マーケティング</h1>
          <p className="text-slate-500 mt-1">診断・改善・自動実施</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200",
                isActive
                  ? `bg-gradient-to-r ${BLUE_GRADIENT} text-white shadow-button`
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              )}
            >
              <Icon size={18} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className={cn("p-6 bg-gradient-to-r text-white", BLUE_GRADIENT)}>
          <div className="flex items-center gap-4">
            {activeItem && (
              <>
                <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm">
                  <activeItem.icon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{activeItem.label}</h2>
                  <p className="text-white/80">{activeItem.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-b border-slate-100">
          <div className="flex">
            {[
              { id: 'diagnosis', label: '診断', icon: Stethoscope },
              { id: 'improve', label: '改善', icon: Wrench },
              { id: 'auto', label: '自動実施', icon: Zap },
              { id: 'campaigns', label: 'キャンペーン', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600 bg-blue-50"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'diagnosis' && (
            <DiagnosisPanel category={activeCategory} />
          )}
          {activeTab === 'improve' && (
            <ImprovementPanel category={activeCategory} />
          )}
          {activeTab === 'auto' && (
            <AutomationPanel category={activeCategory} />
          )}
          {activeTab === 'campaigns' && (
            <CampaignsPanel 
              campaigns={campaigns}
              stats={stats}
              isLoading={isLoading}
              category={activeCategory}
              onAddCampaign={() => setShowForm(true)}
              onEditCampaign={(c) => setEditingCampaign(c)}
              onDeleteCampaign={(id) => {
                if (confirm('このキャンペーンを削除しますか？')) {
                  deleteMutation.mutate(id);
                }
              }}
            />
          )}
        </div>
      </div>

      {(showForm || editingCampaign) && (
        <CampaignFormModal
          campaign={editingCampaign}
          category={activeCategory}
          platforms={platformOptions[activeCategory] || []}
          onClose={() => {
            setShowForm(false);
            setEditingCampaign(null);
          }}
          onSubmit={(data) => {
            if (editingCampaign) {
              updateMutation.mutate({ id: editingCampaign.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function DiagnosisPanel({ category }: { category: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [inputKeywords, setInputKeywords] = useState('');

  const runDiagnosis = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/marketing/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, url: inputUrl, keywords: inputKeywords }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '診断に失敗しました' }));
        throw new Error(err.error || '診断に失敗しました');
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '診断に失敗しました。しばらくしてから再度お試しください。');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const categoryLabels: Record<string, { title: string; placeholder: string; keywordsLabel: string }> = {
    aio: { title: 'AI検索診断', placeholder: 'サイトURLまたはブランド名', keywordsLabel: 'AI検索で表示させたいキーワード' },
    seo: { title: 'SEO診断', placeholder: '診断するページURL', keywordsLabel: '上位表示させたいキーワード' },
    meo: { title: 'MEO診断', placeholder: 'ビジネス名またはGoogleビジネスプロフィールURL', keywordsLabel: '地域キーワード（例：渋谷 カフェ）' },
    hp: { title: 'HP診断', placeholder: 'サイトURL', keywordsLabel: 'ターゲットキーワード' },
    sns: { title: 'SNS診断', placeholder: 'SNSアカウントURL', keywordsLabel: 'ハッシュタグ・キーワード' },
    ads: { title: '広告診断', placeholder: '広告出稿URL', keywordsLabel: '広告キーワード' },
    external: { title: '外部メディア診断', placeholder: 'サイトURLまたはブランド名', keywordsLabel: 'メディア露出キーワード' },
    offline: { title: 'オフライン診断', placeholder: '店舗名・ビジネス名', keywordsLabel: 'ターゲットエリア' },
    sales: { title: '営業診断', placeholder: 'サービス・商品名', keywordsLabel: 'ターゲット業界・顧客層' },
  };

  const labels = categoryLabels[category] || categoryLabels.seo;

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-800 mb-4">{labels.title}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL / 名前
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={labels.placeholder}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {labels.keywordsLabel}
            </label>
            <input
              type="text"
              value={inputKeywords}
              onChange={(e) => setInputKeywords(e.target.value)}
              placeholder="カンマ区切りで入力"
              className="input-field w-full"
            />
          </div>
          <button
            onClick={runDiagnosis}
            disabled={isRunning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                診断中...
              </>
            ) : (
              <>
                <Stethoscope size={18} />
                診断を実行
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="font-medium text-red-700">エラーが発生しました</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - result.score / 100)}
                  className={cn(
                    "transition-all duration-1000",
                    result.score >= 80 ? "text-green-500" :
                    result.score >= 60 ? "text-yellow-500" : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-slate-800">{result.score}</span>
                <span className="text-sm text-slate-500">点</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {result.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                {item.status === 'good' && <CheckCircle className="text-green-500" size={20} />}
                {item.status === 'warning' && <AlertCircle className="text-yellow-500" size={20} />}
                {item.status === 'error' && <X className="text-red-500" size={20} />}
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Sparkles size={18} />
              改善提案
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                  <ChevronRight size={16} className="mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ImprovementPanel({ category }: { category: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputTopic, setInputTopic] = useState('');

  const improvements: Record<string, { title: string; actions: { icon: any; label: string; description: string }[] }> = {
    aio: {
      title: 'AI検索での露出を改善',
      actions: [
        { icon: FileText, label: 'AI向けコンテンツ生成', description: 'AIが理解しやすい構造化コンテンツを生成' },
        { icon: Target, label: 'キーワード最適化', description: 'AI検索で上位表示されるキーワード提案' },
        { icon: Globe, label: 'FAQ生成', description: 'よくある質問と回答を自動生成' },
      ],
    },
    seo: {
      title: 'Google検索での順位を改善',
      actions: [
        { icon: FileText, label: 'SEO記事生成', description: 'キーワードに最適化された記事を生成' },
        { icon: Target, label: 'メタタグ最適化', description: 'タイトル・ディスクリプションを改善' },
        { icon: Globe, label: '内部リンク提案', description: '関連ページへのリンクを提案' },
      ],
    },
    meo: {
      title: 'Googleマップでの表示を改善',
      actions: [
        { icon: FileText, label: 'ビジネス説明文生成', description: 'Googleビジネスプロフィールの説明文を最適化' },
        { icon: Image, label: '投稿コンテンツ生成', description: 'Googleビジネス用の投稿を生成' },
        { icon: Target, label: 'レビュー返信テンプレート', description: 'レビューへの返信文を生成' },
      ],
    },
    hp: {
      title: 'ランディングページを作成',
      actions: [
        { icon: Monitor, label: 'LP自動生成', description: 'コンバージョン最適化されたLPを生成' },
        { icon: FileText, label: 'コピーライティング', description: '訴求力のあるテキストを生成' },
        { icon: Target, label: 'CTAボタン最適化', description: '効果的なCTAを提案' },
      ],
    },
    sns: {
      title: 'SNS投稿を改善',
      actions: [
        { icon: FileText, label: '投稿文生成', description: '各プラットフォーム向けの投稿を生成' },
        { icon: Image, label: '画像キャプション', description: '画像に最適なキャプションを生成' },
        { icon: Target, label: 'ハッシュタグ提案', description: '効果的なハッシュタグを提案' },
      ],
    },
    ads: {
      title: '広告を改善',
      actions: [
        { icon: FileText, label: '広告コピー生成', description: 'クリック率の高い広告文を生成' },
        { icon: Target, label: 'キーワード提案', description: '広告に効果的なキーワードを提案' },
        { icon: Image, label: 'バナー案', description: '広告バナーのコンセプトを提案' },
      ],
    },
    external: {
      title: '外部露出を改善',
      actions: [
        { icon: FileText, label: 'プレスリリース生成', description: 'PRTIMES向けプレスリリースを生成' },
        { icon: Mail, label: 'インフルエンサーピッチ', description: 'インフルエンサーへの提案文を生成' },
        { icon: Target, label: 'メディアリスト', description: '関連メディアリストを提案' },
      ],
    },
    offline: {
      title: 'オフライン素材を作成',
      actions: [
        { icon: Printer, label: 'チラシ文面生成', description: 'チラシ用のキャッチコピーを生成' },
        { icon: FileText, label: '名刺デザイン案', description: '名刺のコンセプトを提案' },
        { icon: Target, label: '看板コピー', description: '看板用のキャッチコピーを生成' },
      ],
    },
    sales: {
      title: '営業活動を改善',
      actions: [
        { icon: Mail, label: '営業メール生成', description: '効果的な営業メールを生成' },
        { icon: FileText, label: '提案書テンプレート', description: '提案書の構成を生成' },
        { icon: Phone, label: 'トークスクリプト', description: '電話営業用スクリプトを生成' },
      ],
    },
  };

  const categoryActions = improvements[category] || improvements.seo;

  const generateContent = async (actionLabel: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, action: actionLabel, topic: inputTopic }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '生成に失敗しました' }));
        throw new Error(err.error || '生成に失敗しました');
      }
      const data = await res.json();
      setGeneratedContent(data.content);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成に失敗しました。しばらくしてから再度お試しください。');
      setGeneratedContent(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-800 mb-4">{categoryActions.title}</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            トピック・キーワード
          </label>
          <input
            type="text"
            value={inputTopic}
            onChange={(e) => setInputTopic(e.target.value)}
            placeholder="改善したいトピックを入力"
            className="input-field w-full"
          />
        </div>
        <div className="grid gap-3">
          {categoryActions.actions.map((action, i) => (
            <button
              key={i}
              onClick={() => generateContent(action.label)}
              disabled={isGenerating}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
            >
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <action.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{action.label}</p>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
              {isGenerating ? (
                <Loader2 size={20} className="animate-spin text-blue-600" />
              ) : (
                <Sparkles size={20} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="font-medium text-red-700">エラーが発生しました</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {generatedContent && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800">生成結果</h4>
            <button
              onClick={() => navigator.clipboard.writeText(generatedContent)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              コピー
            </button>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700">
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  );
}

function AutomationPanel({ category }: { category: string }) {
  const [automations, setAutomations] = useState<{ id: string; name: string; status: 'active' | 'paused'; lastRun: string }[]>([]);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{ automationId: string; content: string } | null>(null);
  const [inputTopic, setInputTopic] = useState('');

  const automationOptions: Record<string, { title: string; items: { id: string; name: string; description: string; icon: any }[] }> = {
    aio: {
      title: 'AI検索自動最適化',
      items: [
        { id: 'aio-faq', name: 'FAQ自動更新', description: 'よくある質問を定期的に更新', icon: Bot },
        { id: 'aio-content', name: 'コンテンツ自動生成', description: 'AI検索向けコンテンツを定期生成', icon: FileText },
        { id: 'aio-monitor', name: 'AI検索モニタリング', description: 'AI検索での表示状況を監視', icon: Eye },
      ],
    },
    seo: {
      title: 'SEO自動最適化',
      items: [
        { id: 'seo-article', name: '記事自動生成', description: '毎日SEO記事を自動生成', icon: FileText },
        { id: 'seo-index', name: '自動インデックス送信', description: '新規ページを自動でGoogle登録', icon: Send },
        { id: 'seo-rank', name: '順位モニタリング', description: 'キーワード順位を毎日チェック', icon: BarChart3 },
      ],
    },
    meo: {
      title: 'MEO自動最適化',
      items: [
        { id: 'meo-post', name: '投稿自動生成', description: 'Googleビジネス投稿を定期生成', icon: FileText },
        { id: 'meo-review', name: 'レビュー自動返信', description: 'レビューに自動で返信', icon: Mail },
        { id: 'meo-photo', name: '写真投稿リマインド', description: '写真投稿のリマインダー', icon: Image },
      ],
    },
    hp: {
      title: 'HP自動更新',
      items: [
        { id: 'hp-lp', name: 'LP自動生成', description: '新商品・キャンペーン用LP自動作成', icon: Monitor },
        { id: 'hp-ab', name: 'A/Bテスト自動実行', description: 'コンバージョン改善のテスト', icon: Target },
        { id: 'hp-update', name: 'コンテンツ自動更新', description: '古いコンテンツを定期更新', icon: RefreshCw },
      ],
    },
    sns: {
      title: 'SNS自動投稿',
      items: [
        { id: 'sns-post', name: '投稿自動生成・配信', description: '各SNSに定期的に投稿', icon: Send },
        { id: 'sns-reply', name: 'コメント自動返信', description: 'コメントに自動で返信', icon: Mail },
        { id: 'sns-dm', name: 'DM自動応答', description: 'DMに自動で対応', icon: Bot },
      ],
    },
    ads: {
      title: '広告自動運用',
      items: [
        { id: 'ads-optimize', name: '入札自動最適化', description: '入札単価を自動調整', icon: Target },
        { id: 'ads-creative', name: 'クリエイティブ自動テスト', description: '広告クリエイティブのA/Bテスト', icon: Image },
        { id: 'ads-report', name: 'レポート自動生成', description: '広告レポートを定期生成', icon: FileText },
      ],
    },
    external: {
      title: '外部連携自動化',
      items: [
        { id: 'ext-pr', name: 'プレスリリース自動配信', description: 'PRTIMESへの定期配信', icon: Send },
        { id: 'ext-influencer', name: 'インフルエンサー自動マッチング', description: '最適なインフルエンサーを提案', icon: Users },
        { id: 'ext-mention', name: 'メンション監視', description: 'ブランドメンションを監視', icon: Eye },
      ],
    },
    offline: {
      title: 'オフライン自動化',
      items: [
        { id: 'off-design', name: 'デザイン自動生成', description: 'チラシ・名刺デザインを自動生成', icon: Printer },
        { id: 'off-order', name: '印刷自動発注', description: '在庫が少なくなったら自動発注', icon: ShoppingCart },
        { id: 'off-track', name: '配布効果測定', description: 'QRコードで配布効果を測定', icon: BarChart3 },
      ],
    },
    sales: {
      title: '営業自動化',
      items: [
        { id: 'sales-email', name: 'メール自動送信', description: 'フォローアップメールを自動送信', icon: Mail },
        { id: 'sales-lead', name: 'リード自動スコアリング', description: 'リードの優先度を自動判定', icon: Target },
        { id: 'sales-report', name: '営業レポート自動生成', description: '営業活動レポートを自動生成', icon: FileText },
      ],
    },
  };

  const options = automationOptions[category] || automationOptions.seo;

  const executeAutomation = async (id: string, name: string) => {
    setIsExecuting(id);
    try {
      const res = await fetch('/api/marketing/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, automationId: id, topic: inputTopic }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '実行に失敗しました' }));
        throw new Error(err.error || '実行に失敗しました');
      }
      
      const data = await res.json();
      setExecutionResult({ automationId: id, content: data.content });
      
      const existing = automations.find(a => a.id === id);
      const now = new Date().toLocaleString('ja-JP');
      if (existing) {
        setAutomations(automations.map(a => 
          a.id === id ? { ...a, status: 'active', lastRun: now } : a
        ));
      } else {
        setAutomations([...automations, { id, name, status: 'active', lastRun: now }]);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || '自動化の実行に失敗しました');
    } finally {
      setIsExecuting(null);
    }
  };

  const toggleAutomation = (id: string, name: string) => {
    const existing = automations.find(a => a.id === id);
    if (existing) {
      if (existing.status === 'active') {
        setAutomations(automations.map(a => 
          a.id === id ? { ...a, status: 'paused' } : a
        ));
      } else {
        executeAutomation(id, name);
      }
    } else {
      executeAutomation(id, name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${BLUE_GRADIENT} text-white`}>
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{options.title}</h3>
            <p className="text-sm text-slate-500">自動化を設定して効率化</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            トピック・キーワード（任意）
          </label>
          <input
            type="text"
            value={inputTopic}
            onChange={(e) => setInputTopic(e.target.value)}
            placeholder="ビジネス名や商品名を入力（例：カフェ、IT企業）"
            className="input-field w-full"
          />
        </div>

        <div className="space-y-3">
          {options.items.map((item) => {
            const automation = automations.find(a => a.id === item.id);
            const isActive = automation?.status === 'active';
            
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  isActive 
                    ? "bg-green-50 border-green-200" 
                    : "bg-white border-slate-200"
                )}
              >
                <div className={cn(
                  "p-3 rounded-lg",
                  isActive ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                )}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                  {automation && (
                    <p className="text-xs text-slate-400 mt-1">
                      最終実行: {automation.lastRun}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleAutomation(item.id, item.name)}
                  disabled={isExecuting === item.id}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2",
                    isExecuting === item.id
                      ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                      : isActive
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isExecuting === item.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      実行中...
                    </>
                  ) : isActive ? '停止' : '開始'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {automations.filter(a => a.status === 'active').length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} />
            実行中の自動化
          </h4>
          <div className="space-y-2">
            {automations.filter(a => a.status === 'active').map((auto) => (
              <div key={auto.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">{auto.name}</span>
                <span className="text-xs text-green-600 ml-auto">稼働中</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {executionResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              生成結果
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(executionResult.content)}
                className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                コピー
              </button>
              <button
                onClick={() => setExecutionResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700 max-h-96 overflow-y-auto">
            {executionResult.content}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignsPanel({ 
  campaigns, 
  stats, 
  isLoading, 
  category,
  onAddCampaign,
  onEditCampaign,
  onDeleteCampaign,
}: { 
  campaigns: MarketingCampaign[];
  stats?: MarketingStats;
  isLoading: boolean;
  category: string;
  onAddCampaign: () => void;
  onEditCampaign: (campaign: MarketingCampaign) => void;
  onDeleteCampaign: (id: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">キャンペーン管理</h3>
        <button onClick={onAddCampaign} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          キャンペーン追加
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="キャンペーン数" value={stats.totalCampaigns.toString()} suffix="件" icon={<BarChart3 size={20} />} />
          <StatCard title="予算合計" value={formatCurrency(stats.totalBudget)} suffix="" icon={<TrendingUp size={20} />} />
          <StatCard title="インプレッション" value={formatNumber(stats.totalImpressions)} suffix="" icon={<Eye size={20} />} />
          <StatCard title="コンバージョン" value={stats.totalConversions.toString()} suffix="件" icon={<ShoppingCart size={20} />} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">読み込み中...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">キャンペーンがありません</p>
          <button onClick={onAddCampaign} className="mt-4 text-blue-600 hover:text-blue-700">
            最初のキャンペーンを作成 →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => onEditCampaign(campaign)}
              onDelete={() => onDeleteCampaign(campaign.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign, onEdit, onDelete }: { campaign: MarketingCampaign; onEdit: () => void; onDelete: () => void; }) {
  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
  const cvr = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              campaign.status === 'active' ? "bg-green-100 text-green-700" :
              campaign.status === 'paused' ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"
            )}>
              {campaign.status === 'active' ? '実施中' : campaign.status === 'paused' ? '一時停止' : '終了'}
            </span>
          </div>
          {campaign.description && <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>}
          {campaign.platform && <p className="text-xs text-slate-400 mt-1">プラットフォーム: {campaign.platform}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400">予算</p>
          <p className="font-semibold text-slate-700">{formatCurrency(campaign.budget)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">インプレッション</p>
          <p className="font-semibold text-slate-700">{formatNumber(campaign.impressions)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">クリック (CTR)</p>
          <p className="font-semibold text-slate-700">{formatNumber(campaign.clicks)} ({ctr}%)</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">CV (CVR)</p>
          <p className="font-semibold text-slate-700">{campaign.conversions} ({cvr}%)</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">売上</p>
          <p className="font-semibold text-green-600">{formatCurrency(campaign.revenue)}</p>
        </div>
      </div>
    </div>
  );
}

function CampaignFormModal({ campaign, category, platforms, onClose, onSubmit, isLoading }: {
  campaign: MarketingCampaign | null;
  category: string;
  platforms: string[];
  onClose: () => void;
  onSubmit: (data: Partial<MarketingCampaign>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    status: campaign?.status || 'active',
    platform: campaign?.platform || '',
    budget: campaign?.budget || '',
    spent: campaign?.spent || '',
    targetUrl: campaign?.targetUrl || '',
    impressions: campaign?.impressions || 0,
    clicks: campaign?.clicks || 0,
    conversions: campaign?.conversions || 0,
    revenue: campaign?.revenue || '',
    notes: campaign?.notes || '',
    startDate: campaign?.startDate ? campaign.startDate.split('T')[0] : '',
    endDate: campaign?.endDate ? campaign.endDate.split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{campaign ? 'キャンペーン編集' : 'キャンペーン追加'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">キャンペーン名 *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field w-full" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">説明</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field w-full" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ステータス</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field w-full">
                <option value="active">実施中</option>
                <option value="paused">一時停止</option>
                <option value="completed">終了</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">プラットフォーム</label>
              <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="input-field w-full">
                <option value="">選択してください</option>
                {platforms.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">予算</label>
              <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="input-field w-full" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">消化額</label>
              <input type="number" value={formData.spent} onChange={(e) => setFormData({ ...formData, spent: e.target.value })} className="input-field w-full" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">開始日</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">終了日</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field w-full" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ターゲットURL</label>
              <input type="url" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} className="input-field w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">インプレッション</label>
              <input type="number" value={formData.impressions} onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">クリック数</label>
              <input type="number" value={formData.clicks} onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">コンバージョン</label>
              <input type="number" value={formData.conversions} onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">売上</label>
              <input type="number" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} className="input-field w-full" placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field w-full" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">キャンセル</button>
            <button type="submit" disabled={isLoading} className="btn-primary">{isLoading ? '保存中...' : campaign ? '更新' : '作成'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix, icon }: { title: string; value: string; suffix: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="text-blue-500">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
    </div>
  );
}

function formatCurrency(value: string | null): string {
  if (!value || value === '0') return '¥0';
  const num = parseFloat(value);
  if (num >= 1000000) return `¥${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `¥${(num / 1000).toFixed(0)}K`;
  return `¥${num.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}
