import { describe, expect, it } from 'vitest';
import { addBridgeTen } from '../../src/tasks/addBridgeTen';
import { decompose } from '../../src/tasks/decompose';
import { fillTen } from '../../src/tasks/fillTen';
import { createRng } from '../../src/lib/rng';
import type { Level } from '../../src/lib/types';

const LEVELS: Level[] = [1, 2, 3, 4];
const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

describe('decompose generator', () => {
  it('produces valid decompositions per level', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = decompose.generate(level, createRng(seed), { easier });
      const max = easier ? 5 : level === 1 ? 6 : 10;
      expect(t.total).toBeGreaterThanOrEqual(2);
      expect(t.total).toBeLessThanOrEqual(max);
      expect(t.left + t.right).toBe(t.total);
      expect(t.left).toBeGreaterThanOrEqual(0);
      expect(t.steps).toHaveLength(1);
      expect(t.steps[0].answer).toBe(t.right);
      expect(t.key).toBe(`decompose:${t.total}:${t.left}`);
      expect(t.solutionText).toBe(`${t.total} = ${t.left} + ${t.right}`);
    }
  });
  it('uses the focus item when it fits the level range', () => {
    const t = decompose.generate(2, createRng(1), { easier: false, focus: 'decompose:9:4' });
    expect([t.total, t.left]).toEqual([9, 4]);
    const u = decompose.generate(1, createRng(1), { easier: false, focus: 'decompose:9:4' });
    expect(u.total).toBeLessThanOrEqual(6);
  });
  it('shows digits only at level 4', () => {
    expect(decompose.generate(4, createRng(3), { easier: false }).steps[0].prompt).toMatch(/^\d+ = \d+ \+ \?$/);
  });
});

describe('fillTen generator', () => {
  it('always completes to ten', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = fillTen.generate(level, createRng(seed), { easier });
      expect(t.filled).toBeGreaterThanOrEqual(1);
      expect(t.filled).toBeLessThanOrEqual(9);
      expect(t.filled + t.missing).toBe(10);
      expect(t.steps[0].answer).toBe(t.missing);
      if (easier) expect(t.missing).toBeLessThanOrEqual(3);
    }
  });
  it('uses the focus item', () => {
    expect(fillTen.generate(2, createRng(1), { easier: false, focus: 'fillTen:3' }).filled).toBe(3);
  });
});

describe('addBridgeTen generator', () => {
  it('always crosses ten with a sum of 11..18', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = addBridgeTen.generate(level, createRng(seed), { easier });
      expect(t.a).toBeGreaterThanOrEqual(2);
      expect(t.a).toBeLessThanOrEqual(9);
      expect(t.b).toBeGreaterThanOrEqual(2);
      expect(t.b).toBeLessThanOrEqual(9);
      expect(t.sum).toBe(t.a + t.b);
      expect(t.sum).toBeGreaterThanOrEqual(11);
      expect(t.sum).toBeLessThanOrEqual(18);
      expect(t.toTen + t.a).toBe(10);
      expect(t.toTen + t.rest).toBe(t.b);
      expect(t.steps.at(-1)!.answer).toBe(t.sum);
      expect(t.steps).toHaveLength(level <= 2 ? 3 : 1);
      expect(t.guided).toBe(level <= 2);
      if (level <= 2 && !easier) expect(t.a).toBeGreaterThanOrEqual(7);
    }
  });
  it('guided steps are to-ten, rest, ten-plus-rest', () => {
    const t = addBridgeTen.generate(1, createRng(1), { easier: false, focus: 'addBridgeTen:8+5' });
    expect(t.steps.map((s) => s.answer)).toEqual([2, 3, 13]);
    expect(t.solutionText).toBe('8 + 2 + 3 = 13');
  });
  it('ignores invalid focus items', () => {
    const t = addBridgeTen.generate(3, createRng(1), { easier: false, focus: 'addBridgeTen:3+4' });
    expect(t.sum).toBeGreaterThan(10);
  });
});
