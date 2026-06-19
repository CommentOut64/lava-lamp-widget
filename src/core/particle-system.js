import { mergeReturnedParticles } from './reservoir.js';
import { sampleTemperature } from './thermal-field.js';
import { SpatialHash } from './spatial-hash.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 液体对流场——模拟加热液体的环形对流。
 * 中心上升、两侧下沉的 toroidal 流型，满足不可压缩条件 div(v)=0。
 * 带有缓慢时变分量避免静态平衡。
 */
function getConvectionForce(x, y, width, height, time) {
  const px = 2 * Math.PI * x / width;
  const py = Math.PI * y / height;
  const aspectRatio = width / (2 * height);

  // 主环流（单对环流胞）：中心上升，两侧下沉
  // 强度需达到浮力的 ~1/3 才能推动粒子穿越平衡区
  const S = 0.012;
  const vyConv = S * Math.cos(px) * Math.sin(py);
  const vxConv = -S * aspectRatio * Math.sin(px) * Math.cos(py);

  // 缓慢时变：打破稳态
  const drift = Math.sin(time * 0.0003) * 0.005;
  const sway = Math.cos(time * 0.0002) * 0.003;

  return {
    fx: vxConv + drift,
    fy: vyConv + sway
  };
}

export function stepParticles(particles, config) {
  const hash = new SpatialHash(40);
  for (const p of particles) {
    hash.insert(p);
  }

  const nextParticles = particles.map((particle) => {
    let forceX = 0;
    let forceY = 0;

    // 粒子间碰撞排斥（视觉融合由 shader smooth union 实现）
    const neighbors = hash.query(particle, particle.radius * 2.5);
    for (const n of neighbors) {
      if (n === particle) continue;
      const dx = particle.x - n.x;
      const dy = particle.y - n.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= 0) continue;

      const dist = Math.sqrt(distSq);
      const rSum = particle.radius + n.radius;
      const nx = dx / dist;
      const ny = dy / dist;

      if (dist < rSum) {
        const overlap = rSum - dist;
        forceX += nx * overlap * 0.5;
        forceY += ny * overlap * 0.5;
      }
    }

    // 对流场推力——液体环流带动蜡团运动
    const conv = getConvectionForce(
      particle.x, particle.y,
      config.width, config.height,
      config.time || 0
    );
    forceX += conv.fx;
    forceY += conv.fy;

    // 双轴随机扰动
    forceX += (Math.random() - 0.5) * 0.15;
    forceY += (Math.random() - 0.5) * 0.08;

    // 热传递——中间区极低传热保持热惯性，边缘快速传热驱动循环
    let newTemp = particle.temperature;
    if (config.heat !== undefined) {
      const fieldTemp = sampleTemperature({ x: particle.x, y: particle.y }, config);
      const normalizedY = particle.y / config.height;

      const edgeFactor = Math.max(
        Math.max(0, (normalizedY - 0.75)) / 0.25,
        Math.max(0, (0.25 - normalizedY)) / 0.25
      );
      // 中间 0.001（近乎绝热），边缘最高 0.05
      const transferRate = 0.001 + edgeFactor * 0.049;
      newTemp += (fieldTemp - newTemp) * transferRate;
    }

    // 浮力 = 温度偏差 × 浮力系数
    const heatLift = -(newTemp - 1.0) * config.buoyancy * (particle.buoyancyMultiplier || 1.0);
    const gravityForce = config.gravity;
    
    const impulseX = config.inertialImpulse?.x ?? 0;
    const impulseY = config.inertialImpulse?.y ?? 0;
    
    // drag ≈ 0.98，允许粒子累积速度完成全程
    const drag = 1.0 - (config.viscosity * 0.04);
    const nextVx = (particle.vx + forceX + impulseX) * drag;
    const nextVy = (particle.vy + gravityForce + heatLift + forceY + impulseY) * drag;
    
    let nextX = particle.x + nextVx * config.dt * 60;
    let nextY = particle.y + nextVy * config.dt * 60;
    
    const minX = particle.radius;
    const maxX = config.width - particle.radius;
    const minY = particle.radius;
    const maxY = config.height - particle.radius;
    
    let resolvedVx = nextVx;
    let resolvedVy = nextVy;
    
    if (nextX < minX || nextX > maxX) {
      nextX = clamp(nextX, minX, maxX);
      resolvedVx = -resolvedVx * config.wallBounce;
    }
    if (nextY < minY || nextY > maxY) {
      nextY = clamp(nextY, minY, maxY);
      resolvedVy = -resolvedVy * config.wallBounce;
    }
    
    return { ...particle, x: nextX, y: nextY, vx: resolvedVx, vy: resolvedVy, temperature: newTemp };
  });

  return config.enableReservoirMerge ? mergeReturnedParticles(nextParticles, config) : nextParticles;
}
