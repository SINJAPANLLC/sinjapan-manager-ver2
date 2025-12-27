import { useState } from 'react';
import { GraduationCap, BookOpen, Brain, TrendingUp, Lightbulb, Loader2, ChevronDown, ChevronUp, RefreshCw, DollarSign, Users, Scale, Megaphone, Settings, AlertTriangle, Code, Cpu, Briefcase, Languages } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const CATEGORIES = [
  {
    id: 'psychology',
    name: '心理学',
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    topics: [
      '認知心理学', '行動心理学', '社会心理学', '発達心理学', '臨床心理学',
      'ポジティブ心理学', '産業・組織心理学', '消費者心理学', 'パーソナリティ理論',
      '動機づけ理論', '学習理論', '記憶と認知', 'ストレスと対処', '感情心理学',
    ],
  },
  {
    id: 'finance',
    name: '金融学',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    topics: [
      'コーポレートファイナンス', '投資理論・ポートフォリオ理論', 'デリバティブ・金融工学',
      'バリュエーション（企業価値評価）', 'M&A・事業再編', '資本市場・IPO',
      'リスクマネジメント', '行動ファイナンス', '国際金融・為替', 'ベンチャーキャピタル・PE',
      '不動産金融・REIT', 'ストラクチャードファイナンス', '金融規制・コンプライアンス',
      'ESG投資・サステナブルファイナンス', 'フィンテック・DeFi',
    ],
  },
  {
    id: 'management_adv',
    name: 'マネジメント学',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    topics: [
      '戦略的経営論', '組織行動論', '変革マネジメント', 'タレントマネジメント',
      'パフォーマンスマネジメント', 'クロスファンクショナルチーム管理', 'アジャイル経営',
      'ナレッジマネジメント', 'グローバルマネジメント', 'エグゼクティブリーダーシップ',
      'ステークホルダーマネジメント', '意思決定論', 'コンフリクトマネジメント',
      'ダイバーシティ&インクルージョン', 'サクセッションプランニング',
    ],
  },
  {
    id: 'law',
    name: '法律',
    icon: Scale,
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    topics: [
      '会社法・商法', '契約法', '労働法', '知的財産法', '独占禁止法・競争法',
      '金融商品取引法', '個人情報保護法・GDPR', 'コーポレートガバナンス法制',
      'M&A法務', 'スタートアップ法務', '国際取引法', '倒産法・事業再生',
      'コンプライアンス体制', 'リスク法務', 'AI・テクノロジー法',
    ],
  },
  {
    id: 'marketing',
    name: 'マーケティング学',
    icon: Megaphone,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50',
    topics: [
      'ブランドマネジメント', 'デジタルマーケティング戦略', 'カスタマージャーニー設計',
      'データドリブンマーケティング', 'グロースハック', 'コンテンツマーケティング',
      'インフルエンサーマーケティング', 'B2Bマーケティング', 'プロダクトマーケティング',
      'プライシング戦略', '顧客獲得・LTV最適化', 'マーケティングROI分析',
      'ニューロマーケティング', 'グローバルマーケティング', 'サステナブルマーケティング',
    ],
  },
  {
    id: 'operations',
    name: 'オペレーション設計学',
    icon: Settings,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    topics: [
      'リーン生産方式', 'シックスシグマ', 'サプライチェーンデザイン', 'オペレーションズリサーチ',
      'キャパシティプランニング', '在庫最適化', 'プロセス改善・BPR', 'オペレーションモデル設計',
      'サービスオペレーション', 'デジタルオペレーション', 'アウトソーシング戦略',
      '品質管理システム（QMS）', 'TOC（制約理論）', 'オペレーショナルエクセレンス',
      'スケーラビリティ設計',
    ],
  },
  {
    id: 'risk_exit',
    name: 'リスク・出口戦略学',
    icon: AlertTriangle,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    topics: [
      'エンタープライズリスクマネジメント', '事業継続計画（BCP）', 'レピュテーションリスク管理',
      'サイバーセキュリティリスク', '規制リスク対応', 'IPO戦略・準備', 'M&A出口戦略',
      'MBO・EBO', '事業売却・カーブアウト', 'スタートアップのイグジット設計',
      'バリュエーション交渉', 'PMI（買収後統合）', '事業撤退・清算戦略',
      'クライシスマネジメント', 'シナリオプランニング',
    ],
  },
  {
    id: 'programming',
    name: 'プログラミング学',
    icon: Code,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    topics: [
      'ソフトウェアアーキテクチャ', 'デザインパターン', 'クリーンコード・リファクタリング',
      'システムデザイン', 'マイクロサービス設計', 'API設計・REST/GraphQL', 'データベース設計',
      'クラウドアーキテクチャ', 'DevOps・CI/CD', 'セキュアコーディング', 'パフォーマンス最適化',
      'テスト駆動開発（TDD）', 'ドメイン駆動設計（DDD）', 'イベント駆動アーキテクチャ',
      '技術的負債管理', 'スケーラブルシステム設計',
    ],
  },
  {
    id: 'ai',
    name: 'AI学',
    icon: Cpu,
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    topics: [
      '機械学習基礎・アルゴリズム', '深層学習・ニューラルネットワーク', '自然言語処理（NLP）',
      'コンピュータビジョン', '強化学習', '生成AI・LLM', 'プロンプトエンジニアリング',
      'MLOps・モデル運用', 'AI倫理・バイアス対策', 'AIガバナンス', 'エッジAI・組み込みAI',
      '推薦システム', '時系列予測', 'AutoML・ノーコードAI', 'AI事業戦略・ROI',
    ],
  },
  {
    id: 'business_model',
    name: 'ビジネスモデル学',
    icon: Briefcase,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    topics: [
      'ビジネスモデルキャンバス', 'プラットフォームビジネス', 'サブスクリプションモデル',
      'フリーミアム戦略', 'マーケットプレイス設計', 'ネットワーク効果の構築',
      'バリューチェーン再構築', 'ディスラプション戦略', 'ブルーオーシャン戦略',
      'リカーリングレベニュー設計', 'ユニットエコノミクス', 'Go-to-Market戦略',
      'ビジネスモデルイノベーション', 'エコシステム戦略', 'ピボット戦略',
    ],
  },
  {
    id: 'languages',
    name: '言語',
    icon: Languages,
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    topics: [
      'ビジネス英語・交渉術', '英語プレゼンテーション', '英語ライティング（ビジネス文書）',
      '英語面接・キャリア英語', '中国語（ビジネス）', '韓国語（ビジネス）', 'スペイン語入門',
      'フランス語入門', 'ドイツ語入門', '第二言語習得理論', '言語学習メソッド比較',
      '異文化コミュニケーション', 'ビジネス日本語（外国人向け）', '通訳・翻訳スキル',
      'マルチリンガル戦略',
    ],
  },
];

