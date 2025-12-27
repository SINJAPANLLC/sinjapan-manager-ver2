import { Layout } from '../components/layout';
import { Headphones } from 'lucide-react';

export default function BPOPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Headphones className="text-primary-500" size={28} />
          BPO
        </h1>
        <p className="text-slate-500 mt-1">BPO管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">BPO管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
