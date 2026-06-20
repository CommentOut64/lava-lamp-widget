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

  // 1. 主环流（Toroidal Cell）：中心上升，两侧下沉。
  // 基于流函数 ψ = -C * sin(px) * sin(py) 严格推导，保证不可压缩 (div(v) = 0)
  const S = 0.012;
  const vyConv = S * Math.cos(px) * Math.sin(py);
  const vxConv = -S * aspectRatio * Math.sin(px) * Math.cos(py);

  // 2. 物理级次级湍流（Eddy Currents / Curl Noise）
  // 真实流体中热柱上升会产生卡门涡街或次级旋涡。我们通过叠加第二个高频流函数来模拟：
  // ψ_eddy = E * sin(2*px + t1) * sin(3*py + t2)
  // 这保证了加入的随机湍流依然 100% 遵守流体力学的质量守恒（不可压缩），不会导致粒子非物理地扎堆。
  const t1 = time * 0.0008;
  const t2 = time * 0.0005;
  const eddyA = 0.004; // 涡流强度
  
  // 对 ψ_eddy 求偏导得到速度场
  const eddyVx = eddyA * Math.sin(2 * px + t1) * Math.cos(3 * py + t2);
  const eddyVy = -eddyA * (4 * height / (3 * width)) * Math.cos(2 * px + t1) * Math.sin(3 * py + t2);

  return {
    fx: vxConv + eddyVx,
    fy: vyConv + eddyVy
  };
}

const STATE_POOL_BOTTOM = 'POOL_BOTTOM';
const STATE_RISING = 'RISING';
const STATE_POOL_TOP = 'POOL_TOP';
const STATE_SINKING = 'SINKING';