interface StudyContent {
  title: string;
  summary: string;
  keyPoints: string[];
  examples: string[];
  practicalTips: string[];
}

export default function StudyPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [content, setContent] = useState<StudyContent | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  const generateMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch('/api/ai/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic, category: selectedCategory }),
      });
      if (!response.ok) throw new Error('コンテンツ生成に失敗しました');
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data);
      setExpandedSection('summary');
    },
  });

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    generateMutation.mutate(topic);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-3">
          <GraduationCap className="text-primary-500" size={28} />
          勉強
        </h1>
        <p className="text-slate-500 mt-1">AI学習アシスタント - ビジネス・テクノロジー・言語</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={20} />
              カテゴリ・トピック
            </h2>
            
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      isSelected ? `bg-gradient-to-r ${category.color} text-white` : `${category.bgColor} hover:opacity-80`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={20} />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {isSelected ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {isSelected && (
                    <div className="mt-2 pl-2 space-y-1 max-h-64 overflow-y-auto">
                      {category.topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleTopicSelect(topic)}
                          disabled={generateMutation.isPending}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedTopic === topic
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'hover:bg-slate-100 text-slate-600'
                          } disabled:opacity-50`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {generateMutation.isPending ? (
            <div className="glass-card p-12 text-center">
              <Loader2 className="animate-spin mx-auto text-primary-500" size={48} />
              <p className="mt-4 text-slate-600">学習コンテンツを生成中...</p>
              <p className="mt-2 text-sm text-slate-400">「{selectedTopic}」について分析しています</p>
            </div>
          ) : content ? (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" size={24} />
                  {content.title}
                </h2>
                <button
                  onClick={() => selectedTopic && generateMutation.mutate(selectedTopic)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="再生成"
                >
                  <RefreshCw size={18} className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('summary')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-700">概要</span>
                    {expandedSection === 'summary' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSection === 'summary' && (
                    <div className="p-4 bg-white">
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{content.summary}</p>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('keyPoints')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-700">重要ポイント</span>
                    {expandedSection === 'keyPoints' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSection === 'keyPoints' && (
                    <div className="p-4 bg-white">
                      <ul className="space-y-2">
                        {content.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary-500 font-bold">{i + 1}.</span>
                            <span className="text-slate-600">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('examples')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-700">具体例・事例</span>
                    {expandedSection === 'examples' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSection === 'examples' && (
                    <div className="p-4 bg-white">
                      <ul className="space-y-3">
                        {content.examples.map((example, i) => (
                          <li key={i} className="p-3 bg-blue-50 rounded-lg text-slate-600">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('tips')}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-700">実践的なアドバイス</span>
                    {expandedSection === 'tips' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSection === 'tips' && (
                    <div className="p-4 bg-white">
                      <ul className="space-y-2">
                        {content.practicalTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-slate-600">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <GraduationCap className="mx-auto text-slate-300" size={64} />
              <p className="mt-4 text-slate-500">左のメニューからカテゴリとトピックを選択してください</p>
              <p className="mt-2 text-sm text-slate-400">AIが選択したトピックについて詳しく解説します</p>
            </div>
          )}

          {generateMutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
              コンテンツの生成に失敗しました。もう一度お試しください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
