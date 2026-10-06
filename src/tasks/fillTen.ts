import type { Level } from '../lib/types';
import type { FillTenTask, TaskGenerator } from './model';

export function fillTenFrom(filled: number, level: Level): FillTenTask {
  const missing = 10 - filled;
  return {
    kind: 'fillTen',
    key: `fillTen:${filled}`,
    level,
    filled,
    missing,
    steps: [{ prompt: level === 4 ? `${filled} + ? = 10` : 'Wie viele fehlen bis 10?', answer: missing }],
    solutionText: `${filled} + ${missing} = 10`,
  };
}

export const fillTen: TaskGenerator<FillTenTask> = {
  generate(level, rng, { easier, focus }) {
    const m = focus ? /^fillTen:(\d)$/.exec(focus) : null;
    if (m && Number(m[1]) >= 1) return fillTenFrom(Number(m[1]), level);
    return fillTenFrom(easier ? rng.int(7, 9) : rng.int(1, 9), level);
  },
};
