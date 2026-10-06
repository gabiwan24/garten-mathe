import { TASK_TYPE_IDS, type AppState, type TaskTypeId } from '../lib/types';
import { TASK_TYPES } from '../tasks/registry';

export function unlockedTypes(state: AppState): TaskTypeId[] {
  return TASK_TYPE_IDS.filter((id) => TASK_TYPES[id].unlocked(state.levels));
}

export function roundsToday(state: AppState, date: string): number {
  return state.rounds.filter((r) => r.date === date).length;
}

export function limitReached(state: AppState, date: string): boolean {
  return roundsToday(state, date) >= state.settings.roundsPerDay;
}

// Empty history ranks below every real rate so a newly unlocked type gets tried first.
function firstTryRate(history: boolean[]): number {
  return history.length === 0 ? -1 : history.filter(Boolean).length / history.length;
}

function box1Count(state: AppState, type: TaskTypeId): number {
  return Object.entries(state.items).filter(([k, v]) => k.startsWith(`${type}:`) && v.box === 1).length;
}

export function suggestType(state: AppState): TaskTypeId {
  const unlocked = unlockedTypes(state);
  const pool = unlocked.length > 1 ? unlocked.filter((t) => t !== state.lastTaskType) : unlocked;
  return [...pool].sort(
    (a, b) =>
      firstTryRate(state.history[a]) - firstTryRate(state.history[b]) ||
      box1Count(state, b) - box1Count(state, a) ||
      TASK_TYPE_IDS.indexOf(a) - TASK_TYPE_IDS.indexOf(b),
  )[0];
}
