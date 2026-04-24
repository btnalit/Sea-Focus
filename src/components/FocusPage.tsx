import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FocusRecord } from '../types';
import {
  clampFocusMinutes,
  FocusDurationPresetId,
  FOCUS_DURATION_PRESETS,
  toFocusDurationSeconds,
} from '../features/focus/durationPresets';

interface FocusPageProps {
  onFocusComplete: (record: Omit<FocusRecord, 'id' | 'timestamp'>) => void;
}

const FOCUS_CATEGORIES = ['深度工作', '日常维护', '冥想复盘', '学习成长', '其他'];

export const FocusPage: React.FC<FocusPageProps> = ({ onFocusComplete }) => {
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro' | 'countdown'>('pomodoro');
  const [selectedPreset, setSelectedPreset] = useState<FocusDurationPresetId>('25');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [category, setCategory] = useState(FOCUS_CATEGORIES[0]);
  const [timeLeft, setTimeLeft] = useState(toFocusDurationSeconds(25));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(toFocusDurationSeconds(25));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedMinutes = selectedPreset === 'custom' ? customMinutes : Number(selectedPreset);
  const selectedSeconds = toFocusDurationSeconds(selectedMinutes);

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
      onFocusComplete({
        type: mode,
        duration: initialTime,
        category,
      });
    }
  }, [category, initialTime, isActive, mode, onFocusComplete, timeLeft]);

  const handleModeChange = (nextMode: typeof mode) => {
    setIsActive(false);
    setMode(nextMode);
    setElapsedSeconds(0);
    if (nextMode !== 'stopwatch') {
      setInitialTime(selectedSeconds);
      setTimeLeft(selectedSeconds);
    }
  };

  const handlePresetChange = (presetId: FocusDurationPresetId) => {
    if (isActive) return;
    setSelectedPreset(presetId);
    const nextMinutes = presetId === 'custom' ? customMinutes : Number(presetId);
    const nextSeconds = toFocusDurationSeconds(nextMinutes);
    setInitialTime(nextSeconds);
    setTimeLeft(nextSeconds);
  };

  const handleCustomMinutesChange = (value: string) => {
    const nextMinutes = clampFocusMinutes(Number(value));
    setCustomMinutes(nextMinutes);
    if (!isActive && selectedPreset === 'custom') {
      const nextSeconds = toFocusDurationSeconds(nextMinutes);
      setInitialTime(nextSeconds);
      setTimeLeft(nextSeconds);
    }
  };

  const toggleTimer = () => {
    if (!isActive && mode !== 'stopwatch' && timeLeft === 0) {
      setTimeLeft(initialTime);
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
              min="1"
              max="240"
              value={customMinutes}
              disabled={isActive}
              onChange={(event) => handleCustomMinutesChange(event.target.value)}
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
