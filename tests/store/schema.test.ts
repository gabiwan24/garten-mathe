import { describe, expect, it } from 'vitest';
import { defaultState, migrate, SCHEMA_VERSION } from '../../src/store/schema';

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
});
