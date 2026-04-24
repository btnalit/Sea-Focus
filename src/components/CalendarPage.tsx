import React from 'react';
import { LayoutGrid, MoreHorizontal, ChevronRight, Crown } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const days = Array.from({ length: 35 }, (_, i) => i - 4);
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  
  return (
    <div className="p-6 pb-28 font-sans overflow-y-auto h-full text-nature-text">
      <div className="flex items-center justify-between mb-8">
        <LayoutGrid className="w-6 h-6 opacity-30" />
        <h1 className="italic-serif text-3xl font-bold border-b-2 border-nature-secondary pb-1 leading-none">随笔庭院</h1>
        <MoreHorizontal className="w-6 h-6 opacity-30" />
      </div>

      <div className="bg-nature-primary rounded-[40px] p-6 flex items-center mb-8 shadow-sm border border-nature-primary/10">
        <div className="bg-white/20 rounded-full p-2 mr-5">
            <Crown className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1 text-white">
            <div className="font-serif italic text-lg leading-tight">探索自然奥秘</div>
            <div className="text-[10px] opacity-70 tracking-widest mt-1 font-bold">解锁全景月度视图</div>
        </div>
        <button className="bg-white text-nature-primary px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest shadow-sm border-nature-border">升级</button>
      </div>

      <div className="bg-white border border-nature-border rounded-[40px] p-4 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 mb-4">
          {weekdays.map(w => (
            <div key={w} className="text-center py-2 text-[10px] font-bold tracking-widest opacity-40">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-t border-nature-border/30">
          {days.map((day, i) => {
            const isToday = day === 24;
            return (
              <div key={i} className={cn("min-h-[100px] border-r border-b border-nature-border/20 p-2 flex flex-col group hover:bg-nature-bg/30 transition-colors", (i+1)%7 === 0 && "border-r-0")}>
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-2xl transition-all", 
                    isToday ? "bg-nature-primary text-white shadow-lg shadow-nature-primary/20" : "opacity-30 group-hover:opacity-100"
                  )}>
                    {day > 0 ? day : day + 31}
                  </span>
                  <span className="text-[8px] font-bold opacity-30 tracking-tighter">
                    {day === 4 ? '清明' : ''}
                    {day === 1 ? '劳动节' : ''}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {(day === 3 || day === 30) && (
                    <div className="text-[8px] font-bold tracking-tighter bg-nature-primary/10 text-nature-primary px-1.5 py-0.5 rounded-md whitespace-nowrap overflow-hidden">打理美术馆</div>
                  )}
                  {day === 21 && (
                    <div className="text-[8px] font-bold tracking-tighter bg-nature-secondary/10 text-nature-secondary px-1.5 py-0.5 rounded-md whitespace-nowrap overflow-hidden">新媒体排版</div>
                  )}
                  {day === 8 && (
                    <div className="text-[8px] font-bold tracking-tighter bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-md whitespace-nowrap overflow-hidden">户外徒步</div>
                  )}
                  {day === 24 && (
                    <div className="text-[8px] font-bold tracking-tighter bg-nature-primary text-white px-1.5 py-0.5 rounded-md whitespace-nowrap overflow-hidden">产品发布</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
