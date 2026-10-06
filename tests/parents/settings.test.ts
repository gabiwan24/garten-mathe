import { describe, expect, it } from 'vitest';
import { applyImportedState, resetLevel, withSettings } from '../../src/parents/settings';
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
  it('keeps the current PIN when importing a backup', () => {
    const current = withSettings(defaultState(), { pin: '1234' });
    for (const importedPin of [null, '9999']) {
      const imported = withSettings(defaultState(), { pin: importedPin, roundsPerDay: 5 });
      imported.levels.fillTen = 3;
      const r = applyImportedState(current, imported);
      expect(r.settings.pin).toBe('1234');
      expect(r.settings.roundsPerDay).toBe(5);
      expect(r.levels.fillTen).toBe(3);
    }
  });
});
