import { slotForIndex } from '../garden/layout';
import type { AppState, PlantRecord, RoundRecord, Settings, TaskTypeId } from '../lib/types';

export const SCHEMA_VERSION = 2;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function defaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { roundsPerDay: 3, vibration: true, tilt: true, pin: null },
    levels: { decompose: 1, fillTen: 1, addBridgeTen: 1 },
    history: { decompose: [], fillTen: [], addBridgeTen: [] },
    items: {},
    plants: [],
    rounds: [],
    lastTaskType: null,
  };
}

type Migration = (s: Record<string, unknown>) => Record<string, unknown>;
// Key n migrates a version-n object to version n+1. Add entries when SCHEMA_VERSION grows.
const MIGRATIONS: Record<number, Migration> = {
  // 1→2: plants get grid slots; existing plants are distributed over the three rows, filling columns left to right (slotForIndex).
  1: (s) => ({
    ...s,
    schemaVersion: 2,
    plants: (Array.isArray(s.plants) ? s.plants : []).map((p, i) => ({ ...(p as object), slot: slotForIndex(i) })),
  }),
};

export function migrate(raw: unknown): AppState {
  if (!isRecord(raw) || typeof raw.schemaVersion !== 'number') throw new Error('Invalid state');
  if (raw.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`State version ${raw.schemaVersion} is newer than app version ${SCHEMA_VERSION}`);
  }
  let s = raw;
  for (let v = raw.schemaVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration from version ${v}`);
    s = step(s);
  }
  return withDefaults(s);
}

// Older saves may lack keys added later; defaults fill them so the UI never sees undefined.
function withDefaults(s: Record<string, unknown>): AppState {
  const d = defaultState();
  const rec = (v: unknown): Record<string, unknown> => (isRecord(v) ? v : {});
  const lastTaskType = typeof s.lastTaskType === 'string' ? (s.lastTaskType as TaskTypeId) : null;
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...d.settings, ...rec(s.settings) } as Settings,
    levels: { ...d.levels, ...rec(s.levels) } as AppState['levels'],
    history: { ...d.history, ...rec(s.history) } as AppState['history'],
    items: rec(s.items) as AppState['items'],
    // A plant without a slot is an unplanted seed.
    plants: (Array.isArray(s.plants) ? s.plants : []).map((p) => (isRecord(p) ? { ...p, slot: p.slot ?? null } : p)) as PlantRecord[],
    rounds: (Array.isArray(s.rounds) ? s.rounds : []) as RoundRecord[],
    lastTaskType,
  };
}
