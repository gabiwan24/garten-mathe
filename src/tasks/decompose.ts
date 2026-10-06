import type { Level } from '../lib/types';
import type { DecomposeTask, TaskGenerator } from './model';

export function decomposeFrom(total: number, left: number, level: Level): DecomposeTask {
  const right = total - left;
  const prompt = level === 4 ? `${total} = ${left} + ?` : `Links sind ${left}. Wie viele sind unterm Deckel?`;
  return {
    kind: 'decompose',
    key: `decompose:${total}:${left}`,
    level,
    total,
    left,
    right,
    steps: [{ prompt, answer: right }],
    solutionText: `${total} = ${left} + ${right}`,
  };
}

function parseKey(key: string): { total: number; left: number } | null {
  const m = /^decompose:(\d+):(\d+)$/.exec(key);
  if (!m) return null;
  const total = Number(m[1]), left = Number(m[2]);
  return left <= total ? { total, left } : null;
}

export const decompose: TaskGenerator<DecomposeTask> = {
  generate(level, rng, { easier, focus }) {
    const maxTotal = easier ? 5 : level === 1 ? 6 : 10;
    const parsed = focus ? parseKey(focus) : null;
    if (parsed && parsed.total >= 2 && parsed.total <= maxTotal) return decomposeFrom(parsed.total, parsed.left, level);
    const total = rng.int(2, maxTotal);
    // An empty side is a legitimate decomposition but confusing if frequent.
    const left = rng.chance(0.1) ? rng.pick([0, total]) : rng.int(1, total - 1);
    return decomposeFrom(total, left, level);
  },
};
