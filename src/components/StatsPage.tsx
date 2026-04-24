import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FocusRecord } from '../types';
import {
  buildFocusStats,
  FocusStatsPeriod,
  formatDuration,
  getFocusRecordsForPeriod,
} from '../features/stats/focusStats';
import { cn } from '../lib/utils';

interface StatsPageProps {
  records: FocusRecord[];
}

export const StatsPage: React.FC<StatsPageProps> = ({ records }) => {
  const [period, setPeriod] = React.useState<FocusStatsPeriod>('day');
  const stats = buildFocusStats(records);
  const periodRecords = getFocusRecordsForPeriod(records, period);
  const periodStats = buildFocusStats(periodRecords);
  const chartData = periodStats.totalDistribution;

  return (
    <div className="p-6 pb-28 font-sans text-nature-text overflow-y-auto h-full">
      <div className="flex items-center space-x-6 mb-8">
        <h1 className="opacity-30 text-xl italic-serif italic">预估</h1>
        <h1 className="italic-serif text-3xl font-bold border-b-2 border-nature-secondary pb-1 leading-none text-nature-text">收获</h1>
      </div>

      <div className="bg-white border border-nature-border rounded-[40px] p-8 shadow-sm mb-6">
        <div className="grid grid-cols-2 gap-y-10">
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-widest opacity-40">今日收获</div>
            <div className="text-4xl font-serif font-light flex items-baseline">
                {stats.todayPomodoros} <span className="text-xs uppercase ml-1 opacity-40 tracking-tighter">番茄</span>
            </div>
            <div className="text-[10px] opacity-40 italic-serif italic">稳步前行</div>
          </div>
          <div className="pl-6 border-l border-nature-border space-y-1">
            <div className="text-[10px] font-bold tracking-widest opacity-40">巅峰心流</div>
            <div className="text-4xl font-serif font-light flex items-baseline">
                {formatDuration(stats.longestSeconds)} <span className="text-xs uppercase ml-1 opacity-40 tracking-tighter text-nature-text">最长</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-widest opacity-40">总计播种</div>
            <div className="text-4xl font-serif font-light flex items-baseline">
                {stats.totalPomodoros} <span className="text-xs ml-1 opacity-40 tracking-tighter text-nature-text">颗</span>
            </div>
          </div>
          <div className="pl-6 border-l border-nature-border space-y-1">
            <div className="text-[10px] font-bold tracking-widest opacity-40">总计专注</div>
            <div className="text-2xl font-serif font-light leading-none">
                {formatDuration(stats.totalSeconds)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-nature-secondary rounded-[40px] p-8 text-white relative overflow-hidden mb-6">
        <div className="relative z-10">
          <h4 className="text-[10px] tracking-widest font-bold opacity-80 mb-2">自然复盘</h4>
          <p className="italic-serif italic text-lg leading-tight">
            {stats.todaySeconds > 0 ? '你今日已经进入专注节奏。大自然会奖励充满耐心的大脑。' : '今天还没有专注记录，先播种一个小番茄。'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
      </div>

      <div className="bg-white border border-nature-border rounded-[40px] p-8 shadow-sm relative">
        <div className="flex justify-between items-center mb-8">
            <h3 className="italic-serif text-xl italic text-nature-text">分布图鉴</h3>
            <div className="flex space-x-1 text-[10px] bg-nature-bg p-1 rounded-full border border-nature-border font-bold tracking-widest">
                {(['day', 'week', 'month'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setPeriod(item)}
                    className={cn(
                      'px-2 py-0.5 rounded-full',
                      period === item ? 'bg-nature-primary text-white' : 'opacity-40',
                    )}
                  >
                    {item === 'day' ? '日' : item === 'week' ? '周' : '月'}
                  </button>
                ))}
            </div>
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
                    dataKey="seconds"
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatDuration(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] font-bold tracking-widest opacity-40">{period === 'day' ? '今日专注' : period === 'week' ? '本周专注' : '本月专注'}</div>
                <div className="text-2xl font-serif font-light leading-none">{formatDuration(periodStats.totalSeconds)}</div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-nature-border bg-nature-bg/40">
              <div className="text-[10px] font-bold tracking-widest opacity-40 mb-2">暂无分布</div>
              <div className="text-sm italic-serif italic opacity-50">完成一次专注后生成图鉴</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 px-2">
            {chartData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-tight opacity-100">{d.name}</span>
                  <span className="text-[10px] opacity-40 italic-serif italic">占比 {d.percentage}%</span>
                </div>
              </div>
            ))}
            {chartData.length === 0 && (
              <div className="col-span-2 text-center text-[10px] opacity-30 italic-serif italic">暂无真实专注数据</div>
            )}
        </div>
      </div>
    </div>
  );
};
