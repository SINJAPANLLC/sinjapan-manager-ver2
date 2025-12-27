import { Layout } from '../components/layout';
import { GraduationCap } from 'lucide-react';

export default function StudyPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <GraduationCap className="text-primary-500" size={28} />
          勉強
        </h1>
        <p className="text-slate-500 mt-1">勉強・学習管理</p>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">勉強管理ページは準備中です</p>
      </div>
    </Layout>
  );
}
