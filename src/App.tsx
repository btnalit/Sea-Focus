/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppTab, Task, FocusRecord } from './types';
import { BottomNav } from './components/BottomNav';
import { FocusPage } from './components/FocusPage';
import { PlanPage } from './components/PlanPage';
import { StatsPage } from './components/StatsPage';
import { CalendarPage } from './components/CalendarPage';
import { motion, AnimatePresence } from 'motion/react';
import { seaFocusStorage } from './api/seaFocusStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('focus');
  const [tasks, setTasks] = useState<Task[]>(() => seaFocusStorage.loadTasks());
  const [records, setRecords] = useState<FocusRecord[]>(() => seaFocusStorage.loadFocusRecords());

  // Sync data to localStorage
  useEffect(() => {
    seaFocusStorage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    seaFocusStorage.saveFocusRecords(records);
  }, [records]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'date'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      date: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addFocusRecord = (record: Omit<FocusRecord, 'id' | 'timestamp'>) => {
    const newRecord: FocusRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setRecords([newRecord, ...records]);
  };

  return (
    <div className="relative min-h-screen bg-nature-bg overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl border-x border-nature-border text-nature-text">
      {/* Background Decor (Soft Leaves/Dots) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [1000, -200],
              opacity: [0, 0.2, 0],
              rotate: [0, 180]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 15 + i * 2, 
              delay: i * 1.5,
              ease: "linear"
            }}
            className="absolute rounded-lg bg-nature-primary/10"
            style={{ 
              width: 15 + i * 5, 
              height: 15 + i * 5,
              left: `${10 + i * 20}%`
            }}
          />
        ))}
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === 'plan' && <PlanPage tasks={tasks} onAddTask={addTask} onToggleTask={toggleTask} />}
            {activeTab === 'view' && <CalendarPage />}
            {activeTab === 'focus' && <FocusPage onFocusComplete={addFocusRecord} />}
            {activeTab === 'stats' && <StatsPage records={records} />}
            {activeTab === 'mine' && (
              <div className="flex flex-col items-center justify-center h-full font-sans p-12">
                <div className="w-24 h-24 bg-white rounded-[32px] border border-nature-border flex items-center justify-center p-1 mb-4 shadow-sm">
                  <div className="w-full h-full bg-[#e9e8e0] rounded-[28px]" />
                </div>
                <h2 className="text-2xl italic-serif italic mb-2 text-nature-text">自然探索者</h2>
                <p className="opacity-60 mb-8 italic-serif italic text-sm">"深入自然，静待专注之花绽放"</p>
                <div className="w-full space-y-4">
                   <div className="bg-white border border-nature-border p-4 rounded-2xl flex justify-between shadow-sm">
                      <span className="font-medium text-sm">成就勋章</span>
                      <span className="text-nature-primary font-bold">12 枚</span>
                   </div>
                   <div className="bg-white border border-nature-border p-4 rounded-2xl flex justify-between shadow-sm">
                      <span className="font-medium text-sm">今日目标</span>
                      <span className="text-nature-secondary font-bold">6/8 番茄</span>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
