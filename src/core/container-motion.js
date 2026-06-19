export function deriveInertialImpulse(motion, physics) {
  return {
    x: -motion.ax * physics.dragImpulse * 0.0015,
    y: -motion.ay * physics.dragImpulse * 0.0015,
  };
}
