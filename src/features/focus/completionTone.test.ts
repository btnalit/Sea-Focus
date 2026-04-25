import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFocusCompletionToneSteps } from './completionTone';

test('builds an audible multi-step focus completion tone pattern', () => {
  const toneSteps = buildFocusCompletionToneSteps();
  const totalDurationMs = toneSteps.reduce((total, step) => total + step.durationMs, 0);

  assert.equal(toneSteps.length >= 3, true);
  assert.equal(totalDurationMs >= 1400, true);
  assert.equal(toneSteps.some((step) => step.gain >= 0.14), true);
  assert.equal(toneSteps.every((step) => step.durationMs >= 300), true);
  assert.equal(toneSteps.every((step) => step.gain > 0 && step.gain <= 0.22), true);
});
