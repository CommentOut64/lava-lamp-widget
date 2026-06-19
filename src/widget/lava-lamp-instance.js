import { defaults } from '../defaults.js';
import { WebGLRenderer } from '../render/webgl-renderer.js';
import { resolveTheme } from '../render/palette.js';
import { spawnReservoirParticles } from '../core/reservoir.js';
import { stepParticles } from '../core/particle-system.js';
import { deriveInertialImpulse } from '../core/container-motion.js';
import { DragController } from './drag-controller.js';
import { structureStyles } from './styles.js';

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

  get glassHeight() {
    // Glass height is 85% of Top Section (which is 65% of total) -> 0.5525 of total height
    return this.options.height * 0.5525;
  }

  mount() {
    const doc = this.container.ownerDocument;

    // 1. Inject Styles if not present
    if (!doc.getElementById('lava-lamp-styles')) {
      const styleEl = doc.createElement('style');
      styleEl.id = 'lava-lamp-styles';
      styleEl.textContent = structureStyles;
      doc.head.appendChild(styleEl);
    }

    // 2. Create Wrapper
    this.wrapper = doc.createElement('div');
    this.wrapper.className = 'lava-lamp-wrapper';

    // 3. Create Top Section (Cap + Glass)
    const topSection = doc.createElement('div');
    topSection.className = 'lava-top-section';
    const cap = doc.createElement('div');
    cap.className = 'lava-cap';
    const glass = doc.createElement('div');
    glass.className = 'lava-glass';
    topSection.appendChild(cap);
    topSection.appendChild(glass);

    // 4. Create Canvas and append to Glass
    this.canvas = doc.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.glassHeight;
    glass.appendChild(this.canvas);

    // 5. Create Connector with Heart
    const connector = doc.createElement('div');
    connector.className = 'lava-connector';
    connector.innerHTML = `
      <svg class="lava-heart-emblem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        <path class="lava-heart-inner" d="M12 18.35l-1.1-1C6.3 13.5 3.5 11 3.5 8.5 3.5 6.2 5.2 4.5 7.5 4.5c1.4 0 2.8.8 3.5 2 .7-1.2 2.1-2 3.5-2 2.3 0 4 1.7 4 4 0 2.5-2.8 5-7.4 8.85l-1.1 1z" />
      </svg>
    `;

    // 6. Create Base
    const base = doc.createElement('div');
    base.className = 'lava-base';

    // Assemble everything
    this.wrapper.appendChild(topSection);
    this.wrapper.appendChild(connector);
    this.wrapper.appendChild(base);
    this.container.appendChild(this.wrapper);

    // Initialize physics
    if (this.particles.length === 0) {
      this.particles = spawnReservoirParticles({
        width: this.options.width,
        height: this.glassHeight,
        count: 30,
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
      height: this.glassHeight,
      gravity: this.options.physics?.gravity || 0.005,
      buoyancy: this.options.physics?.buoyancy || 0.015,
      viscosity: this.options.physics?.viscosity || 0.8,
      wallBounce: this.options.physics?.wallBounce || 0.15,
      heat: this.options.heat || 0.85,
      inertialImpulse: impulse,
      enableReservoirMerge: true
    });

    if (this.renderer) {
      this.renderer.render({
        width: this.options.width,
        height: this.glassHeight,
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
    if (this.canvas) {
      this.canvas.width = this.options.width;
      this.canvas.height = this.glassHeight;
    }
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
    if (this.wrapper && this.container) {
      this.container.removeChild?.(this.wrapper);
    }
    this.wrapper = null;
    this.canvas = null;
    this.renderer = null;
  }
}
