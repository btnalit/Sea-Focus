export type TaskQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface Task {
  id: string;
  title: string;
  quadrant: TaskQuadrant;
  completed: boolean;
  completedAt?: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reminderEnabled?: boolean;
  reminderAt?: string;
  reminderNotificationId?: number;
}

export interface JournalReminderSaveResult {
  reminderScheduled: boolean;
  permissionDenied: boolean;
}

export type FocusTaskLinkStatus = 'active' | 'archived' | 'deleted';

export interface FocusTaskSnapshot {
  taskId: string;
  taskTitle: string;
  taskQuadrant: TaskQuadrant;
  taskDate: string;
  taskLinkStatus: FocusTaskLinkStatus;
}

export interface FocusRecord {
  id: string;
  type: 'pomodoro' | 'stopwatch' | 'countdown';
  duration: number; // in seconds
  category: string;
  timestamp: string;
  task?: FocusTaskSnapshot;
}

export type AppTab = 'plan' | 'view' | 'focus' | 'stats';
