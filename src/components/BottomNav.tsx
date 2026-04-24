import React from 'react';
import { Star, Calendar, Timer, BarChart3 } from 'lucide-react';
import { AppTab } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'plan', label: '计划', icon: Star },
    { id: 'view', label: '随笔', icon: Calendar },
    { id: 'focus', label: '专注', icon: Timer },
    { id: 'stats', label: '收获', icon: BarChart3 },
  ] as const;

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-nature-bg border-t border-nature-border pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center space-y-0.5 w-full relative transition-all duration-300",
              activeTab === tab.id ? "text-nature-primary" : "text-nature-text opacity-40 hover:opacity-60"
            )}
          >
            <tab.icon className={cn("w-5 h-5 transition-transform", activeTab === tab.id && "scale-110")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", activeTab === tab.id ? "opacity-100" : "opacity-40")}>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-px w-8 h-0.5 bg-nature-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
