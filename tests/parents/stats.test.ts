import { describe, expect, it } from 'vitest';
import { dailyMinutes, typeSummaries, wobblyItems } from '../../src/parents/stats';
import { defaultState } from '../../src/store/schema';

describe('stats', () => {
  it('summarises each type with rate and trend', () => {
    const s = defaultState();
    s.history.decompose = [true, true, false, true];
    s.rounds = [
      { date: '2026-10-05', taskType: 'decompose', firstTry: 5, total: 10, ms: 60000 },
      { date: '2026-10-06', taskType: 'decompose', firstTry: 7, total: 10, ms: 60000 },
    ];
    const [dec, fill, bridge] = typeSummaries(s);
    expect(dec).toMatchObject({ type: 'decompose', level: 1, rate: 0.75, trend: 'up', unlocked: true });
    expect(fill.rate).toBeNull();
    expect(fill.trend).toBeNull();
    expect(bridge.unlocked).toBe(false);
  });
  it('lists 14 days of minutes ending today, oldest first', () => {
    const s = defaultState();
    s.rounds = [
      { date: '2026-10-06', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
      { date: '2026-10-06', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
      { date: '2026-09-01', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
    ];
    const days = dailyMinutes(s, '2026-10-06');
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe('2026-09-23');
    expect(days[13]).toEqual({ date: '2026-10-06', minutes: 3 });
    expect(days[12].minutes).toBe(0);
  });
  it('ranks the shakiest items first and skips items without errors', () => {
    const s = defaultState();
    s.items = {
      'fillTen:6': { box: 2, wrong: 3, lastSeen: '2026-10-06' },
      'addBridgeTen:8+5': { box: 1, wrong: 1, lastSeen: '2026-10-06' },
      'decompose:7:3': { box: 1, wrong: 4, lastSeen: '2026-10-05' },
      'fillTen:2': { box: 4, wrong: 0, lastSeen: '2026-10-06' },
    };
    expect(wobblyItems(s).map((w) => w.label)).toEqual(['7 = 3 + ?', '8 + 5', '6 + ? = 10']);
  });
});
