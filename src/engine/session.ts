import { createRng, type Rng } from '../lib/rng';
import type { ItemKey, ItemStat, Level, TaskResult, TaskTypeId } from '../lib/types';
import type { AnyTask } from '../tasks/model';
import { TASK_TYPES } from '../tasks/registry';
import { BOX_WEIGHT, focusItems, pickWeighted } from './leitner';

export const ROUND_SIZE = 10;
const FOCUS_SHARE = 0.4;

export interface RoundOptions {
  taskType: TaskTypeId;
  level: Level;
  items: Record<string, ItemStat>;
  seed: number;
  wateringPlantId?: string | null;
}

export class Round {
  readonly taskType: TaskTypeId;
  readonly level: Level;
  readonly seed: number;
  readonly wateringPlantId: string | null;
  readonly results: TaskResult[] = [];
  current: AnyTask;
  private readonly items: Record<string, ItemStat>;
  private readonly rng: Rng;
  private errorStreak = 0;

  constructor(opts: RoundOptions) {
    this.taskType = opts.taskType;
    this.level = opts.level;
    this.seed = opts.seed;
    this.wateringPlantId = opts.wateringPlantId ?? null;
    this.items = opts.items;
    this.rng = createRng(opts.seed);
    this.current = this.nextTask(null);
  }

  get done(): boolean {
    return this.results.length >= ROUND_SIZE;
  }

  get index(): number {
    return this.results.length;
  }

  record(result: TaskResult): void {
    if (this.done) return;
    this.results.push(result);
    this.errorStreak = result.attempts > 0 ? this.errorStreak + 1 : 0;
    if (!this.done) this.current = this.nextTask(result.itemKey);
  }

  private nextTask(prevKey: ItemKey | null): AnyTask {
    const generator = TASK_TYPES[this.taskType].generator;
    // After two misses in a row she needs a quick success, not a review item.
    const easier = this.errorStreak >= 2;
    const focus = focusItems(this.items, this.taskType).filter((f) => f.key !== prevKey);
    let task: AnyTask | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const focusKey =
        !easier && focus.length > 0 && this.rng.chance(FOCUS_SHARE)
          ? pickWeighted(focus.map((f) => ({ value: f.key, weight: BOX_WEIGHT[f.box] })), this.rng)
          : undefined;
      task = generator.generate(this.level, this.rng, { easier, focus: focusKey });
      if (task.key !== prevKey) return task;
    }
    return task!;
  }
}
