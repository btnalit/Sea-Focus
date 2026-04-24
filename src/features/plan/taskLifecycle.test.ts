import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteTaskById,
  getTasksForPlanDate,
  isTaskCarriedForward,
  toggleTaskCompletion,
} from './taskLifecycle';
import { Task } from '../../types';

const tasks: Task[] = [
  {
    id: 'done-from-24',
    title: '完成日报',
    quadrant: 'urgent-important',
    completed: true,
    completedAt: '2026-04-25',
    date: '2026-04-24',
  },
  {
    id: 'open-from-24',
    title: '继续整理方案',
    quadrant: 'not-urgent-important',
    completed: false,
    date: '2026-04-24',
  },
  {
    id: 'today',
    title: '今天新增计划',
    quadrant: 'urgent-not-important',
    completed: false,
    date: '2026-04-25',
  },
];

test('archives completed tasks under their original plan date', () => {
  assert.deepEqual(
    getTasksForPlanDate(tasks, '2026-04-24', 'archive').map((task) => task.id),
    ['done-from-24'],
  );
  assert.deepEqual(
    getTasksForPlanDate(tasks, '2026-04-25', 'archive').map((task) => task.id),
    [],
  );
});

test('carries unfinished past tasks into later active dates', () => {
  assert.deepEqual(
    getTasksForPlanDate(tasks, '2026-04-25', 'active').map((task) => task.id),
    ['open-from-24', 'today'],
  );
  assert.equal(isTaskCarriedForward(tasks[1], '2026-04-25'), true);
  assert.equal(isTaskCarriedForward(tasks[2], '2026-04-25'), false);
});

test('stamps completion date when archiving and clears it when reopening', () => {
  const archived = toggleTaskCompletion(tasks[1], new Date('2026-04-25T15:00:00+08:00'));

  assert.equal(archived.completed, true);
  assert.equal(archived.completedAt, '2026-04-25');

  const reopened = toggleTaskCompletion(archived, new Date('2026-04-26T09:00:00+08:00'));

  assert.equal(reopened.completed, false);
  assert.equal(reopened.completedAt, undefined);
});

test('deletes an archived task from the persisted task list', () => {
  assert.deepEqual(deleteTaskById(tasks, 'done-from-24').map((task) => task.id), [
    'open-from-24',
    'today',
  ]);
});
