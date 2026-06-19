import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveInertialImpulse } from '../../src/core/container-motion.js';
import { stepParticles } from '../../src/core/particle-system.js';

test('container acceleration produces opposite inertial impulse', () => {
  const impulse = deriveInertialImpulse({ ax: 600, ay: -120 }, { dragImpulse: 1.0 });
  assert.ok(impulse.x < 0);
  assert.ok(impulse.y > 0);
});

test('particles stay inside capsule boundary after step', () => {
  const particles = [{ x: 245, y: 60, vx: 120, vy: -20, radius: 18, temperature: 0.8, mass: 1 }];
  const next = stepParticles(particles, {
    dt: 1 / 60,
    width: 260,
    height: 520,
    gravity: 0.26,
    buoyancy: 0.58,
    viscosity: 0.46,
    wallBounce: 0.34,
    inertialImpulse: { x: 0, y: 0 },
  });
  assert.ok(next[0].x <= 242);
});

test('hot particles rise more easily than cold particles', () => {
  const baseConfig = {
    dt: 1 / 60,
    width: 260,
    height: 520,
    gravity: 0.26,
    buoyancy: 0.58,
    viscosity: 0.46,
    wallBounce: 0.34,
    inertialImpulse: { x: 0, y: 0 },
  };
  const hot = stepParticles([{ x: 130, y: 300, vx: 0, vy: 0, radius: 18, temperature: 0.9, mass: 1 }], baseConfig)[0];
  const cold = stepParticles([{ x: 130, y: 300, vx: 0, vy: 0, radius: 18, temperature: 0.2, mass: 1 }], baseConfig)[0];
  assert.ok(hot.vy < cold.vy);
});

test('cold particles near the bottom can be reabsorbed into reservoir zone', () => {
  const next = stepParticles(
    [{ x: 120, y: 506, vx: 2, vy: 10, radius: 18, temperature: 0.16, mass: 1 }],
    {
      dt: 1 / 60,
      width: 260,
      height: 520,
      gravity: 0.26,
      buoyancy: 0.58,
      viscosity: 0.46,
      wallBounce: 0.34,
      inertialImpulse: { x: 0, y: 0 },
      enableReservoirMerge: true,
    }
  );
  assert.ok(next[0].y >= 520 * 0.82);
  assert.ok(next[0].temperature >= 0.3);
});

test('bottom particles heat up and begin rising under sustained heating', () => {
  let particles = [{ x: 130, y: 430, vx: 0, vy: 0, radius: 18, temperature: 0.3, mass: 1 }];
  const config = {
    dt: 1 / 60,
    width: 260,
    height: 520,
    gravity: 0.26,
    buoyancy: 0.58,
    viscosity: 0.46,
    wallBounce: 0.34,
    inertialImpulse: { x: 0, y: 0 },
    heat: 0.72,
  };

  for (let step = 0; step < 90; step += 1) {
    particles = stepParticles(particles, config);
  }

  assert.ok(particles[0].temperature > 0.3);
  assert.ok(particles[0].vy < 0);
});
