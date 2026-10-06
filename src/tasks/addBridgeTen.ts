import type { Level } from '../lib/types';
import type { AddBridgeTenTask, TaskGenerator, TaskStep } from './model';

export function isValidBridge(a: number, b: number): boolean {
  return a >= 2 && a <= 9 && b >= 2 && b <= 9 && a + b > 10;
}

export function addBridgeTenFrom(a: number, b: number, level: Level): AddBridgeTenTask {
  const toTen = 10 - a;
  const rest = b - toTen;
  const sum = a + b;
  const guided = level <= 2;
  const steps: TaskStep[] = guided
    ? [
        { prompt: `Wie viele bis zur 10? (${a} + ? = 10)`, answer: toTen },
        { prompt: `${b} sind ${toTen} und …?`, answer: rest },
        { prompt: `10 + ${rest} = ?`, answer: sum },
      ]
    : [{ prompt: `${a} + ${b} = ?`, answer: sum }];
  return {
    kind: 'addBridgeTen',
    key: `addBridgeTen:${a}+${b}`,
    level,
    a,
    b,
    toTen,
    rest,
    sum,
    guided,
    steps,
    solutionText: `${a} + ${toTen} + ${rest} = ${sum}`,
  };
}

export const addBridgeTen: TaskGenerator<AddBridgeTenTask> = {
  generate(level, rng, { easier, focus }) {
    const m = focus ? /^addBridgeTen:(\d)\+(\d)$/.exec(focus) : null;
    if (m && isValidBridge(Number(m[1]), Number(m[2]))) return addBridgeTenFrom(Number(m[1]), Number(m[2]), level);
    let a: number, b: number;
    if (easier) {
      // 9 or 8 plus a small number: only a short step past ten.
      a = rng.pick([8, 9]);
      b = rng.int(11 - a, 13 - a);
    } else if (level <= 2) {
      // Big first addend keeps the "fill to ten" gap small while the strategy is new.
      a = rng.int(7, 9);
      b = rng.int(11 - a, 9);
    } else {
      a = rng.int(2, 9);
      b = rng.int(Math.max(2, 11 - a), 9);
    }
    return addBridgeTenFrom(a, b, level);
  },
};
