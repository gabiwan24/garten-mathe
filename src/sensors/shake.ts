export interface ShakeOptions { threshold: number; rearm: number; peaks: number; windowMs: number }

// Tuned for a gentle child's shake: hand shaking gives linear-acceleration peaks of roughly 6-20 m/s²,
// while holding or walking with the phone stays below ~4. Three strokes in one second keep it from firing by accident.
export const DEFAULT_SHAKE: ShakeOptions = { threshold: 6, rearm: 3, peaks: 3, windowMs: 1000 };

export function createShakeDetector(opts: ShakeOptions = DEFAULT_SHAKE) {
  let peaks: number[] = [];
  let above = false;
  return {
    feed(magnitude: number, t: number): boolean {
      if (magnitude >= opts.threshold && !above) {
        above = true;
        peaks.push(t);
      } else if (magnitude < opts.rearm) {
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

const complete = (v: Vec | null): v is { x: number; y: number; z: number } =>
  v !== null && v.x !== null && v.y !== null && v.z !== null;

// Not every phone reports gravity-free `acceleration`. Then we estimate gravity with a slow low-pass
// filter and subtract it, which leaves the movement of the hand.
const GRAVITY_ALPHA = 0.95;

export function createMotionReader() {
  let gravity: { x: number; y: number; z: number } | null = null;
  return (e: MotionLike): number | null => {
    if (complete(e.acceleration)) return Math.hypot(e.acceleration.x, e.acceleration.y, e.acceleration.z);
    const s = e.accelerationIncludingGravity;
    if (!complete(s)) return null;
    if (!gravity) {
      gravity = { x: s.x, y: s.y, z: s.z };
      return 0;
    }
    const lin = Math.hypot(s.x - gravity.x, s.y - gravity.y, s.z - gravity.z);
    gravity = {
      x: GRAVITY_ALPHA * gravity.x + (1 - GRAVITY_ALPHA) * s.x,
      y: GRAVITY_ALPHA * gravity.y + (1 - GRAVITY_ALPHA) * s.y,
      z: GRAVITY_ALPHA * gravity.z + (1 - GRAVITY_ALPHA) * s.z,
    };
    return lin;
  };
}

const NO_DATA_MS = 2500;

/**
 * Calls `onShake` when the phone is shaken. `onNoSensor` fires once if no motion data arrives at all
 * (desktop browser, blocked sensor permission), so the UI can point to the button instead.
 */
export function watchShake(onShake: () => void, onNoSensor?: () => void): () => void {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
    onNoSensor?.();
    return () => {};
  }
  const detector = createShakeDetector();
  const read = createMotionReader();
  let gotData = false;
  const handler = (e: DeviceMotionEvent) => {
    const m = read(e);
    if (m === null) return;
    gotData = true;
    if (detector.feed(m, e.timeStamp)) onShake();
  };
  window.addEventListener('devicemotion', handler);
  const timer = setTimeout(() => {
    if (!gotData) onNoSensor?.();
  }, NO_DATA_MS);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('devicemotion', handler);
  };
}
