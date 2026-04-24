import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FocusRecord, Task } from '../types';
import {
  buildFocusStats,
  FocusStatsPeriod,
  formatDuration,
  getFocusRecordsForPeriod,
} from '../features/stats/focusStats';
import { buildTaskForecast } from '../features/stats/taskForecast';
import { cn } from '../lib/utils';

interface StatsPageProps {
  records: FocusRecord[];
  tasks: Task[];
}

export const StatsPage: React.FC<StatsPageProps> = ({ records, tasks }) => {
  const [mode, setMode] = React.useState<'estimate' | 'harvest'>('harvest');
  const [period, setPeriod] = React.useState<FocusStatsPeriod>('day');
  const stats = buildFocusStats(records);
  const periodRecords = getFocusRecordsForPeriod(records, period);
  const periodStats = buildFocusStats(periodRecords);
  const forecast = buildTaskForecast(tasks, period);
  const chartData = mode === 'harvest' ? periodStats.totalDistribution : forecast.distribution;

  return (
    <div className="p-6 pb-28 font-sans text-nature-text overflow-y-auto h-full">
      <div className="flex items-center space-x-6 mb-8">
        <button
          onClick={() => setMode('estimate')}
          className={cn(
            'text-3xl italic-serif italic pb-1 leading-none',
            mode === 'estimate' ? 'font-bold border-b-2 border-nature-secondary text-nature-text' : 'opacity-30',
          )}
        >
          预估
        </button>
        <button
          onClick={() => setMode('harvest')}
          className={cn(
            'text-3xl italic-serif italic pb-1 leading-none',
            mode === 'harvest' ? 'font-bold border-b-2 border-nature-secondary text-nature-text' : 'opacity-30',
          )}
        >
          收获
        </button>
      </div>

      {mode === 'harvest' ? (
        <HarvestSummary stats={stats} />
      ) : (
        <EstimateSummary forecast={forecast} />
      )}

      <div className={cn(
        'rounded-[40px] p-8 text-white relative overflow-hidden mb-6',
        mode === 'harvest' ? 'bg-nature-secondary' : 'bg-nature-primary',
      )}>
        <div className="relative z-10">
          <h4 className="text-[10px] tracking-widest font-bold opacity-80 mb-2">
            {mode === 'harvest' ? '自然复盘' : '计划预估'}
          </h4>
          <p className="italic-serif italic text-lg leading-tight">
            {mode === 'harvest'
              ? stats.todaySeconds > 0
                ? '你今日已经进入专注节奏。大自然会奖励充满耐心的大脑。'
                : '今天还没有专注记录，先播种一个小番茄。'
              : forecast.activeTasks > 0
                ? `当前周期还有 ${forecast.activeTasks} 个计划，建议预留 ${forecast.estimatedPomodoros} 个番茄。`
                : '当前周期没有待办计划，可以安排复盘或留白。'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white opacity-10 rounded-full" />
      </div>

      <div className="bg-white border border-nature-border rounded-[40px] p-8 shadow-sm relative">
        <div className="flex justify-between items-center mb-8">
          <h3 className="italic-serif text-xl italic text-nature-text">
            {mode === 'harvest' ? '分布图鉴' : '任务土壤'}
          </h3>
          <PeriodControl period={period} onPeriodChange={setPeriod} />
        </div>

        <div className="h-64 relative">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey={mode === 'harvest' ? 'seconds' : 'estimatedPomodoros'}
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => mode === 'harvest' ? formatDuration(Number(value)) : `${value} 番茄`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] font-bold tracking-widest opacity-40">{getPeriodLabel(period)}{mode === 'harvest' ? '专注' : '预估'}</div>
                <div className="text-2xl font-serif font-light leading-none">
                  {mode === 'harvest' ? formatDuration(periodStats.totalSeconds) : `${forecast.estimatedPomodoros} 番茄`}
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-nature-border bg-nature-bg/40">
              <div className="text-[10px] font-bold tracking-widest opacity-40 mb-2">暂无分布</div>
              <div className="text-sm italic-serif italic opacity-50">
                {mode === 'harvest' ? '完成一次专注后生成图鉴' : '添加计划后生成预估'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 px-2">
          {chartData.slice(0, 4).map((d) => (
            <div key={d.name} className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-tight opacity-100">{d.name}</span>
                <span className="text-[10px] opacity-40 italic-serif italic">
                  {mode === 'harvest'
                    ? `占比 ${'percentage' in d ? d.percentage : 0}%`
                    : `${'activeTaskCount' in d ? d.activeTaskCount : 0} 个待办`}
                </span>
              </div>
            </div>
          ))}
          {chartData.length === 0 && (
            <div className="col-span-2 text-center text-[10px] opacity-30 italic-serif italic">
              {mode === 'harvest' ? '暂无真实专注数据' : '暂无计划预估数据'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function HarvestSummary({ stats }: { stats: ReturnType<typeof buildFocusStats> }) {
  return (
    <div className="bg-white border border-nature-border rounded-[40px] p-8 shadow-sm mb-6">
      <div className="grid grid-cols-2 gap-y-10">
        <Metric title="今日收获" value={stats.todayPomodoros} suffix="番茄" helper="稳步前行" />
        <Metric title="巅峰心流" value={formatDuration(stats.longestSeconds)} suffix="最长" bordered />
        <Metric title="总计播种" value={stats.totalPomodoros} suffix="颗" />
        <Metric title="总计专注" value={formatDuration(stats.totalSeconds)} bordered compact />
      </div>
    </div>
  );
}

function EstimateSummary({ forecast }: { forecast: ReturnType<typeof buildTaskForecast> }) {
  return (
    <div className="bg-white border border-nature-border rounded-[40px] p-8 shadow-sm mb-6">
      <div className="grid grid-cols-2 gap-y-10">
        <Metric title="待办计划" value={forecast.activeTasks} suffix="个" helper="需要照料" />
        <Metric title="建议番茄" value={forecast.estimatedPomodoros} suffix="个" bordered />
        <Metric title="已归档" value={forecast.completedTasks} suffix="个" />
        <Metric title="预估专注" value={formatDuration(forecast.estimatedSeconds)} bordered compact />
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  suffix,
  helper,
  bordered,
  compact,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  helper?: string;
  bordered?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn('space-y-1', bordered && 'pl-6 border-l border-nature-border')}>
      <div className="text-[10px] font-bold tracking-widest opacity-40">{title}</div>
      <div className={cn('font-serif font-light flex items-baseline', compact ? 'text-2xl leading-none' : 'text-4xl')}>
        {value} {suffix && <span className="text-xs uppercase ml-1 opacity-40 tracking-tighter">{suffix}</span>}
      </div>
      {helper && <div className="text-[10px] opacity-40 italic-serif italic">{helper}</div>}
    </div>
  );
}

function PeriodControl({
  period,
  onPeriodChange,
}: {
  period: FocusStatsPeriod;
  onPeriodChange: (period: FocusStatsPeriod) => void;
}) {
  return (
    <div className="flex space-x-1 text-[10px] bg-nature-bg p-1 rounded-full border border-nature-border font-bold tracking-widest">
      {(['day', 'week', 'month'] as const).map((item) => (
        <button
          key={item}
          onClick={() => onPeriodChange(item)}
          className={cn(
            'px-2 py-0.5 rounded-full',
            period === item ? 'bg-nature-primary text-white' : 'opacity-40',
          )}
        >
          {item === 'day' ? '日' : item === 'week' ? '周' : '月'}
        </button>
      ))}
    </div>
  );
}

function getPeriodLabel(period: FocusStatsPeriod): string {
  if (period === 'day') return '今日';
  if (period === 'week') return '本周';
  return '本月';
}
