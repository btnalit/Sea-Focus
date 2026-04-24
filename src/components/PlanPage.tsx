import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Task, TaskQuadrant } from '../types';
import { cn } from '../lib/utils';
import {
  buildDateRangeAround,
  formatDateKey,
  getChineseWeekday,
} from '../features/calendar/dateUtils';

interface PlanPageProps {
  tasks: Task[];
  todayPomodoros: number;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
}

const quadrants: { id: TaskQuadrant; label: string; color: string; textColor: string; checkBoxBorder: string; checkBoxActive: string }[] = [
  { id: 'urgent-important', label: '核心/紧急', color: 'bg-[#fcf7f6] border-[#f2e4e0]', textColor: 'text-[#c68a73]', checkBoxBorder: 'border-[#c68a73]', checkBoxActive: 'bg-[#c68a73]' },
  { id: 'not-urgent-important', label: '战略/成长', color: 'bg-[#fdf9f0] border-[#eae1d1]', textColor: 'text-[#d0a460]', checkBoxBorder: 'border-[#d0a460]', checkBoxActive: 'bg-[#d0a460]' },
  { id: 'urgent-not-important', label: '琐事/干扰', color: 'bg-[#f2f6f3] border-[#e1e8de]', textColor: 'text-[#7c8363]', checkBoxBorder: 'border-[#7c8363]', checkBoxActive: 'bg-[#7c8363]' },
  { id: 'not-urgent-not-important', label: '冥想/留白', color: 'bg-[#f5f7f9] border-[#e6ebef]', textColor: 'text-[#7a8e9e]', checkBoxBorder: 'border-[#7a8e9e]', checkBoxActive: 'bg-[#7a8e9e]' },
];

let persistedSelectedDateKey: string | null = null;
let persistedDateStripScrollLeft: number | null = null;
let hasCenteredInitialPlanDate = false;

