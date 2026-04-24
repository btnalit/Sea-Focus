import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyHarvestTheme } from './dailyHarvestTheme';

test('returns a stable harvest theme for the same local date', () => {
  const morningTheme = getDailyHarvestTheme(new Date('2026-04-24T08:00:00+08:00'));
  const eveningTheme = getDailyHarvestTheme(new Date('2026-04-24T21:30:00+08:00'));

  assert.equal(morningTheme.id, eveningTheme.id);
  assert.equal(morningTheme.label.length > 0, true);
});

test('rotates harvest themes across adjacent dates', () => {
  const todayTheme = getDailyHarvestTheme(new Date('2026-04-24T08:00:00+08:00'));
  const tomorrowTheme = getDailyHarvestTheme(new Date('2026-04-25T08:00:00+08:00'));

  assert.notEqual(todayTheme.id, tomorrowTheme.id);
});
