import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCenteredDateStrip, buildMonthGrid, formatDateKey } from './dateUtils';

test('centers the given day in a seven day date strip', () => {
  const today = new Date('2026-04-24T13:42:00+08:00');
  const strip = buildCenteredDateStrip(today);

  assert.equal(strip.length, 7);
  assert.equal(formatDateKey(strip[3]), '2026-04-24');
  assert.deepEqual(strip.map(formatDateKey), [
    '2026-04-21',
    '2026-04-22',
    '2026-04-23',
    '2026-04-24',
    '2026-04-25',
    '2026-04-26',
    '2026-04-27',
  ]);
});

test('builds a complete monday-first month grid', () => {
  const grid = buildMonthGrid(2026, 3);

  assert.equal(grid.length, 42);
  assert.equal(formatDateKey(grid[0]), '2026-03-30');
  assert.equal(formatDateKey(grid[4]), '2026-04-03');
  assert.equal(formatDateKey(grid[41]), '2026-05-10');
});