export function stepParticles(particles, config) {
  const hash = new SpatialHash(40);
  for (const p of particles) {
    hash.insert(p);
  }

  const nextParticles = particles.map((particle) => {
    let forceX = 0;
    let forceY = 0;

    let state = particle.state || STATE_POOL_BOTTOM;
    let timer = (particle.timer || 0) + config.dt * 60;
    let newTemp = particle.temperature;

    // 粒子间碰撞、表面张力与内摩擦（物理级流体融合模拟）
    const neighbors = hash.query(particle, particle.radius * 3.0);
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

      const restingDist = rSum * 0.6;   // 核心排斥距离（允许大幅重叠以形成单一巨大色块）
      const influenceDist = rSum * 1.5; // 表面张力的最大作用半径

      if (dist < influenceDist) {
        // 全局生效的表面张力和内摩擦（不再受状态限制）
        // 这意味着：即使一个是“顶部聚集”，一个是“开始下沉”，它们依然会有粘滞的吸引力。
        // 下沉的力必须缓慢撕裂这层吸引力（当距离 > influenceDist 时自然断裂），
        // 这将完美还原出熔岩灯“拉丝、拉长成水滴状、然后柔和断裂”的真实物理效果，告别硬分离！
        if (dist < restingDist) {
          // 距离过近时的核心排斥力，防止坍缩成奇点
          const overlap = restingDist - dist;
          forceX += nx * overlap * 0.05;
          forceY += ny * overlap * 0.05;
        } else {
          // 处于最佳接触距离内：产生表面张力（互相吸引），把它们拉在一起
          // 如果粒子状态不同（例如一个正在上升，一个死守底部），我们需要大幅削弱表面张力，防止它们互相死锁卡成一坨
          const pullStrength = (particle.state !== n.state) ? 0.0005 : 0.005;
          const pull = Math.sin(((dist - restingDist) / (influenceDist - restingDist)) * Math.PI) * pullStrength;
          forceX -= nx * pull;
          forceY -= ny * pull;
        }
        
        // 流体内摩擦（速度匹配粘滞阻尼）：让接触的液体互相拖拽（拉丝）
        const dvx = particle.vx - (n.vx || 0);
        const dvy = particle.vy - (n.vy || 0);
        forceX -= dvx * 0.02;
        forceY -= dvy * 0.02;
      }
    }

    // 对流场推力
    const conv = getConvectionForce(
      particle.x, particle.y,
      config.width, config.height,
      config.time || 0
    );
    
    // 状态机逻辑
    const centerX = config.width / 2;
    if (state === STATE_POOL_BOTTOM) {
      // 在底部蜡池中，大块作为“母体”永远停留在底部，小块作为“表层”被挤压在上面
      if (particle.radius >= 16) {
        forceY += 0.1; // 大块死死沉在底下
      } else {
        forceY += 0.01; // 小块较轻，受大块排斥会自然浮在表层
      }

      // 恢复中等加热速度
      if (config.heat !== undefined) {
        const fieldTemp = sampleTemperature({ x: particle.x, y: config.height }, config);
        newTemp += (fieldTemp - newTemp) * 0.025;
      }
      
      // 没有任何“限制一次脱离数量”的代码。所有小块（radius < 16）只要温度够了都会脱离。
      // 调高概率（5%）和降低酝酿时间（60帧），允许它们成群结队、多个接连脱离
      if (particle.radius < 16 && newTemp > 2.2 && timer > 60 && Math.random() < 0.05) {
        state = STATE_RISING;
        timer = 0;
        // 增加初始的向上冲量，用来对抗强烈的全局表面张力，
        // 这样它就会更加积极地上浮，同时在被底盘拉扯时产生漂亮的拉丝撕裂效果。
        forceY -= 1.0;
      }
    } else if (state === STATE_RISING) {
      // 恢复原版的对流强度，不再放大
      forceX += conv.fx;
      forceY += conv.fy;
      
      // 施加向中心的吸引力，模拟热柱
      forceX += (centerX - particle.x) * 0.001;
      
      // 热传递（极低传热，保持热惯性）
      // 使用极小的值（0.0001），确保蜡块在半空中不会过快流失热量导致浮力消失而停滞
      if (config.heat !== undefined) {
        const fieldTemp = sampleTemperature({ x: particle.x, y: particle.y }, config);
        newTemp += (fieldTemp - newTemp) * 0.0001;
      }

      // 碰到顶部附近，转为顶部蜡池
      if (particle.y < config.height * 0.15 && particle.vy < 0) {
        state = STATE_POOL_TOP;
        timer = 0;
      } else if (particle.y > config.height * 0.8 && particle.vy > 0) {
        // 容错：如果中途因为碰撞或其他原因掉回了底部，重置为底部蜡池
        state = STATE_POOL_BOTTOM;
        timer = 0;
      }
    } else if (state === STATE_POOL_TOP) {
      // 在顶部缓慢冷却，目标温度接近 0
      newTemp += (0.0 - newTemp) * 0.01;
      forceY -= 0.05; // 强力向上托，形成顶部蜡池
      
      // 冷却后下沉
      if (newTemp < 0.4 && timer > 60 && Math.random() < 0.05) {
        state = STATE_SINKING;
        timer = 0;
        // 增加向下的初始冲量以对抗表面张力，让水滴能更痛快地拉丝脱落
        forceY += 0.5;
      }
    } else if (state === STATE_SINKING) {
      // 恢复原版的对流强度
      forceX += conv.fx;
      forceY += conv.fy;
      
      // 强烈施加向边缘的排斥力
      const edgeDir = particle.x < centerX ? -1 : 1;
      forceX += edgeDir * 0.005;

      // 热传递（极低传热，保持热惯性）
      if (config.heat !== undefined) {
        const fieldTemp = sampleTemperature({ x: particle.x, y: particle.y }, config);
        newTemp += (fieldTemp - newTemp) * 0.0001;
      }

      // 碰到底部附近，转为底部蜡池
      if (particle.y > config.height * 0.85 && particle.vy > 0) {
        state = STATE_POOL_BOTTOM;
        timer = 0;
      } else if (particle.y < config.height * 0.2 && particle.vy < 0) {
        // 容错：如果中途被推回了顶部，重置为顶部状态
        state = STATE_POOL_TOP;
        timer = 0;
      }
    }

    const sizeSpeedModifier = 12.0 / Math.max(particle.radius, 4.0);

    // 浮力计算：只有 RISING 和 SINKING 状态才严格按温度计算，POOL 状态由上面强力场控制
    let heatLift = 0;
    let gravityForce = 0;
    if (state === STATE_RISING || state === STATE_SINKING) {
      heatLift = -(newTemp - 1.0) * config.buoyancy * (particle.buoyancyMultiplier || 1.0) * sizeSpeedModifier;
      gravityForce = config.gravity * sizeSpeedModifier;
    }
    
    const impulseX = config.inertialImpulse?.x ?? 0;
    const impulseY = config.inertialImpulse?.y ?? 0;
    
    // 施加微小的布朗运动扰动，打破可能存在的绝对受力平衡死锁
    const noiseX = (Math.random() - 0.5) * 0.005;
    const noiseY = (Math.random() - 0.5) * 0.005;

    // 在 POOL 状态下增加阻力，防止它们来回滑动
    const dragBase = (state === STATE_POOL_BOTTOM || state === STATE_POOL_TOP) ? 0.85 : (1.0 - config.viscosity * 0.04);
    const nextVx = (particle.vx + forceX + impulseX + noiseX) * dragBase;
    const nextVy = (particle.vy + gravityForce + heatLift + forceY + impulseY + noiseY) * dragBase;
    
    let nextX = particle.x + nextVx * config.dt * 60;
    let nextY = particle.y + nextVy * config.dt * 60;
    
    const minY = particle.radius;
    const maxY = config.height - particle.radius;
    
    // 梯形边界计算
    const ratio = 0.85 * (nextY / config.height) + 0.15;
    const insetPercentage = 0.2 * (1 - ratio);
    const leftEdge = config.width * insetPercentage;
    const rightEdge = config.width * (1 - insetPercentage);
    
    const minX = leftEdge + particle.radius;
    const maxX = rightEdge - particle.radius;
    
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
    
    return { ...particle, x: nextX, y: nextY, vx: resolvedVx, vy: resolvedVy, temperature: newTemp, state, timer };
  });

  return config.enableReservoirMerge ? mergeReturnedParticles(nextParticles, config) : nextParticles;
}
