import { Layout } from '../components/layout';
import { Monitor } from 'lucide-react';

export default function ITPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Monitor className="text-primary-500" size={28} />
          IT
        </h1>
        <p className="text-slate-500 mt-1">IT管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">IT管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
