# Selbst einpflanzen und breiter Garten – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a normal round the child plants the seed herself on a free soil spot of a wide, densely plantable garden (3 rows, horizontal scroll); the position is saved.

**Architecture:** Pure grid logic (`src/garden/layout.ts`, `src/engine/planting.ts`) with unit tests, schema v2 with a 1→2 migration, a new wide `GardenCanvas` used by the garden and by a new planting screen, a seed component and router changes. All state flows through the existing `commit()/snapshot()`.

**Tech Stack:** unchanged (Vite 8, Svelte 5 runes, TypeScript 6, Vitest 5).

**Spec:** `docs/superpowers/specs/2026-10-06-garten-mathe-design.md`, section 12 (read it first). Base plan for conventions: `docs/superpowers/plans/2026-10-06-garten-mathe-m1.md`.

## Global Constraints

- All Global Constraints of the base plan still apply (flat cut-paper look, palette, German UI text / English code, no timers/lives, `import type`, no enums/parameter properties, gate = `npm test` green + `npm run check` 0 errors + `npm run build` OK).
- Router invariant (CLAUDE.md): `Garden` (with the tilt-sway loop) must be unmounted whenever state is committed. The planting screen commits while mounted, so it must render its garden with `sway={false}`.
- Slots: 3 rows (`row` 0 = back, 1 = middle, 2 = front), `col >= 0`. Columns = `max(7, ceil((plantCount + 12) / 3))` where `plantCount` counts ALL plants (also unplanted seeds). One plant per slot. Spacing 56 px at scale 1; row scale 0.70 / 0.85 / 1.00; row stagger offsets 28 / 14 / 0 px.
- A plant with `slot === null` is a pending seed. Watering rounds never create a seed and never change a slot.
- Tap targets (free slots, buttons) at least 44 x 44 px.
- Garden scrolls horizontally only (`overflow-x: auto; overflow-y: hidden`); sky/sun/clouds/meadow, header and footer do not scroll.
- Tests live in `tests/**`, one file per pure module, deterministic.

## File Map

```
src/lib/types.ts                  + Row, Slot; PlantRecord.slot: Slot | null
src/garden/layout.ts              grid constants + pure functions (new)
src/engine/planting.ts            plantSeed(), (new)
src/engine/round.ts               new plant gets slot: null
src/store/schema.ts               SCHEMA_VERSION 2 + migration 1→2 + slot normalisation
src/garden/GardenCanvas.svelte    wide scrollable garden (new)
src/garden/Garden.svelte          uses GardenCanvas, pending-seed button
src/garden/Seed.svelte            flat seed, gold variant (new)
src/screens/RoundEnd.svelte       seed + "Samen einpflanzen" (watered rounds unchanged)
src/screens/PlantingScreen.svelte choose → confirm → grow (new)
src/App.svelte                    new screen 'plant'
tests/garden/layout.test.ts, tests/engine/planting.test.ts, tests/store/schema.test.ts (+), existing fixtures updated
docs/STATUS.md, docs/DECISIONS.md, CLAUDE.md
```

---

### Task 1: Slot model, layout logic, schema v2, plantSeed

**Files:** Create `src/garden/layout.ts`, `src/engine/planting.ts`, `tests/garden/layout.test.ts`, `tests/engine/planting.test.ts`. Modify `src/lib/types.ts`, `src/engine/round.ts`, `src/store/schema.ts`, and every existing test fixture that builds a `PlantRecord` (add `slot: null`), `tests/store/schema.test.ts`.

**Interfaces — Produces:**
- types: `export type Row = 0 | 1 | 2; export interface Slot { row: Row; col: number }`, `PlantRecord.slot: Slot | null`.
- layout.ts: `ROWS = 3`, `MIN_COLS = 7`, `FREE_MIN = 12`, `SPACING = 56`, `PAD = 24`, `GARDEN_H = 360`, `ROW_SCALE: Record<Row, number>`, `ROW_OFFSET: Record<Row, number>`, `ROW_BASE_Y: Record<Row, number>` (soil centre y from the top of the canvas, rows back→front, start with 150 / 245 / 335 and tune visually), `colsFor(plantCount: number): number`, `gardenWidth(cols: number): number`, `slotKey(s: Slot): string`, `slotForIndex(i: number): Slot`, `isFree(plants: readonly PlantRecord[], slot: Slot): boolean`, `freeSlots(plants): Slot[]` (within `colsFor(plants.length)`, ordered by col ascending then row ascending), `pendingSeed(plants): PlantRecord | null` (first plant with `slot === null`, array order = oldest first), `drawOrder(plants): PlantRecord[]` (placed plants only, row ascending then col ascending), `slotGeometry(s: Slot): { x: number; baseY: number; scale: number }` (`x` = horizontal centre in canvas px = `PAD + ROW_OFFSET[row] + col * SPACING + SPACING / 2`).
- planting.ts: `plantSeed(state: AppState, plantId: string, slot: Slot): AppState` – returns a new state with the slot set; returns the SAME state object when the plant does not exist, already has a slot, or the slot is not free / out of range.

