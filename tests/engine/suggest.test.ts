import { describe, expect, it } from 'vitest';
import { limitReached, suggestType, unlockedTypes } from '../../src/engine/suggest';
import { defaultState } from '../../src/store/schema';

describe('suggest', () => {
  it('starts with decompose and locks addBridgeTen', () => {
    const s = defaultState();
    expect(unlockedTypes(s)).toEqual(['decompose', 'fillTen']);
    expect(suggestType(s)).toBe('decompose');
  });
  it('avoids the type played last when alternatives exist', () => {
    const s = defaultState();
    s.lastTaskType = 'decompose';
    expect(suggestType(s)).toBe('fillTen');
  });
  it('prefers the type with the lowest first-try rate', () => {
    const s = defaultState();
    s.levels = { decompose: 2, fillTen: 2, addBridgeTen: 1 };
    s.history = { decompose: [true, true], fillTen: [true, false], addBridgeTen: [true, true, true] };
    expect(suggestType(s)).toBe('fillTen');
  });
  it('suggests a newly unlocked type with empty history first', () => {
    const s = defaultState();
    s.levels = { decompose: 2, fillTen: 2, addBridgeTen: 1 };
    s.history = { decompose: [true], fillTen: [false], addBridgeTen: [] };
    expect(suggestType(s)).toBe('addBridgeTen');
  });
  it("counts only today's rounds for the daily limit", () => {
    const s = defaultState();
    const r = { taskType: 'fillTen' as const, firstTry: 5, total: 10, ms: 1 };
    s.rounds = [{ ...r, date: '2026-10-05' }, { ...r, date: '2026-10-06' }, { ...r, date: '2026-10-06' }];
    expect(limitReached(s, '2026-10-06')).toBe(false);
    s.rounds.push({ ...r, date: '2026-10-06' });
    expect(limitReached(s, '2026-10-06')).toBe(true);
  });
});
