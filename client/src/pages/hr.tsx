import { Layout } from '../components/layout';
import { Users2 } from 'lucide-react';

export default function HRPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Users2 className="text-primary-500" size={28} />
          人材
        </h1>
        <p className="text-slate-500 mt-1">人材管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">人材管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
