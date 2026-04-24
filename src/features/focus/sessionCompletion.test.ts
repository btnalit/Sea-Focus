import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldSaveStopwatchSession } from './sessionCompletion';

test('saves stopwatch sessions only when elapsed time is positive', () => {
  assert.equal(shouldSaveStopwatchSession(1), true);
  assert.equal(shouldSaveStopwatchSession(0), false);
  assert.equal(shouldSaveStopwatchSession(-5), false);
  assert.equal(shouldSaveStopwatchSession(Number.NaN), false);
});
