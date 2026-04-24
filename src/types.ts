export type TaskQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface Task {
  id: string;
  title: string;
  quadrant: TaskQuadrant;
  completed: boolean;
  date: string;
}

export interface FocusRecord {
  id: string;
  type: 'pomodoro' | 'stopwatch' | 'countdown';
  duration: number; // in seconds
  category: string;
  timestamp: string;
}

export type AppTab = 'plan' | 'view' | 'focus' | 'stats' | 'mine';
