export interface Spring { angle: number; vel: number }

export const MAX_BASE_DEG = 8;

export function tiltToTarget(gammaDeg: number, stiffness: number, isRoot: boolean): number {
  const g = Math.max(-45, Math.min(45, gammaDeg)) / 45;
  // Upper parts add a little bend of their own on top of the parent's rotation.
  const max = isRoot ? MAX_BASE_DEG : 1.5 + 3 * (1 - stiffness);
  return g * max;
}

export function stepSpring(s: Spring, target: number, stiffness: number, dt: number): Spring {
  const h = Math.min(dt, 0.05);
  // Softer parts get a weaker spring, so they react later and swing longer: the visible "lag upwards".
  const k = 20 + 60 * stiffness;
  const c = 2 * Math.sqrt(k) * 0.35;
  const vel = s.vel + (k * (target - s.angle) - c * s.vel) * h;
  return { angle: s.angle + vel * h, vel };
}

export function smooth(prev: number, next: number, alpha: number): number {
  return prev + (next - prev) * alpha;
}

/** True when the spring is at rest on its target, so no further frames are needed. */
export function isSettled(s: Spring, target: number, eps = 0.02): boolean {
  return Math.abs(s.angle - target) < eps && Math.abs(s.vel) < eps;
}
