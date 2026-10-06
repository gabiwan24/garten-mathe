import type { AppState } from '../lib/types';
import { defaultState, isRecord, migrate } from './schema';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const MAIN_KEY = 'garten-mathe';
export const BACKUP_KEY = 'garten-mathe:lastGood';

export interface LoadResult { state: AppState; source: 'main' | 'lastGood' | 'default'; storageOk: boolean }
export type ImportResult = { ok: true; state: AppState } | { ok: false; error: string };

const SOURCES = [[MAIN_KEY, 'main'], [BACKUP_KEY, 'lastGood']] as const;

export function loadState(storage: StorageLike | null): LoadResult {
  if (!storage) return { state: defaultState(), source: 'default', storageOk: false };
  let storageOk = true;
  for (const [key, source] of SOURCES) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      storageOk = false;
      continue;
    }
    if (raw === null) continue;
    try {
      return { state: migrate(JSON.parse(raw)), source, storageOk };
    } catch {
      // corrupt entry: try the next source
    }
  }
  return { state: defaultState(), source: 'default', storageOk };
}

function isValid(raw: string): boolean {
  try {
    migrate(JSON.parse(raw));
    return true;
  } catch {
    return false;
  }
}

export function saveState(storage: StorageLike | null, state: AppState): boolean {
  if (!storage) return false;
  try {
    const prev = storage.getItem(MAIN_KEY);
    // Only a readable previous state is worth keeping as fallback.
    if (prev !== null && isValid(prev)) storage.setItem(BACKUP_KEY, prev);
    storage.setItem(MAIN_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify({ app: 'garten-mathe', ...state }, null, 2);
}

export function importState(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges Backup.' };
  }
  if (!isRecord(parsed) || parsed.app !== 'garten-mathe') {
    return { ok: false, error: 'Die Datei ist kein Garten-Mathe-Backup.' };
  }
  const rest: Record<string, unknown> = { ...parsed };
  delete rest.app;
  try {
    return { ok: true, state: migrate(rest) };
  } catch {
    return { ok: false, error: 'Das Backup stammt aus einer neueren App-Version oder ist beschädigt.' };
  }
}
