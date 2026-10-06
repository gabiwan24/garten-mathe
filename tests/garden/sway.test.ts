import { describe, expect, it } from 'vitest';
import { isSettled, MAX_BASE_DEG, smooth, stepJoint, stepSpring, tiltToTarget } from '../../src/garden/sway';

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
  it('isSettled needs both position and velocity at rest', () => {
    expect(isSettled({ angle: 5, vel: 0 }, 5)).toBe(true);
    expect(isSettled({ angle: 5.01, vel: 0.01 }, 5)).toBe(true);
    expect(isSettled({ angle: 5.5, vel: 0 }, 5)).toBe(false);
    expect(isSettled({ angle: 5, vel: 0.5 }, 5)).toBe(false);
    expect(isSettled({ angle: 5.1, vel: 0 }, 5, 0.2)).toBe(true);
  });
  it('a spring reaches the settled state within a few seconds', () => {
    let s = { angle: 0, vel: 0 };
    let frames = 0;
    while (!isSettled(s, 5) && frames < 600) {
      s = stepSpring(s, 5, 0.15, 1 / 60);
      frames++;
    }
    expect(frames).toBeLessThan(600);
    let flat = { angle: 0, vel: 0 };
    expect(isSettled(flat, 0)).toBe(true);
    flat = stepSpring(flat, 0, 0.5, 1 / 60);
    expect(isSettled(flat, 0)).toBe(true);
  });
  it('stepJoint: an idle settled joint keeps its spring so slow tilts accumulate', () => {
    const idle = { angle: 2, vel: 0 };
    const r = stepJoint(true, idle, 2.005, 0.5, 1 / 60);
    expect(r).toEqual({ spring: idle, write: false, settled: true });
    const moving = stepJoint(true, idle, 2.5, 0.5, 1 / 60);
    expect(moving.write).toBe(true);
    expect(moving.settled).toBe(false);
    const landing = stepJoint(false, { angle: 2.499, vel: 0.001 }, 2.5, 0.5, 1 / 60);
    expect(landing).toEqual({ spring: { angle: 2.5, vel: 0 }, write: true, settled: true });
  });
  it.each([
    [true, 0.9],
    [false, 0.9],
    [false, 0.15],
  ])('slow tilt (0.05 deg per frame) reaches the screen (root=%s, stiffness=%s)', (root, stiffness) => {
    let gamma = 0;
    let spring = { angle: 0, vel: 0 };
    let idle = true;
    let shown = 0;
    const frame = (input: number) => {
      gamma = smooth(gamma, input, 0.15);
      const r = stepJoint(idle, spring, tiltToTarget(gamma, stiffness, root), stiffness, 1 / 60);
      spring = r.spring;
      idle = r.settled;
      if (r.write) shown = spring.angle;
    };
    for (let i = 1; i <= 600; i++) frame(i * 0.05);
    for (let i = 0; i < 600; i++) frame(30);
    expect(idle).toBe(true);
    expect(shown).toBeCloseTo(tiltToTarget(30, stiffness, root), 1);
    expect(Math.abs(shown)).toBeGreaterThan(1);
  });
});
