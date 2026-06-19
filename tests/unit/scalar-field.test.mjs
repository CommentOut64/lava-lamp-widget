import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScalarField } from '../../src/render/scalar-field.js';

test('nearby particles build stronger field than distant cells', () => {
  const field = buildScalarField(
    [{ x: 100, y: 100, radius: 24 }, { x: 120, y: 110, radius: 22 }],
    { width: 260, height: 520, cellSize: 10 }
  );
  assert.ok(field.sample(110, 110) > field.sample(220, 220));
});

test('larger particles produce wider influence than smaller particles', () => {
  const small = buildScalarField([{ x: 100, y: 100, radius: 12 }], { width: 260, height: 520, cellSize: 10 });
  const large = buildScalarField([{ x: 100, y: 100, radius: 28 }], { width: 260, height: 520, cellSize: 10 });
  assert.ok(large.sample(130, 100) > small.sample(130, 100));
});
