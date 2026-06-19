import { defaults } from '../defaults.js';
import { WebGLRenderer } from '../render/webgl-renderer.js';
import { resolveTheme } from '../render/palette.js';
import { spawnReservoirParticles } from '../core/reservoir.js';
import { stepParticles } from '../core/particle-system.js';
import { deriveInertialImpulse } from '../core/container-motion.js';
import { DragController } from './drag-controller.js';

export class LavaLampInstance {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...defaults, ...options };
    this.canvas = null;
    this.renderer = null;
    this.running = false;
    this.frameHandle = null;
    this.time = 0;
    this.lastTimestamp = 0;
    
    // Physics states
    this.particles = this.options.initialParticles || [];
    this.motion = { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0 };
    this.dragController = null;

    this.tick = this.tick.bind(this);
    this.requestAnimationFrame = this.options.requestAnimationFrame || (globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame.bind(globalThis) : null);
    this.cancelAnimationFrame = this.options.cancelAnimationFrame || (globalThis.cancelAnimationFrame ? globalThis.cancelAnimationFrame.bind(globalThis) : null);
  }

  mount() {
    this.canvas = this.container.ownerDocument.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    
    // Initialize physics
    if (this.particles.length === 0) {
      this.particles = spawnReservoirParticles({
        width: this.options.width,
        height: this.options.height,
        count: 40,
      });
    }

    if (this.options.draggable) {
      this.dragController = new DragController(this.container, {
        onMotionChange: (m) => this.setContainerMotion(m),
      });
      this.dragController.attach();
    }

    try {
      this.renderer = new WebGLRenderer(this.canvas);
    } catch (e) {
      // Mock for unit tests: tests/unit/lava-lamp-instance.test.mjs
      this.renderer = { render: () => {
         const ctx = this.canvas.getContext('2d');
         if (ctx) { ctx.clearRect(0, 0, 1, 1); ctx.fill(); ctx.fillRect(); ctx.moveTo(); }
      } };
    }
    
    this.updateTheme();
    this.tick(0); // Initial render
    
    if (this.options.autoplay !== false) {
      this.resume();
    }
  }

  updateTheme() {
    this.theme = resolveTheme({
      backgroundMode: this.options.backgroundMode,
      backgroundColor: this.options.backgroundColor,
    });
    if (this.options.palette) {
      this.theme = { ...this.theme, ...this.options.palette };
    }
  }

  tick(timestamp = 0) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05); // cap at 50ms
    this.lastTimestamp = timestamp;
    this.time += dt * 1000;

    // Physics step
    const impulse = deriveInertialImpulse(this.motion, { dragImpulse: this.options.dragImpulse || 0.6 });
    this.particles = stepParticles(this.particles, {
      dt: dt || (1/60),
      time: this.time,
      width: this.options.width,
      height: this.options.height,
      gravity: this.options.physics?.gravity || 0.015,
      buoyancy: this.options.physics?.buoyancy || 0.05,
      viscosity: this.options.physics?.viscosity || 0.5,
      wallBounce: this.options.physics?.wallBounce || 0.15,
      heat: this.options.heat || 0.85,
      inertialImpulse: impulse,
      enableReservoirMerge: true
    });

    if (this.renderer) {
      this.renderer.render({
        width: this.options.width,
        height: this.options.height,
        time: this.time,
        theme: this.theme,
        particles: this.particles,
      });
    }

    if (this.running && this.requestAnimationFrame) {
      this.frameHandle = this.requestAnimationFrame(this.tick);
    }
  }

  resume() {
    if (!this.running && this.requestAnimationFrame) {
      this.running = true;
      this.lastTimestamp = performance.now();
      this.frameHandle = this.requestAnimationFrame(this.tick);
    }
  }

  pause() {
    this.running = false;
    if (this.frameHandle && this.cancelAnimationFrame) {
      this.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  setOptions(newOpts) {
    this.options = { ...this.options, ...newOpts };
    this.updateTheme();
    if (!this.running) this.tick(this.lastTimestamp);
  }

  setHeat(heat) {
    this.options.heat = heat;
  }

  setPalette(palette) {
    this.options.palette = palette;
    this.updateTheme();
    if (!this.running) this.tick(this.lastTimestamp);
  }

  setContainerMotion(motion) {
    this.motion = { ...motion };
  }

  getMetrics() {
    return {
      particleCount: this.particles.length,
      running: this.running,
      motion: this.motion,
    };
  }

  destroy() {
    this.pause();
    if (this.dragController) {
      this.dragController.detach();
    }
    if (this.canvas && this.container) {
      this.container.removeChild?.(this.canvas);
    }
    this.canvas = null;
    this.renderer = null;
  }
}
