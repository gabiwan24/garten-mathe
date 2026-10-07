import { describe, expect, it } from 'vitest';
import { createMotionReader, createShakeDetector, DEFAULT_SHAKE } from '../../src/sensors/shake';

// A stroke = one rise above the threshold followed by a dip below the re-arm level.
function strokes(d: ReturnType<typeof createShakeDetector>, peak: number, times: number[]): boolean[] {
  return times.flatMap((t) => [d.feed(peak, t), d.feed(0.5, t + 60)]);
}

describe('shake detector', () => {
  it('ignores a single jolt and a double bump', () => {
    const d = createShakeDetector();
    expect(strokes(d, 15, [0, 250]).some(Boolean)).toBe(false);
  });
  it('fires on three strokes within the window', () => {
    const d = createShakeDetector();
    expect(strokes(d, 15, [0, 250, 500]).some(Boolean)).toBe(true);
  });
  it('a gentle shake (peaks of 7 m/s²) is enough', () => {
    const d = createShakeDetector();
    expect(strokes(d, 7, [0, 250, 500]).some(Boolean)).toBe(true);
  });
  it('ordinary handling and walking (peaks below the threshold) never fires', () => {
    const d = createShakeDetector();
    expect(strokes(d, DEFAULT_SHAKE.threshold - 1, [0, 200, 400, 600, 800, 1000, 1200]).some(Boolean)).toBe(false);
  });
  it('does not fire when strokes are far apart', () => {
    const d = createShakeDetector();
    expect(strokes(d, 15, [0, 1500, 3000]).some(Boolean)).toBe(false);
  });
  it('counts a sustained high value only once', () => {
    const d = createShakeDetector();
    expect([d.feed(15, 0), d.feed(15, 50), d.feed(15, 100), d.feed(15, 150)]).toEqual([false, false, false, false]);
  });
  it('resets after firing so one shake triggers once', () => {
    const d = createShakeDetector();
    const fired = strokes(d, 15, [0, 250, 500, 750]).filter(Boolean);
    expect(fired).toHaveLength(1);
  });
});

describe('createMotionReader', () => {
  const none = { x: null, y: null, z: null };
  it('prefers linear acceleration', () => {
    const read = createMotionReader();
    expect(read({ acceleration: { x: 3, y: 4, z: 0 }, accelerationIncludingGravity: null })).toBe(5);
  });
  it('returns null without data', () => {
    const read = createMotionReader();
    expect(read({ acceleration: null, accelerationIncludingGravity: null })).toBeNull();
    expect(read({ acceleration: none, accelerationIncludingGravity: none })).toBeNull();
  });
  it('without linear data it removes gravity: a resting phone reads ~0, a push reads large', () => {
    const read = createMotionReader();
    const g = (x: number) => ({ acceleration: null, accelerationIncludingGravity: { x, y: 0, z: 9.81 } });
    expect(read(g(0))).toBeCloseTo(0);
    for (let i = 0; i < 30; i++) expect(read(g(0))).toBeCloseTo(0, 1);
    expect(read(g(20))).toBeGreaterThan(15);
  });
  it('without linear data a phone tilted to another resting angle settles back to ~0', () => {
    const read = createMotionReader();
    const g = (x: number, z: number) => ({ acceleration: null, accelerationIncludingGravity: { x, y: 0, z } });
    read(g(0, 9.81));
    let last = 0;
    for (let i = 0; i < 200; i++) last = read(g(6.9, 6.9)) ?? 0;
    expect(last).toBeLessThan(1);
  });
});
