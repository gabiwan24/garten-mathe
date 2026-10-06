import { describe, expect, it } from 'vitest';
import { resetLevel, withSettings } from '../../src/parents/settings';
import { defaultState } from '../../src/store/schema';

describe('parent settings', () => {
  it('patches settings without touching the rest', () => {
    const s = withSettings(defaultState(), { roundsPerDay: 5 });
    expect(s.settings.roundsPerDay).toBe(5);
    expect(s.settings.vibration).toBe(true);
  });
  it('resets one level and its history', () => {
    const s = defaultState();
    s.levels.fillTen = 3;
    s.history.fillTen = [true, false];
    s.levels.decompose = 2;
    const r = resetLevel(s, 'fillTen');
    expect(r.levels).toEqual({ decompose: 2, fillTen: 1, addBridgeTen: 1 });
    expect(r.history.fillTen).toEqual([]);
  });
});
