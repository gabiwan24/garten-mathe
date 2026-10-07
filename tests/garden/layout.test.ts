import { describe, expect, it } from 'vitest';
import { colsFor, drawOrder, focusSlot, freeSlots, gardenWidth, isFree, MIN_COLS, pendingSeed, ROWS, slotForIndex, slotGeometry, slotKey } from '../../src/garden/layout';
import type { PlantRecord, Row, Slot } from '../../src/lib/types';

const plant = (id: string, slot: Slot | null): PlantRecord =>
  ({ id, seed: 1, family: 'flower', taskType: 'decompose', stage: 3, pracht: false, date: '2026-10-07', slot });

describe('colsFor', () => {
  it('has a minimum and always leaves at least 12 free slots', () => {
    expect(colsFor(0)).toBe(MIN_COLS);
    for (const n of [0, 1, 9, 10, 21, 22, 40, 100, 333]) {
      expect(colsFor(n) * ROWS - n).toBeGreaterThanOrEqual(12);
    }
    expect(colsFor(21)).toBe(11);
    expect(colsFor(100)).toBe(38);
  });
});

describe('slots', () => {
  it('slotForIndex spreads over rows first and never repeats', () => {
    const keys = Array.from({ length: 60 }, (_, i) => slotKey(slotForIndex(i)));
    expect(new Set(keys).size).toBe(60);
    expect(slotForIndex(0)).toEqual({ row: 0, col: 0 });
    expect(slotForIndex(1)).toEqual({ row: 1, col: 0 });
    expect(slotForIndex(3)).toEqual({ row: 0, col: 1 });
  });
  it('isFree rejects occupied and out-of-range slots', () => {
    const plants = [plant('a', { row: 2, col: 3 })];
    expect(isFree(plants, { row: 2, col: 3 })).toBe(false);
    expect(isFree(plants, { row: 2, col: 4 })).toBe(true);
    expect(isFree(plants, { row: 1, col: colsFor(1) })).toBe(false);
    expect(isFree(plants, { row: 1, col: -1 })).toBe(false);
    expect(isFree(plants, { row: 3 as Row, col: 0 })).toBe(false);
  });
  it('freeSlots counts all slots minus placed plants and is ordered col then row', () => {
    const plants = [plant('a', { row: 0, col: 0 }), plant('b', null)];
    const free = freeSlots(plants);
    expect(free).toHaveLength(colsFor(2) * ROWS - 1);
    expect(free[0]).toEqual({ row: 1, col: 0 });
    expect(free.some((s) => slotKey(s) === '0:0')).toBe(false);
  });
});

describe('pendingSeed / drawOrder', () => {
  it('pendingSeed returns the oldest unplaced plant', () => {
    expect(pendingSeed([])).toBeNull();
    expect(pendingSeed([plant('a', { row: 0, col: 0 })])).toBeNull();
    expect(pendingSeed([plant('a', null), plant('b', null)])?.id).toBe('a');
  });
  it('drawOrder lists placed plants back-to-front, left-to-right within a row', () => {
    const order = drawOrder([plant('f', { row: 2, col: 0 }), plant('b2', { row: 0, col: 2 }), plant('b1', { row: 0, col: 1 }), plant('seed', null), plant('m', { row: 1, col: 5 })]);
    expect(order.map((p) => p.id)).toEqual(['b1', 'b2', 'm', 'f']);
  });
});

describe('geometry', () => {
  it('gets bigger and lower towards the front and moves right with the column', () => {
    const g = (row: Row, col: number) => slotGeometry({ row, col });
    expect(g(0, 0).scale).toBeLessThan(g(1, 0).scale);
    expect(g(1, 0).scale).toBeLessThan(g(2, 0).scale);
    expect(g(0, 0).baseY).toBeLessThan(g(2, 0).baseY);
    expect(g(2, 1).x - g(2, 0).x).toBe(56);
  });
  it('no two slots share the same position and all fit into the garden width', () => {
    const cols = colsFor(0);
    const seen = new Set<string>();
    for (let r = 0 as Row; r <= 2; r = (r + 1) as Row) for (let c = 0; c < cols; c++) {
      const { x, baseY } = slotGeometry({ row: r, col: c });
      seen.add(`${x}:${baseY}`);
      expect(x).toBeLessThanOrEqual(gardenWidth(cols));
    }
    expect(seen.size).toBe(cols * ROWS);
  });
});

describe('focusSlot', () => {
  const at = (n: number, s: Slot) => plant(`p${n}`, s);
  it('opens at column 0 when nothing is planted', () => {
    expect(focusSlot([])).toEqual({ row: 0, col: 0 });
  });
  it('prefers the first free slot at or after the rightmost placed column', () => {
    const plants = [at(1, { row: 0, col: 0 }), at(2, { row: 2, col: 5 })];
    expect(focusSlot(plants)).toEqual({ row: 0, col: 5 });
  });
  it('ignores holes before the last column', () => {
    const plants = [at(1, { row: 0, col: 4 })];
    expect(focusSlot(plants)!.col).toBeGreaterThanOrEqual(4);
  });
  it('never returns an occupied slot when the tail is full', () => {
    const cols = colsFor(40);
    const plants: PlantRecord[] = [];
    // Fill the last columns completely, leave the earlier ones empty.
    for (let c = cols - 4; c < cols; c++) for (let r = 0; r < ROWS; r++) plants.push(at(plants.length, { row: r as Row, col: c }));
    const s = focusSlot(plants)!;
    expect(s).not.toBeNull();
    expect(isFree(plants, s)).toBe(true);
  });
});
