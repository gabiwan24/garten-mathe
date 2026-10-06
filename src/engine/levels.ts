import type { Level } from '../lib/types';

export const HISTORY_LEN = 10;

export function pushHistory(h: boolean[], values: boolean[]): boolean[] {
  return [...h, ...values].slice(-HISTORY_LEN);
}

export function nextLevel(level: Level, history: boolean[]): { level: Level; delta: -1 | 0 | 1 } {
  if (history.length < HISTORY_LEN) return { level, delta: 0 };
  const rate = history.filter(Boolean).length / history.length;
  if (rate >= 0.85 && level < 4) return { level: (level + 1) as Level, delta: 1 };
  if (rate < 0.6 && level > 1) return { level: (level - 1) as Level, delta: -1 };
  return { level, delta: 0 };
}
