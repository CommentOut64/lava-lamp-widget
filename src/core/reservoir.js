export function spawnReservoirParticles({ width, height, count }) {
  const particles = [];

  for (let index = 0; index < count; index += 1) {
    const radius = 7 + Math.random() * 5;
    // 初始分布在全高度范围（10%~90%），让画面立即有分散效果
    const yRange = height * 0.8;
    const yBase = height * 0.1;
    particles.push({
      x: radius + Math.random() * (width - radius * 2),
      y: yBase + Math.random() * yRange,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 1,
      radius,
      // 初始温度双峰分布：要么热(1.5~2.0)要么冷(0.2~0.7)，跳过平衡区
      temperature: index % 2 === 0
        ? 1.5 + Math.random() * 0.5
        : 0.2 + Math.random() * 0.5,
      mass: 1,
      buoyancyMultiplier: 0.7 + Math.random() * 0.6,
    });
  }
  return particles;
}

export function mergeReturnedParticles(particles, { height }) {
  const reservoirFloor = height * 0.88;
  return particles.map((particle) => {
    if (particle.temperature > 0.4 || particle.y < height * 0.85) {
      return particle;
    }
    return {
      ...particle,
      y: Math.max(particle.y, reservoirFloor),
      vy: Math.min(particle.vy, 0),
      temperature: Math.max(particle.temperature, 0.5),
    };
  });
}

export function shouldDetachBlob({ averageTemperature, upwardPressure, viscosity }) {
  return averageTemperature > 0.8 && upwardPressure > 0.6;
}
