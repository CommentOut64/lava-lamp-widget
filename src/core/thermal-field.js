export function sampleTemperature(point, config) {
  // 归一化高度：0（顶部）→ 1（底部）
  const normalizedY = point.y / config.height;

  // 基础连续梯度：底部2.0 → 顶部0.0
  let temp = normalizedY * 2.0;

  // 底部 20%：额外加热（模拟加热灯泡的集中热源）
  if (normalizedY > 0.8) {
    const bottomIntensity = (normalizedY - 0.8) / 0.2; // 0→1
    temp += bottomIntensity * 0.5;
  }

  // 顶部 20%：额外冷却（模拟金属帽散热）
  if (normalizedY < 0.2) {
    const topIntensity = (0.2 - normalizedY) / 0.2; // 0→1
    temp -= topIntensity * 0.3;
  }

  return Math.max(0, temp);
}
