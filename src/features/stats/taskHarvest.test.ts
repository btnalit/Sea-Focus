import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskHarvestStats, getCompletedTasksForPeriod } from './taskHarvest';
import { Task } from '../../types';

const tasks: Task[] = [
  {
    id: 'today-urgent',
    title: '完成上线检查',
    quadrant: 'urgent-important',
    completed: true,
    completedAt: '2026-04-24',
    date: '2026-04-24',
  },
  {
    id: 'today-growth',
    title: '复盘学习材料',
    quadrant: 'not-urgent-important',
    completed: true,
    completedAt: '2026-04-24',
    date: '2026-04-23',
  },
  {
    id: 'yesterday',
    title: '昨天已归档',
    quadrant: 'urgent-not-important',
    completed: true,
    completedAt: '2026-04-23',
    date: '2026-04-23',
  },
  {
    id: 'open',
    title: '还没完成',
    quadrant: 'not-urgent-not-important',
    completed: false,
    date: '2026-04-24',
  },
];

test('builds harvest counters from completed plan dates', () => {
  const harvest = buildTaskHarvestStats(tasks, new Date('2026-04-24T18:00:00+08:00'));

  assert.equal(harvest.todayCompletedTasks, 2);
  assert.equal(harvest.totalCompletedTasks, 3);
});

test('builds completed plan distribution by quadrant for today', () => {
  const periodTasks = getCompletedTasksForPeriod(tasks, 'day', new Date('2026-04-24T18:00:00+08:00'));
  const harvest = buildTaskHarvestStats(periodTasks, new Date('2026-04-24T18:00:00+08:00'));

  assert.deepEqual(
    harvest.completedDistribution.map(({ id, name, completedTaskCount, percentage }) => ({
      id,
      name,
      completedTaskCount,
      percentage,
    })),
    [
      { id: 'urgent-important', name: '核心/紧急', completedTaskCount: 1, percentage: 50 },
      { id: 'not-urgent-important', name: '战略/成长', completedTaskCount: 1, percentage: 50 },
    ],
  );
});

test('filters completed plans by day, week, and month periods', () => {
  const now = new Date('2026-04-24T18:00:00+08:00');

  assert.deepEqual(getCompletedTasksForPeriod(tasks, 'day', now).map((task) => task.id), [
    'today-urgent',
    'today-growth',
  ]);
  assert.deepEqual(getCompletedTasksForPeriod(tasks, 'week', now).map((task) => task.id), [
    'today-urgent',
    'today-growth',
    'yesterday',
  ]);
  assert.deepEqual(getCompletedTasksForPeriod(tasks, 'month', now).map((task) => task.id), [
    'today-urgent',
    'today-growth',
    'yesterday',
  ]);
});
