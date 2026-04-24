import { Task, TaskQuadrant } from '../../types';
import { FocusStatsPeriod } from './focusStats';
import { normalizeTaskDateKey } from '../plan/taskLifecycle';

const QUADRANT_META: Record<TaskQuadrant, { name: string; color: string }> = {
  'urgent-important': { name: '核心/紧急', color: '#c68a73' },
  'not-urgent-important': { name: '战略/成长', color: '#d0a460' },
  'urgent-not-important': { name: '琐事/干扰', color: '#7c8363' },
  'not-urgent-not-important': { name: '冥想/留白', color: '#7a8e9e' },
};

export interface TaskHarvestDistribution {
  id: TaskQuadrant;
  name: string;
  completedTaskCount: number;
  percentage: number;
  color: string;
}

export interface TaskHarvestStats {
  todayCompletedTasks: number;
  totalCompletedTasks: number;
  completedDistribution: TaskHarvestDistribution[];
}

/**
 * Builds harvest counters and distribution from completed plans.
 *
 * @param tasks persisted tasks
 * @param now date used for today's harvest boundary
 * @returns completed-plan harvest totals and quadrant distribution
 */
export function buildTaskHarvestStats(tasks: Task[], now = new Date()): TaskHarvestStats {
  const todayKey = formatLocalDateKey(now);
  const completedTasks = tasks.filter(isCompletedTask);
  const todayCompletedTasks = completedTasks.filter((task) => getTaskCompletedDateKey(task) === todayKey);

  return {
    todayCompletedTasks: todayCompletedTasks.length,
    totalCompletedTasks: completedTasks.length,
    completedDistribution: buildCompletedDistribution(completedTasks),
  };
}

/**
 * Filters completed plans for a visible harvest period.
 *
 * @param tasks persisted tasks
 * @param period selected stats period
 * @param now period anchor date
 * @returns completed tasks inside the selected period
 */
export function getCompletedTasksForPeriod(tasks: Task[], period: FocusStatsPeriod, now = new Date()): Task[] {
  const start = getPeriodStart(period, now);
  const end = getPeriodEnd(period, now);

  return tasks.filter((task) => {
    if (!isCompletedTask(task)) return false;
    const completedDate = parseLocalDateKey(getTaskCompletedDateKey(task));
    return completedDate >= start && completedDate < end;
  });
}

function buildCompletedDistribution(tasks: Task[]): TaskHarvestDistribution[] {
  if (tasks.length === 0) return [];

  return (Object.keys(QUADRANT_META) as TaskQuadrant[])
    .map((quadrant) => {
      const completedTaskCount = tasks.filter((task) => task.quadrant === quadrant).length;
      const meta = QUADRANT_META[quadrant];

      return {
        id: quadrant,
        name: meta.name,
        completedTaskCount,
        percentage: Math.round((completedTaskCount / tasks.length) * 1000) / 10,
        color: meta.color,
      };
    })
    .filter((item) => item.completedTaskCount > 0);
}

function isCompletedTask(task: Task): boolean {
  return task.completed;
}

function getTaskCompletedDateKey(task: Task): string {
  return task.completedAt ? normalizeTaskDateKey(task.completedAt) : normalizeTaskDateKey(task.date);
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
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
