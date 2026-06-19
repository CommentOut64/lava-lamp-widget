import test from 'node:test';
import assert from 'node:assert/strict';
import { SpatialHash } from '../../src/core/spatial-hash.js';

test('neighbor query returns local particles only', () => {
  const hash = new SpatialHash(32);
  hash.insert({ id: 'a', x: 10, y: 10 });
  hash.insert({ id: 'b', x: 18, y: 12 });
  hash.insert({ id: 'c', x: 140, y: 140 });
  const neighbors = hash.query({ x: 12, y: 10 }, 24).map((item) => item.id).sort();
  assert.deepEqual(neighbors, ['a', 'b']);
});

test('neighbor query crosses cell boundaries without missing close particles', () => {
  const hash = new SpatialHash(32);
  hash.insert({ id: 'edge-left', x: 31, y: 20 });
  hash.insert({ id: 'edge-right', x: 33, y: 20 });
  const neighbors = hash.query({ x: 32, y: 20 }, 4).map((item) => item.id).sort();
  assert.deepEqual(neighbors, ['edge-left', 'edge-right']);
});
