import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Image,
  Video,
  FileText,
  Mic,
  List,
  FileSpreadsheet,
  MessageSquare,
  Phone,
  History,
  Zap,
  Sparkles,
  Send,
  Loader2,
  Download,
  Copy,
  Check,
  ChevronRight,
  Bot,
  X,
  Share2,
  Mail,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Globe,
  Eye,
  Save,
  ArrowLeft,
  BarChart3,
  FolderOpen,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

type TabType = 'image' | 'video' | 'seo' | 'voice' | 'list' | 'document' | 'chat' | 'voiceChat' | 'logs' | 'automation';

interface AiLog {
  id: number;
  type: string;
  prompt?: string;
  result?: string;
  status: string;
  createdAt: string;
}

interface SeoCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

interface SeoArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keywords: string;
  categoryId?: number;
  isPublished: boolean;
  indexingStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface LogDetailModalProps {
  log: AiLog | null;
  onClose: () => void;
}

export function AiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AiLog | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string; content: string}[]>([]);

  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [imageProvider, setImageProvider] = useState<'hailuo' | 'openai' | 'modelslab'>('openai');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageQuality, setImageQuality] = useState('standard');
  const [imageTranslatedPrompt, setImageTranslatedPrompt] = useState('');

  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState('');
  const [videoProvider, setVideoProvider] = useState<'hailuo' | 'modelslab'>('hailuo');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [videoDuration, setVideoDuration] = useState('8');
  const [videoTranslatedPrompt, setVideoTranslatedPrompt] = useState('');

  const [seoTopic, setSeoTopic] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoArticle, setSeoArticle] = useState('');
  const [seoArticles, setSeoArticles] = useState<SeoArticle[]>([]);
  const [seoCategories, setSeoCategories] = useState<SeoCategory[]>([]);
  const [seoView, setSeoView] = useState<'list' | 'edit' | 'generate' | 'bulk' | 'categories' | 'stats'>('list');
  const [editingArticle, setEditingArticle] = useState<SeoArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    metaDescription: '',
    keywords: '',
    ctaUrl: '',
    ctaText: 'お問い合わせはこちら',
    domain: '',
    siteName: '',
    categoryId: undefined as number | undefined,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [bulkTopics, setBulkTopics] = useState('');
  const [bulkCategoryId, setBulkCategoryId] = useState<number | undefined>(undefined);
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, generating: false });

  const [siteName, setSiteName] = useState('');
  const [seoDomain, setSeoDomain] = useState('');

  const [voiceText, setVoiceText] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  
  const voiceOptions = [
    { id: 'alloy', name: 'Alloy', description: '中性的で落ち着いた声' },
    { id: 'echo', name: 'Echo', description: '男性的な深い声' },
    { id: 'fable', name: 'Fable', description: '若々しく表現豊かな声' },
    { id: 'onyx', name: 'Onyx', description: '低音で力強い男性の声' },
    { id: 'nova', name: 'Nova', description: '明るく親しみやすい女性の声' },
    { id: 'shimmer', name: 'Shimmer', description: '柔らかく優しい女性の声' },
  ];

  const [listTopic, setListTopic] = useState('');
  const [listCount, setListCount] = useState('10');
  const [generatedList, setGeneratedList] = useState('');

  const [docType, setDocType] = useState('contract');
  const [docDetails, setDocDetails] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');

  const tabs = [
    { id: 'chat' as TabType, label: 'テキスト会話', icon: MessageSquare },
    { id: 'image' as TabType, label: '画像生成', icon: Image },
    { id: 'video' as TabType, label: '動画生成', icon: Video },
    { id: 'seo' as TabType, label: 'SEO記事', icon: FileText },
    { id: 'voice' as TabType, label: '音声生成', icon: Mic },
    { id: 'list' as TabType, label: 'リスト生成', icon: List },
    { id: 'document' as TabType, label: '書類生成', icon: FileSpreadsheet },
    { id: 'voiceChat' as TabType, label: '音声会話', icon: Phone },
    { id: 'logs' as TabType, label: 'ログ', icon: History },
    { id: 'automation' as TabType, label: 'AI自動化', icon: Zap },
  ];

  const fetchLogs = async () => {
    const res = await fetch('/api/ai/logs');
    if (res.ok) {
      setLogs(await res.json());
    }
  };

  const fetchSeoArticles = async () => {
    const res = await fetch('/api/seo-articles');
    if (res.ok) {
      setSeoArticles(await res.json());
    }
  };

  const fetchSeoCategories = async () => {
    const res = await fetch('/api/seo-categories');
    if (res.ok) {
      setSeoCategories(await res.json());
    }
  };

  const fetchSeoSettings = async () => {
    const [siteRes, domainRes] = await Promise.all([
      fetch('/api/settings/site_name'),
      fetch('/api/settings/seo_domain'),
    ]);
    if (siteRes.ok) {
      const data = await siteRes.json();
      setSiteName(data.value || '');
    }
    if (domainRes.ok) {
      const data = await domainRes.json();
      setSeoDomain(data.value || '');
    }
  };

  const saveSeoSettings = async () => {
    try {
      const results = await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ key: 'site_name', value: siteName }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ key: 'seo_domain', value: seoDomain }),
        }),
      ]);
      
      const allOk = results.every(r => r.ok);
      if (allOk) {
        alert('設定を保存しました');
      } else {
        const errorData = await results[0].json().catch(() => ({}));
        alert('保存に失敗しました: ' + (errorData.message || '不明なエラー'));
      }
    } catch (error) {
      alert('保存に失敗しました');
    }
  };

  useEffect(() => {
    if (activeTab === 'seo') {
      fetchSeoArticles();
      fetchSeoCategories();
      fetchSeoSettings();
    }
  }, [activeTab]);

  const handleSaveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) return;
    setIsLoading(true);
    try {
      const url = editingArticle 
        ? `/api/seo-articles/${editingArticle.id}` 
        : '/api/seo-articles';
      const method = editingArticle ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleForm),
      });
      
      if (res.ok) {
        await fetchSeoArticles();
        setSeoView('list');
        setEditingArticle(null);
        setArticleForm({ title: '', content: '', metaDescription: '', keywords: '', ctaUrl: '', ctaText: 'お問い合わせはこちら', domain: '', siteName: '', categoryId: undefined });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('この記事を削除しますか？')) return;
    const res = await fetch(`/api/seo-articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchSeoArticles();
    }
  };

  const handleTogglePublish = async (article: SeoArticle) => {
    const res = await fetch(`/api/seo-articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, isPublished: !article.isPublished }),
    });
    if (res.ok) {
      await fetchSeoArticles();
    }
  };

  const handleIndexArticle = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/seo-articles/${id}/index`, { method: 'POST' });
      if (res.ok) {
        await fetchSeoArticles();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startEditArticle = (article: SeoArticle) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      metaDescription: article.metaDescription || '',
      keywords: article.keywords || '',
      ctaUrl: (article as any).ctaUrl || '',
      ctaText: (article as any).ctaText || 'お問い合わせはこちら',
      domain: (article as any).domain || '',
      siteName: (article as any).siteName || '',
      categoryId: article.categoryId,
    });
    setSeoView('edit');
  };

  const startNewArticle = () => {
    setEditingArticle(null);
    setArticleForm({ title: '', content: '', metaDescription: '', keywords: '', ctaUrl: '', ctaText: 'お問い合わせはこちら', domain: '', siteName: '', categoryId: undefined });
    setSeoView('edit');
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategorySlug.trim() || newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await fetch('/api/seo-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, slug }),
    });
    if (res.ok) {
      await fetchSeoCategories();
      setNewCategoryName('');
      setNewCategorySlug('');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('このカテゴリを削除しますか？記事は削除されませんが、カテゴリは外れます。')) return;
    const res = await fetch(`/api/seo-categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchSeoCategories();
    }
  };

  const handleBulkGenerate = async () => {
    const topics = bulkTopics.split('\n').map(t => t.trim()).filter(t => t);
    if (topics.length === 0) return;
    
    setBulkProgress({ current: 0, total: topics.length, generating: true });
    
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        const res = await fetch('/api/ai/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, keywords: bulkKeywords }),
        });
        const data = await res.json();
        if (data.article) {
          const slug = `article-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          await fetch('/api/seo-articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: topic,
              slug,
              content: data.article,
              metaDescription: `${topic}についての詳細記事`,
              keywords: bulkKeywords,
              categoryId: bulkCategoryId,
            }),
          });
        }
      } catch (e) {
        console.error('Bulk generate error:', e);
      }
      setBulkProgress({ current: i + 1, total: topics.length, generating: true });
    }
    
    setBulkProgress({ current: topics.length, total: topics.length, generating: false });
    setBulkTopics('');
    await fetchSeoArticles();
  };

  const handleGenerateAndSave = async () => {
    if (!seoTopic.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords }),
      });
      const data = await res.json();
      if (data.article) {
        setArticleForm({
          title: seoTopic,
          content: data.article,
          metaDescription: `${seoTopic}についての詳細記事`,
          keywords: seoKeywords,
          ctaUrl: '',
          ctaText: 'お問い合わせはこちら',
          domain: '',
          siteName: '',
          categoryId: undefined,
        });
        setSeoView('edit');
        setSeoTopic('');
        setSeoKeywords('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: chatMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageGenerate = async () => {
    if (!imagePrompt.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedImage('');
    setImageTranslatedPrompt('');
    
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          provider: imageProvider,
          aspectRatio: imageAspectRatio,
          quality: imageQuality
        }),
      });
      const data = await res.json();
      if (data.translatedPrompt) {
        setImageTranslatedPrompt(data.translatedPrompt);
      }
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('画像生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const [videoStatus, setVideoStatus] = useState('');

  const pollVideoResult = async (taskId: string, prompt: string, provider: string, attempts = 0): Promise<void> => {
    if (attempts > 60) {
      setVideoStatus('');
      setIsLoading(false);
      alert('動画生成がタイムアウトしました。もう一度お試しください。');
      return;
    }

    try {
      const res = await fetch('/api/ai/video/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, prompt, provider }),
      });
      const data = await res.json();

      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        setVideoStatus('');
        setIsLoading(false);
      } else if (data.processing) {
        setVideoStatus(`生成中... (${attempts + 1}/60)`);
        setTimeout(() => pollVideoResult(taskId, prompt, provider, attempts + 1), 3000);
      } else if (data.error) {
        setVideoStatus('');
        setIsLoading(false);
        alert(data.error);
      }
    } catch (err) {
      setVideoStatus('');
      setIsLoading(false);
      alert('ポーリングに失敗しました');
    }
  };

  const handleVideoGenerate = async () => {
    if (!videoPrompt.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedVideo('');
    setVideoTranslatedPrompt('');
    setVideoStatus('リクエスト送信中...');

    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: videoPrompt, 
          provider: videoProvider,
          aspectRatio: videoAspectRatio,
          seconds: parseInt(videoDuration)
        }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        setVideoStatus('');
        setIsLoading(false);
        if (data.translatedPrompt) {
          setVideoTranslatedPrompt(data.translatedPrompt);
        }
      } else if (data.processing && data.taskId) {
        setVideoStatus('動画生成を開始しました...');
        if (data.translatedPrompt) {
          setVideoTranslatedPrompt(data.translatedPrompt);
        }
        // Use provider from response if available, otherwise use selected provider
        pollVideoResult(data.taskId, data.prompt || videoPrompt, data.provider || videoProvider);
      } else if (data.error) {
        setVideoStatus('');
        setIsLoading(false);
        alert(data.error);
      }
    } catch (err) {
      setVideoStatus('');
      setIsLoading(false);
      alert('動画生成に失敗しました');
    }
  };

  const handleSeoGenerate = async () => {
    if (!seoTopic.trim() || isLoading) return;
    setIsLoading(true);
    setSeoArticle('');

    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords }),
      });
      const data = await res.json();
      if (data.article) {
        setSeoArticle(data.article);
      }
    } catch (err) {
      alert('記事生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceGenerate = async () => {
    if (!voiceText.trim() || isLoading) return;
    setIsLoading(true);
    setVoiceUrl('');

    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText, voice: selectedVoice }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setVoiceUrl(data.audioUrl);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('音声生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListGenerate = async () => {
    if (!listTopic.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedList('');

    try {
      const res = await fetch('/api/ai/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: listTopic, count: parseInt(listCount) }),
      });
      const data = await res.json();
      if (data.list) {
        setGeneratedList(data.list);
      }
    } catch (err) {
      alert('リスト生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocGenerate = async () => {
    if (!docDetails.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedDoc('');

    try {
      const res = await fetch('/api/ai/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: docType, details: docDetails }),
      });
      const data = await res.json();
      if (data.document) {
        setGeneratedDoc(data.document);
      }
    } catch (err) {
      alert('書類生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = (content: string, url?: string) => {
    const text = encodeURIComponent(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
    const shareUrl = url ? `&url=${encodeURIComponent(url)}` : '';
    window.open(`https://twitter.com/intent/tweet?text=${text}${shareUrl}`, '_blank');
  };

  const shareToLine = (content: string, url?: string) => {
    const text = encodeURIComponent(url || content.substring(0, 200));
    window.open(`https://social-plugins.line.me/lineit/share?url=${text}`, '_blank');
  };

  const shareByEmail = (subject: string, body: string) => {
    const mailSubject = encodeURIComponent(subject);
    const mailBody = encodeURIComponent(body);
    window.location.href = `mailto:?subject=${mailSubject}&body=${mailBody}`;
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const shareToFacebook = (url?: string) => {
    const shareUrl = url ? encodeURIComponent(url) : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
  };

  const shareToWhatsApp = (content: string, url?: string) => {
    const text = encodeURIComponent(url || content.substring(0, 200));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = (content: string, url?: string) => {
    const text = encodeURIComponent(content.substring(0, 200));
    const shareUrl = url ? `&url=${encodeURIComponent(url)}` : '';
    window.open(`https://t.me/share/url?text=${text}${shareUrl}`, '_blank');
  };

  const shareToInstagram = () => {
    alert('Instagramへの直接共有はできません。\n画像をダウンロードしてInstagramアプリから投稿してください。');
  };

  const ShareButtons = ({ content, url, type }: { content: string; url?: string; type: 'text' | 'media' }) => (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <span className="text-xs text-slate-500 mr-1">共有:</span>
      {type === 'text' && (
        <button
          onClick={() => copyToClipboard(content)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          コピー
        </button>
      )}
      {url && (
        <>
          <button
            onClick={() => copyToClipboard(url)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700 transition-colors"
          >
            <Copy size={12} />
            URLコピー
          </button>
          <button
            onClick={() => openInNewTab(url)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700 transition-colors"
          >
            <ExternalLink size={12} />
            新しいタブ
          </button>
        </>
      )}
      <button
        onClick={() => shareToTwitter(type === 'text' ? content : 'AIで生成したコンテンツ', url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-gray-800 rounded-lg text-xs text-white transition-colors"
      >
        𝕏
      </button>
      <button
        onClick={() => shareToLine(type === 'text' ? content : (url || 'AIで生成したコンテンツ'))}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00B900] hover:bg-[#00a000] rounded-lg text-xs text-white transition-colors"
      >
        LINE
      </button>
      <button
        onClick={() => shareToFacebook(url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] rounded-lg text-xs text-white transition-colors"
      >
        Facebook
      </button>
      {type === 'media' && (
        <button
          onClick={shareToInstagram}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 rounded-lg text-xs text-white transition-colors"
        >
          Instagram
        </button>
      )}
      <button
        onClick={() => shareToWhatsApp(type === 'text' ? content : 'AIで生成したコンテンツ', url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] rounded-lg text-xs text-white transition-colors"
      >
        WhatsApp
      </button>
      <button
        onClick={() => shareToTelegram(type === 'text' ? content : 'AIで生成したコンテンツ', url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0088cc] hover:bg-[#007ab8] rounded-lg text-xs text-white transition-colors"
      >
        Telegram
      </button>
      <button
        onClick={() => shareByEmail('AI生成コンテンツ', type === 'text' ? content : (url || 'コンテンツをご確認ください'))}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 rounded-lg text-xs text-white transition-colors"
      >
        <Mail size={12} />
        メール
      </button>
    </div>
  );

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      chat: 'テキスト会話',
      image: '画像生成',
      video: '動画生成',
      seo: 'SEO記事',
      voice: '音声生成',
      list: 'リスト生成',
      document: '書類生成',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-primary-500" />
            AI機能
          </h1>
          <p className="text-slate-500 text-sm mt-1">様々なAI機能を活用して業務を効率化</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'logs') fetchLogs();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button"
                  : "bg-white text-slate-600 hover:bg-primary-50 border border-slate-200"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-primary-500" size={20} />
              AIテキスト会話
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 h-96 overflow-y-auto space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Bot size={48} className="mb-2 opacity-50" />
                  <p>AIと会話を始めましょう</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl",
                    msg.role === 'user'
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  )}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                    <Loader2 className="animate-spin text-primary-500" size={20} />
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Send size={18} />
                送信
              </button>
            </form>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Image className="text-primary-500" size={20} />
              画像生成
            </h2>
            <p className="text-sm text-slate-500">テキストから高品質な画像を生成します</p>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="生成したい画像の説明を入力... (例: 美しい風景、夕焼けの海、リアルな猫)"
              rows={3}
              className="input-field resize-none"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">プロバイダー</label>
                <select
                  value={imageProvider}
                  onChange={(e) => setImageProvider(e.target.value as 'hailuo' | 'openai' | 'modelslab')}
                  className="input-field"
                >
                  <option value="openai">OpenAI (DALL-E)</option>
                  <option value="hailuo">Hailuo AI (MiniMax)</option>
                  <option value="modelslab">MODELSLAB (NSFW対応)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">アスペクト比</label>
                <select
                  value={imageAspectRatio}
                  onChange={(e) => setImageAspectRatio(e.target.value)}
                  className="input-field"
                >
                  <option value="1:1">1:1 (正方形)</option>
                  <option value="16:9">16:9 (横長)</option>
                  <option value="9:16">9:16 (縦長)</option>
                  {(imageProvider === 'hailuo' || imageProvider === 'modelslab') && (
                    <>
                      <option value="4:3">4:3</option>
                      <option value="3:4">3:4</option>
                    </>
                  )}
                  {imageProvider === 'hailuo' && (
                    <>
                      <option value="3:2">3:2</option>
                      <option value="2:3">2:3</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">品質</label>
                <select
                  value={imageQuality}
                  onChange={(e) => setImageQuality(e.target.value)}
                  className="input-field"
                >
                  <option value="standard">標準</option>
                  <option value="high">高品質</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleImageGenerate}
              disabled={isLoading || !imagePrompt.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              画像を生成
            </button>
            {imageTranslatedPrompt && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">翻訳されたプロンプト:</span> {imageTranslatedPrompt}
                </p>
              </div>
            )}
            {generatedImage && (
              <div className="mt-4">
                <img src={generatedImage} alt="Generated" className="max-w-full rounded-xl shadow-lg" />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <a href={generatedImage} download target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                    <Download size={16} />
                    ダウンロード
                  </a>
                </div>
                <ShareButtons content="AIで生成した画像" url={generatedImage} type="media" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Video className="text-primary-500" size={20} />
              動画生成
            </h2>
            <p className="text-sm text-slate-500">テキストから動画を生成します（生成には数分かかる場合があります）</p>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="生成したい動画の説明を入力... (例: 海辺を歩く人、夕焼けの風景)"
              rows={3}
              className="input-field resize-none"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">プロバイダー</label>
                <select
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value as 'hailuo' | 'modelslab')}
                  className="input-field"
                >
                  <option value="hailuo">Hailuo AI (MiniMax)</option>
                  <option value="modelslab">MODELSLAB (NSFW対応)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">アスペクト比</label>
                <select
                  value={videoAspectRatio}
                  onChange={(e) => setVideoAspectRatio(e.target.value)}
                  className="input-field"
                >
                  <option value="16:9">16:9 (横長)</option>
                  <option value="9:16">9:16 (縦長)</option>
                  <option value="1:1">1:1 (正方形)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">長さ</label>
                <select
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  className="input-field"
                >
                  {videoProvider === 'modelslab' ? (
                    <>
                      <option value="2">約2秒 (16フレーム)</option>
                      <option value="3">約3秒 (25フレーム)</option>
                    </>
                  ) : (
                    <>
                      <option value="5">5秒</option>
                      <option value="6">6秒</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <button
              onClick={handleVideoGenerate}
              disabled={isLoading || !videoPrompt.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              動画を生成
            </button>
            {videoStatus && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-primary-500" size={20} />
                  <span className="text-primary-700 font-medium">{videoStatus}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">動画生成には数分かかることがあります。このページを開いたままお待ちください。</p>
              </div>
            )}
            {videoTranslatedPrompt && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">翻訳されたプロンプト:</span> {videoTranslatedPrompt}
                </p>
              </div>
            )}
            {generatedVideo && (
              <div className="mt-4">
                <video src={generatedVideo} controls className="max-w-full rounded-xl shadow-lg" />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <a href={generatedVideo} download target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                    <Download size={16} />
                    ダウンロード
                  </a>
                </div>
                <ShareButtons content="AIで生成した動画" url={generatedVideo} type="media" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            {seoView === 'list' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-primary-500" size={24} />
                        SEO記事管理
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">記事の作成・編集・公開を管理します</p>
                    </div>
                    <button onClick={startNewArticle} className="btn-primary flex items-center gap-2 shrink-0">
                      <Plus size={16} />
                      新規作成
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                    <button 
                      onClick={() => setSeoView('stats')} 
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <BarChart3 size={16} />
                      インデックス監視
                    </button>
                    <button 
                      onClick={() => setSeoView('bulk')} 
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FileText size={16} />
                      一括生成
                    </button>
                    <button 
                      onClick={() => setSeoView('generate')} 
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      AI生成
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {seoArticles.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                      <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                      <p className="text-slate-500">記事がありません</p>
                      <p className="text-sm text-slate-400">「新規作成」または「AI生成」で記事を作成してください</p>
                    </div>
                  ) : (
                    seoArticles.map((article) => (
                      <div key={article.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{article.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.metaDescription || article.content.substring(0, 100)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                article.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                              )}>
                                {article.isPublished ? '公開中' : '下書き'}
                              </span>
                              {article.indexingStatus === 'sent' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  インデックス済
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                {format(new Date(article.updatedAt), 'yyyy/MM/dd HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            {article.isPublished && (
                              <a
                                href={`/articles/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="記事を見る"
                              >
                                <Eye size={18} />
                              </a>
                            )}
                            <button
                              onClick={() => handleTogglePublish(article)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                article.isPublished 
                                  ? "text-green-600 hover:bg-green-50" 
                                  : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                              )}
                              title={article.isPublished ? '非公開にする' : '公開する'}
                            >
                              <Globe size={18} />
                            </button>
                            {article.isPublished && article.indexingStatus !== 'sent' && (
                              <button
                                onClick={() => handleIndexArticle(article.id)}
                                disabled={isLoading}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="インデックス送信"
                              >
                                <Send size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => startEditArticle(article)}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="編集"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="削除"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">サイトマップ:</span>{' '}
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      /sitemap.xml
                    </a>
                  </p>
                </div>
              </>
            )}

            {seoView === 'generate' && (
              <>
                <button onClick={() => setSeoView('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4">
                  <ArrowLeft size={18} />
                  記事一覧に戻る
                </button>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-primary-500" size={20} />
                  AI記事生成
                </h2>
                <p className="text-sm text-slate-500">トピックを入力するとAIがSEO最適化された記事を生成します</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">トピック *</label>
                    <input
                      type="text"
                      value={seoTopic}
                      onChange={(e) => setSeoTopic(e.target.value)}
                      placeholder="例: AIを活用したマーケティング戦略"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">キーワード</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="例: AI, マーケティング, 自動化"
                      className="input-field"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateAndSave}
                  disabled={isLoading || !seoTopic.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  記事を生成して編集
                </button>
              </>
            )}

            {seoView === 'categories' && (
              <>
                <button onClick={() => setSeoView('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4">
                  <ArrowLeft size={18} />
                  記事一覧に戻る
                </button>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  カテゴリ管理
                </h2>
                <p className="text-sm text-slate-500 mb-4">記事のカテゴリを管理します</p>
                
                <div className="bg-white border rounded-xl p-4 mb-4">
                  <h3 className="font-medium text-slate-700 mb-3">新規カテゴリ作成</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="カテゴリ名"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={newCategorySlug}
                      onChange={(e) => setNewCategorySlug(e.target.value)}
                      placeholder="スラッグ（自動生成）"
                      className="input-field"
                    />
                  </div>
                  <button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="btn-primary mt-3">
                    <Plus size={16} className="mr-2" />
                    カテゴリを追加
                  </button>
                </div>

                <div className="space-y-2">
                  {seoCategories.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <p className="text-slate-500">カテゴリがありません</p>
                    </div>
                  ) : (
                    seoCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                        <div>
                          <span className="font-medium text-slate-800">{cat.name}</span>
                          <span className="text-sm text-slate-500 ml-2">/{cat.slug}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {seoView === 'bulk' && (
              <>
                <button onClick={() => setSeoView('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4">
                  <ArrowLeft size={18} />
                  記事一覧に戻る
                </button>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-primary-500" size={20} />
                  一括記事生成
                </h2>
                <p className="text-sm text-slate-500 mb-4">複数のトピックから記事を一括生成します（1日10〜30記事推奨）</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">トピックリスト（1行1トピック）</label>
                    <textarea
                      value={bulkTopics}
                      onChange={(e) => setBulkTopics(e.target.value)}
                      placeholder="東京のおすすめカフェ&#10;京都の観光スポット&#10;大阪のグルメガイド"
                      rows={10}
                      className="input-field resize-none"
                      disabled={bulkProgress.generating}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      現在: {bulkTopics.split('\n').filter(t => t.trim()).length} トピック
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">キーワード（オプション・カンマ区切り）</label>
                    <input
                      type="text"
                      value={bulkKeywords}
                      onChange={(e) => setBulkKeywords(e.target.value)}
                      placeholder="SEO, マーケティング, Web集客"
                      className="input-field"
                      disabled={bulkProgress.generating}
                    />
                    <p className="text-xs text-slate-400 mt-1">全記事に共通で適用されます</p>
                  </div>

                  {bulkProgress.generating && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="animate-spin text-primary-500" size={20} />
                        <span className="font-medium text-primary-700">
                          生成中... {bulkProgress.current} / {bulkProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBulkGenerate}
                    disabled={bulkProgress.generating || bulkTopics.split('\n').filter(t => t.trim()).length === 0}
                    className="btn-primary flex items-center gap-2"
                  >
                    {bulkProgress.generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    一括生成開始
                  </button>
                </div>
              </>
            )}

            {seoView === 'stats' && (
              <>
                <button onClick={() => setSeoView('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4">
                  <ArrowLeft size={18} />
                  記事一覧に戻る
                </button>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  インデックス監視ダッシュボード
                </h2>
                <p className="text-sm text-slate-500 mb-4">記事のインデックス状況を監視します（目標: 50%以上）</p>

                {(() => {
                  const total = seoArticles.length;
                  const published = seoArticles.filter(a => a.isPublished).length;
                  const indexed = seoArticles.filter(a => a.indexingStatus === 'sent').length;
                  const indexRate = published > 0 ? Math.round((indexed / published) * 100) : 0;

                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white border rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-slate-800">{total}</p>
                          <p className="text-sm text-slate-500">総記事数</p>
                        </div>
                        <div className="bg-white border rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-green-600">{published}</p>
                          <p className="text-sm text-slate-500">公開中</p>
                        </div>
                        <div className="bg-white border rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-blue-600">{indexed}</p>
                          <p className="text-sm text-slate-500">インデックス送信済</p>
                        </div>
                        <div className={cn(
                          "bg-white border rounded-xl p-4 text-center",
                          indexRate >= 50 ? "ring-2 ring-green-500" : "ring-2 ring-orange-500"
                        )}>
                          <p className={cn(
                            "text-3xl font-bold",
                            indexRate >= 50 ? "text-green-600" : "text-orange-600"
                          )}>{indexRate}%</p>
                          <p className="text-sm text-slate-500">インデックス率</p>
                        </div>
                      </div>

                      {indexRate < 50 && (
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <p className="text-orange-800 font-medium">インデックス率が50%を下回っています</p>
                          <p className="text-sm text-orange-600 mt-1">
                            公開記事のインデックス送信を行い、Search Consoleでの確認をおすすめします。
                          </p>
                        </div>
                      )}

                      <div className="bg-white border rounded-xl p-4">
                        <h3 className="font-medium text-slate-700 mb-3">未インデックス記事（公開中）</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {seoArticles.filter(a => a.isPublished && a.indexingStatus !== 'sent').length === 0 ? (
                            <p className="text-slate-500 text-sm">すべての公開記事がインデックス済みです</p>
                          ) : (
                            seoArticles.filter(a => a.isPublished && a.indexingStatus !== 'sent').map((article) => (
                              <div key={article.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <span className="text-sm text-slate-700">{article.title}</span>
                                <button
                                  onClick={() => handleIndexArticle(article.id)}
                                  disabled={isLoading}
                                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                  インデックス送信
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">サイトマップ:</span>{' '}
                          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                            /sitemap.xml
                          </a>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Google Search Consoleにサイトマップを送信することでインデックス率が向上します
                        </p>
                      </div>

                      <div className="bg-white border rounded-xl p-4">
                        <h3 className="font-medium text-slate-700 mb-3">サイト設定</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">サイト名</label>
                            <input
                              type="text"
                              value={siteName}
                              onChange={(e) => setSiteName(e.target.value)}
                              placeholder="例: SIN JAPAN"
                              className="input-field"
                            />
                            <p className="text-xs text-slate-400 mt-1">公開記事ページに表示されるサイト名</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">サイトドメイン</label>
                            <input
                              type="text"
                              value={seoDomain}
                              onChange={(e) => setSeoDomain(e.target.value)}
                              placeholder="例: https://example.com"
                              className="input-field"
                            />
                            <p className="text-xs text-slate-400 mt-1">canonical URLやGoogle Indexing APIで使用</p>
                          </div>
                          <button
                            onClick={saveSeoSettings}
                            className="btn-primary text-sm"
                          >
                            設定を保存
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {seoView === 'edit' && (
              <>
                <button onClick={() => setSeoView('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-4">
                  <ArrowLeft size={18} />
                  記事一覧に戻る
                </button>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="text-primary-500" size={20} />
                  {editingArticle ? '記事を編集' : '新規記事作成'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">タイトル *</label>
                    <input
                      type="text"
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      placeholder="記事のタイトル"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">本文 *</label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!articleForm.content.trim()) return;
                          setIsLoading(true);
                          try {
                            const res = await fetch('/api/ai/internal-links', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ articleId: editingArticle?.id, content: articleForm.content }),
                            });
                            const data = await res.json();
                            if (data.linkedContent) {
                              setArticleForm({ ...articleForm, content: data.linkedContent });
                              alert(`${data.linksAdded}個の内部リンクを挿入しました`);
                            }
                          } catch (e) {
                            console.error('Internal link error:', e);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading || !articleForm.content.trim()}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Sparkles size={12} />
                        内部リンク自動挿入
                      </button>
                    </div>
                    <textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                      placeholder="記事の本文"
                      rows={12}
                      className="input-field resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">メタディスクリプション</label>
                    <input
                      type="text"
                      value={articleForm.metaDescription}
                      onChange={(e) => setArticleForm({ ...articleForm, metaDescription: e.target.value })}
                      placeholder="検索結果に表示される説明文"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">キーワード</label>
                    <input
                      type="text"
                      value={articleForm.keywords}
                      onChange={(e) => setArticleForm({ ...articleForm, keywords: e.target.value })}
                      placeholder="カンマ区切りでキーワードを入力"
                      className="input-field"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <ExternalLink size={16} />
                      CTA設定（外部サービスへの誘導）
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">リンク先URL</label>
                        <input
                          type="url"
                          value={articleForm.ctaUrl}
                          onChange={(e) => setArticleForm({ ...articleForm, ctaUrl: e.target.value })}
                          placeholder="https://example.com/service"
                          className="input-field"
                        />
                        <p className="text-xs text-slate-500 mt-1">記事下部のCTAボタンのリンク先（外部サービスページ）</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CTAボタンのテキスト</label>
                        <input
                          type="text"
                          value={articleForm.ctaText}
                          onChange={(e) => setArticleForm({ ...articleForm, ctaText: e.target.value })}
                          placeholder="お問い合わせはこちら"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Globe size={16} />
                      記事個別設定
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">サイト名（この記事用）</label>
                        <input
                          type="text"
                          value={articleForm.siteName}
                          onChange={(e) => setArticleForm({ ...articleForm, siteName: e.target.value })}
                          placeholder="例: My Brand（未設定の場合はグローバル設定を使用）"
                          className="input-field"
                        />
                        <p className="text-xs text-slate-500 mt-1">公開ページのロゴ・タイトルに表示</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">ドメイン（この記事用）</label>
                        <input
                          type="url"
                          value={articleForm.domain}
                          onChange={(e) => setArticleForm({ ...articleForm, domain: e.target.value })}
                          placeholder="https://example.com（未設定の場合はグローバル設定を使用）"
                          className="input-field"
                        />
                        <p className="text-xs text-slate-500 mt-1">canonical URLやGoogle Indexing APIで使用</p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-3">
                      ※ 独自ドメインを使用するには、アプリ公開後にReplitでドメイン接続（DNS設定）が必要です
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveArticle}
                      disabled={isLoading || !articleForm.title.trim() || !articleForm.content.trim()}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      保存
                    </button>
                    <button onClick={() => setSeoView('list')} className="btn-secondary">
                      キャンセル
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Mic className="text-primary-500" size={20} />
              音声生成
            </h2>
            <p className="text-sm text-slate-500">テキストを自然な音声に変換します（OpenAI TTS）</p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">声を選択</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {voiceOptions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedVoice === v.id 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-medium text-slate-800">{v.name}</div>
                    <div className="text-xs text-slate-500">{v.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="音声に変換したいテキストを入力..."
              rows={4}
              className="input-field resize-none"
            />
            <button
              onClick={handleVoiceGenerate}
              disabled={isLoading || !voiceText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
              音声を生成
            </button>
            {voiceUrl && (
              <div className="mt-4">
                <audio src={voiceUrl} controls className="w-full" />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <a href={voiceUrl} download target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                    <Download size={16} />
                    ダウンロード
                  </a>
                </div>
                <ShareButtons content="AIで生成した音声" url={voiceUrl} type="media" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <List className="text-primary-500" size={20} />
              リスト生成
            </h2>
            <p className="text-sm text-slate-500">指定したトピックのリストを自動生成します</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">トピック *</label>
                <input
                  type="text"
                  value={listTopic}
                  onChange={(e) => setListTopic(e.target.value)}
                  placeholder="例: 日本の人気観光地"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">項目数</label>
                <input
                  type="number"
                  value={listCount}
                  onChange={(e) => setListCount(e.target.value)}
                  min="1"
                  max="50"
                  className="input-field"
                />
              </div>
            </div>
            <button
              onClick={handleListGenerate}
              disabled={isLoading || !listTopic.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <List size={18} />}
              リストを生成
            </button>
            {generatedList && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-slate-700">生成されたリスト</span>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border">{generatedList}</pre>
                <ShareButtons content={generatedList} type="text" />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Target className="text-primary-500" size={18} />
                リード管理
              </h3>
              <p className="text-sm text-slate-500 mb-4">MEO・SNSから収集したリード（見込み客）を一元管理。電話・メール・DMでアプローチできます。</p>
              <Link href="/leads" className="btn-primary inline-flex items-center gap-2">
                <Target size={18} />
                リード管理を開く
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-primary-500" size={20} />
              書類生成
            </h2>
            <p className="text-sm text-slate-500">ビジネス書類を自動生成します</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">書類タイプ</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="input-field"
              >
                <option value="contract">契約書</option>
                <option value="proposal">提案書</option>
                <option value="invoice">請求書</option>
                <option value="report">報告書</option>
                <option value="email">ビジネスメール</option>
                <option value="minutes">議事録</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">詳細情報 *</label>
              <textarea
                value={docDetails}
                onChange={(e) => setDocDetails(e.target.value)}
                placeholder="書類に含める情報を入力... (例: 契約期間、金額、当事者名など)"
                rows={4}
                className="input-field resize-none"
              />
            </div>
            <button
              onClick={handleDocGenerate}
              disabled={isLoading || !docDetails.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
              書類を生成
            </button>
            {generatedDoc && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-slate-700">生成された書類</span>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border font-sans">{generatedDoc}</pre>
                <ShareButtons content={generatedDoc} type="text" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'voiceChat' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Phone className="text-primary-500" size={20} />
              AI音声会話
            </h2>
            <div className="bg-slate-50 rounded-xl p-8 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4">
                <Phone size={40} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">音声会話機能</h3>
              <p className="text-slate-500 text-sm mb-4">
                この機能は現在開発中です。<br />
                音声でAIと会話できるようになる予定です。
              </p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                <Zap size={14} />
                Coming Soon
              </span>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <History className="text-primary-500" size={20} />
                AI利用ログ
              </h2>
              <button onClick={fetchLogs} className="btn-secondary text-sm">
                更新
              </button>
            </div>
            <div className="space-y-3">
              {logs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <History size={48} className="mx-auto mb-2 opacity-50" />
                  <p>ログがありません</p>
                </div>
              )}
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
                        {getTypeLabel(log.type)}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        log.status === 'success' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {log.status === 'success' ? '成功' : 'エラー'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm')}
                    </span>
                  </div>
                  {log.prompt && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{log.prompt}</p>
                  )}
                  {log.result && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      {(log.type === 'image' || log.type === 'video' || log.type === 'voice') && log.result.startsWith('http') ? (
                        <div className="flex items-center gap-2">
                          {log.type === 'image' && (
                            <img src={log.result} alt="Generated" className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          {log.type === 'video' && (
                            <video src={log.result} className="w-24 h-16 object-cover rounded-lg" />
                          )}
                          {log.type === 'voice' && (
                            <audio src={log.result} controls className="h-8" />
                          )}
                          <span className="text-xs text-primary-600">クリックして詳細を表示</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 line-clamp-2">{log.result}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedLog && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-lg">
                    {getTypeLabel(selectedLog.type)}
                  </span>
                  <span className="text-sm text-slate-400">
                    {format(new Date(selectedLog.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                  </span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {selectedLog.prompt && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">入力 / プロンプト</h4>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedLog.prompt}</p>
                    </div>
                  </div>
                )}
                {selectedLog.result && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-slate-700">生成結果</h4>
                      {selectedLog.type !== 'image' && selectedLog.type !== 'video' && selectedLog.type !== 'voice' && (
                        <button
                          onClick={() => copyToClipboard(selectedLog.result || '')}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'コピー済み' : 'コピー'}
                        </button>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      {selectedLog.type === 'image' && selectedLog.result.startsWith('http') ? (
                        <div className="space-y-3">
                          <img src={selectedLog.result} alt="Generated" className="max-w-full rounded-xl" />
                          <a href={selectedLog.result} download target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                            <Download size={16} />
                            ダウンロード
                          </a>
                        </div>
                      ) : selectedLog.type === 'video' && selectedLog.result.startsWith('http') ? (
                        <video src={selectedLog.result} controls className="max-w-full rounded-xl" />
                      ) : selectedLog.type === 'voice' && selectedLog.result.startsWith('http') ? (
                        <audio src={selectedLog.result} controls className="w-full" />
                      ) : (
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{selectedLog.result}</pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="text-primary-500" size={20} />
              AI自動化
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText size={20} className="text-primary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">自動レポート生成</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  毎日/毎週の業務レポートを自動生成
                </p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                  <Zap size={14} />
                  Coming Soon
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <MessageSquare size={20} className="text-primary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">自動返信</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  メッセージへのAI自動返信設定
                </p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                  <Zap size={14} />
                  Coming Soon
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Bot size={20} className="text-primary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">タスク自動割当</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  AIが最適なスタッフにタスクを割り当て
                </p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                  <Zap size={14} />
                  Coming Soon
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <ChevronRight size={20} className="text-primary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">ワークフロー自動化</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  カスタムワークフローの自動実行
                </p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                  <Zap size={14} />
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
