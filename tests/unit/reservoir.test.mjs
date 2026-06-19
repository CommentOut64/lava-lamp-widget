import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeReturnedParticles, spawnReservoirParticles, shouldDetachBlob } from '../../src/core/reservoir.js';

test('reservoir particles start distributed across container height', () => {
  const particles = spawnReservoirParticles({ width: 260, height: 520, count: 8 });
  assert.ok(particles.every((p) => p.y >= 520 * 0.1 && p.y <= 520 * 0.9));
});

test('hot reservoir section can detach', () => {
  assert.equal(
    shouldDetachBlob({ averageTemperature: 0.82, upwardPressure: 0.68, viscosity: 0.22 }),
    true
  );
});

test('cold particles returning to bottom merge back into reservoir zone', () => {
  const merged = mergeReturnedParticles(
    [{ x: 120, y: 506, vx: 4, vy: 12, radius: 18, temperature: 0.18, mass: 1 }],
    { width: 260, height: 520 }
  );
  assert.ok(merged[0].y >= 520 * 0.82);
  assert.ok(merged[0].temperature >= 0.3);
});
