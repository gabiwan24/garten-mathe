import { describe, expect, it } from 'vitest';
import { plantSeed } from '../../src/engine/planting';
import { defaultState } from '../../src/store/schema';
import type { PlantRecord, Slot } from '../../src/lib/types';

const plant = (id: string, slot: Slot | null): PlantRecord =>
  ({ id, seed: 1, family: 'fruit', taskType: 'fillTen', stage: 4, pracht: false, date: '2026-10-07', slot });

describe('plantSeed', () => {
  it('places an unplanted seed on a free slot without mutating the input', () => {
    const s = defaultState();
    s.plants = [plant('a', null)];
    const next = plantSeed(s, 'a', { row: 2, col: 3 });
    expect(next.plants[0].slot).toEqual({ row: 2, col: 3 });
    expect(s.plants[0].slot).toBeNull();
  });
  it('returns the same state for unknown ids, already planted plants, occupied or out-of-range slots', () => {
    const s = defaultState();
    s.plants = [plant('a', null), plant('b', { row: 0, col: 0 })];
    expect(plantSeed(s, 'zzz', { row: 1, col: 1 })).toBe(s);
    expect(plantSeed(s, 'b', { row: 1, col: 1 })).toBe(s);
    expect(plantSeed(s, 'a', { row: 0, col: 0 })).toBe(s);
    expect(plantSeed(s, 'a', { row: 1, col: 999 })).toBe(s);
  });
});
