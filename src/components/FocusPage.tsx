import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FocusRecord, FocusTaskSnapshot, Task, TaskQuadrant } from '../types';
import { formatDateKey } from '../features/calendar/dateUtils';
import {
  commitCustomFocusMinutesDraft,
  FocusDurationPresetId,
  FOCUS_DURATION_PRESETS,
  normalizeCustomFocusMinutesDraft,
  toFocusDurationSeconds,
} from '../features/focus/durationPresets';
import { playFocusCompletionTone, primeFocusCompletionTone } from '../features/focus/completionTone';
import { shouldSaveStopwatchSession } from '../features/focus/sessionCompletion';
import {
  buildFocusTaskSnapshot,
  getSelectableFocusTasks,
  resolveFocusTaskSnapshot,
} from '../features/focus/focusTaskLinking';
import { isTaskCarriedForward } from '../features/plan/taskLifecycle';

interface FocusPageProps {
  tasks: Task[];
  onFocusComplete: (record: Omit<FocusRecord, 'id' | 'timestamp'>) => void;
}

const FOCUS_CATEGORIES = ['深度工作', '日常维护', '冥想复盘', '学习成长', '其他'];

const TASK_CATEGORY_LABELS: Record<TaskQuadrant, string> = {
  'urgent-important': '深度工作',
  'not-urgent-important': '学习成长',
  'urgent-not-important': '日常维护',
  'not-urgent-not-important': '冥想复盘',
};

