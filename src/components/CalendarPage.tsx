import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { JournalEntry, JournalReminderSaveResult } from '../types';
import { cn } from '../lib/utils';
import { buildMonthGrid, formatDateKey, getChineseWeekday, parseDateKey } from '../features/calendar/dateUtils';
import {
  buildDefaultReminderParts,
  buildLocalReminderIso,
  buildReminderSelectOptions,
  isFutureReminderAt,
  parseLocalReminderIso,
  ReminderDateParts,
} from '../features/calendar/journalReminder';

interface CalendarPageProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalReminderSaveResult>;
  onUpdateEntry: (
    id: string,
    updates: Pick<JournalEntry, 'title' | 'content' | 'reminderEnabled' | 'reminderAt'>,
  ) => Promise<JournalReminderSaveResult>;
  onDeleteEntry: (id: string) => Promise<void> | void;
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
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderParts, setReminderParts] = useState<ReminderDateParts>(() => buildDefaultReminderParts(todayKey, today));
  const [reminderError, setReminderError] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const monthGrid = useMemo(
    () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const reminderOptions = useMemo(() => buildReminderSelectOptions(today), []);
  const reminderDayOptions = useMemo(
    () => Array.from(
      { length: getDaysInMonth(reminderParts.year, reminderParts.month) },
      (_, index) => index + 1,
    ),
    [reminderParts.month, reminderParts.year],
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
    setReminderEnabled(false);
    setReminderParts(buildDefaultReminderParts(formatDateKey(date), today));
    setReminderError('');
    setReminderNotice('');
    setModalMode('list');
    setIsDayModalOpen(true);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setReminderEnabled(Boolean(entry.reminderEnabled && entry.reminderAt));
    setReminderParts(entry.reminderAt ? parseLocalReminderIso(entry.reminderAt) : buildDefaultReminderParts(entry.date, today));
    setReminderError('');
    setReminderNotice('');
    setModalMode('form');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setReminderEnabled(false);
    setReminderParts(buildDefaultReminderParts(selectedDateKey, today));
    setReminderError('');
    setReminderNotice('');
    setModalMode('form');
  };

  const saveEntry = async () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    if (!normalizedTitle && !normalizedContent) return;
    if (isSaving) return;

    setReminderError('');
    setReminderNotice('');
    const reminderAt = reminderEnabled ? buildLocalReminderIso(reminderParts) : undefined;
    if (reminderAt && !isFutureReminderAt(reminderAt)) {
      setReminderError('提醒时间需要晚于当前时间。');
      return;
    }

    setIsSaving(true);
    let result: JournalReminderSaveResult;
    if (editingId) {
      result = await onUpdateEntry(editingId, {
        title: normalizedTitle || '无题随笔',
        content: normalizedContent,
        reminderEnabled,
        reminderAt,
      });
    } else {
      result = await onAddEntry({
        date: selectedDateKey,
        title: normalizedTitle || '无题随笔',
        content: normalizedContent,
        reminderEnabled,
        reminderAt,
      });
    }

    setIsSaving(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setReminderEnabled(false);
    setReminderParts(buildDefaultReminderParts(selectedDateKey, today));
    setReminderNotice(
      result.permissionDenied
        ? '通知权限未开启，随笔已保存但提醒未启用。'
        : result.reminderScheduled
          ? '提醒已安排，到点会发送系统通知。'
          : '',
    );
    setModalMode('list');
  };

  const updateReminderPart = (key: keyof ReminderDateParts, value: string) => {
    setReminderParts((current) => {
      const next = { ...current, [key]: Number(value) };
      const maxDay = getDaysInMonth(next.year, next.month);
      return { ...next, day: Math.min(next.day, maxDay) };
    });
  };

  const renderReminderSelect = (label: string, key: keyof ReminderDateParts, values: number[]) => (
    <label className="min-w-0">
      <span className="mb-1 block text-[9px] font-bold tracking-widest opacity-40">{label}</span>
      <select
        value={reminderParts[key]}
        onChange={(event) => updateReminderPart(key, event.target.value)}
        className="w-full rounded-xl border border-nature-border bg-nature-bg px-2 py-2 text-xs font-bold outline-none"
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {String(value).padStart(label === '年' ? 4 : 2, '0')}
          </option>
        ))}
      </select>
    </label>
  );

  const dayModal = (
    <div className="fixed inset-0 z-[100] bg-[#4a4a3544] backdrop-blur-sm flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm max-h-[calc(100dvh-5rem)] overflow-y-auto bg-nature-bg border border-nature-border rounded-[36px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest opacity-40">随笔管理</div>
            <h2 className="italic-serif text-xl italic mt-1">
              {selectedDateKey} 周{getChineseWeekday(parseDateKey(selectedDateKey))}
            </h2>
          </div>
          <button
            onClick={() => setIsDayModalOpen(false)}
            className="w-10 h-10 rounded-2xl border border-nature-border bg-white flex items-center justify-center opacity-70"
            aria-label="关闭随笔弹窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {modalMode === 'list' ? (
          <>
            {reminderNotice && (
              <div className="mb-3 rounded-2xl border border-nature-primary/20 bg-nature-primary/10 px-4 py-3 text-xs font-bold leading-5 text-nature-primary">
                {reminderNotice}
              </div>
            )}
            <div className="space-y-3 mb-5">
              {selectedEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => startEdit(entry)}
                  className="w-full rounded-3xl bg-white border border-nature-border p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-sm">{entry.title}</h3>
                    <span className="opacity-40">
                      <Pencil className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-xs leading-5 opacity-60 line-clamp-3 whitespace-pre-wrap">{entry.content || '没有正文。'}</p>
                  {entry.reminderEnabled && entry.reminderAt && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-nature-primary/10 px-3 py-1 text-[10px] font-bold tracking-widest text-nature-primary">
                      <Bell className="w-3 h-3" />
                      {formatReminderDisplay(entry.reminderAt)}
                    </div>
                  )}
                </button>
              ))}
              {selectedEntries.length === 0 && (
                <div className="rounded-3xl border border-dashed border-nature-border p-6 text-center text-xs italic-serif italic opacity-40">
                  这一天还没有随笔，写下一粒种子。
                </div>
              )}
            </div>
            <button
              onClick={resetForm}
              className="w-full py-3 rounded-2xl bg-nature-primary text-white text-xs font-bold tracking-widest flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加随笔
            </button>
          </>
        ) : (
          <div className="rounded-3xl border border-nature-border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-widest opacity-40">
                {editingId ? '编辑随笔' : '新增随笔'}
              </div>
              {editingId && (
                <button
                  onClick={async () => {
                    await onDeleteEntry(editingId);
                    setModalMode('list');
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                    setReminderEnabled(false);
                    setReminderError('');
                  }}
                  className="text-nature-secondary opacity-80"
                  aria-label="删除随笔"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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
              className="w-full min-h-36 bg-transparent outline-none text-sm leading-6 resize-none"
            />
            <div className="mt-4 rounded-2xl border border-nature-border bg-nature-bg/70 p-3">
              <button
                type="button"
                onClick={() => {
                  setReminderEnabled(!reminderEnabled);
                  setReminderError('');
                }}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-2 text-xs font-bold tracking-widest">
                  {reminderEnabled ? <Bell className="w-4 h-4 text-nature-primary" /> : <BellOff className="w-4 h-4 opacity-40" />}
                  提醒我
                </span>
                <span className="text-[10px] font-bold tracking-widest opacity-50">
                  {reminderEnabled ? '已开启' : '未开启'}
                </span>
              </button>
              {reminderEnabled && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {renderReminderSelect('年', 'year', reminderOptions.years)}
                    {renderReminderSelect('月', 'month', reminderOptions.months)}
                    {renderReminderSelect('日', 'day', reminderDayOptions)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderReminderSelect('时', 'hour', reminderOptions.hours)}
                    {renderReminderSelect('分', 'minute', reminderOptions.minutes)}
                  </div>
                  {reminderError && (
                    <p className="text-[10px] font-bold tracking-widest text-nature-secondary">
                      {reminderError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setModalMode('list')}
                className="py-3 rounded-2xl border border-nature-border bg-white text-xs font-bold tracking-widest opacity-60"
              >
                返回列表
              </button>
              <button
                onClick={saveEntry}
                disabled={isSaving}
                className="py-3 rounded-2xl bg-nature-primary text-white text-xs font-bold tracking-widest disabled:opacity-50"
              >
                {isSaving ? '保存中' : editingId ? '保存修改' : '保存随笔'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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

      {isDayModalOpen && (typeof document === 'undefined' ? dayModal : createPortal(dayModal, document.body))}
    </div>
  );
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatReminderDisplay(reminderAt: string): string {
  const parts = parseLocalReminderIso(reminderAt);
  return `${parts.month}月${parts.day}日 ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}
