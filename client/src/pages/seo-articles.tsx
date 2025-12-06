import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Globe, Eye, EyeOff, Send, Loader2, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface SeoArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  indexingStatus: string | null;
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SeoArticles() {
  const [articles, setArticles] = useState<SeoArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<SeoArticle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  const [generateTopic, setGenerateTopic] = useState('');
  const [generateKeywords, setGenerateKeywords] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/seo-articles');
      const data = await res.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setContent('');
    setMetaTitle('');
    setMetaDescription('');
    setKeywords('');
    setEditingArticle(null);
  };

  const openEditor = (article?: SeoArticle) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title);
      setSlug(article.slug);
      setContent(article.content);
      setMetaTitle(article.metaTitle || '');
      setMetaDescription(article.metaDescription || '');
      setKeywords(article.keywords || '');
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/seo-articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: generateTopic, keywords: generateKeywords }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        setTitle(data.title || '');
        setSlug(data.suggestedSlug || generateSlug(data.title || ''));
        setContent(data.content || '');
        setMetaTitle(data.metaTitle || '');
        setMetaDescription(data.metaDescription || '');
        setKeywords(generateKeywords);
        setGenerateTopic('');
        setGenerateKeywords('');
      }
    } catch (error) {
      alert('記事生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      alert('タイトル、スラッグ、本文は必須です');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingArticle ? `/api/seo-articles/${editingArticle.id}` : '/api/seo-articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, metaTitle, metaDescription, keywords }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowEditor(false);
        resetForm();
        fetchArticles();
      }
    } catch (error) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この記事を削除してもよろしいですか？')) return;

    try {
      await fetch(`/api/seo-articles/${id}`, { method: 'DELETE' });
      fetchArticles();
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  const handlePublish = async (id: number, publish: boolean) => {
    try {
      await fetch(`/api/seo-articles/${id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
      fetchArticles();
    } catch (error) {
      alert('操作に失敗しました');
    }
  };

  const handleIndex = async (id: number) => {
    try {
      const res = await fetch(`/api/seo-articles/${id}/index`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
        fetchArticles();
      }
    } catch (error) {
      alert('インデックス送信に失敗しました');
    }
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/articles/${slug}`;
    navigator.clipboard.writeText(url);
    alert('URLをコピーしました');
  };

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-primary-500" />
            {editingArticle ? '記事を編集' : '新規記事作成'}
          </h1>
          <button onClick={() => { setShowEditor(false); resetForm(); }} className="btn-secondary">
            戻る
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
            <h3 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
              <Sparkles size={18} />
              AI記事生成
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={generateTopic}
                onChange={(e) => setGenerateTopic(e.target.value)}
                placeholder="トピック（例：AIマーケティング）"
                className="input-field"
              />
              <input
                type="text"
                value={generateKeywords}
                onChange={(e) => setGenerateKeywords(e.target.value)}
                placeholder="キーワード（カンマ区切り）"
                className="input-field"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !generateTopic.trim()}
              className="btn-primary mt-3 flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              AI生成
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">スラッグ (URL) *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">本文 (Markdown) *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="input-field font-mono text-sm"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SEOタイトル <span className="text-slate-400">({metaTitle.length}/60)</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">キーワード</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="キーワード1, キーワード2"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SEO説明文 <span className="text-slate-400">({metaDescription.length}/160)</span>
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="text-primary-500" />
          SEO記事管理
        </h1>
        <div className="flex gap-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Globe size={18} />
            サイトマップ
          </a>
          <button onClick={() => openEditor()} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新規作成
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-600">記事がありません</h3>
          <p className="text-slate-500 mt-2">新規作成ボタンからSEO記事を作成してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 truncate">{article.title}</h3>
                    {article.isPublished ? (
                      <span className="badge badge-success flex items-center gap-1">
                        <Eye size={12} />
                        公開中
                      </span>
                    ) : (
                      <span className="badge badge-warning flex items-center gap-1">
                        <EyeOff size={12} />
                        下書き
                      </span>
                    )}
                    {article.indexingStatus === 'sent' && (
                      <span className="badge badge-info">インデックス済</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">/articles/{article.slug}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    作成: {format(new Date(article.createdAt), 'yyyy/MM/dd HH:mm')}
                    {article.publishedAt && ` | 公開: ${format(new Date(article.publishedAt), 'yyyy/MM/dd HH:mm')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {article.isPublished && (
                    <>
                      <button
                        onClick={() => copyUrl(article.slug)}
                        className="p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                        title="URLをコピー"
                      >
                        <Copy size={18} />
                      </button>
                      <a
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                        title="プレビュー"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button
                        onClick={() => handleIndex(article.id)}
                        className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded-lg"
                        title="インデックス送信"
                      >
                        <Send size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePublish(article.id, !article.isPublished)}
                    className={`p-2 rounded-lg ${
                      article.isPublished
                        ? 'text-amber-500 hover:bg-amber-50'
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={article.isPublished ? '非公開にする' : '公開する'}
                  >
                    {article.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={() => openEditor(article)}
                    className="p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                    title="編集"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
