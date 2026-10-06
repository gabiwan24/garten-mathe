import type { Rng } from '../lib/rng';
import type { Box, ItemKey, ItemStat, TaskResult, TaskTypeId } from '../lib/types';

export const BOX_WEIGHT: Record<Box, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };

export function updateItem(
  prev: ItemStat | undefined,
  result: Pick<TaskResult, 'correctFirstTry' | 'usedHelp' | 'attempts'>,
  date: string,
): ItemStat {
  const box = prev?.box ?? 1;
  const wrong = prev?.wrong ?? 0;
  if (result.attempts > 0) return { box: 1, wrong: wrong + 1, lastSeen: date };
  if (result.correctFirstTry && !result.usedHelp) return { box: Math.min(5, box + 1) as Box, wrong, lastSeen: date };
  return { box, wrong, lastSeen: date };
}

export function pickWeighted<T>(entries: readonly { value: T; weight: number }[], rng: Rng): T {
  if (entries.length === 0) throw new Error('pickWeighted from empty list');
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll < 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

export function focusItems(items: Record<string, ItemStat>, type: TaskTypeId): { key: ItemKey; box: ItemStat['box'] }[] {
  return Object.entries(items)
    .filter(([key, stat]) => key.startsWith(`${type}:`) && stat.box <= 3)
    .map(([key, stat]) => ({ key: key as ItemKey, box: stat.box }));
}
