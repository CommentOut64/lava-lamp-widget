import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTemperature } from '../../src/core/thermal-field.js';

test('bottom area is hotter than top area', () => {
  const bottom = sampleTemperature({ x: 100, y: 460 }, { width: 260, height: 520, heat: 0.72 });
  const top = sampleTemperature({ x: 100, y: 40 }, { width: 260, height: 520, heat: 0.72 });
  assert.ok(bottom > top);
});

test('temperature changes smoothly in vertical direction', () => {
  const a = sampleTemperature({ x: 130, y: 260 }, { width: 260, height: 520, heat: 0.72 });
  const b = sampleTemperature({ x: 130, y: 270 }, { width: 260, height: 520, heat: 0.72 });
  assert.ok(Math.abs(a - b) < 0.05);
});
