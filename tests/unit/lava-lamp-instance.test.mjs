import test from 'node:test';
import assert from 'node:assert/strict';
import { LavaLampInstance } from '../../src/widget/lava-lamp-instance.js';

function createFakeContext(log) {
  return {
    clearRect() {
      log.push('clearRect');
    },
    fillRect() {
      log.push('fillRect');
    },
    beginPath() {
      log.push('beginPath');
    },
    moveTo() {
      log.push('moveTo');
    },
    lineTo() {
      log.push('lineTo');
    },
    closePath() {
      log.push('closePath');
    },
    fill() {
      log.push('fill');
    },
    stroke() {
      log.push('stroke');
    },
    set fillStyle(_) {},
    set strokeStyle(_) {},
    set lineWidth(_) {},
    set globalAlpha(_) {},
  };
}

function createContainer(log) {
  const listeners = new Map();
  return {
    style: {},
    appendChild(node) {
      log.push('appendChild');
      return node;
    },
    removeChild(node) {
      log.push(['removeChild', node.tagName]);
      return node;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    ownerDocument: {
      createElement(tagName) {
        return {
          tagName,
          style: {},
          width: 0,
          height: 0,
          getContext() {
            return createFakeContext(log);
          },
        };
      },
    },
  };
}

test('mount seeds reservoir particles and performs an initial render', () => {
  const log = [];
  const instance = new LavaLampInstance(createContainer(log), { width: 260, height: 520 });
  instance.mount();

  assert.ok(Array.isArray(instance.particles));
  assert.ok(instance.particles.length > 0);
  assert.equal(instance.canvas.width, 260);
  assert.equal(instance.canvas.height, 520);
  assert.ok(log.includes('fillRect'));
  assert.ok(log.includes('moveTo'));
});

test('mount starts animation by default when requestAnimationFrame is available', () => {
  const scheduled = [];
  const instance = new LavaLampInstance(createContainer([]), {
    width: 260,
    height: 520,
    requestAnimationFrame(callback) {
      scheduled.push(callback);
      return 11;
    },
  });

  instance.mount();

  assert.equal(instance.running, true);
  assert.equal(instance.frameHandle, 11);
  assert.equal(scheduled.length, 1);
});

test('tick advances particles and redraws the scene', () => {
  const log = [];
  const instance = new LavaLampInstance(createContainer(log), { width: 260, height: 520 });
  instance.mount();
  const beforeY = instance.particles[0].y;
  log.length = 0;

  instance.tick();

  assert.notEqual(instance.particles[0].y, beforeY);
  assert.ok(log.includes('clearRect'));
  assert.ok(log.includes('fill'));
});

test('resume schedules a frame and pause cancels it', () => {
  const log = [];
  const scheduled = [];
  const cancelled = [];
  const instance = new LavaLampInstance(createContainer(log), {
    width: 260,
    height: 520,
    requestAnimationFrame(callback) {
      scheduled.push(callback);
      return 7;
    },
    cancelAnimationFrame(handle) {
      cancelled.push(handle);
    },
  });
  instance.mount();

  instance.resume();
  assert.equal(instance.frameHandle, 7);
  assert.equal(scheduled.length, 1);

  instance.pause();
  assert.deepEqual(cancelled, [7]);
});

test('destroy removes mounted canvas and clears frame handle', () => {
  const log = [];
  const cancelled = [];
  const instance = new LavaLampInstance(createContainer(log), {
    width: 260,
    height: 520,
    requestAnimationFrame() {
      return 9;
    },
    cancelAnimationFrame(handle) {
      cancelled.push(handle);
    },
  });
  instance.mount();
  instance.resume();
  instance.destroy();

  assert.equal(instance.canvas, null);
  assert.deepEqual(cancelled, [9]);
  assert.ok(log.some((entry) => Array.isArray(entry) && entry[0] === 'removeChild'));
});

test('setOptions updates theme inputs and triggers redraw', () => {
  const log = [];
  const instance = new LavaLampInstance(createContainer(log), {
    width: 260,
    height: 520,
    backgroundColor: '#101820',
  });
  instance.mount();
  log.length = 0;

  instance.setOptions({ backgroundColor: '#f4efe8' });

  assert.equal(instance.options.backgroundColor, '#f4efe8');
  assert.ok(log.includes('clearRect'));
});

test('getMetrics returns particle and animation state', () => {
  const instance = new LavaLampInstance(createContainer([]), { width: 260, height: 520 });
  instance.mount();
  const metrics = instance.getMetrics();

  assert.equal(typeof metrics.particleCount, 'number');
  assert.equal(metrics.particleCount, instance.particles.length);
  assert.equal(metrics.running, false);
});

test('draggable instances create a drag controller and store motion updates', () => {
  const log = [];
  const instance = new LavaLampInstance(createContainer(log), { width: 260, height: 520, draggable: true });
  instance.mount();

  assert.ok(instance.dragController);
  instance.dragController.options.onMotionChange({ x: 20, y: 10, vx: 1, vy: 2, ax: 0.2, ay: 0.1 });
  const metrics = instance.getMetrics();

  assert.deepEqual(metrics.motion, { x: 20, y: 10, vx: 1, vy: 2, ax: 0.2, ay: 0.1 });
});

test('setContainerMotion overwrites current motion snapshot', () => {
  const instance = new LavaLampInstance(createContainer([]), { width: 260, height: 520 });
  instance.mount();
  instance.setContainerMotion({ x: 5, y: 6, vx: 0.5, vy: 0.6, ax: 0.05, ay: 0.06 });

  assert.deepEqual(instance.getMetrics().motion, { x: 5, y: 6, vx: 0.5, vy: 0.6, ax: 0.05, ay: 0.06 });
});

test('setHeat updates heat option used by future ticks', () => {
  const instance = new LavaLampInstance(createContainer([]), { width: 260, height: 520 });
  instance.mount();
  instance.setHeat(0.91);

  assert.equal(instance.options.heat, 0.91);
});

test('setPalette replaces theme palette and redraws', () => {
  const log = [];
  const instance = new LavaLampInstance(createContainer(log), { width: 260, height: 520 });
  instance.mount();
  log.length = 0;

  instance.setPalette({
    wax: ['#112233', '#445566'],
    liquid: ['#223344', '#556677'],
  });

  assert.deepEqual(instance.theme.wax, ['#112233', '#445566']);
  assert.ok(log.includes('clearRect'));
});

test('instance tick uses heating so bottom particles eventually rise', () => {
  const instance = new LavaLampInstance(createContainer([]), {
    width: 260,
    height: 520,
    autoplay: false,
    initialParticles: [{ x: 130, y: 430, vx: 0, vy: 0, radius: 18, temperature: 0.3, mass: 1 }],
  });
  instance.mount();

  for (let step = 0; step < 90; step += 1) {
    instance.tick();
  }

  assert.ok(instance.particles[0].temperature > 0.3);
  assert.ok(instance.particles[0].vy < 0);
});
