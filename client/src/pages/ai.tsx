import { useState } from 'react';
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
  X
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

  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState('');

  const [seoTopic, setSeoTopic] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoArticle, setSeoArticle] = useState('');

  const [voiceText, setVoiceText] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');

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

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
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

  const handleVideoGenerate = async () => {
    if (!videoPrompt.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedVideo('');

    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('動画生成に失敗しました');
    } finally {
      setIsLoading(false);
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
        body: JSON.stringify({ text: voiceText }),
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
              画像生成 (MODELSLAB)
            </h2>
            <p className="text-sm text-slate-500">テキストから高品質な画像を生成します</p>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="生成したい画像の説明を入力... (例: 夕日に照らされた富士山、写実的なスタイル)"
              rows={3}
              className="input-field resize-none"
            />
            <button
              onClick={handleImageGenerate}
              disabled={isLoading || !imagePrompt.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              画像を生成
            </button>
            {generatedImage && (
              <div className="mt-4">
                <img src={generatedImage} alt="Generated" className="max-w-full rounded-xl shadow-lg" />
                <a href={generatedImage} download className="btn-secondary mt-3 inline-flex items-center gap-2">
                  <Download size={16} />
                  ダウンロード
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Video className="text-primary-500" size={20} />
              動画生成 (MODELSLAB)
            </h2>
            <p className="text-sm text-slate-500">テキストから動画を生成します</p>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="生成したい動画の説明を入力..."
              rows={3}
              className="input-field resize-none"
            />
            <button
              onClick={handleVideoGenerate}
              disabled={isLoading || !videoPrompt.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              動画を生成
            </button>
            {generatedVideo && (
              <div className="mt-4">
                <video src={generatedVideo} controls className="max-w-full rounded-xl shadow-lg" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="text-primary-500" size={20} />
              SEO記事生成
            </h2>
            <p className="text-sm text-slate-500">SEOに最適化された記事を自動生成します</p>
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
              onClick={handleSeoGenerate}
              disabled={isLoading || !seoTopic.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
              記事を生成
            </button>
            {seoArticle && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-slate-700">生成された記事</span>
                  <button
                    onClick={() => copyToClipboard(seoArticle)}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border">{seoArticle}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Mic className="text-primary-500" size={20} />
              音声生成
            </h2>
            <p className="text-sm text-slate-500">テキストを自然な音声に変換します</p>
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
                  <button
                    onClick={() => copyToClipboard(generatedList)}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border">{generatedList}</pre>
              </div>
            )}
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
                  <button
                    onClick={() => copyToClipboard(generatedDoc)}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-white p-4 rounded-lg border font-sans">{generatedDoc}</pre>
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
