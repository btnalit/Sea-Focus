import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskForecast } from './taskForecast';
import { Task } from '../../types';

const tasks: Task[] = [
  {
    id: 'urgent',
    title: '上线前检查',
    quadrant: 'urgent-important',
    completed: false,
    date: '2026-04-24',
  },
  {
    id: 'growth',
    title: '阅读文档',
    quadrant: 'not-urgent-important',
    completed: false,
    date: '2026-04-25',
  },
  {
    id: 'done',
    title: '整理随笔',
    quadrant: 'urgent-not-important',
    completed: true,
    date: '2026-04-24',
  },
  {
    id: 'other-month',
    title: '下月安排',
    quadrant: 'not-urgent-not-important',
    completed: false,
    date: '2026-05-01',
  },
];

test('builds day forecast from selected day tasks', () => {
  const forecast = buildTaskForecast(tasks, 'day', new Date('2026-04-24T13:42:00+08:00'));

  assert.equal(forecast.totalTasks, 2);
  assert.equal(forecast.activeTasks, 1);
  assert.equal(forecast.completedTasks, 1);
  assert.equal(forecast.estimatedPomodoros, 2);
  assert.equal(forecast.estimatedSeconds, 3000);
  assert.deepEqual(
    forecast.distribution.map(({ name, taskCount, estimatedPomodoros }) => ({ name, taskCount, estimatedPomodoros })),
    [
      { name: '核心/紧急', taskCount: 1, estimatedPomodoros: 2 },
      { name: '琐事/干扰', taskCount: 1, estimatedPomodoros: 0 },
    ],
  );
});

test('builds week and month forecasts from dated tasks', () => {
  const now = new Date('2026-04-24T13:42:00+08:00');

  assert.deepEqual(buildTaskForecast(tasks, 'week', now), {
    totalTasks: 3,
    activeTasks: 2,
    completedTasks: 1,
    estimatedPomodoros: 4,
    estimatedSeconds: 6000,
    distribution: [
      { id: 'urgent-important', name: '核心/紧急', taskCount: 1, activeTaskCount: 1, estimatedPomodoros: 2, color: '#c68a73' },
      { id: 'not-urgent-important', name: '战略/成长', taskCount: 1, activeTaskCount: 1, estimatedPomodoros: 2, color: '#d0a460' },
      { id: 'urgent-not-important', name: '琐事/干扰', taskCount: 1, activeTaskCount: 0, estimatedPomodoros: 0, color: '#7c8363' },
    ],
  });

  assert.equal(buildTaskForecast(tasks, 'month', now).totalTasks, 3);
});

test('includes unfinished carryover tasks in the current day forecast', () => {
  const forecast = buildTaskForecast(tasks, 'day', new Date('2026-04-25T09:00:00+08:00'));

  assert.equal(forecast.totalTasks, 2);
  assert.equal(forecast.activeTasks, 2);
  assert.equal(forecast.completedTasks, 0);
  assert.equal(forecast.estimatedPomodoros, 4);
  assert.deepEqual(
    forecast.distribution.map(({ id, activeTaskCount, estimatedPomodoros }) => ({ id, activeTaskCount, estimatedPomodoros })),
    [
      { id: 'urgent-important', activeTaskCount: 1, estimatedPomodoros: 2 },
      { id: 'not-urgent-important', activeTaskCount: 1, estimatedPomodoros: 2 },
    ],
  );
});
