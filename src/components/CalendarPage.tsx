import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';
import { cn } from '../lib/utils';
import { buildMonthGrid, formatDateKey, getChineseWeekday, parseDateKey } from '../features/calendar/dateUtils';

interface CalendarPageProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (id: string, updates: Pick<JournalEntry, 'title' | 'content'>) => void;
  onDeleteEntry: (id: string) => void;
}

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

export const CalendarPage: React.FC<CalendarPageProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const monthGrid = useMemo(
    () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const selectedEntries = entries
    .filter((entry) => entry.date === selectedDateKey)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const goMonth = (offset: number) => {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDateKey(formatDateKey(date));
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const saveEntry = () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    if (!normalizedTitle && !normalizedContent) return;

    if (editingId) {
      onUpdateEntry(editingId, {
        title: normalizedTitle || '无题随笔',
        content: normalizedContent,
      });
    } else {
      onAddEntry({
        date: selectedDateKey,
        title: normalizedTitle || '无题随笔',
        content: normalizedContent,
      });
    }

    resetForm();
  };

  return (
    <div className="p-6 pb-28 font-sans overflow-y-auto h-full text-nature-text">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => goMonth(-1)}
          className="w-10 h-10 rounded-2xl border border-nature-border bg-white flex items-center justify-center opacity-70"
          aria-label="上个月"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="italic-serif text-3xl font-bold border-b-2 border-nature-secondary pb-1 leading-none">随笔庭院</h1>
          <div className="text-[10px] font-bold tracking-widest opacity-40 mt-3">
            {visibleMonth.getFullYear()}.{String(visibleMonth.getMonth() + 1).padStart(2, '0')}
          </div>
        </div>
        <button
          onClick={() => goMonth(1)}
          className="w-10 h-10 rounded-2xl border border-nature-border bg-white flex items-center justify-center opacity-70"
          aria-label="下个月"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border border-nature-border rounded-[40px] p-4 shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-7 mb-3">
          {weekdays.map(w => (
            <div key={w} className="text-center py-2 text-[10px] font-bold tracking-widest opacity-40">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-t border-nature-border/30">
          {monthGrid.map((date) => {
            const dateKey = formatDateKey(date);
            const dayEntries = entries.filter((entry) => entry.date === dateKey);
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === todayKey;

            return (
              <button
                key={dateKey}
                onClick={() => selectDate(date)}
                className={cn(
                  'min-h-[78px] border-r border-b border-nature-border/20 p-1.5 flex flex-col text-left transition-colors',
                  !isCurrentMonth && 'opacity-25',
                  isSelected ? 'bg-nature-primary/10' : 'hover:bg-nature-bg/50',
                  date.getDay() === 0 && 'border-r-0',
                )}
              >
                <span className={cn(
                  'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-2xl transition-all',
                  isSelected ? 'bg-nature-primary text-white shadow-sm' : isToday ? 'border border-nature-primary text-nature-primary' : 'opacity-40',
                )}>
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayEntries.slice(0, 2).map((entry) => (
                    <div key={entry.id} className="text-[8px] font-bold tracking-tighter bg-nature-secondary/10 text-nature-secondary px-1 py-0.5 rounded-md truncate">
                      {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 2 && (
                    <div className="text-[8px] opacity-30 font-bold">+{dayEntries.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-nature-border rounded-[36px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest opacity-40">选中日期</div>
            <h2 className="italic-serif text-xl italic mt-1">
              {selectedDateKey} 周{getChineseWeekday(parseDateKey(selectedDateKey))}
            </h2>
          </div>
          <button
            onClick={resetForm}
            className="w-10 h-10 rounded-2xl bg-nature-primary text-white flex items-center justify-center"
            aria-label="新建随笔"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {selectedEntries.map((entry) => (
            <div key={entry.id} className="rounded-3xl bg-nature-bg border border-nature-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-sm">{entry.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(entry)} className="opacity-50 hover:opacity-100" aria-label="编辑随笔">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteEntry(entry.id)} className="opacity-50 hover:opacity-100" aria-label="删除随笔">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs leading-5 opacity-60 whitespace-pre-wrap">{entry.content || '没有正文。'}</p>
            </div>
          ))}
          {selectedEntries.length === 0 && (
            <div className="rounded-3xl border border-dashed border-nature-border p-6 text-center text-xs italic-serif italic opacity-40">
              这一天还没有随笔，写下一粒种子。
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-nature-border bg-nature-bg/60 p-4">
          <div className="text-[10px] font-bold tracking-widest opacity-40 mb-3">
            {editingId ? '编辑随笔' : '新增随笔'}
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="标题"
            className="w-full bg-transparent border-b border-nature-border py-2 mb-3 outline-none text-sm font-bold"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="记录今天的想法、安排或复盘..."
            className="w-full min-h-24 bg-transparent outline-none text-sm leading-6 resize-none"
          />
          <button
            onClick={saveEntry}
            className="w-full mt-4 py-3 rounded-2xl bg-nature-primary text-white text-xs font-bold tracking-widest"
          >
            {editingId ? '保存修改' : '保存随笔'}
          </button>
        </div>
      </div>
    </div>
  );
};
