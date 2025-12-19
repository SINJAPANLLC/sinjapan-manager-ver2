import { useState } from 'react';
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
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

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

export function MarketingPage() {
  const [activeCategory, setActiveCategory] = useState('aio');

  const activeItem = categories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">マーケティング</h1>
          <p className="text-slate-500 mt-1">マーケティング施策の管理</p>
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

        <CategoryContent category={activeCategory} />
      </div>
    </div>
  );
}

function CategoryContent({ category }: { category: string }) {
  switch (category) {
    case 'aio':
      return <AioContent />;
    case 'seo':
      return <SeoContent />;
    case 'meo':
      return <MeoContent />;
    case 'hp':
      return <HpContent />;
    case 'sns':
      return <SnsContent />;
    case 'ads':
      return <AdsContent />;
    case 'external':
      return <ExternalContent />;
    case 'offline':
      return <OfflineContent />;
    case 'sales':
      return <SalesContent />;
    default:
      return <div className="text-center py-12 text-slate-500">カテゴリを選択してください</div>;
  }
}

function AioContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="AI最適化スコア" value="85" suffix="%" trend="+5%" />
        <StatCard title="AIコンテンツ数" value="24" suffix="件" trend="+3" />
        <StatCard title="AI生成記事" value="156" suffix="本" trend="+12" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <BarChart3 size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">AIを活用した最適化施策を管理します</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function SeoContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="インデックス済み" value="342" suffix="ページ" trend="+28" />
        <StatCard title="平均順位" value="12.4" suffix="位" trend="-2.1" positive />
        <StatCard title="オーガニック流入" value="8,542" suffix="回" trend="+15%" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Search size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">SEO記事・キーワード管理はAIページから行えます</p>
        <a href="/ai" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
          AIページへ移動 →
        </a>
      </div>
    </div>
  );
}

function MeoContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Googleビジネス" value="12" suffix="店舗" trend="+2" />
        <StatCard title="レビュー数" value="487" suffix="件" trend="+34" />
        <StatCard title="平均評価" value="4.6" suffix="★" trend="+0.2" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <MapPin size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">Googleマップでの店舗露出を最適化します</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function HpContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="サイト数" value="8" suffix="サイト" trend="+1" />
        <StatCard title="月間PV" value="125K" suffix="" trend="+18%" />
        <StatCard title="コンバージョン率" value="3.2" suffix="%" trend="+0.4%" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Monitor size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">ホームページの管理・分析を行います</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function SnsContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="フォロワー合計" value="45.2K" suffix="" trend="+2.3K" />
        <StatCard title="エンゲージメント率" value="4.8" suffix="%" trend="+0.6%" />
        <StatCard title="投稿数（今月）" value="86" suffix="件" trend="+12" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Share2 size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">SNSアカウントの運用管理を行います</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function AdsContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="広告費（今月）" value="¥1.2M" suffix="" trend="-5%" positive />
        <StatCard title="ROAS" value="320" suffix="%" trend="+15%" />
        <StatCard title="CV数" value="234" suffix="件" trend="+28" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Megaphone size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">リスティング・ディスプレイ広告を管理します</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function ExternalContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="掲載メディア" value="18" suffix="媒体" trend="+3" />
        <StatCard title="被リンク数" value="456" suffix="件" trend="+24" />
        <StatCard title="参照流入" value="3,245" suffix="回" trend="+8%" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <ExternalLink size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">外部メディア・プレスリリースを管理します</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function OfflineContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="イベント数" value="6" suffix="件" trend="+2" />
        <StatCard title="参加者数" value="1,234" suffix="人" trend="+156" />
        <StatCard title="名刺獲得" value="342" suffix="枚" trend="+48" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Users size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">展示会・セミナー等のオフライン施策を管理します</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function SalesContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="商談数（今月）" value="45" suffix="件" trend="+8" />
        <StatCard title="成約率" value="32" suffix="%" trend="+4%" />
        <StatCard title="成約金額" value="¥8.5M" suffix="" trend="+12%" />
      </div>
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Briefcase size={48} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">営業活動・商談管理を行います</p>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  suffix, 
  trend, 
  positive 
}: { 
  title: string; 
  value: string; 
  suffix: string; 
  trend: string;
  positive?: boolean;
}) {
  const isPositive = positive || trend.startsWith('+') || trend.startsWith('-') && title.includes('順位');
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-soft">
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
      <p className={cn(
        "text-xs mt-1",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {trend}
      </p>
    </div>
  );
}