export const FocusPage: React.FC<FocusPageProps> = ({ tasks, onFocusComplete }) => {
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro' | 'countdown'>('pomodoro');
  const [selectedPreset, setSelectedPreset] = useState<FocusDurationPresetId>('25');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customMinutesInput, setCustomMinutesInput] = useState('25');
  const [category, setCategory] = useState(FOCUS_CATEGORIES[0]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskSnapshot, setSelectedTaskSnapshot] = useState<FocusTaskSnapshot | null>(null);
  const [timeLeft, setTimeLeft] = useState(toFocusDurationSeconds(25));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(toFocusDurationSeconds(25));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedSeconds = toFocusDurationSeconds(selectedPreset === 'custom' ? customMinutes : Number(selectedPreset));
  const today = new Date();
  const todayKey = formatDateKey(today);
  const selectableFocusTasks = getSelectableFocusTasks(tasks, today);
  const selectedTaskStillSelectable = selectedTaskId
    ? selectableFocusTasks.some((task) => task.id === selectedTaskId)
    : false;

  useEffect(() => {
    if (!isActive && mode !== 'stopwatch') {
      setInitialTime(selectedSeconds);
      setTimeLeft(selectedSeconds);
    }
  }, [isActive, mode, selectedSeconds]);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsedSeconds((prev) => prev + 1);
        return;
      }

      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  useEffect(() => {
    if (isActive && mode !== 'stopwatch' && timeLeft === 0) {
      setIsActive(false);
      playFocusCompletionTone();
      onFocusComplete(buildFocusRecord(mode, initialTime));
    }
  }, [initialTime, isActive, mode, onFocusComplete, timeLeft, tasks, selectedTaskId, selectedTaskSnapshot, category]);

  const buildFocusRecord = (
    recordType: FocusRecord['type'],
    duration: number,
  ): Omit<FocusRecord, 'id' | 'timestamp'> => {
    const taskSnapshot = resolveFocusTaskSnapshot(tasks, selectedTaskId, selectedTaskSnapshot);

    return taskSnapshot
      ? { type: recordType, duration, category, task: taskSnapshot }
      : { type: recordType, duration, category };
  };

  const handleModeChange = (nextMode: typeof mode) => {
    if (nextMode === mode) return;
    if (mode === 'stopwatch' && shouldSaveStopwatchSession(elapsedSeconds)) {
      onFocusComplete(buildFocusRecord(mode, elapsedSeconds));
    }
    setIsActive(false);
    setMode(nextMode);
    setElapsedSeconds(0);
    if (nextMode !== 'stopwatch') {
      setInitialTime(selectedSeconds);
      setTimeLeft(selectedSeconds);
    }
  };

  const handleTaskSelect = (task: Task | null) => {
    if (isActive) return;

    if (!task) {
      setSelectedTaskId(null);
      setSelectedTaskSnapshot(null);
      return;
    }

    setSelectedTaskId(task.id);
    setSelectedTaskSnapshot(buildFocusTaskSnapshot(task));
    setCategory(TASK_CATEGORY_LABELS[task.quadrant]);
  };

  const handlePresetChange = (presetId: FocusDurationPresetId) => {
    if (isActive) return;
    setSelectedPreset(presetId);
    if (presetId === 'custom') {
      setCustomMinutesInput(String(customMinutes));
    }
    const nextMinutes = presetId === 'custom' ? customMinutes : Number(presetId);
    const nextSeconds = toFocusDurationSeconds(nextMinutes);
    setInitialTime(nextSeconds);
    setTimeLeft(nextSeconds);
  };

  const handleCustomMinutesChange = (value: string) => {
    const draft = normalizeCustomFocusMinutesDraft(value, customMinutes);
    setCustomMinutesInput(draft.inputValue);

    if (!draft.shouldUpdateTimer) return;

    const nextMinutes = draft.minutes;
    setCustomMinutes(nextMinutes);
    if (!isActive && selectedPreset === 'custom') {
      const nextSeconds = toFocusDurationSeconds(nextMinutes);
      setInitialTime(nextSeconds);
      setTimeLeft(nextSeconds);
    }
  };

  const commitCustomMinutes = () => {
    const committedDraft = commitCustomFocusMinutesDraft(customMinutesInput);
    setCustomMinutesInput(committedDraft.inputValue);
    setCustomMinutes(committedDraft.minutes);

    if (!isActive && selectedPreset === 'custom') {
      const nextSeconds = toFocusDurationSeconds(committedDraft.minutes);
      setInitialTime(nextSeconds);
      setTimeLeft(nextSeconds);
    }
  };

  const toggleTimer = () => {
    if (isActive && mode === 'stopwatch') {
      setIsActive(false);
      if (shouldSaveStopwatchSession(elapsedSeconds)) {
        onFocusComplete(buildFocusRecord(mode, elapsedSeconds));
        setElapsedSeconds(0);
      }
      return;
    }

    if (!isActive && mode !== 'stopwatch' && timeLeft === 0) {
      setTimeLeft(initialTime);
    }
    if (!isActive) {
      primeFocusCompletionTone();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
    setElapsedSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displaySeconds = mode === 'stopwatch' ? elapsedSeconds : timeLeft;
  const progress = mode === 'stopwatch' ? Math.min((elapsedSeconds / initialTime) * 100, 100) : (timeLeft / initialTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-full pb-24 px-5 text-nature-text text-center">
      <div className="flex space-x-6 mb-7 text-xs font-bold tracking-widest opacity-40">
        <button onClick={() => handleModeChange('stopwatch')} className={cn("pb-1 transition-all", mode === 'stopwatch' && "text-nature-primary opacity-100 border-b-2 border-nature-primary")}>正计时</button>
        <button onClick={() => handleModeChange('pomodoro')} className={cn("pb-1 transition-all", mode === 'pomodoro' && "text-nature-primary opacity-100 border-b-2 border-nature-primary")}>番茄钟</button>
        <button onClick={() => handleModeChange('countdown')} className={cn("pb-1 transition-all", mode === 'countdown' && "text-nature-primary opacity-100 border-b-2 border-nature-primary")}>倒计时</button>
      </div>

      <div className="text-center mb-5">
        <h2 className="italic-serif text-2xl mb-1">当前专注</h2>
        <p className="text-sm opacity-50 font-medium">深度工作，静待花开</p>
      </div>

      <div className="w-full max-w-xs mb-5 text-left">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-bold tracking-[0.2em] text-nature-text/45">关联计划</span>
          <span className="text-[10px] font-bold tracking-widest text-nature-secondary/80">
            {selectedTaskSnapshot ? '本次记录会写入计划快照' : '可选未完成计划'}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            disabled={isActive}
            onClick={() => handleTaskSelect(null)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold tracking-widest transition-all disabled:opacity-50",
              !selectedTaskId ? "bg-nature-primary text-white border-nature-primary shadow-sm" : "bg-white border-nature-border text-nature-text/55",
            )}
          >
            自由专注
          </button>
          {selectableFocusTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              disabled={isActive}
              onClick={() => handleTaskSelect(task)}
              className={cn(
                "shrink-0 max-w-[9rem] rounded-full border px-4 py-2 text-left transition-all disabled:opacity-50",
                selectedTaskId === task.id ? "bg-nature-secondary text-white border-nature-secondary shadow-sm" : "bg-white border-nature-border text-nature-text/60",
              )}
            >
              <span className="block truncate text-[11px] font-bold tracking-widest">{task.title}</span>
              <span className="mt-0.5 block text-[9px] font-bold tracking-widest opacity-60">
                {isTaskCarriedForward(task, todayKey) ? '追踪中' : '今日计划'}
              </span>
            </button>
          ))}
        </div>
        {selectedTaskSnapshot && !selectedTaskStillSelectable && (
          <p className="mt-2 px-1 text-[10px] font-bold tracking-widest text-nature-secondary/70">
            当前计划已变化，本次会保留快照后写入记录。
          </p>
        )}
      </div>
      
      <div className="w-full max-w-xs mb-6 space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-full bg-white border border-nature-border p-1 shadow-sm">
          {FOCUS_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              disabled={isActive}
              onClick={() => handlePresetChange(preset.id)}
              className={cn(
                "h-9 rounded-full text-[11px] font-bold tracking-widest transition-all disabled:opacity-40",
                selectedPreset === preset.id ? "bg-nature-primary text-white shadow-sm" : "text-nature-text opacity-50",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {selectedPreset === 'custom' && (
          <label className="flex items-center justify-between rounded-2xl bg-white border border-nature-border px-4 py-2 text-xs font-bold tracking-widest">
            <span className="opacity-40">自定义分钟</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="240"
              value={customMinutesInput}
              disabled={isActive}
              onChange={(event) => handleCustomMinutesChange(event.target.value)}
              onBlur={commitCustomMinutes}
              className="w-20 bg-transparent text-right outline-none text-nature-primary disabled:opacity-40"
            />
          </label>
        )}

        <div className="grid grid-cols-3 gap-2">
          {FOCUS_CATEGORIES.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-2xl border px-2 py-2 text-[10px] font-bold tracking-widest transition-all",
                category === item ? "bg-nature-secondary text-white border-nature-secondary" : "bg-white border-nature-border opacity-50",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="#f5f5f0"
            strokeWidth="4"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="#7c8363"
            strokeWidth="8"
            strokeDasharray="942.4"
            initial={{ strokeDashoffset: 942.4 }}
            animate={{ strokeDashoffset: 942.4 * (1 - progress / 100) }}
            transition={{ duration: 0.5, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <button
            onClick={resetTimer}
            className="mb-5 h-9 px-4 rounded-full border border-nature-border bg-white/90 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest text-nature-primary shadow-sm opacity-80 active:scale-95 transition-transform"
            aria-label="重置计时"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
          <span className="text-[72px] sm:text-[92px] font-serif font-light tracking-tighter leading-none text-nature-text">
            {formatTime(displaySeconds)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <button
          onClick={toggleTimer}
          className="w-24 h-24 rounded-full bg-nature-primary text-white flex items-center justify-center shadow-lg shadow-nature-primary/20 active:scale-95 transition-transform"
        >
            {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
        </button>
      </div>

      <div className="mt-12 text-xs font-bold tracking-[0.2em] opacity-30">
        感受呼吸，拥抱静谧...
      </div>
    </div>
  );
};
