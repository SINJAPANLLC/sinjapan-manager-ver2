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
  ShoppingCart
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

const categories = [
  { id: 'aio', label: 'AIO', icon: TrendingUp, description: 'AI最適化' },
  { id: 'seo', label: 'SEO', icon: Search, description: '検索エンジン最適化' },
  { id: 'meo', label: 'MEO', icon: MapPin, description: 'マップエンジン最適化' },
  { id: 'hp', label: 'HP', icon: Monitor, description: 'ホームページ' },
  { id: 'sns', label: 'SNS', icon: Share2, description: 'ソーシャルメディア' },
  { id: 'ads', label: '広告', icon: Megaphone, description: '広告運用' },
  { id: 'external', label: '外部', icon: ExternalLink, description: '外部メディア' },
  { id: 'offline', label: 'オフライン', icon: Users, description: 'オフライン施策' },
  { id: 'sales', label: '営業', icon: Briefcase, description: '営業活動' },
];

const platformOptions: Record<string, string[]> = {
  aio: ['ChatGPT', 'Perplexity', 'Claude', 'Gemini', 'その他'],
  seo: ['Google', 'Yahoo', 'Bing', 'その他'],
  meo: ['Googleマップ', 'Yahooマップ', 'その他'],
  hp: ['コーポレートサイト', 'LP', 'EC', 'ブログ', 'その他'],
  sns: ['X(Twitter)', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'LINE', 'LinkedIn', 'その他'],
  ads: ['Google Ads', 'Yahoo広告', 'Meta広告', 'X広告', 'TikTok広告', 'LINE広告', 'その他'],
  external: ['プレスリリース', 'メディア掲載', 'アフィリエイト', 'インフルエンサー', 'その他'],
  offline: ['展示会', 'セミナー', 'DM', 'チラシ', 'テレアポ', 'その他'],
  sales: ['新規営業', '既存顧客', '紹介', 'インバウンド', 'その他'],
};

export function MarketingPage() {
  const [activeCategory, setActiveCategory] = useState('aio');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const queryClient = useQueryClient();

  const activeItem = categories.find(c => c.id === activeCategory);

  const { data: campaigns = [], isLoading, error: campaignsError } = useQuery<MarketingCampaign[]>({
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
          <p className="text-slate-500 mt-1">マーケティング施策の管理</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          キャンペーン追加
        </button>
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
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button"
                  : "bg-white text-slate-600 hover:bg-primary-50 hover:text-primary-600 border border-slate-200"
              )}
            >
              <Icon size={18} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="キャンペーン数" 
            value={stats.totalCampaigns.toString()} 
            suffix="件"
            icon={<BarChart3 size={20} />}
          />
          <StatCard 
            title="予算合計" 
            value={formatCurrency(stats.totalBudget)} 
            suffix=""
            icon={<TrendingUp size={20} />}
          />
          <StatCard 
            title="インプレッション" 
            value={formatNumber(stats.totalImpressions)} 
            suffix=""
            icon={<Eye size={20} />}
          />
          <StatCard 
            title="コンバージョン" 
            value={stats.totalConversions.toString()} 
            suffix="件"
            icon={<ShoppingCart size={20} />}
          />
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          {activeItem && (
            <>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <activeItem.icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{activeItem.label}</h2>
                <p className="text-slate-500">{activeItem.description}</p>
              </div>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">読み込み中...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">キャンペーンがありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              最初のキャンペーンを作成 →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={() => setEditingCampaign(campaign)}
                onDelete={() => {
                  if (confirm('このキャンペーンを削除しますか？')) {
                    deleteMutation.mutate(campaign.id);
                  }
                }}
              />
            ))}
          </div>
        )}
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

function CampaignCard({ 
  campaign, 
  onEdit, 
  onDelete 
}: { 
  campaign: MarketingCampaign; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ctr = campaign.impressions > 0 
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) 
    : '0.00';
  const cvr = campaign.clicks > 0 
    ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              campaign.status === 'active' ? "bg-green-100 text-green-700" :
              campaign.status === 'paused' ? "bg-yellow-100 text-yellow-700" :
              "bg-slate-100 text-slate-600"
            )}>
              {campaign.status === 'active' ? '実施中' : 
               campaign.status === 'paused' ? '一時停止' : '終了'}
            </span>
          </div>
          {campaign.description && (
            <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>
          )}
          {campaign.platform && (
            <p className="text-xs text-slate-400 mt-1">プラットフォーム: {campaign.platform}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
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

function CampaignFormModal({
  campaign,
  category,
  platforms,
  onClose,
  onSubmit,
  isLoading,
}: {
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
          <h2 className="text-xl font-bold text-slate-800">
            {campaign ? 'キャンペーン編集' : 'キャンペーン追加'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                キャンペーン名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field w-full"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field w-full"
              >
                <option value="active">実施中</option>
                <option value="paused">一時停止</option>
                <option value="completed">終了</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                プラットフォーム
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="input-field w-full"
              >
                <option value="">選択してください</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                予算
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="input-field w-full"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                消化額
              </label>
              <input
                type="number"
                value={formData.spent}
                onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                className="input-field w-full"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field w-full"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ターゲットURL
              </label>
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                className="input-field w-full"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                インプレッション
              </label>
              <input
                type="number"
                value={formData.impressions}
                onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })}
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                クリック数
              </label>
              <input
                type="number"
                value={formData.clicks}
                onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })}
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                コンバージョン
              </label>
              <input
                type="number"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                売上
              </label>
              <input
                type="number"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                className="input-field w-full"
                placeholder="0"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                メモ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field w-full"
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              キャンセル
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? '保存中...' : campaign ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  suffix,
  icon
}: { 
  title: string; 
  value: string; 
  suffix: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="text-primary-500">{icon}</div>
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
  if (num >= 1000000) {
    return `¥${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `¥${(num / 1000).toFixed(0)}K`;
  }
  return `¥${num.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
