import { Layout } from '../components/layout';
import { Languages } from 'lucide-react';

export default function TranslationPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Languages className="text-primary-500" size={28} />
          翻訳
        </h1>
        <p className="text-slate-500 mt-1">翻訳管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">翻訳管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
