import { describe, expect, it } from 'vitest';
import { MAX_BASE_DEG, smooth, stepSpring, tiltToTarget } from '../../src/garden/sway';

describe('sway', () => {
  it('clamps the root target to ±8°', () => {
    expect(tiltToTarget(90, 0.9, true)).toBe(MAX_BASE_DEG);
    expect(tiltToTarget(-90, 0.9, true)).toBe(-MAX_BASE_DEG);
    expect(tiltToTarget(0, 0.9, true)).toBe(0);
  });
  it('lets soft parts bend more than stiff ones', () => {
    expect(Math.abs(tiltToTarget(45, 0.2, false))).toBeGreaterThan(Math.abs(tiltToTarget(45, 0.9, false)));
  });
  it('settles on the target with a gentle overshoot', () => {
    let s = { angle: 0, vel: 0 };
    let peak = 0;
    for (let i = 0; i < 180; i++) {
      s = stepSpring(s, 5, 0.5, 1 / 60);
      peak = Math.max(peak, s.angle);
    }
    expect(s.angle).toBeCloseTo(5, 1);
    expect(peak).toBeGreaterThan(5);
    expect(peak).toBeLessThan(7.5);
  });
  it('stays stable for long frames (tab was in background)', () => {
    let s = { angle: 0, vel: 0 };
    for (let i = 0; i < 20; i++) s = stepSpring(s, 8, 0.15, 1);
    expect(Number.isFinite(s.angle)).toBe(true);
    expect(Math.abs(s.angle)).toBeLessThan(20);
  });
  it('smooth moves part of the way', () => {
    expect(smooth(0, 10, 0.2)).toBeCloseTo(2);
  });
});
