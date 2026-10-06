import type { AppState, Settings, TaskTypeId } from '../lib/types';

export function withSettings(state: AppState, patch: Partial<Settings>): AppState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

export function resetLevel(state: AppState, type: TaskTypeId): AppState {
  return {
    ...state,
    levels: { ...state.levels, [type]: 1 },
    history: { ...state.history, [type]: [] },
  };
}
