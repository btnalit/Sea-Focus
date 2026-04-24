import test from 'node:test';
import assert from 'node:assert/strict';
import { clampFocusMinutes, toFocusDurationSeconds } from './durationPresets';

test('converts focus minutes into seconds', () => {
  assert.equal(toFocusDurationSeconds(25), 1500);
  assert.equal(toFocusDurationSeconds(50), 3000);
});

test('clamps custom focus minutes to the supported range', () => {
  assert.equal(clampFocusMinutes(0), 1);
  assert.equal(clampFocusMinutes(-10), 1);
  assert.equal(clampFocusMinutes(90), 90);
  assert.equal(clampFocusMinutes(241), 240);
});
