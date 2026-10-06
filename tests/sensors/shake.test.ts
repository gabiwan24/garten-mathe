import { describe, expect, it } from 'vitest';
import { createShakeDetector, motionMagnitude } from '../../src/sensors/shake';

describe('shake detector', () => {
  it('ignores a single jolt', () => {
    const d = createShakeDetector();
    expect(d.feed(15, 0)).toBe(false);
    expect(d.feed(1, 50)).toBe(false);
  });
  it('fires on two peaks within the window', () => {
    const d = createShakeDetector();
    d.feed(15, 0);
    d.feed(1, 100);
    expect(d.feed(15, 300)).toBe(true);
  });
  it('does not fire when peaks are far apart', () => {
    const d = createShakeDetector();
    d.feed(15, 0);
    d.feed(1, 100);
    expect(d.feed(15, 2000)).toBe(false);
  });
  it('counts a sustained high value only once', () => {
    const d = createShakeDetector();
    expect([d.feed(15, 0), d.feed(15, 50), d.feed(15, 100)]).toEqual([false, false, false]);
  });
});

describe('motionMagnitude', () => {
  it('prefers linear acceleration', () => {
    expect(motionMagnitude({ acceleration: { x: 3, y: 4, z: 0 }, accelerationIncludingGravity: null })).toBe(5);
  });
  it('falls back to gravity-included values minus g', () => {
    const m = motionMagnitude({ acceleration: null, accelerationIncludingGravity: { x: 0, y: 0, z: 9.81 } });
    expect(m).toBeCloseTo(0);
  });
  it('returns null without data', () => {
    expect(motionMagnitude({ acceleration: null, accelerationIncludingGravity: null })).toBeNull();
  });
});
