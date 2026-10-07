import { isFree } from '../garden/layout';
import type { AppState, Slot } from '../lib/types';

export function plantSeed(state: AppState, plantId: string, slot: Slot): AppState {
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || plant.slot !== null || !isFree(state.plants, slot)) return state;
  return { ...state, plants: state.plants.map((p) => (p.id === plantId ? { ...p, slot } : p)) };
}
