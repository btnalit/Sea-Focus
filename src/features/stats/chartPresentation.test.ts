import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGardenChartSegments } from './chartPresentation';

test('builds chart segments from positive values only', () => {
  const segments = buildGardenChartSegments([
    { name: '深度工作', value: 1500, color: '#7c8363', helper: '25m' },
    { name: '学习成长', value: 1500, color: '#c68a73', helper: '25m' },
    { name: '空分类', value: 0, color: '#e9e8e0', helper: '0m' },
  ]);

  assert.deepEqual(segments, [
    { name: '深度工作', value: 1500, color: '#7c8363', helper: '25m', percentage: 50, offset: 0 },
    { name: '学习成长', value: 1500, color: '#c68a73', helper: '25m', percentage: 50, offset: 0.5 },
  ]);
});

test('returns empty segments when all values are empty', () => {
  assert.deepEqual(buildGardenChartSegments([{ name: '空', value: 0, color: '#e9e8e0', helper: '0m' }]), []);
});
