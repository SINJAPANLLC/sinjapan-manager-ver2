import { Layout } from '../components/layout';
import { Truck } from 'lucide-react';

export default function LogisticsPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Truck className="text-primary-500" size={28} />
          物流
        </h1>
        <p className="text-slate-500 mt-1">物流管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">物流管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
