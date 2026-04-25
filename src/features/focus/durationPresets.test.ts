import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFocusMinutes,
  commitCustomFocusMinutesDraft,
  normalizeCustomFocusMinutesDraft,
  toFocusDurationSeconds,
} from './durationPresets';

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

test('keeps custom focus minute draft empty while the user is editing', () => {
  assert.deepEqual(normalizeCustomFocusMinutesDraft('', 25), {
    inputValue: '',
    minutes: 25,
    shouldUpdateTimer: false,
  });
  assert.deepEqual(normalizeCustomFocusMinutesDraft('90', 25), {
    inputValue: '90',
    minutes: 90,
    shouldUpdateTimer: true,
  });
});

test('commits custom focus minute drafts into supported values', () => {
  assert.deepEqual(commitCustomFocusMinutesDraft(''), {
    inputValue: '1',
    minutes: 1,
  });
  assert.deepEqual(commitCustomFocusMinutesDraft('260'), {
    inputValue: '240',
    minutes: 240,
  });
  assert.deepEqual(commitCustomFocusMinutesDraft('12.6'), {
    inputValue: '13',
    minutes: 13,
  });
});
