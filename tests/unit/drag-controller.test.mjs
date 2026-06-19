import test from 'node:test';
import assert from 'node:assert/strict';
import { DragController } from '../../src/widget/drag-controller.js';

function createHost() {
  const listeners = new Map();
  return {
    style: {},
    setPointerCapture(pointerId) {
      this.captured = pointerId;
    },
    releasePointerCapture(pointerId) {
      this.released = pointerId;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    dispatch(type, event) {
      const handler = listeners.get(type);
      if (handler) {
        handler(event);
      }
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

test('drag controller updates transform and motion metrics during drag', () => {
  const host = createHost();
  const motions = [];
  const drag = new DragController(host, {
    onMotionChange(motion) {
      motions.push(motion);
    },
  });

  drag.attach();
  host.dispatch('pointerdown', { pointerId: 1, clientX: 20, clientY: 20 });
  host.dispatch('pointermove', { pointerId: 1, clientX: 90, clientY: 55, timeStamp: 16 });
  host.dispatch('pointerup', { pointerId: 1, clientX: 90, clientY: 55, timeStamp: 32 });

  assert.equal(host.style.transform, 'translate3d(70px, 35px, 0)');
  assert.ok(motions.length >= 2);
  assert.ok(motions.at(-1).vx >= 0);
});

test('detach removes registered listeners', () => {
  const host = createHost();
  const drag = new DragController(host, {});
  drag.attach();
  assert.ok(host.listenerCount > 0);
  drag.detach();
  assert.equal(host.listenerCount, 0);
});
