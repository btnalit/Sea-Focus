import { Task, TaskQuadrant } from '../../types';
import { FocusStatsPeriod } from './focusStats';
import { formatDateKey } from '../calendar/dateUtils';

const POMODORO_SECONDS = 25 * 60;

const QUADRANT_META: Record<TaskQuadrant, { name: string; weight: number; color: string }> = {
  'urgent-important': { name: '核心/紧急', weight: 2, color: '#c68a73' },
  'not-urgent-important': { name: '战略/成长', weight: 2, color: '#d0a460' },
  'urgent-not-important': { name: '琐事/干扰', weight: 1, color: '#7c8363' },
  'not-urgent-not-important': { name: '冥想/留白', weight: 1, color: '#7a8e9e' },
};

export interface TaskForecastDistribution {
  id: TaskQuadrant;
  name: string;
  taskCount: number;
  activeTaskCount: number;
  estimatedPomodoros: number;
  color: string;
}

export interface TaskForecast {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  estimatedPomodoros: number;
  estimatedSeconds: number;
  distribution: TaskForecastDistribution[];
}

/**
 * Builds a task-based focus forecast for the selected period.
 *
 * @param tasks planned tasks
 * @param period selected stats period
 * @param now period anchor date
 * @returns task forecast and quadrant distribution
 */
export function buildTaskForecast(tasks: Task[], period: FocusStatsPeriod, now = new Date()): TaskForecast {
  const periodTasks = getTasksForPeriod(tasks, period, now);
  const activeTasks = periodTasks.filter((task) => !task.completed);
  const distribution = (Object.keys(QUADRANT_META) as TaskQuadrant[])
    .map((quadrant) => {
      const quadrantTasks = periodTasks.filter((task) => task.quadrant === quadrant);
      const activeQuadrantTasks = quadrantTasks.filter((task) => !task.completed);
      const meta = QUADRANT_META[quadrant];

      return {
        id: quadrant,
        name: meta.name,
        taskCount: quadrantTasks.length,
        activeTaskCount: activeQuadrantTasks.length,
        estimatedPomodoros: activeQuadrantTasks.length * meta.weight,
        color: meta.color,
      };
    })
    .filter((item) => item.taskCount > 0);
  const estimatedPomodoros = distribution.reduce((total, item) => total + item.estimatedPomodoros, 0);

  return {
    totalTasks: periodTasks.length,
    activeTasks: activeTasks.length,
    completedTasks: periodTasks.length - activeTasks.length,
    estimatedPomodoros,
    estimatedSeconds: estimatedPomodoros * POMODORO_SECONDS,
    distribution,
  };
}

function getTasksForPeriod(tasks: Task[], period: FocusStatsPeriod, now: Date): Task[] {
  const start = getPeriodStart(period, now);
  const end = getPeriodEnd(period, now);

  return tasks.filter((task) => {
    const taskDate = parseTaskDate(task.date);
    return taskDate >= start && taskDate < end;
  });
}

function parseTaskDate(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(formatDateKey(new Date(date)));
}

function getPeriodStart(period: FocusStatsPeriod, now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  }

  if (period === 'month') {
    start.setDate(1);
  }

  return start;
}

function getPeriodEnd(period: FocusStatsPeriod, now: Date): Date {
  const end = getPeriodStart(period, now);

  if (period === 'day') {
    end.setDate(end.getDate() + 1);
  } else if (period === 'week') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return end;
}
