export class DragController {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    // Physics tracking for inertia
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.lastTime = 0;
    this.lastVx = 0;
    this.lastVy = 0;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.trackMotion = this.trackMotion.bind(this);
  }

  attach() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  detach() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
  }

  onPointerDown(event) {
    this.isDragging = true;
    this.startX = event.clientX - this.currentX;
    this.startY = event.clientY - this.currentY;
    this.element.setPointerCapture?.(event.pointerId);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerup', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerUp);
    this.element.setAttribute?.('data-dragged', 'true');
    
    this.lastTime = performance.now();
    this._lastX = this.currentX;
    this._lastY = this.currentY;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.lastVx = 0;
    this.lastVy = 0;

    const trackLoop = () => {
      if (!this.isDragging) return;
      this.trackMotion();
      requestAnimationFrame(trackLoop);
    };
    requestAnimationFrame(trackLoop);
  }

  onPointerMove(event) {
    if (!this.isDragging) return;
    this.currentX = event.clientX - this.startX;
    this.currentY = event.clientY - this.startY;
    this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
  }

  onPointerUp(event) {
    this.isDragging = false;
    this.element.releasePointerCapture?.(event.pointerId);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
    this.element.removeAttribute?.('data-dragged');
    // Instantly reset acceleration so it doesn't get stuck
    this.ax = 0;
    this.ay = 0;
    this.options.onMotionChange?.({ x: this.currentX, y: this.currentY, vx: this.vx, vy: this.vy, ax: this.ax, ay: this.ay });
  }

  trackMotion() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000 || 0.016;
    this.lastTime = now;

    const deltaX = this.currentX - this._lastX;
    const deltaY = this.currentY - this._lastY;
    this._lastX = this.currentX;
    this._lastY = this.currentY;

    const rawVx = deltaX / dt;
    const rawVy = deltaY / dt;
    
    // Low-pass filter to smooth velocity
    this.vx += (rawVx - this.vx) * 0.3;
    this.vy += (rawVy - this.vy) * 0.3;

    const rawAx = (this.vx - this.lastVx) / dt;
    const rawAy = (this.vy - this.lastVy) / dt;

    // Low-pass filter to smooth acceleration and prevent violent splashing
    this.ax += (rawAx - this.ax) * 0.2;
    this.ay += (rawAy - this.ay) * 0.2;

    // Clamp acceleration
    const clamp = (val, max) => Math.max(-max, Math.min(max, val));
    this.ax = clamp(this.ax, 1500);
    this.ay = clamp(this.ay, 1500);

    this.lastVx = this.vx;
    this.lastVy = this.vy;

    this.options.onMotionChange?.({ x: this.currentX, y: this.currentY, vx: this.vx, vy: this.vy, ax: this.ax, ay: this.ay });
  }
}
