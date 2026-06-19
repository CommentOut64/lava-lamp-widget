import test from 'node:test';
import assert from 'node:assert/strict';
import { CanvasRenderer } from '../../src/render/canvas-renderer.js';

function createFakeContext(log) {
  return {
    clearRect(...args) {
      log.push(['clearRect', ...args]);
    },
    beginPath() {
      log.push(['beginPath']);
    },
    moveTo(...args) {
      log.push(['moveTo', ...args]);
    },
    lineTo(...args) {
      log.push(['lineTo', ...args]);
    },
    closePath() {
      log.push(['closePath']);
    },
    fill() {
      log.push(['fill']);
    },
    stroke() {
      log.push(['stroke']);
    },
    fillRect(...args) {
      log.push(['fillRect', ...args]);
    },
    save() {
      log.push(['save']);
    },
    restore() {
      log.push(['restore']);
    },
    set fillStyle(value) {
      log.push(['fillStyle', value]);
    },
    set strokeStyle(value) {
      log.push(['strokeStyle', value]);
    },
    set lineWidth(value) {
      log.push(['lineWidth', value]);
    },
    set globalAlpha(value) {
      log.push(['globalAlpha', value]);
    },
  };
}

test('canvas renderer draws background before blob contours', () => {
  const log = [];
  const renderer = new CanvasRenderer(createFakeContext(log));
  renderer.render({
    width: 260,
    height: 520,
    theme: {
      liquid: ['#13293d', '#1f4e5f'],
      wax: ['#ff7a18', '#ffb347'],
      glassEdgeAlpha: 0.44,
      shadowAlpha: 0.3,
    },
    contours: [[{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }]],
  });

  const fillRectIndex = log.findIndex((entry) => entry[0] === 'fillRect');
  const moveToIndex = log.findIndex((entry) => entry[0] === 'moveTo');
  assert.ok(fillRectIndex >= 0);
  assert.ok(moveToIndex > fillRectIndex);
});
