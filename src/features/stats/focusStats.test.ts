import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFocusStats } from './focusStats';
import { FocusRecord } from '../../types';

const records: FocusRecord[] = [
  {
    id: 'morning',
    type: 'pomodoro',
    duration: 1500,
    category: '深度工作',
    timestamp: '2026-04-24T09:00:00+08:00',
  },
  {
    id: 'midday',
    type: 'countdown',
    duration: 3000,
    category: '深度工作',
    timestamp: '2026-04-24T12:00:00+08:00',
  },
  {
    id: 'yesterday',
    type: 'pomodoro',
    duration: 1200,
    category: '复盘',
    timestamp: '2026-04-23T21:00:00+08:00',
  },
];

test('builds focus totals from real records', () => {
  const stats = buildFocusStats(records, new Date('2026-04-24T18:00:00+08:00'));

  assert.equal(stats.todayPomodoros, 1);
  assert.equal(stats.totalPomodoros, 2);
  assert.equal(stats.todaySeconds, 4500);
  assert.equal(stats.totalSeconds, 5700);
  assert.equal(stats.longestSeconds, 3000);
});

test('builds category distribution from actual durations', () => {
  const stats = buildFocusStats(records, new Date('2026-04-24T18:00:00+08:00'));

  assert.deepEqual(
    stats.todayDistribution.map(({ name, seconds, percentage }) => ({
      name,
      seconds,
      percentage,
    })),
    [{ name: '深度工作', seconds: 4500, percentage: 100 }],
  );

  assert.deepEqual(
    stats.totalDistribution.map(({ name, seconds, percentage }) => ({
      name,
      seconds,
      percentage,
    })),
    [
      { name: '深度工作', seconds: 4500, percentage: 78.9 },
      { name: '复盘', seconds: 1200, percentage: 21.1 },
    ],
  );
});

test('returns empty distributions when there are no records', () => {
  const stats = buildFocusStats([], new Date('2026-04-24T18:00:00+08:00'));

  assert.equal(stats.todayPomodoros, 0);
  assert.equal(stats.totalSeconds, 0);
  assert.deepEqual(stats.todayDistribution, []);
  assert.deepEqual(stats.totalDistribution, []);
});
