import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFocusTaskSnapshot,
  getSelectableFocusTasks,
  resolveFocusTaskSnapshot,
} from './focusTaskLinking';
import { Task } from '../../types';

const tasks: Task[] = [
  {
    id: 'done-yesterday',
    title: '已归档计划',
    quadrant: 'urgent-important',
    completed: true,
    completedAt: '2026-04-23',
    date: '2026-04-23',
  },
  {
    id: 'carryover',
    title: '继续写方案',
    quadrant: 'not-urgent-important',
    completed: false,
    date: '2026-04-23',
  },
  {
    id: 'today-open',
    title: '整理发布清单',
    quadrant: 'urgent-not-important',
    completed: false,
    date: '2026-04-24',
  },
  {
    id: 'future',
    title: '明天再做',
    quadrant: 'not-urgent-not-important',
    completed: false,
    date: '2026-04-25',
  },
];

test('lists active and carryover tasks for focus linking today', () => {
  const selectableTasks = getSelectableFocusTasks(tasks, new Date(2026, 3, 24, 9));

  assert.deepEqual(selectableTasks.map((task) => task.id), ['carryover', 'today-open']);
});

test('builds a stable focus task snapshot from the selected plan', () => {
  assert.deepEqual(buildFocusTaskSnapshot(tasks[2]), {
    taskId: 'today-open',
    taskTitle: '整理发布清单',
    taskQuadrant: 'urgent-not-important',
    taskDate: '2026-04-24',
    taskLinkStatus: 'active',
  });
});

test('resolves archived and deleted selected plans without dropping the focus record', () => {
  const selectedSnapshot = buildFocusTaskSnapshot(tasks[2]);
  const archivedTasks = tasks.map((task) => (
    task.id === 'today-open'
      ? { ...task, completed: true, completedAt: '2026-04-24' }
      : task
  ));
  const deletedTasks = tasks.filter((task) => task.id !== 'today-open');

  assert.equal(resolveFocusTaskSnapshot(tasks, null, null), undefined);
  assert.deepEqual(resolveFocusTaskSnapshot(tasks, 'today-open', selectedSnapshot), selectedSnapshot);
  assert.deepEqual(resolveFocusTaskSnapshot(archivedTasks, 'today-open', selectedSnapshot), {
    ...selectedSnapshot,
    taskLinkStatus: 'archived',
  });
  assert.deepEqual(resolveFocusTaskSnapshot(deletedTasks, 'today-open', selectedSnapshot), {
    ...selectedSnapshot,
    taskLinkStatus: 'deleted',
  });
});