- [ ] **Step 1: Types.** In `src/lib/types.ts` add `Row`, `Slot` and `slot: Slot | null` to `PlantRecord`. Run `npm run check` and fix every fixture/construction site the compiler reports (`slot: null` in tests; in `finishRound` the new plant gets `slot: null`; a watered plant keeps its slot because `water()` spreads the record).

- [ ] **Step 2: Write failing tests** `tests/garden/layout.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { colsFor, drawOrder, freeSlots, gardenWidth, isFree, MIN_COLS, pendingSeed, ROWS, slotForIndex, slotGeometry, slotKey } from '../../src/garden/layout';
import type { PlantRecord, Row, Slot } from '../../src/lib/types';

const plant = (id: string, slot: Slot | null): PlantRecord =>
  ({ id, seed: 1, family: 'flower', taskType: 'decompose', stage: 3, pracht: false, date: '2026-10-07', slot });

describe('colsFor', () => {
  it('has a minimum and always leaves at least 12 free slots', () => {
    expect(colsFor(0)).toBe(MIN_COLS);
    for (const n of [0, 1, 9, 10, 21, 22, 40, 100, 333]) {
      expect(colsFor(n) * ROWS - n).toBeGreaterThanOrEqual(12);
    }
    expect(colsFor(21)).toBe(11);
    expect(colsFor(100)).toBe(38);
  });
});

describe('slots', () => {
  it('slotForIndex spreads over rows first and never repeats', () => {
    const keys = Array.from({ length: 60 }, (_, i) => slotKey(slotForIndex(i)));
    expect(new Set(keys).size).toBe(60);
    expect(slotForIndex(0)).toEqual({ row: 0, col: 0 });
    expect(slotForIndex(1)).toEqual({ row: 1, col: 0 });
    expect(slotForIndex(3)).toEqual({ row: 0, col: 1 });
  });
  it('isFree rejects occupied and out-of-range slots', () => {
    const plants = [plant('a', { row: 2, col: 3 })];
    expect(isFree(plants, { row: 2, col: 3 })).toBe(false);
    expect(isFree(plants, { row: 2, col: 4 })).toBe(true);
    expect(isFree(plants, { row: 1, col: colsFor(1) })).toBe(false);
    expect(isFree(plants, { row: 1, col: -1 })).toBe(false);
    expect(isFree(plants, { row: 3 as Row, col: 0 })).toBe(false);
  });
  it('freeSlots counts all slots minus placed plants and is ordered col then row', () => {
    const plants = [plant('a', { row: 0, col: 0 }), plant('b', null)];
    const free = freeSlots(plants);
    expect(free).toHaveLength(colsFor(2) * ROWS - 1);
    expect(free[0]).toEqual({ row: 1, col: 0 });
    expect(free.some((s) => slotKey(s) === '0:0')).toBe(false);
  });
});

describe('pendingSeed / drawOrder', () => {
  it('pendingSeed returns the oldest unplaced plant', () => {
    expect(pendingSeed([])).toBeNull();
    expect(pendingSeed([plant('a', { row: 0, col: 0 })])).toBeNull();
    expect(pendingSeed([plant('a', null), plant('b', null)])?.id).toBe('a');
  });
  it('drawOrder lists placed plants back-to-front, left-to-right within a row', () => {
    const order = drawOrder([plant('f', { row: 2, col: 0 }), plant('b2', { row: 0, col: 2 }), plant('b1', { row: 0, col: 1 }), plant('seed', null), plant('m', { row: 1, col: 5 })]);
    expect(order.map((p) => p.id)).toEqual(['b1', 'b2', 'm', 'f']);
  });
});

describe('geometry', () => {
  it('gets bigger and lower towards the front and moves right with the column', () => {
    const g = (row: Row, col: number) => slotGeometry({ row, col });
    expect(g(0, 0).scale).toBeLessThan(g(1, 0).scale);
    expect(g(1, 0).scale).toBeLessThan(g(2, 0).scale);
    expect(g(0, 0).baseY).toBeLessThan(g(2, 0).baseY);
    expect(g(2, 1).x - g(2, 0).x).toBe(56);
  });
  it('no two slots share the same position and all fit into the garden width', () => {
    const cols = colsFor(0);
    const seen = new Set<string>();
    for (let r = 0 as Row; r <= 2; r = (r + 1) as Row) for (let c = 0; c < cols; c++) {
      const { x, baseY } = slotGeometry({ row: r, col: c });
      seen.add(`${x}:${baseY}`);
      expect(x).toBeLessThanOrEqual(gardenWidth(cols));
    }
    expect(seen.size).toBe(cols * ROWS);
  });
});
```
and `tests/engine/planting.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { plantSeed } from '../../src/engine/planting';
import { defaultState } from '../../src/store/schema';
import type { PlantRecord, Slot } from '../../src/lib/types';

const plant = (id: string, slot: Slot | null): PlantRecord =>
  ({ id, seed: 1, family: 'fruit', taskType: 'fillTen', stage: 4, pracht: false, date: '2026-10-07', slot });

describe('plantSeed', () => {
  it('places an unplanted seed on a free slot without mutating the input', () => {
    const s = defaultState();
    s.plants = [plant('a', null)];
    const next = plantSeed(s, 'a', { row: 2, col: 3 });
    expect(next.plants[0].slot).toEqual({ row: 2, col: 3 });
    expect(s.plants[0].slot).toBeNull();
  });
  it('returns the same state for unknown ids, already planted plants, occupied or out-of-range slots', () => {
    const s = defaultState();
    s.plants = [plant('a', null), plant('b', { row: 0, col: 0 })];
    expect(plantSeed(s, 'zzz', { row: 1, col: 1 })).toBe(s);
    expect(plantSeed(s, 'b', { row: 1, col: 1 })).toBe(s);
    expect(plantSeed(s, 'a', { row: 0, col: 0 })).toBe(s);
    expect(plantSeed(s, 'a', { row: 1, col: 999 })).toBe(s);
  });
});
```
Add to `tests/store/schema.test.ts`: (a) `defaultState().schemaVersion` is 2; (b) migrating a version-1 state with 5 plants (no `slot`) gives 5 unique slots equal to `slotForIndex(i)` and `schemaVersion` 2; (c) a version-2 state keeps its slots and a plant without `slot` gets `null`; (d) a version-1 export file through `importState` loads. Add to `tests/engine/round.test.ts`: a normal round's new plant has `slot: null`; a watering round keeps the watered plant's slot.

