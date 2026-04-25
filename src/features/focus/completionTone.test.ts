import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFocusCompletionToneSteps } from './completionTone';

test('builds a calm two-step focus completion tone pattern', () => {
  const toneSteps = buildFocusCompletionToneSteps();

  assert.equal(toneSteps.length, 2);
  assert.deepEqual(toneSteps.map((step) => step.frequency), [660, 880]);
  assert.equal(toneSteps.every((step) => step.durationMs > 0), true);
  assert.equal(toneSteps.every((step) => step.gain > 0 && step.gain <= 0.08), true);
});
