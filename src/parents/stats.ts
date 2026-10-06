import { addDays } from '../lib/date';
import { TASK_TYPE_IDS, type AppState, type Level, type TaskTypeId } from '../lib/types';
import { itemLabel } from '../tasks/labels';
import { TASK_TYPES } from '../tasks/registry';

export interface TypeSummary {
  type: TaskTypeId;
  label: string;
  level: Level;
  unlocked: boolean;
  rate: number | null;
  trend: 'up' | 'down' | 'flat' | null;
}

export function typeSummaries(state: AppState): TypeSummary[] {
  return TASK_TYPE_IDS.map((type) => {
    const h = state.history[type];
    const rounds = state.rounds.filter((r) => r.taskType === type);
    let trend: TypeSummary['trend'] = null;
    if (rounds.length >= 2) {
      const [prev, last] = rounds.slice(-2).map((r) => r.firstTry / r.total);
      trend = last > prev ? 'up' : last < prev ? 'down' : 'flat';
    }
    return {
      type,
      label: TASK_TYPES[type].label,
      level: state.levels[type],
      unlocked: TASK_TYPES[type].unlocked(state.levels),
      rate: h.length === 0 ? null : h.filter(Boolean).length / h.length,
      trend,
    };
  });
}

export function dailyMinutes(state: AppState, endDate: string, days = 14): { date: string; minutes: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(endDate, i - days + 1);
    const ms = state.rounds.filter((r) => r.date === date).reduce((s, r) => s + r.ms, 0);
    // A day with any practice must never look like a day without.
    return { date, minutes: ms > 0 ? Math.max(1, Math.round(ms / 60000)) : 0 };
  });
}

export function wobblyItems(state: AppState, n = 5): { key: string; label: string; box: number; wrong: number }[] {
  return Object.entries(state.items)
    .filter(([, v]) => v.wrong > 0)
    .sort(([, a], [, b]) => a.box - b.box || b.wrong - a.wrong || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, n)
    .map(([key, v]) => ({ key, label: itemLabel(key), box: v.box, wrong: v.wrong }));
}