- [ ] **Step 3: Run `npm test`** → new tests FAIL (modules/fields missing).

- [ ] **Step 4: Implement.**
`src/garden/layout.ts`:
```ts
import type { PlantRecord, Row, Slot } from '../lib/types';

export const ROWS = 3;
export const MIN_COLS = 7;
export const FREE_MIN = 12;
export const SPACING = 56;
export const PAD = 24;
export const GARDEN_H = 360;
export const ROW_SCALE: Record<Row, number> = { 0: 0.7, 1: 0.85, 2: 1 };
// Stagger the rows so plants of different rows do not stand exactly behind each other.
export const ROW_OFFSET: Record<Row, number> = { 0: SPACING / 2, 1: SPACING / 4, 2: 0 };
export const ROW_BASE_Y: Record<Row, number> = { 0: 150, 1: 245, 2: 335 };

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
```
`src/engine/planting.ts`:
```ts
import { isFree } from '../garden/layout';
import type { AppState, Slot } from '../lib/types';

export function plantSeed(state: AppState, plantId: string, slot: Slot): AppState {
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || plant.slot !== null || !isFree(state.plants, slot)) return state;
  return { ...state, plants: state.plants.map((p) => (p.id === plantId ? { ...p, slot } : p)) };
}
```
`src/store/schema.ts`: `SCHEMA_VERSION = 2`; `MIGRATIONS[1]` = `(s) => ({ ...s, schemaVersion: 2, plants: (Array.isArray(s.plants) ? s.plants : []).map((p, i) => ({ ...(p as object), slot: slotForIndex(i) })) })` (import `slotForIndex` from `../garden/layout`); in `withDefaults` normalise every plant so a missing `slot` becomes `null` (`isRecord(p) ? { ...p, slot: p.slot ?? null } : p`). Keep the cast-based style of the existing file.

- [ ] **Step 5: Run `npm test`** → all PASS; `npm run check` 0 errors; `npm run build` OK.
- [ ] **Step 6: Commit** `feat: slot model, grid layout logic, schema v2 migration and plantSeed`.

