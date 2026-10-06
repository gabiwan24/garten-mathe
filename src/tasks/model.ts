import type { Rng } from '../lib/rng';
import type { ItemKey, Level } from '../lib/types';

export interface TaskStep { prompt: string; answer: number }

interface TaskBase { key: ItemKey; level: Level; steps: TaskStep[]; solutionText: string }

export interface DecomposeTask extends TaskBase { kind: 'decompose'; total: number; left: number; right: number }
export interface FillTenTask extends TaskBase { kind: 'fillTen'; filled: number; missing: number }
export interface AddBridgeTenTask extends TaskBase {
  kind: 'addBridgeTen';
  a: number;
  b: number;
  toTen: number;
  rest: number;
  sum: number;
  guided: boolean;
}
export type AnyTask = DecomposeTask | FillTenTask | AddBridgeTenTask;

export interface GenOptions { easier: boolean; focus?: ItemKey }
export interface TaskGenerator<T extends AnyTask> { generate(level: Level, rng: Rng, opts: GenOptions): T }

export type CellState = 'empty' | 'a' | 'b' | 'ghost';
export interface ShellState { step: number; help: boolean; phase: 'answer' | 'praise' | 'solution' }
