import type { PlantRecord, Row, Slot } from '../lib/types';

export const ROWS = 3;
export const MIN_COLS = 7;
export const FREE_MIN = 12;
export const SPACING = 56;
export const PAD = 24;
export const GARDEN_H = 340;
export const ROW_SCALE: Record<Row, number> = { 0: 0.7, 1: 0.85, 2: 1 };
// Stagger the rows so plants of different rows do not stand exactly behind each other.
export const ROW_OFFSET: Record<Row, number> = { 0: SPACING / 2, 1: SPACING / 4, 2: 0 };
export const ROW_BASE_Y: Record<Row, number> = { 0: 150, 1: 232, 2: 318 };

export function colsFor(plantCount: number): number {
  return Math.max(MIN_COLS, Math.ceil((plantCount + FREE_MIN) / ROWS));
}

export function gardenWidth(cols: number): number {
  return PAD * 2 + cols * SPACING + SPACING / 2;
}

export function slotKey(s: Slot): string {
  return `${s.row}:${s.col}`;
}

// Used by the 1→2 migration: fills the rows evenly from the left.
export function slotForIndex(i: number): Slot {
  return { row: (i % ROWS) as Row, col: Math.floor(i / ROWS) };
}

function inRange(plants: readonly PlantRecord[], s: Slot): boolean {
  return Number.isInteger(s.row) && s.row >= 0 && s.row < ROWS && Number.isInteger(s.col) && s.col >= 0 && s.col < colsFor(plants.length);
}

export function isFree(plants: readonly PlantRecord[], slot: Slot): boolean {
  return inRange(plants, slot) && !plants.some((p) => p.slot !== null && slotKey(p.slot) === slotKey(slot));
}

export function freeSlots(plants: readonly PlantRecord[]): Slot[] {
  const used = new Set(plants.flatMap((p) => (p.slot ? [slotKey(p.slot)] : [])));
  const out: Slot[] = [];
  for (let col = 0; col < colsFor(plants.length); col++) {
    for (let row = 0 as Row; row < ROWS; row = (row + 1) as Row) {
      if (!used.has(slotKey({ row, col }))) out.push({ row, col });
    }
  }
  return out;
}

// Where the garden should open for planting: the first free slot at or after the rightmost
// placed column, else the first free slot overall, null when the garden is full.
export function focusSlot(plants: readonly PlantRecord[]): Slot | null {
  const free = freeSlots(plants);
  const lastCol = plants.reduce((m, p) => (p.slot && p.slot.col > m ? p.slot.col : m), 0);
  return free.find((s) => s.col >= lastCol) ?? free[0] ?? null;
}

export function pendingSeed(plants: readonly PlantRecord[]): PlantRecord | null {
  return plants.find((p) => p.slot === null) ?? null;
}

export function drawOrder(plants: readonly PlantRecord[]): PlantRecord[] {
  return plants
    .filter((p): p is PlantRecord & { slot: Slot } => p.slot !== null)
    .sort((a, b) => a.slot.row - b.slot.row || a.slot.col - b.slot.col);
}

export function slotGeometry(s: Slot): { x: number; baseY: number; scale: number } {
  return { x: PAD + ROW_OFFSET[s.row] + s.col * SPACING + SPACING / 2, baseY: ROW_BASE_Y[s.row], scale: ROW_SCALE[s.row] };
}
