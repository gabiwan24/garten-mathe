import { describe, expect, it } from 'vitest';
import { Round, ROUND_SIZE } from '../../src/engine/session';
import type { TaskResult } from '../../src/lib/types';

const good = (r: Round): TaskResult => ({ itemKey: r.current.key, correctFirstTry: true, usedHelp: false, attempts: 0, ms: 1000 });
const bad = (r: Round): TaskResult => ({ itemKey: r.current.key, correctFirstTry: false, usedHelp: false, attempts: 1, ms: 1000 });

describe('Round', () => {
  it('serves 10 tasks of its type and then is done', () => {
    const r = new Round({ taskType: 'fillTen', level: 2, items: {}, seed: 1 });
    for (let i = 0; i < ROUND_SIZE; i++) {
      expect(r.done).toBe(false);
      expect(r.current.kind).toBe('fillTen');
      r.record(good(r));
    }
    expect(r.done).toBe(true);
    expect(r.results).toHaveLength(10);
  });
  it('never repeats the same item twice in a row', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = new Round({ taskType: 'decompose', level: 1, items: {}, seed });
      let prev = '';
      while (!r.done) {
        expect(r.current.key).not.toBe(prev);
        prev = r.current.key;
        r.record(good(r));
      }
    }
  });
  it('serves an easier task after two errors in a row', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = new Round({ taskType: 'fillTen', level: 2, items: {}, seed });
      r.record(bad(r));
      r.record(bad(r));
      expect(r.current.kind === 'fillTen' && r.current.missing).toBeLessThanOrEqual(3);
    }
  });
  it('mixes in shaky items from the leitner boxes', () => {
    const items = { 'fillTen:3': { box: 1 as const, wrong: 2, lastSeen: '2026-10-01' } };
    let hits = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const r = new Round({ taskType: 'fillTen', level: 2, items, seed });
      while (!r.done) {
        if (r.current.key === 'fillTen:3') hits++;
        r.record(good(r));
      }
    }
    expect(hits).toBeGreaterThan(30);
  });
  it('is deterministic for a seed', () => {
    const keys = (seed: number) => {
      const r = new Round({ taskType: 'addBridgeTen', level: 3, items: {}, seed });
      const out: string[] = [];
      while (!r.done) { out.push(r.current.key); r.record(good(r)); }
      return out;
    };
    expect(keys(9)).toEqual(keys(9));
  });
});
