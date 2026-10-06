import { describe, expect, it } from 'vitest';
import { focusItems, pickWeighted, updateItem } from '../../src/engine/leitner';
import { createRng } from '../../src/lib/rng';

const ok = { correctFirstTry: true, usedHelp: false, attempts: 0 };

describe('updateItem', () => {
  it('moves up one box on first try without help, capped at 5', () => {
    expect(updateItem(undefined, ok, 'd').box).toBe(2);
    expect(updateItem({ box: 5, wrong: 0, lastSeen: 'x' }, ok, 'd').box).toBe(5);
  });
  it('drops to box 1 and counts the error on any wrong entry', () => {
    const r = updateItem({ box: 4, wrong: 1, lastSeen: 'x' }, { correctFirstTry: false, usedHelp: false, attempts: 2 }, 'd');
    expect(r).toEqual({ box: 1, wrong: 2, lastSeen: 'd' });
  });
  it('keeps the box when help was used without errors', () => {
    expect(updateItem({ box: 3, wrong: 0, lastSeen: 'x' }, { correctFirstTry: true, usedHelp: true, attempts: 0 }, 'd').box).toBe(3);
  });
});

describe('pickWeighted', () => {
  it('prefers heavier entries', () => {
    const rng = createRng(5);
    let heavy = 0;
    for (let i = 0; i < 2000; i++) if (pickWeighted([{ value: 'a', weight: 9 }, { value: 'b', weight: 1 }], rng) === 'a') heavy++;
    expect(heavy).toBeGreaterThan(1600);
  });
  it('throws on empty input', () => {
    expect(() => pickWeighted([], createRng(1))).toThrow();
  });
});

describe('focusItems', () => {
  it('returns only this type with box <= 3', () => {
    const items = {
      'fillTen:3': { box: 1 as const, wrong: 1, lastSeen: 'd' },
      'fillTen:4': { box: 4 as const, wrong: 0, lastSeen: 'd' },
      'decompose:7:3': { box: 1 as const, wrong: 1, lastSeen: 'd' },
    };
    expect(focusItems(items, 'fillTen')).toEqual([{ key: 'fillTen:3', box: 1 }]);
  });
});
