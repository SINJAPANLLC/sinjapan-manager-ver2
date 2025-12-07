import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, StickyNote } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Memo {
  id: number;
  date: string;
  content: string;
  color: string;
}

const colors = [
  { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { id: 'green', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { id: 'red', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [formData, setFormData] = useState({ content: '', color: 'blue' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listDate, setListDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchMemos();
  }, [currentDate]);

  const fetchMemos = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const res = await fetch(`/api/memos?start=${start.toISOString()}&end=${end.toISOString()}`);
    if (res.ok) {
      setMemos(await res.json());
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ja });
  const calendarEnd = endOfWeek(monthEnd, { locale: ja });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const getMemoForDate = (date: Date) => {
    return memos.filter(m => isSameDay(new Date(m.date), date));
  };

  const getColorClasses = (colorId: string) => {
    return colors.find(c => c.id === colorId) || colors[0];
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingMemo(null);
    setFormData({ content: '', color: 'blue' });
    setIsModalOpen(true);
  };

  const handleDeleteMemo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このメモを削除しますか？')) return;
    await fetch(`/api/memos/${id}`, { method: 'DELETE' });
    fetchMemos();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const url = editingMemo ? `/api/memos/${editingMemo.id}` : '/api/memos';
    const method = editingMemo ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          content: formData.content,
          color: formData.color,
        }),
      });

      if (res.ok) {
        await fetchMemos();
        setIsModalOpen(false);
        setEditingMemo(null);
        setFormData({ content: '', color: 'blue' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">カレンダー</h1>
          <p className="text-slate-500 text-sm mt-1">日付をクリックしてメモを追加</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-blue-50">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">
            {format(currentDate, 'yyyy年 M月', { locale: ja })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-sm font-semibold border-b border-slate-100",
                i === 0 && "text-red-500",
                i === 6 && "text-blue-500",
                i !== 0 && i !== 6 && "text-slate-600"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayMemos = getMemoForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayOfWeek = day.getDay();

            return (
              <div
                key={i}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors hover:bg-slate-50",
                  !isCurrentMonth && "bg-slate-50/50"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center text-sm rounded-full",
                      isToday(day) && "bg-primary-600 text-white font-bold",
                      !isToday(day) && isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                      !isToday(day) && isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                      !isToday(day) && isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-slate-700",
                      !isCurrentMonth && "text-slate-300"
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayMemos.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                      {dayMemos.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  {dayMemos.slice(0, 2).map((memo) => {
                    const colorClasses = getColorClasses(memo.color);
                    return (
                      <div
                        key={memo.id}
                        className={cn(
                          "group px-2 py-1 rounded text-xs truncate flex items-center gap-1 cursor-pointer hover:opacity-80",
                          colorClasses.bg,
                          colorClasses.text
                        )}
                        onClick={() => {
                          setSelectedDate(new Date(memo.date));
                          setEditingMemo(memo);
                          setFormData({ content: memo.content, color: memo.color || 'blue' });
                          setIsModalOpen(true);
                        }}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colorClasses.dot)} />
                        <span className="truncate flex-1">{memo.content}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMemo(memo.id, e);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/50 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {dayMemos.length > 2 && (
                    <div 
                      className="text-xs text-primary-600 pl-2 cursor-pointer hover:underline font-medium"
                      onClick={() => {
                        setListDate(day);
                        setIsListModalOpen(true);
                      }}
                    >
                      +{dayMemos.length - 2}件を表示
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <StickyNote size={18} className="text-amber-600" />
            {format(currentDate, 'M月', { locale: ja })}のメモ一覧
          </h3>
          <span className="px-2.5 py-1 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
            {memos.length}件
          </span>
        </div>
        {memos.length > 0 ? (
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {memos
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((memo) => {
                const colorClasses = getColorClasses(memo.color);
                const memoDate = new Date(memo.date);
                return (
                  <div
                    key={memo.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group cursor-pointer"
                    onClick={() => {
                      setSelectedDate(memoDate);
                      setEditingMemo(memo);
                      setFormData({ content: memo.content, color: memo.color || 'blue' });
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="text-center min-w-[50px]">
                      <p className={cn(
                        "text-2xl font-bold",
                        isToday(memoDate) ? "text-primary-600" : "text-slate-700"
                      )}>
                        {format(memoDate, 'd')}
                      </p>
                      <p className={cn(
                        "text-xs",
                        memoDate.getDay() === 0 ? "text-red-500" : memoDate.getDay() === 6 ? "text-blue-500" : "text-slate-500"
                      )}>
                        {format(memoDate, 'E', { locale: ja })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "px-3 py-2 rounded-lg",
                        colorClasses.bg
                      )}>
                        <div className="flex items-start gap-2">
                          <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", colorClasses.dot)} />
                          <p className={cn("text-sm", colorClasses.text)}>{memo.content}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(memoDate);
                          setEditingMemo(memo);
                          setFormData({ content: memo.content, color: memo.color || 'blue' });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteMemo(memo.id, e)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <StickyNote size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">メモはありません</p>
            <p className="text-slate-400 text-sm mt-1">カレンダーの日付をクリックしてメモを追加</p>
          </div>
        )}
      </div>

      {isListModalOpen && listDate && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
                  <StickyNote size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">メモ一覧</h2>
                  <p className="text-sm text-slate-500">
                    {format(listDate, 'yyyy年M月d日（E）', { locale: ja })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsListModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {getMemoForDate(listDate).map((memo) => {
                const colorClasses = getColorClasses(memo.color);
                return (
                  <div
                    key={memo.id}
                    className={cn(
                      "p-3 rounded-xl flex items-start gap-3",
                      colorClasses.bg
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", colorClasses.dot)} />
                    <div className="flex-1">
                      <p className={cn("text-sm", colorClasses.text)}>{memo.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setIsListModalOpen(false);
                          setSelectedDate(new Date(memo.date));
                          setEditingMemo(memo);
                          setFormData({ content: memo.content, color: memo.color || 'blue' });
                          setIsModalOpen(true);
                        }}
                        className={cn("p-1.5 rounded-lg hover:bg-white/50", colorClasses.text)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={async (e) => {
                          await handleDeleteMemo(memo.id, e);
                          if (getMemoForDate(listDate).length <= 1) {
                            setIsListModalOpen(false);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsListModalOpen(false);
                  setSelectedDate(listDate);
                  setEditingMemo(null);
                  setFormData({ content: '', color: 'blue' });
                  setIsModalOpen(true);
                }}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                新規メモを追加
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
                  <StickyNote size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingMemo ? 'メモを編集' : '新規メモ'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setEditingMemo(null); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メモ内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="メモを入力..."
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">カラー</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.id })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.dot,
                        formData.color === color.id
                          ? "ring-2 ring-offset-2 ring-primary-500 scale-110"
                          : "hover:scale-105"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingMemo(null); }}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : (editingMemo ? '更新' : '保存')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
