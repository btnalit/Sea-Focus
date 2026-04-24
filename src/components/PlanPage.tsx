import React, { useState } from 'react';
import { Plus, ListFilter } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, TaskQuadrant } from '../types';
import { cn } from '../lib/utils';

interface PlanPageProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'date'>) => void;
  onToggleTask: (id: string) => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({ tasks, onAddTask, onToggleTask }) => {
  const quadrants: { id: TaskQuadrant; label: string; color: string; textColor: string; checkBoxBorder: string; checkBoxActive: string }[] = [
    { id: 'urgent-important', label: '核心/紧急', color: 'bg-[#fcf7f6] border-[#f2e4e0]', textColor: 'text-[#c68a73]', checkBoxBorder: 'border-[#c68a73]', checkBoxActive: 'bg-[#c68a73]' },
    { id: 'not-urgent-important', label: '战略/成长', color: 'bg-[#fdf9f0] border-[#eae1d1]', textColor: 'text-[#d0a460]', checkBoxBorder: 'border-[#d0a460]', checkBoxActive: 'bg-[#d0a460]' },
    { id: 'urgent-not-important', label: '琐事/干扰', color: 'bg-[#f2f6f3] border-[#e1e8de]', textColor: 'text-[#7c8363]', checkBoxBorder: 'border-[#7c8363]', checkBoxActive: 'bg-[#7c8363]' },
    { id: 'not-urgent-not-important', label: '冥想/留白', color: 'bg-[#f5f7f9] border-[#e6ebef]', textColor: 'text-[#7a8e9e]', checkBoxBorder: 'border-[#7a8e9e]', checkBoxActive: 'bg-[#7a8e9e]' },
  ];

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [targetQuadrant, setTargetQuadrant] = useState<TaskQuadrant>('urgent-important');

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({ title: newTaskTitle, quadrant: targetQuadrant });
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <div className="p-6 min-h-full pb-24 font-sans text-nature-text">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <h1 className="italic-serif text-3xl font-bold border-b-2 border-nature-secondary pb-1 leading-none">计划</h1>
          <h1 className="opacity-30 text-xl font-serif italic italic-serif">归档</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right">
                <div className="text-[10px] opacity-50 uppercase font-bold tracking-tighter">今日收获</div>
                <div className="text-xs italic-serif italic font-medium">6 番茄</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-nature-primary p-0.5">
                <div className="w-full h-full bg-[#e9e8e0] rounded-full" />
            </div>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-3">
            {['20', '21', '22', '23', '24', '25', '26'].map((d, i) => (
                <div key={d} className={cn(
                    "flex flex-col items-center min-w-14 px-3 py-4 rounded-3xl border transition-all", 
                    d === '24' ? "bg-nature-primary text-white border-nature-primary shadow-lg shadow-nature-primary/20" : "bg-white border-nature-border opacity-60"
                )}>
                    <span className="text-[9px] font-bold tracking-widest mb-1">{['一','二','三','四','五','六','日'][i]}</span>
                    <span className="text-sm font-bold">{d}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center px-2">
            <h3 className="italic-serif text-xl italic">专注庭院</h3>
            <button 
                onClick={() => setIsAdding(true)}
                className="text-nature-secondary font-bold text-xs tracking-widest"
            >
                + 添加计划
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {quadrants.map((q) => (
                <div key={q.id} className={cn(
                    "rounded-[32px] p-5 flex flex-col border transition-all shadow-sm",
                    q.color
                )}>
                    <div className={cn("text-[10px] font-bold tracking-widest mb-3", q.textColor)}>
                        {q.label}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {tasks.filter(t => t.quadrant === q.id).map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onToggleTask(task.id)}
                                className={cn(
                                    "flex items-start gap-2 text-xs transition-all cursor-pointer group",
                                    task.completed ? "opacity-30" : "opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors duration-300",
                                    q.checkBoxBorder,
                                    task.completed ? q.checkBoxActive : "bg-transparent"
                                )}>
                                    {task.completed && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <span className={cn(task.completed && "line-through")}>{task.title}</span>
                            </div>
                        ))}
                        {tasks.filter(t => t.quadrant === q.id).length === 0 && (
                            <div className="text-[10px] opacity-20 italic">庭院空空如也...</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
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
                                    "px-3 py-2 rounded-xl text-xs font-bold tracking-widest transition-all border",
                                    targetQuadrant === q.id ? `${q.checkBoxActive} text-white ${q.checkBoxBorder}` : `bg-white ${q.checkBoxBorder} opacity-50 hover:opacity-80 ${q.textColor}`
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
