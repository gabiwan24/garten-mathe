export interface ShakeOptions { threshold: number; peaks: number; windowMs: number }

// Low threshold on purpose: a gentle shake is enough, the phone must not fly across the room.
export const DEFAULT_SHAKE: ShakeOptions = { threshold: 11, peaks: 2, windowMs: 900 };

export function createShakeDetector(opts: ShakeOptions = DEFAULT_SHAKE) {
  let peaks: number[] = [];
  let above = false;
  return {
    feed(magnitude: number, t: number): boolean {
      if (magnitude >= opts.threshold && !above) {
        above = true;
        peaks.push(t);
      } else if (magnitude < opts.threshold * 0.6) {
        above = false;
      }
      peaks = peaks.filter((p) => t - p <= opts.windowMs);
      if (peaks.length >= opts.peaks) {
        peaks = [];
        return true;
      }
      return false;
    },
  };
}

interface Vec { x: number | null; y: number | null; z: number | null }
export interface MotionLike { acceleration: Vec | null; accelerationIncludingGravity: Vec | null }

export function motionMagnitude(e: MotionLike): number | null {
  const a = e.acceleration;
  if (a && a.x !== null && a.y !== null && a.z !== null) return Math.hypot(a.x, a.y, a.z);
  const g = e.accelerationIncludingGravity;
  if (g && g.x !== null && g.y !== null && g.z !== null) return Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
  return null;
}

export function watchShake(onShake: () => void): () => void {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return () => {};
  const detector = createShakeDetector();
  const handler = (e: DeviceMotionEvent) => {
    const m = motionMagnitude(e);
    if (m !== null && detector.feed(m, e.timeStamp)) onShake();
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
