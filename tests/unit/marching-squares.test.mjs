import test from 'node:test';
import assert from 'node:assert/strict';
import { extractContours } from '../../src/render/marching-squares.js';

test('two overlapping blobs create at least one contour', () => {
  const contours = extractContours({
    width: 4,
    height: 4,
    threshold: 1,
    values: [
      0, 0.4, 0.6, 0,
      0.2, 1.2, 1.4, 0.3,
      0.1, 1.1, 1.3, 0.2,
      0, 0.2, 0.3, 0,
    ],
  });
  assert.ok(contours.length >= 1);
});

test('boundary-only fields do not crash contour extraction', () => {
  const contours = extractContours({
    width: 3,
    height: 3,
    threshold: 1,
    values: [
      1.1, 1.1, 1.1,
      1.1, 0.2, 1.1,
      1.1, 1.1, 1.1,
    ],
  });
  assert.ok(Array.isArray(contours));
});

test('filled blob contours contain drawable polygons instead of isolated line segments', () => {
  const contours = extractContours({
    width: 4,
    height: 4,
    threshold: 1,
    values: [
      0, 0, 0, 0,
      0, 1.4, 1.4, 0,
      0, 1.4, 1.4, 0,
      0, 0, 0, 0,
    ],
  });
  assert.ok(contours.some((contour) => contour.length >= 4));
});
