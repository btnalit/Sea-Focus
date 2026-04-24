import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlanHeaderStats } from './planHeaderStats';
import { FocusRecord, Task } from '../../types';

test('uses completed plans rather than focus pomodoros for today archive count', () => {
  const tasks: Task[] = [
    {
      id: 'archived',
      title: '完成方案',
      quadrant: 'urgent-important',
      completed: true,
      completedAt: '2026-04-24',
      date: '2026-04-24',
    },
  ];
  const records: FocusRecord[] = [
    {
      id: 'pomodoro',
      type: 'pomodoro',
      duration: 1500,
      category: '深度工作',
      timestamp: '2026-04-24T09:00:00+08:00',
    },
    {
      id: 'second-pomodoro',
      type: 'pomodoro',
      duration: 1500,
      category: '深度工作',
      timestamp: '2026-04-24T10:00:00+08:00',
    },
  ];

  assert.deepEqual(buildPlanHeaderStats(tasks, records, new Date('2026-04-24T18:00:00+08:00')), {
    todayArchivedTasks: 1,
  });
});
