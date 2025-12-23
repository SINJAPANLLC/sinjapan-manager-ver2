import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Compass, Target, Users, AlertTriangle, TrendingUp, UserCheck, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Business {
  id: string;
  name: string;
}

interface BusinessDesign {
  id: number;
  businessId: string;
  purpose?: string;
  customerProblem?: string;
  solution?: string;
  alternatives?: string;
  numbers?: string;
  responsibility?: string;
  successCriteria?: string;
  operationLoop?: string;
  createdAt: string;
  updatedAt: string;
}

const sectionConfig = [
  { key: 'purpose', label: '1. 目的（なぜやるか）', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'customerProblem', label: '2. 顧客課題（困りごと）', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'solution', label: '3. 解決策（戦略/どう解くか）', icon: Compass, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'alternatives', label: '4. 代替案と却下理由（他案/なぜ捨てるか）', icon: X, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'numbers', label: '5. 数字（KPI逆算・コスト・利益・リスク・拡大・CF）', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'responsibility', label: '6. 責任者/チーム/セル生産/割り振り（役割設計）', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'successCriteria', label: '7. 実行後の世界（成功/失敗の線引き）', icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
  { key: 'operationLoop', label: '8. 到達思考→行動→継続→改善（運用ループ）', icon: RefreshCw, color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export function DesignsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [designs, setDesigns] = useState<BusinessDesign[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<BusinessDesign | null>(null);
  const [expandedDesign, setExpandedDesign] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    businessId: '',
    purpose: '',
    customerProblem: '',
    solution: '',
    alternatives: '',
    numbers: '',
    responsibility: '',
    successCriteria: '',
    operationLoop: '',
  });

  useEffect(() => {
    fetchBusinesses();
    fetchDesigns();
  }, []);

  useEffect(() => {
    fetchDesigns();
  }, [selectedBusinessId]);

  const fetchBusinesses = async () => {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      const data = await res.json();
      setBusinesses(data);
    }
  };

  const fetchDesigns = async () => {
    const url = selectedBusinessId
      ? `/api/business-designs?businessId=${selectedBusinessId}`
      : '/api/business-designs';
    const res = await fetch(url);
    if (res.ok) {
      setDesigns(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDesign
      ? `/api/business-designs/${editingDesign.id}`
      : '/api/business-designs';
    const method = editingDesign ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      fetchDesigns();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この設計を削除しますか？')) return;
    await fetch(`/api/business-designs/${id}`, { method: 'DELETE' });
    fetchDesigns();
  };

  const openModal = (design?: BusinessDesign) => {
    if (design) {
      setEditingDesign(design);
      setFormData({
        businessId: design.businessId,
        purpose: design.purpose || '',
        customerProblem: design.customerProblem || '',
        solution: design.solution || '',
        alternatives: design.alternatives || '',
        numbers: design.numbers || '',
        responsibility: design.responsibility || '',
        successCriteria: design.successCriteria || '',
        operationLoop: design.operationLoop || '',
      });
    } else {
      setEditingDesign(null);
      setFormData({
        businessId: selectedBusinessId || '',
        purpose: '',
        customerProblem: '',
        solution: '',
        alternatives: '',
        numbers: '',
        responsibility: '',
        successCriteria: '',
        operationLoop: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDesign(null);
    setFormData({
      businessId: '',
      purpose: '',
      customerProblem: '',
      solution: '',
      alternatives: '',
      numbers: '',
      responsibility: '',
      successCriteria: '',
      operationLoop: '',
    });
  };

  const getBusinessName = (businessId: string) => {
    return businesses.find(b => b.id === businessId)?.name || '不明';
  };

  const toggleExpand = (id: number) => {
    setExpandedDesign(expandedDesign === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">事業設計</h1>
          <p className="text-slate-500 mt-1">事業の戦略設計と計画を管理</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-button transition-all duration-200"
        >
          <Plus size={20} />
          新規設計
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={selectedBusinessId}
          onChange={(e) => setSelectedBusinessId(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">すべての事業</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {designs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Compass size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">設計がありません</p>
          <p className="text-slate-400 text-sm mt-1">新規設計ボタンから追加してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {designs.map(design => (
            <div key={design.id} className="glass-card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(design.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Briefcase size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{getBusinessName(design.businessId)}</h3>
                      <p className="text-sm text-slate-500">
                        更新: {format(new Date(design.updatedAt), 'yyyy/MM/dd HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(design); }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(design.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedDesign === design.id ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedDesign === design.id && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  {sectionConfig.map(section => {
                    const Icon = section.icon;
                    const value = design[section.key as keyof BusinessDesign] as string;
                    if (!value) return null;
                    return (
                      <div key={section.key} className={cn("p-4 rounded-lg", section.bg)}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={18} className={section.color} />
                          <h4 className={cn("font-medium", section.color)}>{section.label}</h4>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingDesign ? '設計を編集' : '新規設計'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  事業 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {sectionConfig.map(section => {
                const Icon = section.icon;
                return (
                  <div key={section.key} className={cn("p-4 rounded-xl border", section.bg, "border-slate-200")}>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Icon size={16} className={section.color} />
                      <span className={section.color}>{section.label}</span>
                    </label>
                    <textarea
                      value={formData[section.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [section.key]: e.target.value })}
                      rows={4}
                      placeholder={`${section.label}を入力...`}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                    />
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-button transition-all duration-200"
                >
                  {editingDesign ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
