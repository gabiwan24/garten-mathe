import { describe, expect, it } from 'vitest';
import { slotForIndex, slotKey } from '../../src/garden/layout';
import type { PlantRecord } from '../../src/lib/types';
import { defaultState, migrate, SCHEMA_VERSION } from '../../src/store/schema';
import { exportState, importState } from '../../src/store/storage';

const oldPlant = (i: number) => ({ id: `p${i}`, seed: i, family: 'flower', taskType: 'decompose', stage: 3, pracht: false, date: '2026-10-01' });

describe('schema', () => {
  it('default state starts all levels at 1 and has no PIN', () => {
    const s = defaultState();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.levels).toEqual({ decompose: 1, fillTen: 1, addBridgeTen: 1 });
    expect(s.settings).toEqual({ roundsPerDay: 3, vibration: true, tilt: true, pin: null });
    expect(s.plants).toEqual([]);
  });
  it('migrate fills missing keys with defaults', () => {
    const s = migrate({ schemaVersion: 1, settings: { pin: '1234' }, plants: [] });
    expect(s.settings).toEqual({ roundsPerDay: 3, vibration: true, tilt: true, pin: '1234' });
    expect(s.history.fillTen).toEqual([]);
  });
  it('migrate rejects non-objects, newer versions and unknown old versions', () => {
    expect(() => migrate(null)).toThrow();
    expect(() => migrate({ plants: [] })).toThrow();
    expect(() => migrate({ schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/newer/);
    expect(() => migrate({ schemaVersion: 0 })).toThrow(/No migration/);
  });
  it('default state is schema version 2', () => {
    expect(defaultState().schemaVersion).toBe(2);
  });
  it('migrating version 1 gives every plant a unique slot in index order', () => {
    const s = migrate({ schemaVersion: 1, plants: Array.from({ length: 5 }, (_, i) => oldPlant(i)) });
    expect(s.schemaVersion).toBe(2);
    expect(s.plants.map((p) => p.slot)).toEqual(Array.from({ length: 5 }, (_, i) => slotForIndex(i)));
    expect(new Set(s.plants.map((p) => slotKey(p.slot!))).size).toBe(5);
  });
  it('version 2 keeps slots and a plant without slot becomes an unplanted seed', () => {
    const s = migrate({ schemaVersion: 2, plants: [{ ...oldPlant(0), slot: { row: 2, col: 4 } }, oldPlant(1)] });
    expect(s.plants[0].slot).toEqual({ row: 2, col: 4 });
    expect(s.plants[1].slot).toBeNull();
  });
  it('a version 1 export file still imports', () => {
    const r = importState(JSON.stringify({ app: 'garten-mathe', schemaVersion: 1, plants: [oldPlant(0)] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.plants[0].slot).toEqual({ row: 0, col: 0 });
  });
  it('a current export round-trips with its slots', () => {
    const s = defaultState();
    s.plants = [{ ...oldPlant(0), slot: { row: 1, col: 2 } } as PlantRecord];
    const r = importState(exportState(s));
    expect(r.ok && r.state.plants[0].slot).toEqual({ row: 1, col: 2 });
  });
});