export const PlanPage: React.FC<PlanPageProps> = ({ tasks, todayPomodoros, onAddTask, onToggleTask }) => {
  const todayKey = formatDateKey(new Date());
  const [selectedDateKey, setSelectedDateKeyState] = useState(() => persistedSelectedDateKey ?? todayKey);
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [targetQuadrant, setTargetQuadrant] = useState<TaskQuadrant>('urgent-important');
  const dateStrip = useMemo(() => buildDateRangeAround(new Date(), 45, 45), []);
  const dateStripRef = useRef<HTMLDivElement | null>(null);
  const selectedDateRef = useRef<HTMLButtonElement | null>(null);
  const shouldCenterSelectedDate = useRef(false);
  const selectedDateTasks = tasks.filter((task) => normalizeTaskDateKey(task.date) === selectedDateKey);
  const visibleTasks = selectedDateTasks.filter((task) => viewMode === 'archive' ? task.completed : !task.completed);

  useLayoutEffect(() => {
    const strip = dateStripRef.current;
    const selectedDate = selectedDateRef.current;
    if (!strip || !selectedDate) return;

    if (persistedDateStripScrollLeft !== null) {
      strip.scrollLeft = persistedDateStripScrollLeft;
      return;
    }

    if (!hasCenteredInitialPlanDate) {
      centerDateInStrip(strip, selectedDate, 'auto');
      persistedDateStripScrollLeft = strip.scrollLeft;
      hasCenteredInitialPlanDate = true;
    }
  }, []);

  useLayoutEffect(() => {
    if (!shouldCenterSelectedDate.current) return;
    const strip = dateStripRef.current;
    const selectedDate = selectedDateRef.current;
    if (strip && selectedDate) {
      centerDateInStrip(strip, selectedDate, 'smooth');
    }
    shouldCenterSelectedDate.current = false;
  }, [selectedDateKey]);

  const selectDate = (dateKey: string) => {
    persistedSelectedDateKey = dateKey;
    shouldCenterSelectedDate.current = true;
    if (dateKey === selectedDateKey) {
      const strip = dateStripRef.current;
      const selectedDate = selectedDateRef.current;
      if (strip && selectedDate) {
        centerDateInStrip(strip, selectedDate, 'smooth');
      }
      shouldCenterSelectedDate.current = false;
      return;
    }
    setSelectedDateKeyState(dateKey);
  };

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({ title: newTaskTitle.trim(), quadrant: targetQuadrant, date: selectedDateKey });
    setNewTaskTitle('');
    setIsAdding(false);
    setViewMode('active');
  };

  return (
    <div className="p-6 min-h-full pb-24 font-sans text-nature-text">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setViewMode('active')}
            className={cn(
              'italic-serif text-3xl font-bold pb-1 leading-none',
              viewMode === 'active' ? 'border-b-2 border-nature-secondary' : 'opacity-30',
            )}
          >
            计划
          </button>
          <button
            onClick={() => setViewMode('archive')}
            className={cn(
              'text-xl font-serif italic italic-serif pb-1 leading-none',
              viewMode === 'archive' ? 'border-b-2 border-nature-secondary' : 'opacity-30',
            )}
          >
            归档
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] opacity-50 uppercase font-bold tracking-tighter">今日收获</div>
            <div className="text-xs italic-serif italic font-medium">{todayPomodoros} 番茄</div>
          </div>
          <button
            onClick={() => selectDate(todayKey)}
            className="w-10 h-10 rounded-full border border-nature-primary p-0.5"
            aria-label="回到今天"
          >
            <div className="w-full h-full bg-[#e9e8e0] rounded-full" />
          </button>
        </div>
      </div>

      <div
        ref={dateStripRef}
        onScroll={(event) => {
          persistedDateStripScrollLeft = event.currentTarget.scrollLeft;
        }}
        className="mb-8 -mx-6 px-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        <div className="flex gap-3 w-max py-1">
          {dateStrip.map((date) => {
            const dateKey = formatDateKey(date);
            const isSelected = dateKey === selectedDateKey;
            const dayTaskCount = tasks.filter((task) => normalizeTaskDateKey(task.date) === dateKey && !task.completed).length;

            return (
              <button
                key={dateKey}
                ref={isSelected ? selectedDateRef : undefined}
                onClick={() => selectDate(dateKey)}
                className={cn(
                  'snap-center flex flex-col items-center justify-center h-20 w-16 shrink-0 rounded-[28px] border transition-all duration-300',
                  isSelected ? 'bg-nature-primary text-white border-nature-primary shadow-lg shadow-nature-primary/20 scale-105' : 'bg-white border-nature-border opacity-70',
                )}
              >
                <span className="text-[9px] font-bold tracking-widest mb-1">{getChineseWeekday(date)}</span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-40" style={{ visibility: dayTaskCount > 0 ? 'visible' : 'hidden' }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="italic-serif text-xl italic">{viewMode === 'archive' ? '归档庭院' : '专注庭院'}</h3>
          {viewMode === 'active' && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-nature-secondary font-bold text-xs tracking-widest"
            >
              + 添加计划
            </button>
          )}
        </div>

        <motion.div
          key={`${selectedDateKey}-${viewMode}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-2 gap-4"
        >
          {quadrants.map((q) => {
            const quadrantTasks = visibleTasks.filter((task) => task.quadrant === q.id);

            return (
              <div key={q.id} className={cn('rounded-[32px] p-5 min-h-40 flex flex-col border transition-all shadow-sm', q.color)}>
                <div className={cn('text-[10px] font-bold tracking-widest mb-3', q.textColor)}>
                  {q.label}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {quadrantTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        'w-full flex items-start gap-2 text-left text-xs transition-all group',
                        task.completed ? 'opacity-40' : 'opacity-100',
                      )}
                    >
                      <span className={cn(
                        'w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors duration-300',
                        q.checkBoxBorder,
                        task.completed ? q.checkBoxActive : 'bg-transparent',
                      )}>
                        {task.completed && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                      <span className={cn(task.completed && 'line-through')}>{task.title}</span>
                    </button>
                  ))}
                  {quadrantTasks.length === 0 && (
                    <div className="text-[10px] opacity-20 italic">庭院空空如也...</div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-[#4a4a3544] backdrop-blur-sm z-[100] flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-nature-bg border border-nature-border rounded-[40px] w-full max-w-sm p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="italic-serif text-2xl italic">播种新计划</h3>
              <button onClick={() => setIsAdding(false)} className="text-[10px] font-bold tracking-widest opacity-40">关闭</button>
            </div>

            <div className="text-[10px] font-bold tracking-widest opacity-40 mb-3">
              {selectedDateKey}
            </div>

            <input
              autoFocus
              className="w-full bg-transparent border-b border-nature-border py-3 mb-6 outline-none text-xl font-serif italic"
              placeholder="你想专注些什么..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            <div className="space-y-2 mb-8">
              <div className="text-[10px] font-bold tracking-widest opacity-40 mb-2">选择土壤</div>
              <div className="grid grid-cols-2 gap-2">
                {quadrants.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setTargetQuadrant(q.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold tracking-widest transition-all border',
                      targetQuadrant === q.id ? `${q.checkBoxActive} text-white ${q.checkBoxBorder}` : `bg-white ${q.checkBoxBorder} opacity-50 hover:opacity-80 ${q.textColor}`,
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-4 bg-nature-primary text-white rounded-3xl font-bold tracking-widest text-sm shadow-lg shadow-nature-primary/20"
            >
              确认播种
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

function normalizeTaskDateKey(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return formatDateKey(new Date(date));
}

function centerDateInStrip(container: HTMLDivElement, selectedDate: HTMLButtonElement, behavior: ScrollBehavior) {
  const left = selectedDate.offsetLeft - (container.clientWidth / 2) + (selectedDate.clientWidth / 2);
  container.scrollTo({ left: Math.max(0, left), behavior });
}
