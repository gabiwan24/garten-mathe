import type { AppState, PlantRecord, PlantStage, TaskResult, TaskTypeId } from '../lib/types';
import { firstTryNoHelp } from '../lib/types';
import { TASK_TYPES } from '../tasks/registry';
import { updateItem } from './leitner';
import { nextLevel, pushHistory } from './levels';

export interface FinishedRound {
  taskType: TaskTypeId;
  seed: number;
  wateringPlantId: string | null;
  results: readonly TaskResult[];
}

export interface RoundOutcome {
  state: AppState;
  /** The newly planted plant, or after a watering round the grown watered plant. */
  plant: PlantRecord;
  watered: boolean;
  levelDelta: -1 | 0 | 1;
  score: { firstTry: number; total: number };
}

export function plantOutcome(firstTry: number, total: number): { stage: PlantStage; pracht: boolean } {
  if (total > 0 && firstTry === total) return { stage: 5, pracht: true };
  const ratio = total > 0 ? firstTry / total : 0;
  if (ratio >= 0.8) return { stage: 4, pracht: false };
  if (ratio >= 0.5) return { stage: 3, pracht: false };
  return { stage: 2, pracht: false };
}

export function water(p: PlantRecord): PlantRecord {
  if (p.pracht || p.stage >= 5) return p;
  return { ...p, stage: (p.stage + 1) as PlantStage };
}

export function makePlantId(seed: number, now: number = Date.now()): string {
  return `${now.toString(36)}-${seed.toString(36)}`;
}

export function finishRound(state: AppState, round: FinishedRound, date: string, plantId: string): RoundOutcome {
  const type = round.taskType;
  const flags = round.results.map(firstTryNoHelp);
  const firstTry = flags.filter(Boolean).length;
  const total = round.results.length;

  const items = { ...state.items };
  for (const r of round.results) items[r.itemKey] = updateItem(items[r.itemKey], r, date);

  const history = pushHistory(state.history[type], flags);
  const lvl = nextLevel(state.levels[type], history);

  // A watering round grows the chosen plant instead of planting a new one.
  const target = state.plants.find((p) => p.id === round.wateringPlantId);
  let plant: PlantRecord;
  let plants: PlantRecord[];
  if (target) {
    plant = water(target);
    plants = state.plants.map((p) => (p.id === target.id ? plant : p));
  } else {
    const { stage, pracht } = plantOutcome(firstTry, total);
    plant = { id: plantId, seed: round.seed, family: TASK_TYPES[type].family, taskType: type, stage, pracht, date, slot: null };
    plants = [...state.plants, plant];
  }

  return {
    state: {
      ...state,
      items,
      // A fresh history after a level change keeps the next decision about the new level only.
      history: { ...state.history, [type]: lvl.delta === 0 ? history : [] },
      levels: { ...state.levels, [type]: lvl.level },
      plants,
      rounds: [...state.rounds, { date, taskType: type, firstTry, total, ms: round.results.reduce((s, r) => s + r.ms, 0) }],
      lastTaskType: type,
    },
    plant,
    watered: target !== undefined,
    levelDelta: lvl.delta,
    score: { firstTry, total },
  };
}
