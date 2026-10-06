import { today } from '../lib/date';
import type { AppState } from '../lib/types';
import { loadState, saveState, type StorageLike } from '../store/storage';

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = browserStorage();
const loaded = loadState(storage);

export const app = $state({ data: loaded.state, storageOk: loaded.storageOk });

/** Replace the whole state and persist it; pure engine functions produce `next`. */
export function commit(next: AppState): void {
  app.data = next;
  app.storageOk = saveState(storage, next);
}

/** Plain copy for pure functions (no Svelte proxies leaking into the engine). */
export function snapshot(): AppState {
  return $state.snapshot(app.data) as AppState;
}

/** Reactive "today": an installed PWA stays in memory overnight, so derived values must not call today() only once. */
export const clock = $state({ day: today() });

export function refreshDay(): void {
  const now = today();
  if (clock.day !== now) clock.day = now;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshDay();
  });
  window.addEventListener('focus', refreshDay);
}