---

### Task 2: Wide garden canvas

**Files:** Create `src/garden/GardenCanvas.svelte`. Modify `src/garden/Garden.svelte`, `src/garden/DemoGallery.svelte` (only if types require). No unit tests (UI); visual verification is the gate.

**Interfaces — Consumes:** `layout.ts` (all), `PlantSvg`, `SCENE`, `polarBlob`, `app`, existing `Background`.
**Produces:**
`<GardenCanvas plants sway onPlant? onSlot? marker? pulseFree? focus? growing? />`
- `plants: PlantRecord[]` (placed ones are drawn, unplaced ignored)
- `sway: boolean` (passed to every `PlantSvg`)
- `onPlant?: (p: PlantRecord) => void` – tap on a placed plant (plant gets a `button` wrapper only when provided)
- `onSlot?: (slot: Slot) => void` – when provided, every FREE slot is a tappable button (>= 44 x 44 px hit area around the soil mound)
- `marker?: Slot | null` – draws a flat seed marker on that slot (use `Seed.svelte` once Task 3 exists; until then a small brown ellipse is fine, Task 3 swaps it)
- `pulseFree?: boolean` – free soil mounds blink softly (CSS animation, respects `prefers-reduced-motion`)
- `focus?: Slot | null` – on mount scroll horizontally so this slot is centred (fallback: scroll to the right end of the placed plants, else to the start)
- `growing?: string | null` – plant id whose plant animates growing (scale from 0.1 to 1, transform-origin bottom centre, 0.9 s ease-out; Prachtpflanze 1.4 s)

