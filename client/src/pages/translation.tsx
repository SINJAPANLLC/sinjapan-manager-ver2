import { useState } from 'react';
import { Languages, ArrowRightLeft, Copy, Check, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const LANGUAGES = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: '英語' },
  { code: 'zh', name: '中国語（簡体字）' },
  { code: 'zh-TW', name: '中国語（繁体字）' },
  { code: 'ko', name: '韓国語' },
  { code: 'vi', name: 'ベトナム語' },
  { code: 'th', name: 'タイ語' },
  { code: 'id', name: 'インドネシア語' },
  { code: 'ms', name: 'マレー語' },
  { code: 'tl', name: 'フィリピン語' },
  { code: 'my', name: 'ミャンマー語' },
  { code: 'ne', name: 'ネパール語' },
  { code: 'hi', name: 'ヒンディー語' },
  { code: 'bn', name: 'ベンガル語' },
  { code: 'es', name: 'スペイン語' },
  { code: 'pt', name: 'ポルトガル語' },
  { code: 'fr', name: 'フランス語' },
  { code: 'de', name: 'ドイツ語' },
  { code: 'it', name: 'イタリア語' },
  { code: 'ru', name: 'ロシア語' },
  { code: 'ar', name: 'アラビア語' },
  { code: 'tr', name: 'トルコ語' },
];

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('ja');
  const [targetLang, setTargetLang] = useState('en');
  const [copied, setCopied] = useState(false);

  const translateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
        }),
      });
      if (!response.ok) throw new Error('翻訳に失敗しました');
      return response.json();
    },
    onSuccess: (data) => {
      setTranslatedText(data.translation);
    },
  });

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find(l => l.code === code)?.name || code;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-3">
          <Languages className="text-primary-500" size={28} />
          翻訳
        </h1>
        <p className="text-slate-500 mt-1">AI翻訳 - 多言語対応</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">翻訳元言語</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            className="p-3 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 transition-colors mt-6 lg:mt-0"
            title="言語を入れ替え"
          >
            <ArrowRightLeft size={20} />
          </button>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">翻訳先言語</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              原文 ({getLanguageName(sourceLang)})
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="翻訳したいテキストを入力してください..."
              className="w-full h-64 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-slate-400 mt-2">{sourceText.length} 文字</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              翻訳結果 ({getLanguageName(targetLang)})
            </label>
            <div className="relative">
              <textarea
                value={translatedText}
                readOnly
                placeholder="翻訳結果がここに表示されます..."
                className="w-full h-64 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 resize-none"
              />
              {translatedText && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                  title="コピー"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-slate-500" />}
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2">{translatedText.length} 文字</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => translateMutation.mutate()}
            disabled={!sourceText.trim() || translateMutation.isPending}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {translateMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                翻訳中...
              </>
            ) : (
              <>
                <Languages size={20} />
                翻訳する
              </>
            )}
          </button>
        </div>

        {translateMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            翻訳に失敗しました。もう一度お試しください。
          </div>
        )}
      </div>

      <div className="mt-6 glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">対応言語一覧</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {LANGUAGES.map((lang) => (
            <div key={lang.code} className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 text-center">
              {lang.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
