import { describe, expect, it } from 'vitest';
import { finishRound, plantOutcome, water } from '../../src/engine/round';
import { defaultState } from '../../src/store/schema';
import type { PlantRecord, TaskResult } from '../../src/lib/types';

function results(firstTry: number, opts: { helpOnFirst?: boolean } = {}): TaskResult[] {
  return Array.from({ length: 10 }, (_, i) => ({
    itemKey: `fillTen:${(i % 9) + 1}` as const,
    correctFirstTry: i < firstTry,
    usedHelp: opts.helpOnFirst === true && i === 0,
    attempts: i < firstTry ? 0 : 1,
    ms: 2000,
  }));
}
const plant = (over: Partial<PlantRecord> = {}): PlantRecord =>
  ({ id: 'p1', seed: 1, family: 'fruit', taskType: 'fillTen', stage: 3, pracht: false, date: '2026-10-01', slot: null, ...over });

describe('plantOutcome', () => {
  it('maps the first-try share to stages', () => {
    expect(plantOutcome(4, 10)).toEqual({ stage: 2, pracht: false });
    expect(plantOutcome(5, 10)).toEqual({ stage: 3, pracht: false });
    expect(plantOutcome(7, 10)).toEqual({ stage: 3, pracht: false });
    expect(plantOutcome(8, 10)).toEqual({ stage: 4, pracht: false });
    expect(plantOutcome(9, 10)).toEqual({ stage: 4, pracht: false });
    expect(plantOutcome(10, 10)).toEqual({ stage: 5, pracht: true });
  });
});

describe('water', () => {
  it('grows by one stage up to 5 and never makes a Prachtpflanze', () => {
    expect(water(plant({ stage: 2 })).stage).toBe(3);
    expect(water(plant({ stage: 5 })).stage).toBe(5);
    expect(water(plant({ stage: 4 })).pracht).toBe(false);
    const p = plant({ stage: 5, pracht: true });
    expect(water(p)).toBe(p);
  });
});

describe('finishRound', () => {
  const round = (rs: TaskResult[], wateringPlantId: string | null = null) =>
    ({ taskType: 'fillTen' as const, seed: 77, wateringPlantId, results: rs });

  it('plants a Prachtpflanze only at 10/10 without help', () => {
    expect(finishRound(defaultState(), round(results(10)), '2026-10-06', 'x').plant).toMatchObject({ stage: 5, pracht: true, family: 'fruit', seed: 77 });
    expect(finishRound(defaultState(), round(results(10, { helpOnFirst: true })), '2026-10-06', 'x').plant.pracht).toBe(false);
  });
  it('appends plant and round record and remembers the type', () => {
    const o = finishRound(defaultState(), round(results(6)), '2026-10-06', 'x');
    expect(o.state.plants).toHaveLength(1);
    expect(o.state.rounds[0]).toEqual({ date: '2026-10-06', taskType: 'fillTen', firstTry: 6, total: 10, ms: 20000 });
    expect(o.state.lastTaskType).toBe('fillTen');
    expect(o.score).toEqual({ firstTry: 6, total: 10 });
  });
  it('updates leitner items', () => {
    const o = finishRound(defaultState(), round(results(0)), '2026-10-06', 'x');
    expect(o.state.items['fillTen:1']).toMatchObject({ box: 1, wrong: 2 }); // fillTen:1 occurs twice in results() (i=0 and i=9)
  });
  it('levels up after a strong full history and resets that history', () => {
    const o = finishRound(defaultState(), round(results(9)), '2026-10-06', 'x');
    expect(o.levelDelta).toBe(1);
    expect(o.state.levels.fillTen).toBe(2);
    expect(o.state.history.fillTen).toEqual([]);
  });
  it('a watering round only grows the watered plant, no new plant', () => {
    const s = defaultState();
    s.plants.push(plant({ id: 'old', stage: 2 }));
    const o = finishRound(s, round(results(3), 'old'), '2026-10-06', 'new');
    expect(o.state.plants).toHaveLength(1);
    expect(o.state.plants[0]).toMatchObject({ id: 'old', stage: 3 });
    expect(o.watered).toBe(true);
    expect(o.plant).toMatchObject({ id: 'old', stage: 3 });
    expect(o.state.rounds).toHaveLength(1);
  });
  it('a new plant starts as an unplanted seed', () => {
    expect(finishRound(defaultState(), round(results(6)), '2026-10-06', 'x').plant.slot).toBeNull();
  });
  it('a watering round keeps the watered plant slot', () => {
    const s = defaultState();
    s.plants.push(plant({ id: 'old', stage: 2, slot: { row: 1, col: 4 } }));
    const o = finishRound(s, round(results(3), 'old'), '2026-10-06', 'new');
    expect(o.state.plants[0].slot).toEqual({ row: 1, col: 4 });
    expect(o.plant.slot).toEqual({ row: 1, col: 4 });
  });
  it('a perfect watering round still never makes a Prachtpflanze', () => {
    const s = defaultState();
    s.plants.push(plant({ id: 'old', stage: 4 }));
    const o = finishRound(s, round(results(10), 'old'), '2026-10-06', 'new');
    expect(o.plant).toMatchObject({ id: 'old', stage: 5, pracht: false });
  });
  it('plants normally when the watered plant no longer exists', () => {
    const o = finishRound(defaultState(), round(results(6), 'gone'), '2026-10-06', 'new');
    expect(o.watered).toBe(false);
    expect(o.state.plants).toHaveLength(1);
    expect(o.plant.id).toBe('new');
  });
  it('does not mutate the input state', () => {
    const s = defaultState();
    finishRound(s, round(results(10)), '2026-10-06', 'x');
    expect(s.plants).toHaveLength(0);
  });
});