Behaviour/layout:
1. Container: `height: GARDEN_H` px, `overflow-x: auto; overflow-y: hidden; touch-action: pan-x; scrollbar-width: none`; inner element `position: relative; width: gardenWidth(colsFor(plants.length)) px; height: 100%`.
2. For every slot of every row draw a soil mound (flat shape like `Bed`'s soil via `polarBlob`, seeded by the slot, `SCENE.soil`), width ≈ 60 px × row scale, centred at `slotGeometry(slot).x`, vertically centred on `baseY`. Z-order: higher row above lower rows, higher col above lower col in the same row (use `z-index = row * 1000 + col`); a plant is above its own mound.
3. A placed plant: width `90 * scale` px, bottom edge at `baseY` (the SVG viewBox is 100x140 with the base at y = 134; position so the stem foot sits in the soil mound centre), horizontally centred on `x`. Overlap with neighbours is intended.
4. Sway: unchanged behaviour (`PlantSvg` registers itself only when `sway` and visible).
5. Garden.svelte: remove the vertical grid; layout = header (title + gear, unchanged long-press logic), the canvas area (`flex: 1`, canvas vertically centred or bottom-aligned above the footer, full width, NOT inside the 16 px page padding so plants can scroll edge to edge), pending-seed banner (Task 3 wires its click; render it now as a button that calls a new prop `onSeed(plantId: string)` when `pendingSeed(app.data.plants)` exists: text "🌱 Du hast noch einen Samen – einpflanzen"), footer unchanged. `onMount`: `focus` = slot of the most recently placed plant (last placed in array order) else null. Keep `onPlant` → `PlantSheet`.
6. Keep all existing behaviours/invariants (long press fixes, `clock.day`, sway only when `settings.tilt` and no reduced motion).

- [ ] **Step 1: Implement** as above.
- [ ] **Step 2: Verify visually.** Dev server in the background with a temporary no-SSL vite config OUTSIDE the repo (the browser pane refuses the self-signed HTTPS certificate; never modify `vite.config.ts`, never commit a temp config). Browser pane at 375x812. Seed `localStorage['garten-mathe']` via the JS tool with (a) 4 plants, (b) 40 plants spread over rows (use `slotForIndex`-like positions plus a few gaps), (c) 150 plants. Screenshots + report: dense look, overlaps look good (front hides back), header/footer/background stay fixed while swiping (use `scrollLeft` changes and touch emulation if available), scroll range matches `gardenWidth`, tap on a plant opens the sheet, free slots show as mounds, frame rate/jank with 150 plants (count rAF ticks over 2 s, report), no console errors, no horizontal page scroll of the body (`document.documentElement.scrollWidth === 375`). Tune only the numeric constants in `layout.ts` (`ROW_BASE_Y`, `GARDEN_H`, `SPACING`, `ROW_SCALE`) if the look is off, keep `npm test` green (layout tests assert only invariants).
- [ ] **Step 3: Gate** `npm test`, `npm run check`, `npm run build`. **Commit** `feat: wide scrollable garden with three rows and dense soil slots`.

---

### Task 3: Seed, round end, planting screen, router

**Files:** Create `src/garden/Seed.svelte`, `src/screens/PlantingScreen.svelte`. Modify `src/screens/RoundEnd.svelte`, `src/App.svelte`, `src/garden/GardenCanvas.svelte` (swap the marker for `Seed`).

**Interfaces — Consumes:** `plantSeed`, `layout.ts`, `GardenCanvas`, `app`, `commit`, `snapshot`, `vibrate`, `RoundOutcome`.
**Produces:**
- `<Seed gold? size? />` – flat cut-paper seed (teardrop/almond shape built with `polarBlob` or a hand path, brown `#8A5A3C`/cream highlight; `gold` uses `GOLD` + `GOLD_SHINE` shine) with a tiny bob animation (respects reduced motion).
- `<PlantingScreen plantId vibration onDone />`
- `RoundEnd` gets a new callback prop `onPlant: (plantId: string) => void`.

Behaviour:
1. **RoundEnd** – if `outcome.watered`: unchanged (plant picture, stage text, "Zum Garten" → `onDone`). Otherwise: show `<Seed gold={outcome.plant.pracht}>` large instead of the plant, headline "Du hast einen Samen!" (Prachtpflanze: "Ein goldener Samen!"), the existing "10 Aufgaben geübt, X davon gleich beim ersten Mal" text (for pracht: "Alle 10 beim ersten Mal richtig!"), the level-up line as before, primary button "Samen einpflanzen" → `onPlant(outcome.plant.id)`. Never reveal stage/species of the plant here. Short vibration for pracht like before.
2. **PlantingScreen** – shows `Background` and `GardenCanvas` (`sway={false}`, `pulseFree`, `onSlot` → set marker (tap another free slot moves it), `marker`, `focus` = first free slot nearest to the end of the placed plants or the last placed slot), a banner at the top: `<Seed>` + "Tippe auf eine freie Erdstelle." (after a marker is set: "Hier pflanzen?"), primary button "Hier einpflanzen" (disabled until a marker exists). On confirm: `commit(plantSeed(snapshot(), plantId, marker))`, phase 'grown': pass `growing={plantId}`, vibrate (`[30, 40, 30]`, pracht `[80, 60, 160]`) if `vibration`, replace the controls with "Zum Garten" → `onDone`. If the plant with `plantId` does not exist or is already planted when the screen opens, call `onDone()` immediately. The garden area scrolls horizontally with the finger as usual; the banner and button stay fixed.
3. **Garden** – the pending-seed banner (Task 2) calls `onSeed(plantId)`.
4. **App router** – new screen `{ name: 'plant'; plantId: string }`; `roundEnd` → `onPlant` goes there, `garden` → `onSeed` goes there; `plant` → `toGarden` on done. Garden stays unmounted in `plant`; state is committed there with `sway={false}`.
5. A closed app between round end and planting keeps the seed (the plant is already in state with `slot: null`) – the garden banner appears.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify in the browser (375x812, no-SSL temp config as in Task 2).** Walk through: play a round (use keyboard) → RoundEnd shows the seed (gold after a 10/10 round; make a perfect round by answering correctly without help) → "Samen einpflanzen" → garden with blinking free slots → tap a slot (marker appears, button enables) → tap another slot (marker moves) → confirm → plant grows in that slot, vibration call observed (stub `navigator.vibrate` and report args), "Zum Garten" → plant stays at the chosen position after reload (check `localStorage` slot). Then: round end → close/reload before planting → garden shows the pending-seed banner → plant it. Watering round: RoundEnd unchanged, no new plant, no seed banner. Screenshots of each screen. Console must be free of errors.
- [ ] **Step 3: Gate** `npm test`, `npm run check`, `npm run build`. **Commit** `feat: plant the seed yourself – round end seed, planting screen, pending seeds`.

---

### Task 4: Docs and final gate

**Files:** `docs/STATUS.md` (≤ 40 lines, update: feature done, open: phone test, merge), `docs/DECISIONS.md` (append: 3-row dense slot grid; seed saved immediately with `slot: null`; marker + confirm button instead of instant planting; golden seed for Prachtpflanze; planting screen renders without sway to keep the router invariant), `CLAUDE.md` (Conventions: grid/slot rules in one line; Gotchas: planting screen commits with `sway={false}`).

- [ ] Update docs, run `npm test`, `npm run check`, `npm run build`, commit `docs: planting and wide garden`.
