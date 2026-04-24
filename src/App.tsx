/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppTab, Task, FocusRecord, JournalEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { FocusPage } from './components/FocusPage';
import { PlanPage } from './components/PlanPage';
import { StatsPage } from './components/StatsPage';
import { CalendarPage } from './components/CalendarPage';
import { motion, AnimatePresence } from 'motion/react';
import { seaFocusStorage } from './api/seaFocusStorage';
import { toggleTaskCompletion } from './features/plan/taskLifecycle';
import { buildPlanHeaderStats } from './features/plan/planHeaderStats';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('focus');
  const [tasks, setTasks] = useState<Task[]>(() => seaFocusStorage.loadTasks());
  const [records, setRecords] = useState<FocusRecord[]>(() => seaFocusStorage.loadFocusRecords());
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => seaFocusStorage.loadJournalEntries());
  const planHeaderStats = buildPlanHeaderStats(tasks, records);

  // Sync data to localStorage
  useEffect(() => {
    seaFocusStorage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    seaFocusStorage.saveFocusRecords(records);
  }, [records]);

  useEffect(() => {
    seaFocusStorage.saveJournalEntries(journalEntries);
  }, [journalEntries]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? toggleTaskCompletion(t) : t));
  };

  const addFocusRecord = (record: Omit<FocusRecord, 'id' | 'timestamp'>) => {
    const newRecord: FocusRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setRecords([newRecord, ...records]);
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    setJournalEntries([newEntry, ...journalEntries]);
  };

  const updateJournalEntry = (id: string, updates: Pick<JournalEntry, 'title' | 'content'>) => {
    setJournalEntries(journalEntries.map((entry) => (
      entry.id === id ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry
    )));
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries(journalEntries.filter((entry) => entry.id !== id));
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

      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === 'plan' && (
              <PlanPage
                tasks={tasks}
                todayArchivedTasks={planHeaderStats.todayArchivedTasks}
                onAddTask={addTask}
                onToggleTask={toggleTask}
              />
            )}
            {activeTab === 'view' && (
              <CalendarPage
                entries={journalEntries}
                onAddEntry={addJournalEntry}
                onUpdateEntry={updateJournalEntry}
                onDeleteEntry={deleteJournalEntry}
              />
            )}
            {activeTab === 'focus' && <FocusPage onFocusComplete={addFocusRecord} />}
            {activeTab === 'stats' && <StatsPage records={records} tasks={tasks} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
