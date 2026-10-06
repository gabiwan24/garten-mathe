import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/lib/rng';

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42), b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });
  it('differs between seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('int stays within inclusive bounds and hits both ends', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = r.int(2, 6);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([2, 3, 4, 5, 6]);
  });
  it('pick throws on empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
  it('chance(0) is never true, chance(1) always', () => {
    const r = createRng(3);
    for (let i = 0; i < 100; i++) { expect(r.chance(0)).toBe(false); expect(r.chance(1)).toBe(true); }
  });
});
