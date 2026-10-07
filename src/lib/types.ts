export type Level = 1 | 2 | 3 | 4;
export type TaskTypeId = 'decompose' | 'fillTen' | 'addBridgeTen';
export const TASK_TYPE_IDS: readonly TaskTypeId[] = ['decompose', 'fillTen', 'addBridgeTen'];
export type PlantFamily = 'flower' | 'fruit' | 'coral';
export type ItemKey = `${TaskTypeId}:${string}`;
export type Box = 1 | 2 | 3 | 4 | 5;
export type PlantStage = 2 | 3 | 4 | 5;

export interface TaskResult {
  itemKey: ItemKey;
  correctFirstTry: boolean;
  usedHelp: boolean;
  /** Number of wrong entries during this task. */
  attempts: number;
  ms: number;
}

export type Row = 0 | 1 | 2;
/** Position in the garden grid: row 0 = back, 2 = front. */
export interface Slot { row: Row; col: number }

export interface ItemStat { box: Box; wrong: number; lastSeen: string }

export interface PlantRecord {
  id: string;
  seed: number;
  family: PlantFamily;
  taskType: TaskTypeId;
  stage: PlantStage;
  pracht: boolean;
  date: string;
  /** null = seed not planted yet. */
  slot: Slot | null;
}

export interface RoundRecord { date: string; taskType: TaskTypeId; firstTry: number; total: number; ms: number }

export interface Settings { roundsPerDay: number; vibration: boolean; tilt: boolean; pin: string | null }

export interface AppState {
  schemaVersion: number;
  settings: Settings;
  levels: Record<TaskTypeId, Level>;
  /** Last ≤10 first-try-without-help flags per type. */
  history: Record<TaskTypeId, boolean[]>;
  items: Record<string, ItemStat>;
  plants: PlantRecord[];
  rounds: RoundRecord[];
  lastTaskType: TaskTypeId | null;
}

export function firstTryNoHelp(r: Pick<TaskResult, 'correctFirstTry' | 'usedHelp'>): boolean {
  return r.correctFirstTry && !r.usedHelp;
}
