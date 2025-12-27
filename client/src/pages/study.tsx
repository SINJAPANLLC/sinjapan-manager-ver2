import { useState } from 'react';
import { GraduationCap, BookOpen, Brain, TrendingUp, Lightbulb, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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
    id: 'management',
    name: '経営学',
    icon: TrendingUp,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    topics: [
      '経営戦略論', 'マーケティング', '組織論', 'リーダーシップ', '財務管理',
      '人的資源管理', 'オペレーション管理', 'イノベーション経営', '起業論',
      'コーポレートガバナンス', '国際経営', 'サプライチェーン管理', '品質管理',
      'プロジェクト管理', 'ビジネスモデル', 'デジタルトランスフォーメーション',
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
        <p className="text-slate-500 mt-1">AI学習アシスタント - 心理学・経営学</p>
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
