export function spawnReservoirParticles({ width, height, count }) {
  const particles = [];

  for (let index = 0; index < count; index += 1) {
    // 增加体积差异，大的作为稳固的底盘，小的作为游离的蜡滴
    const radius = 8 + Math.random() * 14; 
    
    // 初始生成时稍微错开高度（底部 80 像素内随机），
    // 这样它们会自然堆叠，只有最底层的几块会达到高温上浮，避免一开始全军出击导致底部空空如也。
    particles.push({
      id: index,
      x: width / 2 + (Math.random() - 0.5) * width * 0.8,
      y: height - radius - Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0,
      radius,
      // 初始温度较低
      temperature: 0.1 + Math.random() * 0.4,
      mass: 1,
      buoyancyMultiplier: 0.7 + Math.random() * 0.6,
      // 新增状态机
      state: 'POOL_BOTTOM',
      // 给每个粒子一个随机的初始冷却/加热倒计时，防止它们同时动作
      timer: Math.random() * 100,
    });
  }
  return particles;
}

export function mergeReturnedParticles(particles, config) {
  // 我们不再在这里强制重置粒子的 y 和 vy。
  // pooling 的逻辑已经完全移交给了 particle-system.js 内部的状态机处理。
  // 保留此函数的目的是为了向后兼容不报错。
  return particles;
}

export function shouldDetachBlob({ averageTemperature, upwardPressure, viscosity }) {
  return averageTemperature > 0.8 && upwardPressure > 0.6;
}
