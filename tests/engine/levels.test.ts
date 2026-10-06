import { describe, expect, it } from 'vitest';
import { nextLevel, pushHistory } from '../../src/engine/levels';

const hist = (ok: number, total = 10) => Array.from({ length: total }, (_, i) => i < ok);

describe('levels', () => {
  it('keeps only the last 10 entries', () => {
    expect(pushHistory(hist(10), [false, false])).toHaveLength(10);
    expect(pushHistory(hist(10), [false]).at(-1)).toBe(false);
  });
  it('needs a full history before changing', () => {
    expect(nextLevel(1, hist(9, 9))).toEqual({ level: 1, delta: 0 });
  });
  it('goes up at >= 85 % (9 of 10)', () => {
    expect(nextLevel(1, hist(9))).toEqual({ level: 2, delta: 1 });
    expect(nextLevel(1, hist(8))).toEqual({ level: 1, delta: 0 });
  });
  it('goes down below 60 % (5 of 10)', () => {
    expect(nextLevel(3, hist(5))).toEqual({ level: 2, delta: -1 });
    expect(nextLevel(3, hist(6))).toEqual({ level: 3, delta: 0 });
  });
  it('respects bounds 1 and 4', () => {
    expect(nextLevel(4, hist(10))).toEqual({ level: 4, delta: 0 });
    expect(nextLevel(1, hist(0))).toEqual({ level: 1, delta: 0 });
  });
});
