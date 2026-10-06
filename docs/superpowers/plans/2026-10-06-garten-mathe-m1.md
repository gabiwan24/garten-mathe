# Garten-Mathe Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable Android PWA where a 2nd-grader practises decomposing numbers, "verliebte Zahlen" (fill to 10) and adding across ten; every round grows a procedurally generated plant in her garden.

**Architecture:** Framework-free, unit-tested TypeScript modules hold all logic (`lib/`, `store/`, `engine/`, `tasks/*.ts`, `garden/plant.ts`, `garden/shapes.ts`, `garden/sway.ts`, `sensors/shake.ts`, `parents/stats.ts`). Thin Svelte 5 components render them. State lives in one `$state` object persisted to localStorage.

**Tech Stack:** Node 22, Vite 8, Svelte 5 (runes), TypeScript 6, Vitest 5, vite-plugin-pwa 2, @vitejs/plugin-basic-ssl 2, @fontsource/nunito, @vite-pwa/assets-generator 2.

**Spec:** `docs/superpowers/specs/2026-10-06-garten-mathe-design.md` (read it before starting any task).

## Global Constraints

- Target: Android Chrome, portrait, touch; layout max-width 480px, must work at 360px width without horizontal scroll.
- UI text German; code, identifiers, comments and commit messages English. Comments explain *why*, not *what*.
- Never show a timer, lives/hearts, leaderboards; never a red ✗. Praise the process ("Du hast zuerst die 10 voll gemacht!"), never the person.
- Round = 1 task type × 10 tasks (`ROUND_SIZE = 10`).
- "First try" = correct on first entry **and** no help used. Plant: <50 % → stage 2, 50–79 % → 3, 80–99 % → 4, exactly 100 % → Prachtpflanze (stage 5 + `pracht: true` + exactly one gold node).
- Plants never shrink; watering (+1 stage) caps at 5 and never creates a Prachtpflanze.
- A watering round grows only the watered plant and plants **no** new plant; every normal round plants exactly one new plant. Both count toward the daily limit.
- Level per task type 1–4: up at ≥ 85 % of last 10 first-try, down at < 60 %; history resets on change.
- Daily round limit default 3 (`settings.roundsPerDay`).
- Palette (exact hex): green `#4E9A5B`, pink `#F08C9A`, yellow `#F5B82E`, blue `#2F78C4`, redOrange `#E2522B`, lilac `#9B87C4`, cream `#EADCB4`, navy `#23449A`, olive `#93A62B`, gold `#C9971E` + shine `#F3D57A`. Flat shapes, no gradients, no blurred shadows (hard 0-blur offsets on buttons are allowed).
- No motion during tasks except the task material itself; tilt-sway only in garden; respect `prefers-reduced-motion`.
- Tests live in `tests/**/*.test.ts`, import from `vitest` explicitly, run with `npm test`.
- `verbatimModuleSyntax` is on: use `import type` for type-only imports. Do not use TS parameter properties or enums.
- Gate per task: `npm test` green and `npm run check` reports 0 errors.

## File Map

```
start.bat, scripts/find-port.ps1          dev server on free port, HTTPS, LAN
CLAUDE.md, README.md, docs/STATUS.md, docs/DECISIONS.md
vite.config.ts, vitest.config.ts          build/dev config, test config
src/main.ts, src/app.css, src/App.svelte  entry, global tokens, screen router
src/lib/types.ts                          shared domain types
src/lib/rng.ts                            seeded RNG (mulberry32)
src/lib/date.ts                           local YYYY-MM-DD helpers
src/store/schema.ts                       defaultState, migrate, isRecord
src/store/storage.ts                      load/save with lastGood, export/import
src/state/app.svelte.ts                   reactive app state + commit()
src/engine/leitner.ts                     item boxes, weighted pick
src/engine/levels.ts                      level up/down from history
src/engine/session.ts                     Round: builds the 10 tasks
src/engine/round.ts                       finishRound: score → plant, levels, items
src/engine/suggest.ts                     unlocks, suggestion, daily limit
src/tasks/model.ts                        task data types, CellState, ShellState
src/tasks/decompose.ts, fillTen.ts, addBridgeTen.ts   generators
src/tasks/registry.ts                     TASK_TYPES (label, family, praise, unlock)
src/tasks/labels.ts                       itemKey → human label
src/tasks/components/Keypad.svelte, Field.svelte, Plates.svelte
src/tasks/TaskShell.svelte                answer/feedback/help flow
src/tasks/views/DecomposeTask.svelte, FillTenTask.svelte, AddBridgeTenTask.svelte
src/screens/RoundScreen.svelte, RoundEnd.svelte
src/garden/palette.ts, shapes.ts, plant.ts, sway.ts, swayLoop.ts
src/garden/PlantSvg.svelte, PlantNodeView.svelte, Bed.svelte, Background.svelte,
           Garden.svelte, PlantSheet.svelte, DemoGallery.svelte
src/sensors/shake.ts, tilt.ts, vibrate.ts
src/parents/settings.ts, stats.ts
src/parents/SetupPin.svelte, PinGate.svelte, Parents.svelte
public/logo.svg (+ generated PNG icons)
.github/workflows/deploy.yml
tests/...                                 one test file per pure module
```

---

### Task 1: Project scaffold

**Files:**
- Create: everything from the Vite `svelte-ts` template, `vitest.config.ts`, `start.bat`, `scripts/find-port.ps1`, `CLAUDE.md`, `README.md`, `docs/STATUS.md`, `docs/DECISIONS.md`
- Modify: `package.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/App.svelte`, `src/app.css`, `src/main.ts`, `tsconfig.app.json`

**Interfaces:**
- Produces: `npm test`, `npm run check`, `npm run build`, `npm run dev` scripts; CSS custom properties listed in Step 7 (used by every later component).

- [ ] **Step 1: Generate the template next to the repo files (the root is not empty: `docs/`, `.git/`)**

Run in PowerShell from the repo root:
```powershell
npx -y create-vite@9.2.1 _tpl --template svelte-ts --no-interactive --no-immediate
Get-ChildItem _tpl -Force | Where-Object Name -ne 'README.md' | Move-Item -Destination .
Remove-Item -Recurse -Force _tpl
Remove-Item -Recurse -Force src/assets, src/lib/Counter.svelte, public/icons.svg
```
Expected: `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig*.json`, `index.html`, `src/`, `public/favicon.svg` exist in root.

- [ ] **Step 2: Install dependencies**

Set `"name": "garten-mathe"` in `package.json`, then:
```powershell
npm install
npm install -D vitest@^5 @vitejs/plugin-basic-ssl@^2 vite-plugin-pwa@^2 @vite-pwa/assets-generator@^2
npm install @fontsource/nunito
```
Add to `package.json` `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Test config** – create `vitest.config.ts` (its existence makes Vitest ignore `vite.config.ts`, keeping SSL/PWA plugins out of tests):
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
```
In `tsconfig.app.json` change `include` to `["src/**/*.ts", "src/**/*.js", "src/**/*.svelte", "tests/**/*.ts"]`.

- [ ] **Step 4: Vite config** – replace `vite.config.ts`:
```ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

// HTTPS + host: the phone on the LAN needs a secure context for motion sensors.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte(), basicSsl()],
  server: { host: true },
});
```

- [ ] **Step 5: index.html** – replace:
```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#4E9A5B" />
    <title>Garten-Mathe</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: main.ts** – replace:
```ts
import { mount } from 'svelte';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
```

- [ ] **Step 7: app.css** – replace:
```css
:root {
  --green: #4e9a5b; --pink: #f08c9a; --yellow: #f5b82e; --blue: #2f78c4; --red-orange: #e2522b;
  --lilac: #9b87c4; --cream: #eadcb4; --navy: #23449a; --olive: #93a62b;
  --gold: #c9971e; --gold-shine: #f3d57a;
  --sky: #e4efea; --meadow: #a9c29a; --soil: #8a5a3c;
  --ink: #1f2a44; --white: #fffdf7; --slot: #d9cba0; --press: #2f6b3b; --press-light: #c2b48c;
  color-scheme: light;
  font-family: 'Nunito', system-ui, sans-serif;
  font-weight: 700;
  color: var(--ink);
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--sky); overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
body { touch-action: manipulation; user-select: none; }
#app { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 0 16px; }
button { font: inherit; color: inherit; cursor: pointer; }
.big {
  display: block; width: 100%; min-height: 64px; border: 0; border-radius: 20px;
  background: var(--green); color: var(--white); font-size: 24px; font-weight: 800;
  box-shadow: 0 4px 0 var(--press);
}
.big:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--press); }
.secondary {
  display: block; width: 100%; min-height: 52px; border: 0; border-radius: 18px;
  background: var(--cream); font-size: 20px; font-weight: 800; box-shadow: 0 4px 0 var(--press-light);
}
.secondary:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--press-light); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

- [ ] **Step 8: Placeholder App** – replace `src/App.svelte`:
```svelte
<main><h1>Garten-Mathe</h1></main>
```

- [ ] **Step 9: start.bat + find-port** – copy the user's templates and adapt:
```powershell
New-Item -ItemType Directory -Force scripts | Out-Null
Copy-Item "$env:USERPROFILE\.claude\skills\new-project\templates\find-port.ps1" scripts\
Copy-Item "$env:USERPROFILE\.claude\skills\new-project\templates\start.bat" .
```
In `start.bat`: keep `BASE_PORT=5173`; change the browser line URL to `https://localhost:%PORT%`; change the echo line to `echo [start.bat] https://localhost:%PORT%  (Handy im WLAN: https://^<PC-IP^>:%PORT%)`; set START COMMAND to:
```bat
call npm run dev -- --port %PORT% --strictPort
```
(`--host` comes from `server.host` in `vite.config.ts`.)

- [ ] **Step 10: Docs** – create `CLAUDE.md`:
```markdown
# Garten-Mathe
Mathe-Lern-PWA (Zahlenraum 20, verliebte Zahlen, Zehnerübergang) für ein Kind der 2. Klasse; Android-Handy, Garten-Gamification.

## Run
- Start: `start.bat` (free port from 5173, HTTPS self-signed, reachable in the LAN for phone testing)
- Test: `npm test` · Type check: `npm run check`
- Build: `npm run build` (GitHub Pages build uses `BASE_PATH=/garten-mathe/`)
- Plant gallery for visual tuning (dev only): `https://localhost:<port>/?demo`

## Stack
Vite 8 + Svelte 5 (runes) + TypeScript 6, vite-plugin-pwa, Vitest 5; no backend, localStorage only.

## Conventions
- Pure logic is framework-free and unit-tested in `tests/`; Svelte components stay thin.
- UI text German; code/comments English.
- Look: flat cut-out shapes; palette in `src/garden/palette.ts` and CSS vars in `src/app.css`.
- Pedagogy rules (do not break): no visible timers, no lives, no leaderboards, process praise only, plants never shrink, Prachtpflanze only at exactly 10/10 first try without help.

## Gotchas
- Motion sensors and the service worker need a secure context → dev server runs HTTPS (plugin-basic-ssl); accept the certificate warning on the phone once.
- Spec: docs/superpowers/specs/2026-10-06-garten-mathe-design.md · Plan: docs/superpowers/plans/2026-10-06-garten-mathe-m1.md

## Compact instructions
Preserve: current goal, changed files + why, open TODOs, unresolved errors verbatim, start/port setup.
```
Create `README.md`:
```markdown
# Garten-Mathe
Rechnen üben (bis 20) im eigenen Garten – installierbare Web-App für Android.
Start lokal: `start.bat` doppelklicken. Tests: `npm test`.
```
Create `docs/STATUS.md`:
```markdown
# Status
_Updated: 2026-10-06_

## Now
Milestone 1 build (see docs/superpowers/plans/2026-10-06-garten-mathe-m1.md)

## Works
- Project scaffold, dev server over HTTPS

## Next
1. Task 2 of the plan

## Known issues
-
```
Create `docs/DECISIONS.md`:
```markdown
# Decisions
<!-- one line each: YYYY-MM-DD – decision – why. Append only. -->
2026-10-06 – Vite + Svelte 5 + TypeScript PWA, no backend – small bundle, offline-capable, free GitHub Pages hosting
2026-10-06 – Dev server over HTTPS (plugin-basic-ssl) – motion sensors require a secure context on the phone
2026-10-06 – A watering round only grows the watered plant (+1 stage, max 5), no new plant – "Gießen" should mean caring for that plant; normal rounds keep "1 Runde = 1 Pflanze"
2026-10-06 – Tap-to-place plates instead of drag (fillTen level 1) – more reliable for small fingers
2026-10-06 – "Schütteln" button always visible next to real shaking – sensor availability can't be detected before the first event
```
Append to `.gitignore`:
```
.env*
CLAUDE.local.md
dev-dist
.unlazy/
```

- [ ] **Step 11: Verify**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/find-port.ps1 5173` → prints a port number.
Run: `npm run check` → `svelte-check found 0 errors`.
Run: `npm run build` → ends with `built in`.
Start `npm run dev -- --port 5173 --strictPort` in the background, then `curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:5173/` → `200`. Stop the server.

- [ ] **Step 12: Commit**
```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte 5 PWA project with start.bat and docs"
```

---

### Task 2: Shared types, seeded RNG, date helpers

**Files:**
- Create: `src/lib/types.ts`, `src/lib/rng.ts`, `src/lib/date.ts`
- Test: `tests/lib/rng.test.ts`, `tests/lib/date.test.ts`

**Interfaces:**
- Produces: all types below; `createRng(seed): Rng`, `randomSeed(): number`, `toDateString(d: Date): string`, `today(): string`, `addDays(date: string, delta: number): string`, `formatDateDe(date: string): string`.

- [ ] **Step 1: Types** – create `src/lib/types.ts`:
```ts
export type Level = 1 | 2 | 3 | 4;
export type TaskTypeId = 'decompose' | 'fillTen' | 'addBridgeTen';
export const TASK_TYPE_IDS: readonly TaskTypeId[] = ['decompose', 'fillTen', 'addBridgeTen'];
export type PlantFamily = 'flower' | 'fruit' | 'coral';
export type ItemKey = `${TaskTypeId}:${string}`;
export type Box = 1 | 2 | 3 | 4 | 5;
export type PlantStage = 2 | 3 | 4 | 5;

export interface TaskResult {
  itemKey: ItemKey;
  correctFirstTry: boolean;
  usedHelp: boolean;
  /** Number of wrong entries during this task. */
  attempts: number;
  ms: number;
}

export interface ItemStat { box: Box; wrong: number; lastSeen: string }

export interface PlantRecord {
  id: string;
  seed: number;
  family: PlantFamily;
  taskType: TaskTypeId;
  stage: PlantStage;
  pracht: boolean;
  date: string;
}

export interface RoundRecord { date: string; taskType: TaskTypeId; firstTry: number; total: number; ms: number }

export interface Settings { roundsPerDay: number; vibration: boolean; tilt: boolean; pin: string | null }

export interface AppState {
  schemaVersion: number;
  settings: Settings;
  levels: Record<TaskTypeId, Level>;
  /** Last ≤10 first-try-without-help flags per type. */
  history: Record<TaskTypeId, boolean[]>;
  items: Record<string, ItemStat>;
  plants: PlantRecord[];
  rounds: RoundRecord[];
  lastTaskType: TaskTypeId | null;
}

export function firstTryNoHelp(r: Pick<TaskResult, 'correctFirstTry' | 'usedHelp'>): boolean {
  return r.correctFirstTry && !r.usedHelp;
}
```

- [ ] **Step 2: Write failing tests** – `tests/lib/rng.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/lib/rng';

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42), b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });
  it('differs between seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('int stays within inclusive bounds and hits both ends', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = r.int(2, 6);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([2, 3, 4, 5, 6]);
  });
  it('pick throws on empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
  it('chance(0) is never true, chance(1) always', () => {
    const r = createRng(3);
    for (let i = 0; i < 100; i++) { expect(r.chance(0)).toBe(false); expect(r.chance(1)).toBe(true); }
  });
});
```
`tests/lib/date.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addDays, formatDateDe, toDateString } from '../../src/lib/date';

describe('date helpers', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('formats German dates', () => {
    expect(formatDateDe('2026-10-06')).toBe('6.10.2026');
  });
});
```

- [ ] **Step 3: Run** `npm test` → FAIL (modules not found).

- [ ] **Step 4: Implement** `src/lib/rng.ts`:
```ts
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
}

// mulberry32: tiny, fast, good enough for game randomness, reproducible from a seed.
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => {
      if (arr.length === 0) throw new Error('pick from empty array');
      return arr[Math.floor(next() * arr.length)];
    },
    chance: (p) => next() < p,
  };
}

export function randomSeed(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}
```
`src/lib/date.ts`:
```ts
export function toDateString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function today(): string {
  return toDateString(new Date());
}

export function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + delta));
}

export function formatDateDe(date: string): string {
  const [y, m, d] = date.split('-');
  return `${Number(d)}.${Number(m)}.${y}`;
}
```

- [ ] **Step 5: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/lib tests/lib
git commit -m "feat: add domain types, seeded rng and date helpers"
```

---

### Task 3: Persistence (schema, migration, lastGood, backup)

**Files:**
- Create: `src/store/schema.ts`, `src/store/storage.ts`
- Test: `tests/store/schema.test.ts`, `tests/store/storage.test.ts`

**Interfaces:**
- Consumes: `AppState`, `Settings`, `PlantRecord`, `RoundRecord`, `TaskTypeId` from `src/lib/types.ts`.
- Produces: `SCHEMA_VERSION`, `defaultState(): AppState`, `migrate(raw: unknown): AppState` (throws on invalid/newer), `isRecord(v): v is Record<string, unknown>`; `StorageLike`, `MAIN_KEY`, `BACKUP_KEY`, `loadState(storage: StorageLike | null): LoadResult`, `saveState(storage, state): boolean`, `exportState(state): string`, `importState(text): ImportResult`.

- [ ] **Step 1: Write failing tests** – `tests/store/schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { defaultState, migrate, SCHEMA_VERSION } from '../../src/store/schema';

describe('schema', () => {
  it('default state starts all levels at 1 and has no PIN', () => {
    const s = defaultState();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.levels).toEqual({ decompose: 1, fillTen: 1, addBridgeTen: 1 });
    expect(s.settings).toEqual({ roundsPerDay: 3, vibration: true, tilt: true, pin: null });
    expect(s.plants).toEqual([]);
  });
  it('migrate fills missing keys with defaults', () => {
    const s = migrate({ schemaVersion: 1, settings: { pin: '1234' }, plants: [] });
    expect(s.settings).toEqual({ roundsPerDay: 3, vibration: true, tilt: true, pin: '1234' });
    expect(s.history.fillTen).toEqual([]);
  });
  it('migrate rejects non-objects, newer versions and unknown old versions', () => {
    expect(() => migrate(null)).toThrow();
    expect(() => migrate({ plants: [] })).toThrow();
    expect(() => migrate({ schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/newer/);
    expect(() => migrate({ schemaVersion: 0 })).toThrow(/No migration/);
  });
});
```
`tests/store/storage.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { defaultState } from '../../src/store/schema';
import { BACKUP_KEY, exportState, importState, loadState, MAIN_KEY, saveState, type StorageLike } from '../../src/store/storage';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
}
class BrokenStorage implements StorageLike {
  getItem(): string | null { throw new Error('blocked'); }
  setItem(): void { throw new Error('blocked'); }
}

function withPlant(id: string) {
  const s = defaultState();
  s.plants.push({ id, seed: 1, family: 'flower', taskType: 'decompose', stage: 3, pracht: false, date: '2026-10-06' });
  return s;
}

describe('storage', () => {
  it('round-trips state', () => {
    const st = new MemoryStorage();
    expect(saveState(st, withPlant('a'))).toBe(true);
    const r = loadState(st);
    expect(r.source).toBe('main');
    expect(r.state.plants[0].id).toBe('a');
  });
  it('keeps the previous valid state as lastGood', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    expect(JSON.parse(st.map.get(BACKUP_KEY)!).plants[0].id).toBe('a');
  });
  it('falls back to lastGood when main is corrupt', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    st.map.set(MAIN_KEY, '{broken');
    const r = loadState(st);
    expect(r.source).toBe('lastGood');
    expect(r.state.plants[0].id).toBe('a');
  });
  it('does not overwrite lastGood with a corrupt main', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    st.map.set(MAIN_KEY, '{broken');
    saveState(st, withPlant('c'));
    expect(JSON.parse(st.map.get(BACKUP_KEY)!).plants[0].id).toBe('a');
  });
  it('returns defaults when nothing is stored or everything is corrupt', () => {
    expect(loadState(new MemoryStorage()).source).toBe('default');
    const st = new MemoryStorage();
    st.map.set(MAIN_KEY, 'x');
    st.map.set(BACKUP_KEY, 'y');
    expect(loadState(st).source).toBe('default');
  });
  it('reports broken storage without throwing', () => {
    const r = loadState(new BrokenStorage());
    expect(r.storageOk).toBe(false);
    expect(r.source).toBe('default');
    expect(saveState(new BrokenStorage(), defaultState())).toBe(false);
    expect(loadState(null).storageOk).toBe(false);
  });
  it('export/import round-trips', () => {
    const r = importState(exportState(withPlant('z')));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.plants[0].id).toBe('z');
  });
  it('import rejects foreign or broken files', () => {
    expect(importState('nope').ok).toBe(false);
    expect(importState(JSON.stringify({ schemaVersion: 1 })).ok).toBe(false);
    expect(importState(JSON.stringify({ app: 'garten-mathe', schemaVersion: 99 })).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL (modules not found).

- [ ] **Step 3: Implement** `src/store/schema.ts`:
```ts
import type { AppState, PlantRecord, RoundRecord, Settings, TaskTypeId } from '../lib/types';

export const SCHEMA_VERSION = 1;

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
const MIGRATIONS: Record<number, Migration> = {};

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
    plants: (Array.isArray(s.plants) ? s.plants : []) as PlantRecord[],
    rounds: (Array.isArray(s.rounds) ? s.rounds : []) as RoundRecord[],
    lastTaskType,
  };
}
```
`src/store/storage.ts`:
```ts
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
```

- [ ] **Step 4: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/store tests/store
git commit -m "feat: add versioned local persistence with lastGood fallback and backup"
```

---

### Task 4: Leitner boxes and level progression

**Files:**
- Create: `src/engine/leitner.ts`, `src/engine/levels.ts`
- Test: `tests/engine/leitner.test.ts`, `tests/engine/levels.test.ts`

**Interfaces:**
- Consumes: `Box`, `ItemKey`, `ItemStat`, `Level`, `TaskResult`, `TaskTypeId` (types), `Rng` (rng.ts).
- Produces: `updateItem(prev: ItemStat | undefined, result: Pick<TaskResult,'correctFirstTry'|'usedHelp'|'attempts'>, date: string): ItemStat`; `BOX_WEIGHT: Record<Box, number>`; `pickWeighted<T>(entries: readonly { value: T; weight: number }[], rng: Rng): T`; `focusItems(items: Record<string, ItemStat>, type: TaskTypeId): { key: ItemKey; box: Box }[]`; `HISTORY_LEN = 10`; `pushHistory(h: boolean[], values: boolean[]): boolean[]`; `nextLevel(level: Level, history: boolean[]): { level: Level; delta: -1 | 0 | 1 }`.

- [ ] **Step 1: Write failing tests** – `tests/engine/leitner.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { focusItems, pickWeighted, updateItem } from '../../src/engine/leitner';
import { createRng } from '../../src/lib/rng';

const ok = { correctFirstTry: true, usedHelp: false, attempts: 0 };

describe('updateItem', () => {
  it('moves up one box on first try without help, capped at 5', () => {
    expect(updateItem(undefined, ok, 'd').box).toBe(2);
    expect(updateItem({ box: 5, wrong: 0, lastSeen: 'x' }, ok, 'd').box).toBe(5);
  });
  it('drops to box 1 and counts the error on any wrong entry', () => {
    const r = updateItem({ box: 4, wrong: 1, lastSeen: 'x' }, { correctFirstTry: false, usedHelp: false, attempts: 2 }, 'd');
    expect(r).toEqual({ box: 1, wrong: 2, lastSeen: 'd' });
  });
  it('keeps the box when help was used without errors', () => {
    expect(updateItem({ box: 3, wrong: 0, lastSeen: 'x' }, { correctFirstTry: true, usedHelp: true, attempts: 0 }, 'd').box).toBe(3);
  });
});

describe('pickWeighted', () => {
  it('prefers heavier entries', () => {
    const rng = createRng(5);
    let heavy = 0;
    for (let i = 0; i < 2000; i++) if (pickWeighted([{ value: 'a', weight: 9 }, { value: 'b', weight: 1 }], rng) === 'a') heavy++;
    expect(heavy).toBeGreaterThan(1600);
  });
  it('throws on empty input', () => {
    expect(() => pickWeighted([], createRng(1))).toThrow();
  });
});

describe('focusItems', () => {
  it('returns only this type with box <= 3', () => {
    const items = {
      'fillTen:3': { box: 1 as const, wrong: 1, lastSeen: 'd' },
      'fillTen:4': { box: 4 as const, wrong: 0, lastSeen: 'd' },
      'decompose:7:3': { box: 1 as const, wrong: 1, lastSeen: 'd' },
    };
    expect(focusItems(items, 'fillTen')).toEqual([{ key: 'fillTen:3', box: 1 }]);
  });
});
```
`tests/engine/levels.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { nextLevel, pushHistory } from '../../src/engine/levels';

const hist = (ok: number, total = 10) => Array.from({ length: total }, (_, i) => i < ok);

describe('levels', () => {
  it('keeps only the last 10 entries', () => {
    expect(pushHistory(hist(10), [false, false])).toHaveLength(10);
    expect(pushHistory(hist(10), [false]).at(-1)).toBe(false);
  });
  it('needs a full history before changing', () => {
    expect(nextLevel(1, hist(9, 9))).toEqual({ level: 1, delta: 0 });
  });
  it('goes up at >= 85 % (9 of 10)', () => {
    expect(nextLevel(1, hist(9))).toEqual({ level: 2, delta: 1 });
    expect(nextLevel(1, hist(8))).toEqual({ level: 1, delta: 0 });
  });
  it('goes down below 60 % (5 of 10)', () => {
    expect(nextLevel(3, hist(5))).toEqual({ level: 2, delta: -1 });
    expect(nextLevel(3, hist(6))).toEqual({ level: 3, delta: 0 });
  });
  it('respects bounds 1 and 4', () => {
    expect(nextLevel(4, hist(10))).toEqual({ level: 4, delta: 0 });
    expect(nextLevel(1, hist(0))).toEqual({ level: 1, delta: 0 });
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL.

- [ ] **Step 3: Implement** `src/engine/leitner.ts`:
```ts
import type { Rng } from '../lib/rng';
import type { Box, ItemKey, ItemStat, TaskResult, TaskTypeId } from '../lib/types';

export const BOX_WEIGHT: Record<Box, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };

export function updateItem(
  prev: ItemStat | undefined,
  result: Pick<TaskResult, 'correctFirstTry' | 'usedHelp' | 'attempts'>,
  date: string,
): ItemStat {
  const box = prev?.box ?? 1;
  const wrong = prev?.wrong ?? 0;
  if (result.attempts > 0) return { box: 1, wrong: wrong + 1, lastSeen: date };
  if (result.correctFirstTry && !result.usedHelp) return { box: Math.min(5, box + 1) as Box, wrong, lastSeen: date };
  return { box, wrong, lastSeen: date };
}

export function pickWeighted<T>(entries: readonly { value: T; weight: number }[], rng: Rng): T {
  if (entries.length === 0) throw new Error('pickWeighted from empty list');
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll < 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

export function focusItems(items: Record<string, ItemStat>, type: TaskTypeId): { key: ItemKey; box: ItemStat['box'] }[] {
  return Object.entries(items)
    .filter(([key, stat]) => key.startsWith(`${type}:`) && stat.box <= 3)
    .map(([key, stat]) => ({ key: key as ItemKey, box: stat.box }));
}
```
`src/engine/levels.ts`:
```ts
import type { Level } from '../lib/types';

export const HISTORY_LEN = 10;

export function pushHistory(h: boolean[], values: boolean[]): boolean[] {
  return [...h, ...values].slice(-HISTORY_LEN);
}

export function nextLevel(level: Level, history: boolean[]): { level: Level; delta: -1 | 0 | 1 } {
  if (history.length < HISTORY_LEN) return { level, delta: 0 };
  const rate = history.filter(Boolean).length / history.length;
  if (rate >= 0.85 && level < 4) return { level: (level + 1) as Level, delta: 1 };
  if (rate < 0.6 && level > 1) return { level: (level - 1) as Level, delta: -1 };
  return { level, delta: 0 };
}
```

- [ ] **Step 4: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/engine tests/engine
git commit -m "feat: add leitner boxes and level progression"
```

---

### Task 5: Task generators, registry, labels

**Files:**
- Create: `src/tasks/model.ts`, `src/tasks/decompose.ts`, `src/tasks/fillTen.ts`, `src/tasks/addBridgeTen.ts`, `src/tasks/registry.ts`, `src/tasks/labels.ts`
- Test: `tests/tasks/generators.test.ts`, `tests/tasks/registry.test.ts`

**Interfaces:**
- Consumes: `Level`, `ItemKey`, `PlantFamily`, `TaskTypeId`, `AppState` (types), `Rng`, `createRng`.
- Produces:
  - `TaskStep { prompt: string; answer: number }`
  - `DecomposeTask { kind: 'decompose'; key; level; total; left; right; steps; solutionText }`
  - `FillTenTask { kind: 'fillTen'; key; level; filled; missing; steps; solutionText }`
  - `AddBridgeTenTask { kind: 'addBridgeTen'; key; level; a; b; toTen; rest; sum; guided: boolean; steps; solutionText }`
  - `AnyTask`, `GenOptions { easier: boolean; focus?: ItemKey }`, `TaskGenerator<T> { generate(level, rng, opts): T }`
  - `CellState = 'empty' | 'a' | 'b' | 'ghost'`, `ShellState { step: number; help: boolean; phase: 'answer' | 'praise' | 'solution' }`
  - `decompose`, `fillTen`, `addBridgeTen` generators; `decomposeFrom(total, left, level)`, `fillTenFrom(filled, level)`, `addBridgeTenFrom(a, b, level)`
  - `TASK_TYPES: Record<TaskTypeId, TaskTypeDef>` with `TaskTypeDef { id; label; family; generator: TaskGenerator<AnyTask>; praise: readonly string[]; unlocked(levels: AppState['levels']): boolean }`
  - `itemLabel(key: string): string`

- [ ] **Step 1: Model** – create `src/tasks/model.ts`:
```ts
import type { Rng } from '../lib/rng';
import type { ItemKey, Level } from '../lib/types';

export interface TaskStep { prompt: string; answer: number }

interface TaskBase { key: ItemKey; level: Level; steps: TaskStep[]; solutionText: string }

export interface DecomposeTask extends TaskBase { kind: 'decompose'; total: number; left: number; right: number }
export interface FillTenTask extends TaskBase { kind: 'fillTen'; filled: number; missing: number }
export interface AddBridgeTenTask extends TaskBase {
  kind: 'addBridgeTen';
  a: number;
  b: number;
  toTen: number;
  rest: number;
  sum: number;
  guided: boolean;
}
export type AnyTask = DecomposeTask | FillTenTask | AddBridgeTenTask;

export interface GenOptions { easier: boolean; focus?: ItemKey }
export interface TaskGenerator<T extends AnyTask> { generate(level: Level, rng: Rng, opts: GenOptions): T }

export type CellState = 'empty' | 'a' | 'b' | 'ghost';
export interface ShellState { step: number; help: boolean; phase: 'answer' | 'praise' | 'solution' }
```

- [ ] **Step 2: Write failing tests** – `tests/tasks/generators.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addBridgeTen } from '../../src/tasks/addBridgeTen';
import { decompose } from '../../src/tasks/decompose';
import { fillTen } from '../../src/tasks/fillTen';
import { createRng } from '../../src/lib/rng';
import type { Level } from '../../src/lib/types';

const LEVELS: Level[] = [1, 2, 3, 4];
const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

describe('decompose generator', () => {
  it('produces valid decompositions per level', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = decompose.generate(level, createRng(seed), { easier });
      const max = easier ? 5 : level === 1 ? 6 : 10;
      expect(t.total).toBeGreaterThanOrEqual(2);
      expect(t.total).toBeLessThanOrEqual(max);
      expect(t.left + t.right).toBe(t.total);
      expect(t.left).toBeGreaterThanOrEqual(0);
      expect(t.steps).toHaveLength(1);
      expect(t.steps[0].answer).toBe(t.right);
      expect(t.key).toBe(`decompose:${t.total}:${t.left}`);
      expect(t.solutionText).toBe(`${t.total} = ${t.left} + ${t.right}`);
    }
  });
  it('uses the focus item when it fits the level range', () => {
    const t = decompose.generate(2, createRng(1), { easier: false, focus: 'decompose:9:4' });
    expect([t.total, t.left]).toEqual([9, 4]);
    const u = decompose.generate(1, createRng(1), { easier: false, focus: 'decompose:9:4' });
    expect(u.total).toBeLessThanOrEqual(6);
  });
  it('shows digits only at level 4', () => {
    expect(decompose.generate(4, createRng(3), { easier: false }).steps[0].prompt).toMatch(/^\d+ = \d+ \+ \?$/);
  });
});

describe('fillTen generator', () => {
  it('always completes to ten', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = fillTen.generate(level, createRng(seed), { easier });
      expect(t.filled).toBeGreaterThanOrEqual(1);
      expect(t.filled).toBeLessThanOrEqual(9);
      expect(t.filled + t.missing).toBe(10);
      expect(t.steps[0].answer).toBe(t.missing);
      if (easier) expect(t.missing).toBeLessThanOrEqual(3);
    }
  });
  it('uses the focus item', () => {
    expect(fillTen.generate(2, createRng(1), { easier: false, focus: 'fillTen:3' }).filled).toBe(3);
  });
});

describe('addBridgeTen generator', () => {
  it('always crosses ten with a sum of 11..18', () => {
    for (const level of LEVELS) for (const seed of SEEDS) for (const easier of [false, true]) {
      const t = addBridgeTen.generate(level, createRng(seed), { easier });
      expect(t.a).toBeGreaterThanOrEqual(2);
      expect(t.a).toBeLessThanOrEqual(9);
      expect(t.b).toBeGreaterThanOrEqual(2);
      expect(t.b).toBeLessThanOrEqual(9);
      expect(t.sum).toBe(t.a + t.b);
      expect(t.sum).toBeGreaterThanOrEqual(11);
      expect(t.sum).toBeLessThanOrEqual(18);
      expect(t.toTen + t.a).toBe(10);
      expect(t.toTen + t.rest).toBe(t.b);
      expect(t.steps.at(-1)!.answer).toBe(t.sum);
      expect(t.steps).toHaveLength(level <= 2 ? 3 : 1);
      expect(t.guided).toBe(level <= 2);
      if (level <= 2 && !easier) expect(t.a).toBeGreaterThanOrEqual(7);
    }
  });
  it('guided steps are to-ten, rest, ten-plus-rest', () => {
    const t = addBridgeTen.generate(1, createRng(1), { easier: false, focus: 'addBridgeTen:8+5' });
    expect(t.steps.map((s) => s.answer)).toEqual([2, 3, 13]);
    expect(t.solutionText).toBe('8 + 2 + 3 = 13');
  });
  it('ignores invalid focus items', () => {
    const t = addBridgeTen.generate(3, createRng(1), { easier: false, focus: 'addBridgeTen:3+4' });
    expect(t.sum).toBeGreaterThan(10);
  });
});
```
`tests/tasks/registry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { itemLabel } from '../../src/tasks/labels';
import { TASK_TYPES } from '../../src/tasks/registry';

describe('registry', () => {
  it('unlocks addBridgeTen only when both basics reach level 2', () => {
    const u = TASK_TYPES.addBridgeTen.unlocked;
    expect(u({ decompose: 1, fillTen: 2, addBridgeTen: 1 })).toBe(false);
    expect(u({ decompose: 2, fillTen: 1, addBridgeTen: 1 })).toBe(false);
    expect(u({ decompose: 2, fillTen: 2, addBridgeTen: 1 })).toBe(true);
    expect(TASK_TYPES.decompose.unlocked({ decompose: 1, fillTen: 1, addBridgeTen: 1 })).toBe(true);
  });
  it('maps families per spec', () => {
    expect(TASK_TYPES.decompose.family).toBe('flower');
    expect(TASK_TYPES.fillTen.family).toBe('fruit');
    expect(TASK_TYPES.addBridgeTen.family).toBe('coral');
  });
});

describe('itemLabel', () => {
  it('renders item keys for parents', () => {
    expect(itemLabel('decompose:7:3')).toBe('7 = 3 + ?');
    expect(itemLabel('fillTen:6')).toBe('6 + ? = 10');
    expect(itemLabel('addBridgeTen:8+5')).toBe('8 + 5');
    expect(itemLabel('weird')).toBe('weird');
  });
});
```

- [ ] **Step 3: Run** `npm test` → FAIL.

- [ ] **Step 4: Implement generators** – `src/tasks/decompose.ts`:
```ts
import type { Level } from '../lib/types';
import type { DecomposeTask, TaskGenerator } from './model';

export function decomposeFrom(total: number, left: number, level: Level): DecomposeTask {
  const right = total - left;
  const prompt = level === 4 ? `${total} = ${left} + ?` : `Links sind ${left}. Wie viele sind unterm Deckel?`;
  return {
    kind: 'decompose',
    key: `decompose:${total}:${left}`,
    level,
    total,
    left,
    right,
    steps: [{ prompt, answer: right }],
    solutionText: `${total} = ${left} + ${right}`,
  };
}

function parseKey(key: string): { total: number; left: number } | null {
  const m = /^decompose:(\d+):(\d+)$/.exec(key);
  if (!m) return null;
  const total = Number(m[1]), left = Number(m[2]);
  return left <= total ? { total, left } : null;
}

export const decompose: TaskGenerator<DecomposeTask> = {
  generate(level, rng, { easier, focus }) {
    const maxTotal = easier ? 5 : level === 1 ? 6 : 10;
    const parsed = focus ? parseKey(focus) : null;
    if (parsed && parsed.total >= 2 && parsed.total <= maxTotal) return decomposeFrom(parsed.total, parsed.left, level);
    const total = rng.int(2, maxTotal);
    // An empty side is a legitimate decomposition but confusing if frequent.
    const left = rng.chance(0.1) ? rng.pick([0, total]) : rng.int(1, total - 1);
    return decomposeFrom(total, left, level);
  },
};
```
`src/tasks/fillTen.ts`:
```ts
import type { Level } from '../lib/types';
import type { FillTenTask, TaskGenerator } from './model';

export function fillTenFrom(filled: number, level: Level): FillTenTask {
  const missing = 10 - filled;
  return {
    kind: 'fillTen',
    key: `fillTen:${filled}`,
    level,
    filled,
    missing,
    steps: [{ prompt: level === 4 ? `${filled} + ? = 10` : 'Wie viele fehlen bis 10?', answer: missing }],
    solutionText: `${filled} + ${missing} = 10`,
  };
}

export const fillTen: TaskGenerator<FillTenTask> = {
  generate(level, rng, { easier, focus }) {
    const m = focus ? /^fillTen:(\d)$/.exec(focus) : null;
    if (m && Number(m[1]) >= 1) return fillTenFrom(Number(m[1]), level);
    return fillTenFrom(easier ? rng.int(7, 9) : rng.int(1, 9), level);
  },
};
```
`src/tasks/addBridgeTen.ts`:
```ts
import type { Level } from '../lib/types';
import type { AddBridgeTenTask, TaskGenerator, TaskStep } from './model';

export function isValidBridge(a: number, b: number): boolean {
  return a >= 2 && a <= 9 && b >= 2 && b <= 9 && a + b > 10;
}

export function addBridgeTenFrom(a: number, b: number, level: Level): AddBridgeTenTask {
  const toTen = 10 - a;
  const rest = b - toTen;
  const sum = a + b;
  const guided = level <= 2;
  const steps: TaskStep[] = guided
    ? [
        { prompt: `Wie viele bis zur 10? (${a} + ? = 10)`, answer: toTen },
        { prompt: `${b} sind ${toTen} und …?`, answer: rest },
        { prompt: `10 + ${rest} = ?`, answer: sum },
      ]
    : [{ prompt: `${a} + ${b} = ?`, answer: sum }];
  return {
    kind: 'addBridgeTen',
    key: `addBridgeTen:${a}+${b}`,
    level,
    a,
    b,
    toTen,
    rest,
    sum,
    guided,
    steps,
    solutionText: `${a} + ${toTen} + ${rest} = ${sum}`,
  };
}

export const addBridgeTen: TaskGenerator<AddBridgeTenTask> = {
  generate(level, rng, { easier, focus }) {
    const m = focus ? /^addBridgeTen:(\d)\+(\d)$/.exec(focus) : null;
    if (m && isValidBridge(Number(m[1]), Number(m[2]))) return addBridgeTenFrom(Number(m[1]), Number(m[2]), level);
    let a: number, b: number;
    if (easier) {
      // 9 or 8 plus a small number: only a short step past ten.
      a = rng.pick([8, 9]);
      b = rng.int(11 - a, 13 - a);
    } else if (level <= 2) {
      // Big first addend keeps the "fill to ten" gap small while the strategy is new.
      a = rng.int(7, 9);
      b = rng.int(11 - a, 9);
    } else {
      a = rng.int(2, 9);
      b = rng.int(Math.max(2, 11 - a), 9);
    }
    return addBridgeTenFrom(a, b, level);
  },
};
```

- [ ] **Step 5: Implement registry and labels** – `src/tasks/registry.ts`:
```ts
import type { AppState, PlantFamily, TaskTypeId } from '../lib/types';
import { addBridgeTen } from './addBridgeTen';
import { decompose } from './decompose';
import { fillTen } from './fillTen';
import type { AnyTask, TaskGenerator } from './model';

export interface TaskTypeDef {
  id: TaskTypeId;
  label: string;
  family: PlantFamily;
  generator: TaskGenerator<AnyTask>;
  praise: readonly string[];
  unlocked(levels: AppState['levels']): boolean;
}

export const TASK_TYPES: Record<TaskTypeId, TaskTypeDef> = {
  decompose: {
    id: 'decompose',
    label: 'Zahlen zerlegen',
    family: 'flower',
    generator: decompose,
    praise: ['Du hast genau hingeschaut!', 'Prima zerlegt!', 'Du kennst die Zahl in- und auswendig!'],
    unlocked: () => true,
  },
  fillTen: {
    id: 'fillTen',
    label: 'Bis 10 auffüllen',
    family: 'fruit',
    generator: fillTen,
    praise: ['Verliebte Zahlen gefunden!', 'Du kennst die Zehnerpartner!', 'Genau – zusammen sind es 10!'],
    unlocked: () => true,
  },
  addBridgeTen: {
    id: 'addBridgeTen',
    label: 'Über die 10 rechnen',
    family: 'coral',
    generator: addBridgeTen,
    praise: ['Du hast zuerst die 10 voll gemacht!', 'Erst bis 10, dann weiter – super Weg!', 'Schlau über die 10 gesprungen!'],
    // Builds on both basics, so it waits until they are no longer at the entry level.
    unlocked: (levels) => levels.decompose >= 2 && levels.fillTen >= 2,
  },
};
```
`src/tasks/labels.ts`:
```ts
export function itemLabel(key: string): string {
  let m = /^decompose:(\d+):(\d+)$/.exec(key);
  if (m) return `${m[1]} = ${m[2]} + ?`;
  m = /^fillTen:(\d+)$/.exec(key);
  if (m) return `${m[1]} + ? = 10`;
  m = /^addBridgeTen:(\d+)\+(\d+)$/.exec(key);
  if (m) return `${m[1]} + ${m[2]}`;
  return key;
}
```

- [ ] **Step 6: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 7: Commit**
```bash
git add src/tasks tests/tasks
git commit -m "feat: add task generators for decompose, fill-ten and bridge-ten"
```

---

### Task 6: Round session, round finish, suggestion & daily limit

**Files:**
- Create: `src/engine/session.ts`, `src/engine/round.ts`, `src/engine/suggest.ts`
- Test: `tests/engine/session.test.ts`, `tests/engine/round.test.ts`, `tests/engine/suggest.test.ts`

**Interfaces:**
- Consumes: `TASK_TYPES` (registry), `focusItems`, `pickWeighted`, `BOX_WEIGHT`, `updateItem` (leitner), `pushHistory`, `nextLevel` (levels), `createRng`, types.
- Produces:
  - `ROUND_SIZE = 10`; `class Round { taskType; level; seed; wateringPlantId; results: TaskResult[]; current: AnyTask; get done(): boolean; get index(): number; record(r: TaskResult): void }`, constructor `new Round({ taskType, level, items, seed, wateringPlantId? })`
  - `RoundOutcome { state: AppState; plant: PlantRecord; watered: boolean; levelDelta: -1 | 0 | 1; score: { firstTry: number; total: number } }` – `plant` is the new plant, or after a watering round the grown watered plant (no new plant is planted then)
  - `plantOutcome(firstTry: number, total: number): { stage: PlantStage; pracht: boolean }`
  - `water(p: PlantRecord): PlantRecord`
  - `finishRound(state: AppState, round: FinishedRound, date: string, plantId: string): RoundOutcome` with `FinishedRound = { taskType; seed; wateringPlantId: string | null; results: readonly TaskResult[] }`
  - `makePlantId(seed: number, now?: number): string`
  - `unlockedTypes(state): TaskTypeId[]`, `roundsToday(state, date): number`, `limitReached(state, date): boolean`, `suggestType(state): TaskTypeId`

- [ ] **Step 1: Write failing tests** – `tests/engine/session.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Round, ROUND_SIZE } from '../../src/engine/session';
import type { TaskResult } from '../../src/lib/types';

const good = (r: Round): TaskResult => ({ itemKey: r.current.key, correctFirstTry: true, usedHelp: false, attempts: 0, ms: 1000 });
const bad = (r: Round): TaskResult => ({ itemKey: r.current.key, correctFirstTry: false, usedHelp: false, attempts: 1, ms: 1000 });

describe('Round', () => {
  it('serves 10 tasks of its type and then is done', () => {
    const r = new Round({ taskType: 'fillTen', level: 2, items: {}, seed: 1 });
    for (let i = 0; i < ROUND_SIZE; i++) {
      expect(r.done).toBe(false);
      expect(r.current.kind).toBe('fillTen');
      r.record(good(r));
    }
    expect(r.done).toBe(true);
    expect(r.results).toHaveLength(10);
  });
  it('never repeats the same item twice in a row', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = new Round({ taskType: 'decompose', level: 1, items: {}, seed });
      let prev = '';
      while (!r.done) {
        expect(r.current.key).not.toBe(prev);
        prev = r.current.key;
        r.record(good(r));
      }
    }
  });
  it('serves an easier task after two errors in a row', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = new Round({ taskType: 'fillTen', level: 2, items: {}, seed });
      r.record(bad(r));
      r.record(bad(r));
      expect(r.current.kind === 'fillTen' && r.current.missing).toBeLessThanOrEqual(3);
    }
  });
  it('mixes in shaky items from the leitner boxes', () => {
    const items = { 'fillTen:3': { box: 1 as const, wrong: 2, lastSeen: '2026-10-01' } };
    let hits = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const r = new Round({ taskType: 'fillTen', level: 2, items, seed });
      while (!r.done) {
        if (r.current.key === 'fillTen:3') hits++;
        r.record(good(r));
      }
    }
    expect(hits).toBeGreaterThan(30);
  });
  it('is deterministic for a seed', () => {
    const keys = (seed: number) => {
      const r = new Round({ taskType: 'addBridgeTen', level: 3, items: {}, seed });
      const out: string[] = [];
      while (!r.done) { out.push(r.current.key); r.record(good(r)); }
      return out;
    };
    expect(keys(9)).toEqual(keys(9));
  });
});
```
`tests/engine/round.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { finishRound, plantOutcome, water } from '../../src/engine/round';
import { defaultState } from '../../src/store/schema';
import type { PlantRecord, TaskResult } from '../../src/lib/types';

function results(firstTry: number, opts: { helpOnFirst?: boolean } = {}): TaskResult[] {
  return Array.from({ length: 10 }, (_, i) => ({
    itemKey: `fillTen:${(i % 9) + 1}` as const,
    correctFirstTry: i < firstTry,
    usedHelp: opts.helpOnFirst === true && i === 0,
    attempts: i < firstTry ? 0 : 1,
    ms: 2000,
  }));
}
const plant = (over: Partial<PlantRecord> = {}): PlantRecord =>
  ({ id: 'p1', seed: 1, family: 'fruit', taskType: 'fillTen', stage: 3, pracht: false, date: '2026-10-01', ...over });

describe('plantOutcome', () => {
  it('maps the first-try share to stages', () => {
    expect(plantOutcome(4, 10)).toEqual({ stage: 2, pracht: false });
    expect(plantOutcome(5, 10)).toEqual({ stage: 3, pracht: false });
    expect(plantOutcome(7, 10)).toEqual({ stage: 3, pracht: false });
    expect(plantOutcome(8, 10)).toEqual({ stage: 4, pracht: false });
    expect(plantOutcome(9, 10)).toEqual({ stage: 4, pracht: false });
    expect(plantOutcome(10, 10)).toEqual({ stage: 5, pracht: true });
  });
});

describe('water', () => {
  it('grows by one stage up to 5 and never makes a Prachtpflanze', () => {
    expect(water(plant({ stage: 2 })).stage).toBe(3);
    expect(water(plant({ stage: 5 })).stage).toBe(5);
    expect(water(plant({ stage: 4 })).pracht).toBe(false);
    const p = plant({ stage: 5, pracht: true });
    expect(water(p)).toBe(p);
  });
});

describe('finishRound', () => {
  const round = (rs: TaskResult[], wateringPlantId: string | null = null) =>
    ({ taskType: 'fillTen' as const, seed: 77, wateringPlantId, results: rs });

  it('plants a Prachtpflanze only at 10/10 without help', () => {
    expect(finishRound(defaultState(), round(results(10)), '2026-10-06', 'x').plant).toMatchObject({ stage: 5, pracht: true, family: 'fruit', seed: 77 });
    expect(finishRound(defaultState(), round(results(10, { helpOnFirst: true })), '2026-10-06', 'x').plant.pracht).toBe(false);
  });
  it('appends plant and round record and remembers the type', () => {
    const o = finishRound(defaultState(), round(results(6)), '2026-10-06', 'x');
    expect(o.state.plants).toHaveLength(1);
    expect(o.state.rounds[0]).toEqual({ date: '2026-10-06', taskType: 'fillTen', firstTry: 6, total: 10, ms: 20000 });
    expect(o.state.lastTaskType).toBe('fillTen');
    expect(o.score).toEqual({ firstTry: 6, total: 10 });
  });
  it('updates leitner items', () => {
    const o = finishRound(defaultState(), round(results(0)), '2026-10-06', 'x');
    expect(o.state.items['fillTen:1']).toMatchObject({ box: 1, wrong: 1 });
  });
  it('levels up after a strong full history and resets that history', () => {
    const o = finishRound(defaultState(), round(results(9)), '2026-10-06', 'x');
    expect(o.levelDelta).toBe(1);
    expect(o.state.levels.fillTen).toBe(2);
    expect(o.state.history.fillTen).toEqual([]);
  });
  it('a watering round only grows the watered plant, no new plant', () => {
    const s = defaultState();
    s.plants.push(plant({ id: 'old', stage: 2 }));
    const o = finishRound(s, round(results(3), 'old'), '2026-10-06', 'new');
    expect(o.state.plants).toHaveLength(1);
    expect(o.state.plants[0]).toMatchObject({ id: 'old', stage: 3 });
    expect(o.watered).toBe(true);
    expect(o.plant).toMatchObject({ id: 'old', stage: 3 });
    expect(o.state.rounds).toHaveLength(1);
  });
  it('a perfect watering round still never makes a Prachtpflanze', () => {
    const s = defaultState();
    s.plants.push(plant({ id: 'old', stage: 4 }));
    const o = finishRound(s, round(results(10), 'old'), '2026-10-06', 'new');
    expect(o.plant).toMatchObject({ id: 'old', stage: 5, pracht: false });
  });
  it('plants normally when the watered plant no longer exists', () => {
    const o = finishRound(defaultState(), round(results(6), 'gone'), '2026-10-06', 'new');
    expect(o.watered).toBe(false);
    expect(o.state.plants).toHaveLength(1);
    expect(o.plant.id).toBe('new');
  });
  it('does not mutate the input state', () => {
    const s = defaultState();
    finishRound(s, round(results(10)), '2026-10-06', 'x');
    expect(s.plants).toHaveLength(0);
  });
});
```
`tests/engine/suggest.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { limitReached, suggestType, unlockedTypes } from '../../src/engine/suggest';
import { defaultState } from '../../src/store/schema';

describe('suggest', () => {
  it('starts with decompose and locks addBridgeTen', () => {
    const s = defaultState();
    expect(unlockedTypes(s)).toEqual(['decompose', 'fillTen']);
    expect(suggestType(s)).toBe('decompose');
  });
  it('avoids the type played last when alternatives exist', () => {
    const s = defaultState();
    s.lastTaskType = 'decompose';
    expect(suggestType(s)).toBe('fillTen');
  });
  it('prefers the type with the lowest first-try rate', () => {
    const s = defaultState();
    s.levels = { decompose: 2, fillTen: 2, addBridgeTen: 1 };
    s.history = { decompose: [true, true], fillTen: [true, false], addBridgeTen: [true, true, true] };
    expect(suggestType(s)).toBe('fillTen');
  });
  it('suggests a newly unlocked type with empty history first', () => {
    const s = defaultState();
    s.levels = { decompose: 2, fillTen: 2, addBridgeTen: 1 };
    s.history = { decompose: [true], fillTen: [false], addBridgeTen: [] };
    expect(suggestType(s)).toBe('addBridgeTen');
  });
  it('counts only today\'s rounds for the daily limit', () => {
    const s = defaultState();
    const r = { taskType: 'fillTen' as const, firstTry: 5, total: 10, ms: 1 };
    s.rounds = [{ ...r, date: '2026-10-05' }, { ...r, date: '2026-10-06' }, { ...r, date: '2026-10-06' }];
    expect(limitReached(s, '2026-10-06')).toBe(false);
    s.rounds.push({ ...r, date: '2026-10-06' });
    expect(limitReached(s, '2026-10-06')).toBe(true);
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL.

- [ ] **Step 3: Implement** `src/engine/session.ts`:
```ts
import { createRng, type Rng } from '../lib/rng';
import type { ItemKey, ItemStat, Level, TaskResult, TaskTypeId } from '../lib/types';
import type { AnyTask } from '../tasks/model';
import { TASK_TYPES } from '../tasks/registry';
import { BOX_WEIGHT, focusItems, pickWeighted } from './leitner';

export const ROUND_SIZE = 10;
const FOCUS_SHARE = 0.4;

export interface RoundOptions {
  taskType: TaskTypeId;
  level: Level;
  items: Record<string, ItemStat>;
  seed: number;
  wateringPlantId?: string | null;
}

export class Round {
  readonly taskType: TaskTypeId;
  readonly level: Level;
  readonly seed: number;
  readonly wateringPlantId: string | null;
  readonly results: TaskResult[] = [];
  current: AnyTask;
  private readonly items: Record<string, ItemStat>;
  private readonly rng: Rng;
  private errorStreak = 0;

  constructor(opts: RoundOptions) {
    this.taskType = opts.taskType;
    this.level = opts.level;
    this.seed = opts.seed;
    this.wateringPlantId = opts.wateringPlantId ?? null;
    this.items = opts.items;
    this.rng = createRng(opts.seed);
    this.current = this.nextTask(null);
  }

  get done(): boolean {
    return this.results.length >= ROUND_SIZE;
  }

  get index(): number {
    return this.results.length;
  }

  record(result: TaskResult): void {
    if (this.done) return;
    this.results.push(result);
    this.errorStreak = result.attempts > 0 ? this.errorStreak + 1 : 0;
    if (!this.done) this.current = this.nextTask(result.itemKey);
  }

  private nextTask(prevKey: ItemKey | null): AnyTask {
    const generator = TASK_TYPES[this.taskType].generator;
    // After two misses in a row she needs a quick success, not a review item.
    const easier = this.errorStreak >= 2;
    const focus = focusItems(this.items, this.taskType).filter((f) => f.key !== prevKey);
    let task: AnyTask | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const focusKey =
        !easier && focus.length > 0 && this.rng.chance(FOCUS_SHARE)
          ? pickWeighted(focus.map((f) => ({ value: f.key, weight: BOX_WEIGHT[f.box] })), this.rng)
          : undefined;
      task = generator.generate(this.level, this.rng, { easier, focus: focusKey });
      if (task.key !== prevKey) return task;
    }
    return task!;
  }
}
```
`src/engine/round.ts`:
```ts
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
    plant = { id: plantId, seed: round.seed, family: TASK_TYPES[type].family, taskType: type, stage, pracht, date };
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
```
`src/engine/suggest.ts`:
```ts
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
```

- [ ] **Step 4: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/engine tests/engine
git commit -m "feat: add round session, round scoring and task suggestion"
```

---

### Task 7: Procedural plant generator (palette, shapes, plant model)

**Files:**
- Create: `src/garden/palette.ts`, `src/garden/shapes.ts`, `src/garden/plant.ts`
- Test: `tests/garden/shapes.test.ts`, `tests/garden/plant.test.ts`

**Interfaces:**
- Consumes: `createRng`, `Rng`, `PlantFamily`, `PlantStage`.
- Produces:
  - `PALETTE`, `GOLD`, `GOLD_SHINE`, `DOT`, `ORANGE`, `LEAF_COLORS`, `CROWN_COLORS`, `CENTER_COLORS`, `SCENE`
  - `Pt`, `Wave { k: number; amp: number; phase: number }`, `fmt(v)`, `closedCatmullRom(points: Pt[]): string`, `polarBlob(cx, cy, radius, waves, samples?, stretchY?): string`, `lobedFlower(cx, cy, r, petals, depth, phase): string`, `leafPath(length, width, lobes, depth): string`, `ribbonPath(length, baseWidth, tipWidth, bend, samples?): string`, `starPath(cx, cy, outer, inner, points): string`, `circlePath(cx, cy, r): string`, `tulipPath(w, h): string`
  - `NodeKind`, `PlantNode { id; kind; depth; d; fill; x; y; rot; stiffness: number | null; gold: boolean; children: PlantNode[] }`, `PlantSpec { seed; family; stage; pracht }`, `VIEW = { w: 100, h: 140, baseX: 50, baseY: 134 }`, `generatePlant(spec: PlantSpec): PlantNode`, `walk(node): PlantNode[]`

Geometry convention: every node's path is drawn in local coordinates with its anchor at (0,0); "up" is negative y. A node is placed by `translate(x y) rotate(rot)` relative to its parent's anchor. Nodes with `stiffness === null` have no own spring and move only with their parent (used for parts that must stay aligned: bloom, rim, center, seeds, shine, bee stripes).

- [ ] **Step 1: Palette** – create `src/garden/palette.ts`:
```ts
export const PALETTE = {
  green: '#4E9A5B',
  pink: '#F08C9A',
  yellow: '#F5B82E',
  blue: '#2F78C4',
  redOrange: '#E2522B',
  lilac: '#9B87C4',
  cream: '#EADCB4',
  navy: '#23449A',
  olive: '#93A62B',
} as const;

export const GOLD = '#C9971E';
export const GOLD_SHINE = '#F3D57A';
export const DOT = '#1F2A44';
// The orange from the reference flower; only used for blossom centres.
export const ORANGE = '#F28C28';

export const LEAF_COLORS = [PALETTE.green, PALETTE.blue, PALETTE.olive] as const;
export const CROWN_COLORS = [PALETTE.pink, PALETTE.redOrange, PALETTE.yellow, PALETTE.lilac] as const;
export const CENTER_COLORS = [PALETTE.cream, ORANGE] as const;

export const SCENE = {
  sky: '#E4EFEA',
  sun: PALETTE.yellow,
  cloud: PALETTE.cream,
  meadow: '#A9C29A',
  grass: PALETTE.green,
  soil: '#8A5A3C',
} as const;
```

- [ ] **Step 2: Write failing tests** – `tests/garden/shapes.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { circlePath, closedCatmullRom, leafPath, polarBlob, ribbonPath, starPath, tulipPath } from '../../src/garden/shapes';

const valid = (d: string) => {
  expect(d.startsWith('M')).toBe(true);
  expect(d.endsWith('Z')).toBe(true);
  expect(d).not.toMatch(/NaN|Infinity/);
};

describe('shapes', () => {
  it('closedCatmullRom emits one cubic segment per point', () => {
    const d = closedCatmullRom([[0, 0], [10, 0], [10, 10], [0, 10]]);
    valid(d);
    expect(d.match(/C/g)).toHaveLength(4);
  });
  it('all primitives produce valid closed paths', () => {
    valid(polarBlob(0, 0, 10, [{ k: 5, amp: 0.3, phase: 1 }]));
    valid(polarBlob(0, 0, 10, [], 16, 2));
    valid(leafPath(24, 12, 5, 0.16));
    valid(ribbonPath(30, 5, 3, 4));
    valid(starPath(0, 0, 10, 4, 7));
    valid(circlePath(5, 5, 3));
    valid(tulipPath(20, 24));
  });
  it('ribbon has 2*(samples+1) outline points', () => {
    expect(ribbonPath(30, 5, 3, 4, 10).split(/[ML]/).filter(Boolean)).toHaveLength(22);
  });
  it('star alternates outer and inner vertices', () => {
    expect(starPath(0, 0, 10, 4, 6).split(/[ML]/).filter(Boolean)).toHaveLength(12);
  });
  it('is deterministic', () => {
    expect(polarBlob(1, 2, 3, [{ k: 3, amp: 0.2, phase: 0.5 }])).toBe(polarBlob(1, 2, 3, [{ k: 3, amp: 0.2, phase: 0.5 }]));
  });
});
```
`tests/garden/plant.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { generatePlant, walk, type PlantSpec } from '../../src/garden/plant';
import type { PlantFamily, PlantStage } from '../../src/lib/types';

const FAMILIES: PlantFamily[] = ['flower', 'fruit', 'coral'];
const STAGES: PlantStage[] = [2, 3, 4, 5];
const count = (spec: PlantSpec, kind: string) => walk(generatePlant(spec)).filter((n) => n.kind === kind).length;

describe('generatePlant', () => {
  it('is deterministic per seed', () => {
    const spec: PlantSpec = { seed: 123, family: 'flower', stage: 5, pracht: true };
    expect(JSON.stringify(generatePlant(spec))).toBe(JSON.stringify(generatePlant(spec)));
  });
  it('varies between seeds', () => {
    const shapes = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(generatePlant({ seed: i, family: 'coral', stage: 5, pracht: false }))));
    expect(shapes.size).toBe(20);
  });
  it('grows leaves and crowns by stage', () => {
    for (const family of FAMILIES) for (let seed = 1; seed <= 20; seed++) {
      expect(count({ seed, family, stage: 2, pracht: false }, 'leaf')).toBe(2);
      expect(count({ seed, family, stage: 3, pracht: false }, 'leaf')).toBe(4);
      expect(count({ seed, family, stage: 4, pracht: false }, 'leaf')).toBe(5);
      expect(count({ seed, family, stage: 5, pracht: false }, 'leaf')).toBe(6);
      expect(count({ seed, family, stage: 2, pracht: false }, 'crown')).toBe(0);
      expect(count({ seed, family, stage: 3, pracht: false }, 'crown')).toBe(0);
      expect(count({ seed, family, stage: 4, pracht: false }, 'crown')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: false }, 'crown')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: true }, 'crown')).toBe(2);
      expect(count({ seed, family, stage: 5, pracht: true }, 'bee')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: false }, 'bee')).toBe(0);
    }
  });
  it('has exactly one gold part on a Prachtpflanze and none otherwise', () => {
    for (const family of FAMILIES) for (let seed = 1; seed <= 40; seed++) {
      for (const stage of STAGES) {
        const nodes = walk(generatePlant({ seed, family, stage, pracht: false }));
        expect(nodes.filter((n) => n.gold)).toHaveLength(0);
      }
      const pracht = walk(generatePlant({ seed, family, stage: 5, pracht: true }));
      expect(pracht.filter((n) => n.gold)).toHaveLength(1);
      expect(pracht.some((n) => n.kind === 'shine')).toBe(true);
    }
  });
  it('produces only finite numbers and a single root at depth 0', () => {
    for (const family of FAMILIES) for (const stage of STAGES) {
      const nodes = walk(generatePlant({ seed: 9, family, stage, pracht: stage === 5 }));
      expect(JSON.stringify(nodes)).not.toMatch(/NaN|Infinity/);
      expect(nodes.filter((n) => n.depth === 0)).toHaveLength(1);
    }
  });
});
```

- [ ] **Step 3: Run** `npm test` → FAIL.

- [ ] **Step 4: Implement shapes** – `src/garden/shapes.ts`:
```ts
export type Pt = [number, number];
export interface Wave { k: number; amp: number; phase: number }

export function fmt(v: number): string {
  return String(Math.round(v * 100) / 100 || 0);
}

// Catmull-Rom through all points, closed, converted to cubic Béziers: gives the soft cut-paper edge.
export function closedCatmullRom(points: Pt[]): string {
  const n = points.length;
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(p2[0])},${fmt(p2[1])}`;
  }
  return `${d}Z`;
}

export function polarBlob(cx: number, cy: number, radius: number, waves: readonly Wave[], samples = 48, stretchY = 1): string {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    const m = 1 + waves.reduce((s, w) => s + w.amp * Math.sin(w.k * a + w.phase), 0);
    const r = radius * Math.max(0.15, m);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a) * stretchY]);
  }
  return closedCatmullRom(pts);
}

export function lobedFlower(cx: number, cy: number, r: number, petals: number, depth: number, phase: number): string {
  return polarBlob(cx, cy, r, [{ k: petals, amp: depth, phase }], Math.max(48, petals * 12));
}

/** Leaf with its base at (0,0), pointing up. */
export function leafPath(length: number, width: number, lobes: number, depth: number): string {
  return polarBlob(0, -length / 2, width / 2, [{ k: lobes, amp: depth, phase: Math.PI / 2 }], 48, length / width);
}

/** Tapered stem from (0,0) to (bend, -length), curving along a parabola. */
export function ribbonPath(length: number, baseWidth: number, tipWidth: number, bend: number, samples = 10): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const cx = bend * t * t, cy = -length * t;
    const tx = 2 * bend * t, ty = -length;
    const len = Math.hypot(tx, ty);
    const nx = -ty / len, ny = tx / len;
    const w = (baseWidth + (tipWidth - baseWidth) * t) / 2;
    left.push(`${fmt(cx - nx * w)},${fmt(cy - ny * w)}`);
    right.push(`${fmt(cx + nx * w)},${fmt(cy + ny * w)}`);
  }
  return `M${[...left, ...right.reverse()].join('L')}Z`;
}

export function starPath(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${fmt(cx + r * Math.cos(a))},${fmt(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

export function circlePath(cx: number, cy: number, r: number): string {
  return `M${fmt(cx - r)},${fmt(cy)}a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(2 * r)},0a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(-2 * r)},0Z`;
}

/** Three-tipped tulip cup with its base at (0,0). */
export function tulipPath(w: number, h: number): string {
  const x = w / 2;
  return (
    `M${fmt(-x)},${fmt(-h * 0.25)}L${fmt(-x)},${fmt(-h)}L${fmt(-x / 3)},${fmt(-h * 0.72)}L0,${fmt(-h)}` +
    `L${fmt(x / 3)},${fmt(-h * 0.72)}L${fmt(x)},${fmt(-h)}L${fmt(x)},${fmt(-h * 0.25)}` +
    `Q${fmt(x)},0 0,0Q${fmt(-x)},0 ${fmt(-x)},${fmt(-h * 0.25)}Z`
  );
}
```

- [ ] **Step 5: Implement plant** – `src/garden/plant.ts`:
```ts
import { createRng, type Rng } from '../lib/rng';
import type { PlantFamily, PlantStage } from '../lib/types';
import { CENTER_COLORS, CROWN_COLORS, DOT, GOLD, GOLD_SHINE, LEAF_COLORS, PALETTE } from './palette';
import { circlePath, leafPath, lobedFlower, polarBlob, ribbonPath, starPath, tulipPath } from './shapes';

export type NodeKind =
  | 'stem' | 'leaf' | 'crown' | 'bloom' | 'rim' | 'center' | 'seeds' | 'calyx' | 'bee' | 'wing' | 'stripe' | 'shine';

export interface PlantNode {
  id: string;
  kind: NodeKind;
  depth: number;
  d: string;
  fill: string;
  x: number;
  y: number;
  rot: number;
  /** null = no own spring; the node only moves with its parent. */
  stiffness: number | null;
  gold: boolean;
  children: PlantNode[];
}

export interface PlantSpec { seed: number; family: PlantFamily; stage: PlantStage; pracht: boolean }

export const VIEW = { w: 100, h: 140, baseX: 50, baseY: 134 } as const;

type CrownStyle = 'petal' | 'round' | 'tulip' | 'cherries' | 'lemon' | 'tomato' | 'coralFan' | 'star';
type GoldPart = 'center' | 'leaf' | 'bee' | 'rim';
interface CrownParams { petals: number; depth: number; phase: number; roundPetals: number; coralLobes: number; starPoints: number }
interface LeafStyle { lobes: number; depth: number; widthRatio: number }

const STEM_HEIGHT: Record<PlantStage, number> = { 2: 30, 3: 55, 4: 78, 5: 88 };
const SEGMENTS: Record<PlantStage, number> = { 2: 1, 3: 2, 4: 3, 5: 3 };
const LEAVES: Record<PlantStage, number> = { 2: 2, 3: 4, 4: 5, 5: 6 };
const LEAF_LEN: Record<PlantStage, number> = { 2: 16, 3: 20, 4: 24, 5: 26 };

const CROWNS: Record<PlantFamily, CrownStyle[]> = {
  flower: ['petal', 'round', 'tulip'],
  fruit: ['cherries', 'lemon', 'tomato'],
  coral: ['coralFan', 'star'],
};
const LEAF_STYLES: Record<PlantFamily, LeafStyle[]> = {
  flower: [{ lobes: 5, depth: 0.16, widthRatio: 0.55 }, { lobes: 2, depth: 0.04, widthRatio: 0.45 }],
  fruit: [{ lobes: 2, depth: 0.03, widthRatio: 0.5 }, { lobes: 3, depth: 0.08, widthRatio: 0.6 }],
  coral: [{ lobes: 7, depth: 0.3, widthRatio: 0.5 }, { lobes: 9, depth: 0.22, widthRatio: 0.4 }],
};

const round2 = (v: number) => Math.round(v * 100) / 100 || 0;
const clamp01 = (v: number) => Math.min(1, Math.max(0.05, v));

export function walk(node: PlantNode): PlantNode[] {
  return [node, ...node.children.flatMap(walk)];
}

function crownColorFor(style: CrownStyle, rng: Rng): string {
  if (style === 'lemon') return PALETTE.yellow;
  if (style === 'tomato') return PALETTE.redOrange;
  if (style === 'cherries') return rng.pick([PALETTE.pink, PALETTE.redOrange]);
  return rng.pick(CROWN_COLORS);
}

// `R` positions the shape, `grow` only scales its size: the gold rim reuses the same params slightly larger.
function crownPath(style: CrownStyle, p: CrownParams, R: number, grow: number): string {
  const s = R * grow;
  switch (style) {
    case 'petal': return lobedFlower(0, -R, s, p.petals, p.depth, p.phase);
    case 'round': return lobedFlower(0, -R, s, p.roundPetals, 0.12, p.phase);
    case 'tulip': return tulipPath(s * 1.5, s * 1.7);
    case 'cherries': return circlePath(-R * 0.5, R * 0.25, s * 0.5) + circlePath(R * 0.5, R * 0.45, s * 0.5);
    case 'lemon': return polarBlob(0, -R * 0.9, s * 0.95, [{ k: 2, amp: 0.12, phase: Math.PI / 2 }], 48, 0.72);
    case 'tomato': return polarBlob(0, -R, s, [{ k: 6, amp: 0.04, phase: p.phase }], 48, 0.88);
    case 'coralFan':
      return polarBlob(0, -R * 1.1, s, [{ k: p.coralLobes, amp: 0.3, phase: p.phase }, { k: 2, amp: 0.08, phase: 0 }], 72, 1.15);
    case 'star': return starPath(0, -R, s * 1.05, s * 0.45, p.starPoints);
  }
}

export function generatePlant(spec: PlantSpec): PlantNode {
  const rng = createRng(spec.seed);
  let counter = 0;
  const node = (kind: NodeKind, depth: number, d: string, fill: string, x: number, y: number, rot: number, stiffness: number | null): PlantNode => ({
    id: `${kind}-${counter++}`, kind, depth, d, fill, x: round2(x), y: round2(y), rot: round2(rot), stiffness, gold: false, children: [],
  });
  const shine = (x: number, y: number, r: number, depth: number) =>
    node('shine', depth, polarBlob(x, y, r, [], 16, 2.2), GOLD_SHINE, 0, 0, 0, null);

  const style = rng.pick(CROWNS[spec.family]);
  const leafStyle = rng.pick(LEAF_STYLES[spec.family]);
  const leafColor = rng.pick(LEAF_COLORS);
  const stemColor = leafColor === PALETTE.green ? PALETTE.olive : PALETTE.green;
  const crownColor = crownColorFor(style, rng);
  // Warm crowns get a cream centre so centre and petals never blur together.
  const centerColor = crownColor === PALETTE.yellow || crownColor === PALETTE.redOrange ? PALETTE.cream : rng.pick(CENTER_COLORS);
  const params: CrownParams = {
    petals: rng.int(5, 8),
    depth: 0.3 + rng.next() * 0.12,
    phase: rng.next() * Math.PI * 2,
    roundPetals: rng.int(8, 10),
    coralLobes: rng.int(5, 7),
    starPoints: rng.int(8, 10),
  };
  const hasCenter = style === 'petal' || style === 'round';
  const goldPart: GoldPart | null = spec.pracht
    ? rng.pick<GoldPart>(hasCenter ? ['center', 'leaf', 'bee', 'rim'] : ['leaf', 'bee', 'rim'])
    : null;

  const stage = spec.stage;
  const segCount = SEGMENTS[stage];
  const segLen = STEM_HEIGHT[stage] / segCount;
  const curve = rng.int(-8, 8);
  const segments: { node: PlantNode; bend: number }[] = [];
  for (let i = 0; i < segCount; i++) {
    const width = 5.5 - i * 1.3;
    const bend = (curve / segCount) * (0.6 + rng.next() * 0.8);
    const prev = segments[i - 1];
    const n = node(
      'stem', i, ribbonPath(segLen + 1, width, width - 1.3, bend), stemColor,
      prev ? prev.bend : VIEW.baseX, prev ? -segLen : VIEW.baseY, prev ? rng.int(-5, 5) : 0,
      clamp01(0.9 - i * 0.2 + (rng.next() - 0.5) * 0.1),
    );
    segments.push({ node: n, bend });
  }

  const leafCount = LEAVES[stage];
  const leaves: { node: PlantNode; length: number; width: number }[] = [];
  for (let i = 0; i < leafCount; i++) {
    const seg = segments[Math.min(segCount - 1, Math.floor((i * segCount) / leafCount))];
    const side = i % 2 === 0 ? -1 : 1;
    const t = 0.35 + rng.next() * 0.5;
    const length = LEAF_LEN[stage] + rng.int(-3, 3);
    const width = length * leafStyle.widthRatio;
    const leaf = node(
      'leaf', seg.node.depth + 1, leafPath(length, width, leafStyle.lobes, leafStyle.depth), leafColor,
      seg.bend * t * t, -segLen * t, side * rng.int(40, 65), 0.35 + rng.next() * 0.2,
    );
    seg.node.children.push(leaf);
    leaves.push({ node: leaf, length, width });
  }
  for (let i = 1; i < segCount; i++) segments[i - 1].node.children.push(segments[i].node);

  const buildCrown = (x: number, y: number, depth: number, R: number, gold: GoldPart | null): PlantNode => {
    const holder = node('crown', depth, '', 'none', x, y, rng.int(-8, 8), 0.5);
    if (gold === 'rim') {
      const rim = node('rim', depth + 1, crownPath(style, params, R, 1.14), GOLD, 0, 0, 0, null);
      rim.gold = true;
      rim.children.push(shine(-R * 1.05, -R, R * 0.1, depth + 2));
      holder.children.push(rim);
    }
    holder.children.push(node('bloom', depth + 1, crownPath(style, params, R, 1), crownColor, 0, 0, 0, null));
    if (hasCenter) {
      const r = R * (style === 'round' ? 0.42 : 0.32);
      const center = node('center', depth + 1, circlePath(0, -R, r), gold === 'center' ? GOLD : centerColor, 0, 0, 0, null);
      if (gold === 'center') {
        center.gold = true;
        center.children.push(shine(-r * 0.35, -R - r * 0.35, r * 0.3, depth + 2));
      }
      holder.children.push(center);
    }
    if (style === 'lemon') {
      let dots = '';
      for (let i = 0; i < 9; i++) {
        const a = rng.next() * Math.PI * 2, dist = rng.next() * R * 0.55;
        dots += circlePath(Math.cos(a) * dist * 1.2, -R * 0.9 + Math.sin(a) * dist * 0.6, 0.9);
      }
      holder.children.push(node('seeds', depth + 1, dots, DOT, 0, 0, 0, null));
    }
    if (style === 'tomato') holder.children.push(node('calyx', depth + 1, starPath(0, -R * 1.8, R * 0.45, R * 0.15, 6), PALETTE.green, 0, 0, 0, null));
    if (style === 'cherries') holder.children.push(node('calyx', depth + 1, leafPath(R * 0.9, R * 0.45, 2, 0.03), PALETTE.green, 0, 0, 50, null));
    return holder;
  };

  const top = segments[segCount - 1];
  if (stage >= 4) {
    const R = 14 * (spec.pracht ? 1.15 : stage === 4 ? 0.55 : 1);
    top.node.children.push(buildCrown(top.bend, -segLen, top.node.depth + 1, R, goldPart));
  }

  if (spec.pracht) {
    const mid = segments[Math.max(0, segCount - 2)];
    const side = rng.chance(0.5) ? -1 : 1;
    const branchLen = 24;
    const branch = node('stem', mid.node.depth + 1, ribbonPath(branchLen, 3, 2, side * 4), stemColor, mid.bend, -segLen, side * 38, 0.4);
    branch.children.push(buildCrown(side * 4, -branchLen, branch.depth + 1, 14 * 0.8, null));
    mid.node.children.push(branch);

    const goldBee = goldPart === 'bee';
    const bee = node('bee', top.node.depth + 1, polarBlob(0, 0, 5, [], 24, 0.7), goldBee ? GOLD : PALETTE.yellow, top.bend - side * 20, -segLen - 19, rng.int(-15, 15), 0.15);
    bee.children.push(node('wing', bee.depth + 1, polarBlob(-1, -4.5, 3.2, [], 20, 0.75), PALETTE.cream, 0, 0, 0, null));
    bee.children.push(node('stripe', bee.depth + 1, 'M-1.6,-3.4L-0.4,-3.5L-0.4,3.5L-1.6,3.4ZM1.4,-3.1L2.6,-2.8L2.6,2.8L1.4,3.1Z', DOT, 0, 0, 0, null));
    if (goldBee) {
      bee.gold = true;
      bee.children.push(shine(-2.5, -1, 0.9, bee.depth + 1));
    }
    top.node.children.push(bee);
  }

  if (goldPart === 'leaf') {
    const leaf = rng.pick(leaves);
    leaf.node.fill = GOLD;
    leaf.node.gold = true;
    leaf.node.children.push(shine(-leaf.width * 0.15, -leaf.length * 0.55, leaf.width * 0.12, leaf.node.depth + 1));
  }

  return segments[0].node;
}
```

- [ ] **Step 6: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 7: Commit**
```bash
git add src/garden tests/garden
git commit -m "feat: add procedural cut-paper plant generator"
```

---

### Task 8: Sway physics and sensor adapters

**Files:**
- Create: `src/garden/sway.ts`, `src/sensors/shake.ts`, `src/sensors/tilt.ts`, `src/sensors/vibrate.ts`
- Test: `tests/garden/sway.test.ts`, `tests/sensors/shake.test.ts`

**Interfaces:**
- Produces:
  - `Spring { angle: number; vel: number }`, `MAX_BASE_DEG = 8`, `tiltToTarget(gammaDeg: number, stiffness: number, isRoot: boolean): number`, `stepSpring(s: Spring, target: number, stiffness: number, dt: number): Spring`, `smooth(prev: number, next: number, alpha: number): number`
  - `ShakeOptions`, `DEFAULT_SHAKE`, `createShakeDetector(opts?): { feed(magnitude: number, t: number): boolean }`, `motionMagnitude(e: MotionLike): number | null`, `watchShake(onShake: () => void): () => void`
  - `watchTilt(onGamma: (gamma: number) => void): () => void`, `prefersReducedMotion(): boolean`
  - `vibrate(pattern: number | number[], enabled: boolean): void`

- [ ] **Step 1: Write failing tests** – `tests/garden/sway.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MAX_BASE_DEG, smooth, stepSpring, tiltToTarget } from '../../src/garden/sway';

describe('sway', () => {
  it('clamps the root target to ±8°', () => {
    expect(tiltToTarget(90, 0.9, true)).toBe(MAX_BASE_DEG);
    expect(tiltToTarget(-90, 0.9, true)).toBe(-MAX_BASE_DEG);
    expect(tiltToTarget(0, 0.9, true)).toBe(0);
  });
  it('lets soft parts bend more than stiff ones', () => {
    expect(Math.abs(tiltToTarget(45, 0.2, false))).toBeGreaterThan(Math.abs(tiltToTarget(45, 0.9, false)));
  });
  it('settles on the target with a gentle overshoot', () => {
    let s = { angle: 0, vel: 0 };
    let peak = 0;
    for (let i = 0; i < 180; i++) {
      s = stepSpring(s, 5, 0.5, 1 / 60);
      peak = Math.max(peak, s.angle);
    }
    expect(s.angle).toBeCloseTo(5, 1);
    expect(peak).toBeGreaterThan(5);
    expect(peak).toBeLessThan(7.5);
  });
  it('stays stable for long frames (tab was in background)', () => {
    let s = { angle: 0, vel: 0 };
    for (let i = 0; i < 20; i++) s = stepSpring(s, 8, 0.15, 1);
    expect(Number.isFinite(s.angle)).toBe(true);
    expect(Math.abs(s.angle)).toBeLessThan(20);
  });
  it('smooth moves part of the way', () => {
    expect(smooth(0, 10, 0.2)).toBeCloseTo(2);
  });
});
```
`tests/sensors/shake.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createShakeDetector, motionMagnitude } from '../../src/sensors/shake';

describe('shake detector', () => {
  it('ignores a single jolt', () => {
    const d = createShakeDetector();
    expect(d.feed(15, 0)).toBe(false);
    expect(d.feed(1, 50)).toBe(false);
  });
  it('fires on two peaks within the window', () => {
    const d = createShakeDetector();
    d.feed(15, 0);
    d.feed(1, 100);
    expect(d.feed(15, 300)).toBe(true);
  });
  it('does not fire when peaks are far apart', () => {
    const d = createShakeDetector();
    d.feed(15, 0);
    d.feed(1, 100);
    expect(d.feed(15, 2000)).toBe(false);
  });
  it('counts a sustained high value only once', () => {
    const d = createShakeDetector();
    expect([d.feed(15, 0), d.feed(15, 50), d.feed(15, 100)]).toEqual([false, false, false]);
  });
});

describe('motionMagnitude', () => {
  it('prefers linear acceleration', () => {
    expect(motionMagnitude({ acceleration: { x: 3, y: 4, z: 0 }, accelerationIncludingGravity: null })).toBe(5);
  });
  it('falls back to gravity-included values minus g', () => {
    const m = motionMagnitude({ acceleration: null, accelerationIncludingGravity: { x: 0, y: 0, z: 9.81 } });
    expect(m).toBeCloseTo(0);
  });
  it('returns null without data', () => {
    expect(motionMagnitude({ acceleration: null, accelerationIncludingGravity: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL.

- [ ] **Step 3: Implement** `src/garden/sway.ts`:
```ts
export interface Spring { angle: number; vel: number }

export const MAX_BASE_DEG = 8;

export function tiltToTarget(gammaDeg: number, stiffness: number, isRoot: boolean): number {
  const g = Math.max(-45, Math.min(45, gammaDeg)) / 45;
  // Upper parts add a little bend of their own on top of the parent's rotation.
  const max = isRoot ? MAX_BASE_DEG : 1.5 + 3 * (1 - stiffness);
  return g * max;
}

export function stepSpring(s: Spring, target: number, stiffness: number, dt: number): Spring {
  const h = Math.min(dt, 0.05);
  // Softer parts get a weaker spring, so they react later and swing longer: the visible "lag upwards".
  const k = 20 + 60 * stiffness;
  const c = 2 * Math.sqrt(k) * 0.35;
  const vel = s.vel + (k * (target - s.angle) - c * s.vel) * h;
  return { angle: s.angle + vel * h, vel };
}

export function smooth(prev: number, next: number, alpha: number): number {
  return prev + (next - prev) * alpha;
}
```
`src/sensors/shake.ts`:
```ts
export interface ShakeOptions { threshold: number; peaks: number; windowMs: number }

// Low threshold on purpose: a gentle shake is enough, the phone must not fly across the room.
export const DEFAULT_SHAKE: ShakeOptions = { threshold: 11, peaks: 2, windowMs: 900 };

export function createShakeDetector(opts: ShakeOptions = DEFAULT_SHAKE) {
  let peaks: number[] = [];
  let above = false;
  return {
    feed(magnitude: number, t: number): boolean {
      if (magnitude >= opts.threshold && !above) {
        above = true;
        peaks.push(t);
      } else if (magnitude < opts.threshold * 0.6) {
        above = false;
      }
      peaks = peaks.filter((p) => t - p <= opts.windowMs);
      if (peaks.length >= opts.peaks) {
        peaks = [];
        return true;
      }
      return false;
    },
  };
}

interface Vec { x: number | null; y: number | null; z: number | null }
export interface MotionLike { acceleration: Vec | null; accelerationIncludingGravity: Vec | null }

export function motionMagnitude(e: MotionLike): number | null {
  const a = e.acceleration;
  if (a && a.x !== null && a.y !== null && a.z !== null) return Math.hypot(a.x, a.y, a.z);
  const g = e.accelerationIncludingGravity;
  if (g && g.x !== null && g.y !== null && g.z !== null) return Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
  return null;
}

export function watchShake(onShake: () => void): () => void {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return () => {};
  const detector = createShakeDetector();
  const handler = (e: DeviceMotionEvent) => {
    const m = motionMagnitude(e);
    if (m !== null && detector.feed(m, e.timeStamp)) onShake();
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
```
`src/sensors/tilt.ts`:
```ts
export function watchTilt(onGamma: (gamma: number) => void): () => void {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return () => {};
  const handler = (e: DeviceOrientationEvent) => {
    if (e.gamma !== null) onGamma(e.gamma);
  };
  window.addEventListener('deviceorientation', handler);
  return () => window.removeEventListener('deviceorientation', handler);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```
`src/sensors/vibrate.ts`:
```ts
export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}
```

- [ ] **Step 4: Run** `npm test` → PASS; `npm run check` → 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/garden/sway.ts src/sensors tests/garden/sway.test.ts tests/sensors
git commit -m "feat: add sway spring physics and sensor adapters"
```

---

### Task 9: App state and garden UI (with tilt sway and demo gallery)

**Files:**
- Create: `src/state/app.svelte.ts`, `src/garden/swayLoop.ts`, `src/garden/PlantNodeView.svelte`, `src/garden/PlantSvg.svelte`, `src/garden/Bed.svelte`, `src/garden/Background.svelte`, `src/garden/Garden.svelte`, `src/garden/DemoGallery.svelte`
- Modify: `src/App.svelte`

**Interfaces:**
- Consumes: `loadState`, `saveState` (storage), `generatePlant`, `VIEW`, `PlantNode` (plant), `stepSpring`, `tiltToTarget`, `smooth` (sway), `watchTilt`, `prefersReducedMotion` (tilt), `polarBlob`, `starPath` (shapes), `SCENE` (palette), `suggestType`, `unlockedTypes`, `limitReached` (suggest), `TASK_TYPES`, `today`.
- Produces:
  - `app: { data: AppState; storageOk: boolean }` (reactive), `commit(next: AppState): void`, `snapshot(): AppState`
  - `registerSway(svg: SVGSVGElement): () => void`
  - `<PlantSvg plant={PlantRecord} sway={boolean} />`, `<Bed plant sway onclick? />`, `<Background />`
  - `<Garden onStart={(type: TaskTypeId, wateringPlantId: string | null) => void} onParents={() => void} onPlant={(p: PlantRecord) => void} />`

No unit tests here (thin UI over tested logic); verification is visual in the browser pane.

- [ ] **Step 1: Reactive app state** – `src/state/app.svelte.ts`:
```ts
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
```

- [ ] **Step 2: Recursive plant renderer** – `src/garden/PlantNodeView.svelte`:
```svelte
<script lang="ts">
  import type { PlantNode } from './plant';
  import Self from './PlantNodeView.svelte';

  let { node }: { node: PlantNode } = $props();
</script>

<g
  data-x={node.x}
  data-y={node.y}
  data-rot={node.rot}
  data-depth={node.depth}
  data-stiffness={node.stiffness ?? undefined}
  transform="translate({node.x} {node.y}) rotate({node.rot})"
>
  {#if node.d}<path d={node.d} fill={node.fill} />{/if}
  {#each node.children as child (child.id)}
    <Self node={child} />
  {/each}
</g>
```
`src/garden/swayLoop.ts`:
```ts
import { watchTilt } from '../sensors/tilt';
import { smooth, stepSpring, tiltToTarget, type Spring } from './sway';

interface Joint { el: SVGGElement; x: number; y: number; rot: number; stiffness: number; root: boolean; spring: Spring }

// One shared animation frame loop for all visible plants instead of one per plant.
const plants = new Set<Joint[]>();
let gamma = 0;
let stopTilt: (() => void) | null = null;
let frame = 0;
let last = 0;

function tick(t: number): void {
  const dt = last ? (t - last) / 1000 : 1 / 60;
  last = t;
  for (const joints of plants) {
    for (const j of joints) {
      j.spring = stepSpring(j.spring, tiltToTarget(gamma, j.stiffness, j.root), j.stiffness, dt);
      j.el.setAttribute('transform', `translate(${j.x} ${j.y}) rotate(${(j.rot + j.spring.angle).toFixed(2)})`);
    }
  }
  frame = requestAnimationFrame(tick);
}

export function registerSway(svg: SVGSVGElement): () => void {
  const joints: Joint[] = [...svg.querySelectorAll<SVGGElement>('g[data-stiffness]')].map((el) => ({
    el,
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
    rot: Number(el.dataset.rot),
    stiffness: Number(el.dataset.stiffness),
    root: el.dataset.depth === '0',
    spring: { angle: 0, vel: 0 },
  }));
  plants.add(joints);
  if (plants.size === 1) {
    stopTilt = watchTilt((g) => (gamma = smooth(gamma, g, 0.15)));
    last = 0;
    frame = requestAnimationFrame(tick);
  }
  return () => {
    plants.delete(joints);
    if (plants.size === 0) {
      cancelAnimationFrame(frame);
      stopTilt?.();
      stopTilt = null;
    }
  };
}
```
`src/garden/PlantSvg.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { PlantRecord } from '../lib/types';
  import { generatePlant, VIEW } from './plant';
  import PlantNodeView from './PlantNodeView.svelte';
  import { registerSway } from './swayLoop';

  let { plant, sway }: { plant: PlantRecord; sway: boolean } = $props();

  const root = $derived(generatePlant({ seed: plant.seed, family: plant.family, stage: plant.stage, pracht: plant.pracht }));
  let svg: SVGSVGElement;

  onMount(() => {
    if (!sway) return;
    let unregister: (() => void) | null = null;
    // Only plants on screen are animated.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !unregister) unregister = registerSway(svg);
      else if (!entry.isIntersecting && unregister) {
        unregister();
        unregister = null;
      }
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
      unregister?.();
    };
  });
</script>

<svg bind:this={svg} class="plant" viewBox="0 0 {VIEW.w} {VIEW.h}" role="img" aria-label="Pflanze">
  {#key root}<PlantNodeView node={root} />{/key}
</svg>

<style>
  .plant { display: block; width: 100%; height: auto; overflow: visible; }
</style>
```
- [ ] **Step 3: Bed and background** – `src/garden/Bed.svelte`:
```svelte
<script lang="ts">
  import type { PlantRecord } from '../lib/types';
  import { SCENE } from './palette';
  import PlantSvg from './PlantSvg.svelte';
  import { polarBlob } from './shapes';

  let { plant, sway, onclick }: { plant: PlantRecord; sway: boolean; onclick?: () => void } = $props();
  const soil = $derived(polarBlob(50, 20, 42, [{ k: 5, amp: 0.05, phase: plant.seed % 7 }], 40, 0.32));
</script>

<button class="bed" type="button" {onclick} disabled={!onclick} aria-label="Pflanze ansehen">
  <svg class="soil" viewBox="0 0 100 40" aria-hidden="true"><path d={soil} fill={SCENE.soil} /></svg>
  <div class="plant-wrap"><PlantSvg {plant} {sway} /></div>
</button>

<style>
  .bed { position: relative; display: block; width: 100%; aspect-ratio: 100 / 150; padding: 0; border: 0; background: none; }
  .bed:disabled { cursor: default; }
  .soil { position: absolute; left: 0; bottom: 0; width: 100%; }
  .plant-wrap { position: absolute; left: 0; right: 0; bottom: 9%; }
</style>
```
`src/garden/Background.svelte`:
```svelte
<script lang="ts">
  import { SCENE } from './palette';
  import { polarBlob, starPath } from './shapes';

  const cloudA = polarBlob(80, 46, 30, [{ k: 6, amp: 0.12, phase: 0.4 }], 48, 0.5);
  const cloudB = polarBlob(250, 84, 22, [{ k: 5, amp: 0.14, phase: 1.2 }], 48, 0.5);
  const meadow = 'M0,170 C60,150 120,185 200,165 S330,150 400,172 L400,800 L0,800 Z';
  const tufts = [[40, 260], [300, 330], [150, 430], [360, 520], [80, 620], [250, 720]].map(([x, y]) => starPath(x, y, 9, 3, 7));
</script>

<svg class="bg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
  <rect width="400" height="800" fill={SCENE.sky} />
  <circle cx="330" cy="64" r="34" fill={SCENE.sun} />
  <path d={cloudA} fill={SCENE.cloud} />
  <path d={cloudB} fill={SCENE.cloud} />
  <path d={meadow} fill={SCENE.meadow} />
  {#each tufts as d, i (i)}<path {d} fill={SCENE.grass} />{/each}
</svg>

<style>
  .bg { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; }
</style>
```

- [ ] **Step 4: Garden screen** – `src/garden/Garden.svelte`:
```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { limitReached, suggestType, unlockedTypes } from '../engine/suggest';
  import { today } from '../lib/date';
  import type { PlantRecord, TaskTypeId } from '../lib/types';
  import { prefersReducedMotion } from '../sensors/tilt';
  import { app } from '../state/app.svelte';
  import { TASK_TYPES } from '../tasks/registry';
  import Background from './Background.svelte';
  import Bed from './Bed.svelte';

  let { onStart, onParents, onPlant }: {
    onStart: (type: TaskTypeId, wateringPlantId: string | null) => void;
    onParents: () => void;
    onPlant: (plant: PlantRecord) => void;
  } = $props();

  const sway = app.data.settings.tilt && !prefersReducedMotion();
  const limit = $derived(limitReached(app.data, today()));
  const suggested = $derived(suggestType(app.data));
  const types = $derived(unlockedTypes(app.data).slice(0, 3));

  let list: HTMLElement;
  onMount(async () => {
    await tick();
    list.scrollTo({ top: list.scrollHeight });
  });

  // Long press keeps the parents' area out of reach for accidental taps.
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let pressing = $state(false);
  function pressStart() {
    pressing = true;
    pressTimer = setTimeout(() => {
      pressing = false;
      onParents();
    }, 2000);
  }
  function pressEnd() {
    pressing = false;
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  }
</script>

<Background />
<div class="garden">
  <header>
    <h1>Mein Garten</h1>
    <button
      class="gear"
      class:pressing
      onpointerdown={pressStart}
      onpointerup={pressEnd}
      onpointerleave={pressEnd}
      onpointercancel={pressEnd}
      oncontextmenu={(e) => e.preventDefault()}
      aria-label="Elternbereich (2 Sekunden drücken)">⚙</button>
  </header>

  <main bind:this={list}>
    {#if app.data.plants.length === 0}
      <p class="empty">Dein Garten ist noch leer.<br />Starte deine erste Runde!</p>
    {/if}
    <div class="grid">
      {#each app.data.plants as plant (plant.id)}
        <Bed {plant} {sway} onclick={() => onPlant(plant)} />
      {/each}
    </div>
  </main>

  <footer>
    {#if limit}
      <p class="rest">Dein Garten wächst über Nacht 🌱<br />Morgen geht es weiter.</p>
    {:else}
      <button class="big" onclick={() => onStart(suggested, null)}>Weiter: {TASK_TYPES[suggested].label}</button>
      {#if types.length > 1}
        <div class="chips">
          {#each types as t (t)}
            <button class="chip" onclick={() => onStart(t, null)}>{TASK_TYPES[t].label}</button>
          {/each}
        </div>
      {/if}
    {/if}
  </footer>
</div>

<style>
  .garden { display: flex; flex-direction: column; height: 100dvh; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 0 0; }
  h1 { margin: 0; font-size: 28px; font-weight: 800; color: var(--navy); }
  .gear { width: 48px; height: 48px; border: 0; border-radius: 50%; background: var(--cream); font-size: 24px; position: relative; }
  .gear.pressing { animation: fill 2s linear forwards; }
  @keyframes fill { from { box-shadow: inset 0 0 0 0 var(--green); } to { box-shadow: inset 0 0 0 24px var(--green); } }
  main { flex: 1; overflow-y: auto; padding: 120px 0 16px; }
  .empty { text-align: center; font-size: 20px; color: var(--ink); background: var(--white); border-radius: 18px; padding: 16px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 6px; align-items: end; }
  footer { padding: 12px 0 calc(12px + env(safe-area-inset-bottom)); display: grid; gap: 10px; }
  .chips { display: flex; gap: 8px; }
  .chip { flex: 1; min-height: 48px; border: 0; border-radius: 16px; background: var(--white); font-size: 15px; font-weight: 800; padding: 6px; }
  .rest { margin: 0; text-align: center; font-size: 20px; background: var(--white); border-radius: 18px; padding: 16px; }
</style>
```
(`padding-top: 120px` on `main` keeps the first row of plants below the sky so plants stand on the meadow.)

- [ ] **Step 5: Demo gallery (dev only)** – `src/garden/DemoGallery.svelte`:
```svelte
<script lang="ts">
  import type { PlantFamily, PlantRecord, PlantStage } from '../lib/types';
  import Background from './Background.svelte';
  import Bed from './Bed.svelte';

  const families: PlantFamily[] = ['flower', 'fruit', 'coral'];
  const stages: PlantStage[] = [2, 3, 4, 5];
  const plants: PlantRecord[] = families.flatMap((family, f) =>
    [1, 2, 3].flatMap((seedBase) => [
      ...stages.map((stage) => ({ id: `${family}-${seedBase}-${stage}`, seed: seedBase * 97 + f, family, taskType: 'decompose' as const, stage, pracht: false, date: '2026-10-06' })),
      { id: `${family}-${seedBase}-p`, seed: seedBase * 97 + f, family, taskType: 'decompose' as const, stage: 5 as const, pracht: true, date: '2026-10-06' },
    ]),
  );
</script>

<Background />
<h1>Pflanzen-Galerie</h1>
<p>Je Zeile: Stufe 2 · 3 · 4 · 5 · Pracht</p>
<div class="grid">
  {#each plants as plant (plant.id)}<Bed {plant} sway={true} />{/each}
</div>

<style>
  h1, p { margin: 12px 0 4px; color: var(--navy); }
  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; padding-top: 80px; }
</style>
```

- [ ] **Step 6: App router (garden only for now)** – replace `src/App.svelte`:
```svelte
<script lang="ts">
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
</script>

{#if demo}
  <DemoGallery />
{:else}
  <Garden
    onStart={(type, wateringPlantId) => console.info('start round', type, wateringPlantId)}
    onParents={() => console.info('parents')}
    onPlant={(plant) => console.info('plant', plant.id)}
  />
{/if}
```

- [ ] **Step 7: Verify**

Run: `npm run check` → 0 errors; `npm test` → PASS.
Start the dev server (`npm run dev -- --port 5173 --strictPort`, background). Open `https://localhost:5173/?demo` in the browser pane (accept the self-signed certificate), resize to mobile (375×812), take a screenshot. Expected: 9 rows (3 families × 3 seeds) × 5 plants on soil; stage 2 = small sprout with 2 leaves, stage 4 = small blossom/fruit, stage 5 = full crown, last column has a second crown, a bee and one gold part. No horizontal scroll.
If shapes look wrong (overlapping, cut off, crowns outside the viewBox), adjust only numeric constants in `plant.ts` (`STEM_HEIGHT`, `LEAF_LEN`, crown radius `14`, bee offset) and re-run `npm test`.
Open `https://localhost:5173/` → empty garden message and a "Weiter: Zahlen zerlegen" button plus two chips.

- [ ] **Step 8: Commit**
```bash
git add src
git commit -m "feat: add garden screen with procedural plants and tilt sway"
```

---

### Task 10: Task screens, round flow, planting and watering

**Files:**
- Create: `src/tasks/components/Keypad.svelte`, `src/tasks/components/Field.svelte`, `src/tasks/components/Plates.svelte`, `src/tasks/TaskShell.svelte`, `src/tasks/views/DecomposeTask.svelte`, `src/tasks/views/FillTenTask.svelte`, `src/tasks/views/AddBridgeTenTask.svelte`, `src/screens/RoundScreen.svelte`, `src/screens/RoundEnd.svelte`, `src/garden/PlantSheet.svelte`
- Modify: `src/App.svelte`

**Interfaces:**
- Consumes: `Round`, `ROUND_SIZE` (session), `finishRound`, `makePlantId`, `RoundOutcome` (round), `TASK_TYPES`, task model types, `watchShake`, `vibrate`, `app`, `commit`, `snapshot`, `randomSeed`, `today`, `formatDateDe`, `Bed`.
- Produces:
  - `<Keypad bind:value maxLength? masked? disabled? onsubmit />`
  - `<Field cells={CellState[]} columns={5 | 10} onCellTap? />`, `<Plates count color? size? highlight? />`
  - `<TaskShell task praise praiseExtra? helpText? ready? onDone visual? />` – emits one `TaskResult` per task
  - `<RoundScreen taskType wateringPlantId vibration onFinish={(o: RoundOutcome) => void} onAbort />`, `<RoundEnd outcome vibration onDone />`, `<PlantSheet plant canWater onWater onClose />`

Answer flow (TaskShell, all task types):
1. Correct entry → next step, or (last step) praise for 1.2 s → `onDone`.
2. First wrong entry on a step → "Fast! Schau mal genau hin …", help visuals switch on, retry.
3. Second wrong entry on the same step → "So geht es:" + `task.solutionText` + "Weiter" button → `onDone`.
4. "Hilfe" button → `usedHelp = true`, help visuals on (task can no longer count as first try).

- [ ] **Step 1: Keypad** – `src/tasks/components/Keypad.svelte`:
```svelte
<script lang="ts">
  let { value = $bindable(''), maxLength = 2, masked = false, disabled = false, onsubmit }: {
    value?: string;
    maxLength?: number;
    masked?: boolean;
    disabled?: boolean;
    onsubmit: () => void;
  } = $props();

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;
  type Key = (typeof KEYS)[number];

  function press(k: Key) {
    if (disabled) return;
    if (k === 'del') value = value.slice(0, -1);
    else if (k === 'ok') {
      if (value !== '') onsubmit();
    } else if (value.length < maxLength) value += k;
  }

  // Physical keyboard support makes desktop testing possible.
  function onkeydown(e: KeyboardEvent) {
    if (/^\d$/.test(e.key)) press(e.key as Key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') press('ok');
  }
</script>

<svelte:window {onkeydown} />

<div class="display" aria-live="polite">{masked ? '•'.repeat(value.length) : value}</div>
<div class="pad">
  {#each KEYS as k (k)}
    <button
      type="button"
      class="key"
      class:ok={k === 'ok'}
      class:del={k === 'del'}
      {disabled}
      onclick={() => press(k)}
      aria-label={k === 'del' ? 'Löschen' : k === 'ok' ? 'Fertig' : k}
    >{k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}</button>
  {/each}
</div>

<style>
  .display { height: 64px; line-height: 64px; font-size: 48px; font-weight: 800; text-align: center; background: var(--white); border-radius: 18px; margin-bottom: 10px; }
  .pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .key { height: 60px; border: 0; border-radius: 18px; background: var(--white); font-size: 30px; font-weight: 800; box-shadow: 0 4px 0 var(--press-light); }
  .key:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--press-light); }
  .key.ok { background: var(--green); color: var(--white); box-shadow: 0 4px 0 var(--press); }
  .key.del { background: var(--cream); }
  .key:disabled { opacity: 0.45; }
</style>
```

- [ ] **Step 2: Field and Plates** – `src/tasks/components/Field.svelte`:
```svelte
<script lang="ts">
  import type { CellState } from '../model';

  let { cells, columns, onCellTap }: { cells: CellState[]; columns: 5 | 10; onCellTap?: (index: number) => void } = $props();

  // Zwanzigerfeld: visible gap after every 5 so the "Kraft der 5" is seen, not counted.
  const template = $derived(columns === 10 ? 'repeat(5, 1fr) 6px repeat(5, 1fr)' : 'repeat(5, 1fr)');
  const col = (i: number) => (columns === 10 ? (i % 10) + 1 + (i % 10 >= 5 ? 1 : 0) : undefined);
</script>

<div class="field" style:grid-template-columns={template}>
  {#each cells as cell, i (i)}
    {#if onCellTap}
      <button type="button" class="cell {cell}" style:grid-column={col(i)} onclick={() => onCellTap(i)} aria-label="Feld {i + 1}"></button>
    {:else}
      <span class="cell {cell}" style:grid-column={col(i)}></span>
    {/if}
  {/each}
</div>

<style>
  .field { display: grid; gap: 6px; padding: 10px; background: var(--cream); border-radius: 18px; }
  .cell { display: block; aspect-ratio: 1; border-radius: 50%; border: 0; padding: 0; background: var(--slot); transition: background-color 0.3s; }
  .cell.a { background: var(--blue); }
  .cell.b { background: var(--red-orange); }
  .cell.ghost { background: transparent; outline: 3px dashed var(--red-orange); outline-offset: -4px; }
</style>
```
`src/tasks/components/Plates.svelte`:
```svelte
<script lang="ts">
  let { count, color = 'a', size = 28, highlight = false }: { count: number; color?: 'a' | 'b'; size?: number; highlight?: boolean } = $props();
</script>

<div class="plates" class:highlight style:--size="{size}px">
  {#each Array.from({ length: count }) as _, i (i)}<span class="plate {color}"></span>{/each}
</div>

<style>
  .plates { display: grid; grid-template-columns: repeat(5, var(--size)); gap: 5px; justify-content: center; min-height: var(--size); padding: 6px; border-radius: 14px; }
  .plates.highlight { outline: 3px dashed var(--red-orange); }
  .plate { width: var(--size); height: var(--size); border-radius: 50%; }
  .plate.a { background: var(--blue); }
  .plate.b { background: var(--red-orange); }
</style>
```

- [ ] **Step 3: TaskShell** – `src/tasks/TaskShell.svelte`:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { TaskResult } from '../lib/types';
  import Keypad from './components/Keypad.svelte';
  import type { AnyTask, ShellState } from './model';

  let { task, praise, praiseExtra = '', helpText = '', ready = true, onDone, visual }: {
    task: AnyTask;
    praise: readonly string[];
    praiseExtra?: string;
    helpText?: string;
    ready?: boolean;
    onDone: (result: TaskResult) => void;
    visual?: Snippet<[ShellState]>;
  } = $props();

  let step = $state(0);
  let entry = $state('');
  let totalWrong = $state(0);
  let usedHelp = $state(false);
  let help = $state(false);
  let phase = $state<ShellState['phase']>('answer');
  let message = $state('');
  let wrongThisStep = 0;
  const started = performance.now();

  function submit() {
    const expected = task.steps[step].answer;
    if (Number(entry) === expected) {
      entry = '';
      wrongThisStep = 0;
      message = '';
      if (step < task.steps.length - 1) {
        step += 1;
        return;
      }
      phase = 'praise';
      message = totalWrong === 0 && !usedHelp ? praise[Math.floor(Math.random() * praise.length)] : 'Geschafft!';
      setTimeout(finish, 1200);
      return;
    }
    entry = '';
    totalWrong += 1;
    wrongThisStep += 1;
    help = true;
    if (wrongThisStep === 1) message = 'Fast! Schau mal genau hin …';
    else {
      phase = 'solution';
      message = 'So geht es:';
    }
  }

  function finish() {
    onDone({ itemKey: task.key, correctFirstTry: totalWrong === 0, usedHelp, attempts: totalWrong, ms: Math.round(performance.now() - started) });
  }

  function askHelp() {
    usedHelp = true;
    help = true;
  }
</script>

<div class="task">
  {#if ready}<p class="prompt">{task.steps[step].prompt}</p>{/if}
  {#if ready && task.steps.length > 1}<p class="steps">Schritt {step + 1} von {task.steps.length}</p>{/if}

  <div class="visual">{@render visual?.({ step, help, phase })}</div>

  {#if message}<p class="message" class:praise={phase === 'praise'}>{message}</p>{/if}
  {#if phase === 'praise' && praiseExtra}<p class="extra">{praiseExtra}</p>{/if}

  {#if phase === 'solution'}
    <p class="solution">{task.solutionText}</p>
    <button class="big" onclick={finish}>Weiter</button>
  {:else}
    {#if help && helpText}<p class="help-text">{helpText}</p>{/if}
    <Keypad bind:value={entry} disabled={!ready || phase !== 'answer'} onsubmit={submit} />
    <button class="secondary help" onclick={askHelp} disabled={!ready || help || phase !== 'answer'}>Hilfe</button>
  {/if}
</div>

<style>
  .task { display: grid; gap: 10px; padding: 8px 0 16px; }
  .prompt { margin: 0; font-size: 26px; font-weight: 800; text-align: center; color: var(--navy); }
  .steps { margin: 0; text-align: center; font-size: 15px; }
  .visual { display: grid; justify-items: center; gap: 8px; min-height: 40px; }
  .message { margin: 0; text-align: center; font-size: 20px; color: var(--navy); }
  .message.praise { font-size: 24px; color: var(--green); }
  .extra { margin: 0; text-align: center; font-size: 40px; font-weight: 800; color: var(--pink); }
  .solution { margin: 0; text-align: center; font-size: 34px; font-weight: 800; }
  .help-text { margin: 0; text-align: center; font-size: 18px; background: var(--white); border-radius: 14px; padding: 8px; }
  .help:disabled { opacity: 0.45; }
</style>
```

- [ ] **Step 4: Decompose view (Schüttelbox)** – `src/tasks/views/DecomposeTask.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskResult } from '../../lib/types';
  import { watchShake } from '../../sensors/shake';
  import { vibrate } from '../../sensors/vibrate';
  import Plates from '../components/Plates.svelte';
  import type { DecomposeTask } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, vibration, onDone }: {
    task: DecomposeTask;
    praise: readonly string[];
    vibration: boolean;
    onDone: (r: TaskResult) => void;
  } = $props();

  const showBox = $derived(task.level !== 4);
  let shaken = $state(false);
  let leftHidden = $state(false);
  let stopShake = () => {};

  function shake() {
    if (shaken) return;
    shaken = true;
    stopShake();
    // One short buzz per plate feels like plates clacking into the box.
    vibrate(Array.from({ length: task.total }, () => [18, 45]).flat(), vibration);
    if (task.level === 3) setTimeout(() => (leftHidden = true), 2000);
  }

  onMount(() => {
    if (task.level !== 4) stopShake = watchShake(shake);
    return () => stopShake();
  });
</script>

<TaskShell {task} {praise} ready={!showBox || shaken} {onDone}>
  {#snippet visual({ help })}
    {#if showBox}
      <div class="box">
        {#if !shaken}
          <Plates count={task.total} size={22} />
          <p class="hint">{task.total} Plättchen sind in der Box.<br />Schüttel das Handy!</p>
          <button class="secondary" onclick={shake}>oder hier tippen zum Schütteln</button>
        {:else}
          <div class="halves">
            <div class="half drop">
              {#if leftHidden}<div class="lid">{task.left}</div>{:else}<Plates count={task.left} size={22} />{/if}
            </div>
            <div class="divider"></div>
            <div class="half">
              {#if help}<Plates count={task.right} color="b" size={22} highlight />{:else}<div class="lid">?</div>{/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/snippet}
</TaskShell>

<style>
  .box { width: 100%; display: grid; gap: 8px; justify-items: center; background: var(--cream); border-radius: 20px; padding: 12px; }
  .hint { margin: 0; text-align: center; font-size: 20px; }
  .halves { display: grid; grid-template-columns: 1fr 6px 1fr; width: 100%; min-height: 110px; align-items: center; }
  .half { display: grid; justify-items: center; }
  .divider { height: 100%; background: var(--soil); border-radius: 3px; }
  .lid { width: 120px; height: 90px; display: grid; place-items: center; background: var(--olive); color: var(--white); border-radius: 16px; font-size: 44px; font-weight: 800; }
  .drop { animation: drop 0.5s ease-out; }
  @keyframes drop { from { transform: translateY(-30px); opacity: 0; } }
</style>
```

- [ ] **Step 5: Fill-ten view** – `src/tasks/views/FillTenTask.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskResult } from '../../lib/types';
  import Field from '../components/Field.svelte';
  import type { CellState, FillTenTask } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, onDone }: { task: FillTenTask; praise: readonly string[]; onDone: (r: TaskResult) => void } = $props();

  let placed = $state<number[]>([]);
  let flashHidden = $state(false);

  onMount(() => {
    if (task.level !== 3) return;
    const t = setTimeout(() => (flashHidden = true), 2000);
    return () => clearTimeout(t);
  });

  function cellsFor(help: boolean): CellState[] {
    return Array.from({ length: 10 }, (_, i): CellState =>
      i < task.filled ? 'a' : placed.includes(i) ? 'b' : help ? 'ghost' : 'empty',
    );
  }

  function toggle(i: number) {
    if (i < task.filled) return;
    placed = placed.includes(i) ? placed.filter((p) => p !== i) : [...placed, i];
  }
</script>

<TaskShell {task} {praise} praiseExtra={`${task.filled} ❤ ${task.missing}`} {onDone}>
  {#snippet visual({ help })}
    {#if task.level === 4 && !help}
      <!-- symbolic level: digits only -->
    {:else if task.level === 3 && flashHidden && !help}
      <div class="covered">?</div>
    {:else}
      <Field cells={cellsFor(help)} columns={5} onCellTap={task.level === 1 ? toggle : undefined} />
      {#if task.level === 1}<p class="hint">Tipp: Du kannst Plättchen in die leeren Felder legen.</p>{/if}
    {/if}
  {/snippet}
</TaskShell>

<style>
  .covered { width: 220px; height: 100px; display: grid; place-items: center; background: var(--olive); color: var(--white); border-radius: 18px; font-size: 48px; font-weight: 800; }
  .hint { margin: 0; font-size: 16px; text-align: center; }
</style>
```

- [ ] **Step 6: Bridge-ten view** – `src/tasks/views/AddBridgeTenTask.svelte`:
```svelte
<script lang="ts">
  import type { TaskResult } from '../../lib/types';
  import Field from '../components/Field.svelte';
  import Plates from '../components/Plates.svelte';
  import type { AddBridgeTenTask, CellState } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, onDone }: { task: AddBridgeTenTask; praise: readonly string[]; onDone: (r: TaskResult) => void } = $props();

  // Row 1 = cells 0..9, row 2 = cells 10..19.
  function cellsFor(step: number, full: boolean, help: boolean): CellState[] {
    const tenFilled = full || (task.guided && step >= 1);
    return Array.from({ length: 20 }, (_, i): CellState => {
      if (i < task.a) return 'a';
      if (i < 10) return tenFilled ? 'b' : help && task.guided ? 'ghost' : 'empty';
      if (i < 10 + task.rest) return full ? 'b' : 'empty';
      return 'empty';
    });
  }

  const helpText = $derived(task.guided ? '' : `Erst ${task.toTen} bis zur 10, dann noch ${task.rest}: ${task.a} + ${task.toTen} + ${task.rest}`);
</script>

<TaskShell {task} {praise} {helpText} {onDone}>
  {#snippet visual({ step, help, phase })}
    {@const full = phase !== 'answer' || (task.guided ? step >= 2 : help)}
    {#if task.level < 4 || help || phase !== 'answer'}
      <Field cells={cellsFor(step, full, help)} columns={10} />
      {#if task.level === 1 && !full}
        <div class="waiting">
          <span class="plus">+</span>
          <Plates count={step === 1 ? task.rest : task.b} color="b" size={22} />
        </div>
      {/if}
    {/if}
  {/snippet}
</TaskShell>

<style>
  .waiting { display: flex; align-items: center; gap: 6px; }
  .plus { font-size: 32px; font-weight: 800; }
</style>
```

- [ ] **Step 7: Round screen** – `src/screens/RoundScreen.svelte`:
```svelte
<script lang="ts">
  import { finishRound, makePlantId, type RoundOutcome } from '../engine/round';
  import { Round, ROUND_SIZE } from '../engine/session';
  import { today } from '../lib/date';
  import { randomSeed } from '../lib/rng';
  import type { TaskResult, TaskTypeId } from '../lib/types';
  import { commit, snapshot } from '../state/app.svelte';
  import { TASK_TYPES } from '../tasks/registry';
  import AddBridgeTenTask from '../tasks/views/AddBridgeTenTask.svelte';
  import DecomposeTask from '../tasks/views/DecomposeTask.svelte';
  import FillTenTask from '../tasks/views/FillTenTask.svelte';

  let { taskType, wateringPlantId, vibration, onFinish, onAbort }: {
    taskType: TaskTypeId;
    wateringPlantId: string | null;
    vibration: boolean;
    onFinish: (outcome: RoundOutcome) => void;
    onAbort: () => void;
  } = $props();

  const start = snapshot();
  const round = new Round({ taskType, level: start.levels[taskType], items: start.items, seed: randomSeed(), wateringPlantId });
  const praise = TASK_TYPES[taskType].praise;
  let task = $state(round.current);
  let index = $state(0);
  let confirmAbort = $state(false);

  function done(result: TaskResult) {
    round.record(result);
    if (round.done) {
      const outcome = finishRound(snapshot(), round, today(), makePlantId(round.seed));
      commit(outcome.state);
      onFinish(outcome);
    } else {
      task = round.current;
      index = round.index;
    }
  }
</script>

<div class="round">
  <header>
    {#if confirmAbort}
      <span>Wirklich aufhören? Dann wächst keine Pflanze.</span>
      <button class="mini" onclick={onAbort}>Ja</button>
      <button class="mini" onclick={() => (confirmAbort = false)}>Nein</button>
    {:else}
      <button class="mini close" onclick={() => (confirmAbort = true)} aria-label="Runde abbrechen">×</button>
      <div class="dots" aria-label="Aufgabe {index + 1} von {ROUND_SIZE}">
        {#each Array.from({ length: ROUND_SIZE }) as _, i (i)}<span class="dot" class:done={i < index} class:current={i === index}></span>{/each}
      </div>
    {/if}
  </header>

  {#key index}
    {#if task.kind === 'decompose'}
      <DecomposeTask {task} {praise} {vibration} onDone={done} />
    {:else if task.kind === 'fillTen'}
      <FillTenTask {task} {praise} onDone={done} />
    {:else}
      <AddBridgeTenTask {task} {praise} onDone={done} />
    {/if}
  {/key}
</div>

<style>
  .round { min-height: 100dvh; background: var(--sky); }
  header { display: flex; align-items: center; gap: 10px; padding: 12px 0 4px; min-height: 60px; }
  .mini { min-width: 44px; height: 44px; border: 0; border-radius: 14px; background: var(--cream); font-size: 20px; font-weight: 800; }
  .close { font-size: 28px; }
  .dots { flex: 1; display: flex; gap: 6px; justify-content: center; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--white); }
  .dot.done { background: var(--green); }
  .dot.current { background: var(--yellow); }
</style>
```

- [ ] **Step 8: Round end** – `src/screens/RoundEnd.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { RoundOutcome } from '../engine/round';
  import Background from '../garden/Background.svelte';
  import Bed from '../garden/Bed.svelte';
  import { vibrate } from '../sensors/vibrate';

  let { outcome, vibration, onDone }: { outcome: RoundOutcome; vibration: boolean; onDone: () => void } = $props();

  onMount(() => {
    if (outcome.plant.pracht) vibrate([80, 60, 160], vibration);
  });
</script>

<Background />
<div class="end">
  <div class="stage" class:pracht={outcome.plant.pracht}><Bed plant={outcome.plant} sway={false} /></div>
  {#if outcome.watered}
    <h1>Deine Pflanze ist gewachsen! 💧</h1>
    <p>Jetzt ist sie auf Stufe {outcome.plant.stage} von 5.</p>
  {:else}
    <h1>{outcome.plant.pracht ? 'Eine Prachtpflanze!' : 'Deine Pflanze wächst!'}</h1>
  {/if}
  <p>
    {outcome.plant.pracht
      ? 'Alle 10 Aufgaben beim ersten Mal richtig – mit goldenem Glanz!'
      : `Du hast 10 Aufgaben geübt. ${outcome.score.firstTry} davon klappten gleich beim ersten Mal.`}
  </p>
  {#if outcome.levelDelta > 0}<p class="level">Du bist eine Stufe weiter! ⭐</p>{/if}
  <button class="big" onclick={onDone}>Zum Garten</button>
</div>

<style>
  .end { display: grid; gap: 12px; justify-items: center; padding: 100px 0 24px; text-align: center; }
  .stage { width: 60%; animation: plant 0.7s cubic-bezier(0.3, 1.6, 0.5, 1); transform-origin: bottom center; }
  .stage.pracht { animation-duration: 1.1s; }
  @keyframes plant { from { transform: scale(0.1); opacity: 0; } }
  h1 { margin: 0; font-size: 30px; font-weight: 800; color: var(--navy); }
  p { margin: 0; font-size: 20px; background: var(--white); border-radius: 16px; padding: 10px 14px; }
  .level { color: var(--green); font-weight: 800; }
</style>
```

- [ ] **Step 9: Plant sheet (Gießen)** – `src/garden/PlantSheet.svelte`:
```svelte
<script lang="ts">
  import { formatDateDe } from '../lib/date';
  import type { PlantRecord } from '../lib/types';
  import { TASK_TYPES } from '../tasks/registry';
  import Bed from './Bed.svelte';

  let { plant, canWater, onWater, onClose }: { plant: PlantRecord; canWater: boolean; onWater: () => void; onClose: () => void } = $props();

  const waterable = $derived(!plant.pracht && plant.stage < 5);
</script>

<button class="backdrop" aria-label="Schließen" onclick={onClose}></button>
<div class="sheet" role="dialog" aria-label="Pflanze">
  <div class="preview"><Bed {plant} sway={false} /></div>
  <p class="type">{TASK_TYPES[plant.taskType].label}</p>
  <p>{formatDateDe(plant.date)} · {plant.pracht ? 'Prachtpflanze ✨' : `Stufe ${plant.stage} von 5`}</p>
  {#if waterable && canWater}
    <button class="big" onclick={onWater}>💧 Gießen</button>
  {:else if waterable}
    <p>Morgen kannst du sie wieder gießen.</p>
  {/if}
  <button class="secondary" onclick={onClose}>Schließen</button>
</div>

<style>
  .backdrop { position: fixed; inset: 0; border: 0; background: rgba(31, 42, 68, 0.35); }
  .sheet { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: min(480px, 100%); display: grid; gap: 10px; padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); background: var(--sky); border-radius: 24px 24px 0 0; text-align: center; }
  .preview { width: 40%; justify-self: center; }
  p { margin: 0; font-size: 18px; }
  .type { font-size: 22px; font-weight: 800; color: var(--navy); }
</style>
```

- [ ] **Step 10: App router with rounds** – replace `src/App.svelte`:
```svelte
<script lang="ts">
  import type { RoundOutcome } from './engine/round';
  import { limitReached } from './engine/suggest';
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';
  import PlantSheet from './garden/PlantSheet.svelte';
  import { today } from './lib/date';
  import type { PlantRecord, TaskTypeId } from './lib/types';
  import RoundEnd from './screens/RoundEnd.svelte';
  import RoundScreen from './screens/RoundScreen.svelte';
  import { app } from './state/app.svelte';

  type Screen =
    | { name: 'garden' }
    | { name: 'round'; taskType: TaskTypeId; wateringPlantId: string | null }
    | { name: 'roundEnd'; outcome: RoundOutcome };

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
  let screen = $state<Screen>({ name: 'garden' });
  let selected = $state<PlantRecord | null>(null);

  function startRound(taskType: TaskTypeId, wateringPlantId: string | null) {
    selected = null;
    screen = { name: 'round', taskType, wateringPlantId };
  }
</script>

{#if demo}
  <DemoGallery />
{:else if screen.name === 'garden'}
  <Garden onStart={startRound} onParents={() => console.info('parents')} onPlant={(p) => (selected = p)} />
  {#if selected}
    <PlantSheet
      plant={selected}
      canWater={!limitReached(app.data, today())}
      onWater={() => startRound(selected!.taskType, selected!.id)}
      onClose={() => (selected = null)}
    />
  {/if}
{:else if screen.name === 'round'}
  <RoundScreen
    taskType={screen.taskType}
    wateringPlantId={screen.wateringPlantId}
    vibration={app.data.settings.vibration}
    onFinish={(outcome) => (screen = { name: 'roundEnd', outcome })}
    onAbort={() => (screen = { name: 'garden' })}
  />
{:else}
  <RoundEnd outcome={screen.outcome} vibration={app.data.settings.vibration} onDone={() => (screen = { name: 'garden' })} />
{/if}
```

- [ ] **Step 11: Verify**

Run: `npm run check` → 0 errors; `npm test` → PASS.
In the browser pane (mobile 375×812, `https://localhost:5173/`), play with the physical keyboard:
1. "Weiter: Zahlen zerlegen" → box with plates → tap "oder hier tippen zum Schütteln" → plates split, prompt appears → type the right answer + Enter → praise → next dot turns green.
2. Type a wrong answer once → "Fast! …" and the hidden plates appear; wrong again → "So geht es:" with `7 = 3 + 4` style text and "Weiter".
3. Finish 10 tasks → RoundEnd with plant, "Zum Garten" → plant appears in the grid.
4. Tap the plant → sheet with "💧 Gießen" (if stage < 5) → round of the same type; RoundEnd says "Deine Pflanze ist gewachsen! 💧", the garden has no extra plant and the old plant's stage is one higher (check the sheet).
5. "Bis 10 auffüllen": level 1 lets you tap empty cells; a correct answer shows "6 ❤ 4".
6. After 3 rounds the footer shows "Dein Garten wächst über Nacht 🌱" (reset via DevTools: `localStorage.clear()` + reload).
7. Unlock "Über die 10 rechnen" for testing via DevTools: `const s = JSON.parse(localStorage['garten-mathe']); s.levels.decompose = 2; s.levels.fillTen = 2; s.rounds = []; localStorage['garten-mathe'] = JSON.stringify(s); location.reload()` → chip appears; its level 1 shows 3 guided steps with waiting plates with the Zwanzigerfeld filling row 1, then row 2.
Take one screenshot per task type as evidence.

- [ ] **Step 12: Commit**
```bash
git add src
git commit -m "feat: add task screens, round flow, planting and watering"
```

---

### Task 11: Parents' area (PIN, statistics, settings, backup)

**Files:**
- Create: `src/parents/settings.ts`, `src/parents/stats.ts`, `src/parents/SetupPin.svelte`, `src/parents/PinGate.svelte`, `src/parents/Parents.svelte`
- Modify: `src/App.svelte`
- Test: `tests/parents/settings.test.ts`, `tests/parents/stats.test.ts`

**Interfaces:**
- Consumes: `AppState`, `Settings`, `TaskTypeId`, `TASK_TYPE_IDS`, `TASK_TYPES`, `itemLabel`, `addDays`, `exportState`, `importState`, `app`, `commit`, `snapshot`, `Keypad`, `today`.
- Produces:
  - `withSettings(state, patch: Partial<Settings>): AppState`, `resetLevel(state, type): AppState`
  - `TypeSummary { type; label; level; unlocked: boolean; rate: number | null; trend: 'up' | 'down' | 'flat' | null }`, `typeSummaries(state): TypeSummary[]`
  - `dailyMinutes(state, endDate: string, days?: number): { date: string; minutes: number }[]`
  - `wobblyItems(state, n?: number): { key: string; label: string; box: number; wrong: number }[]`
  - `<SetupPin title? onDone />`, `<PinGate onSuccess onCancel />`, `<Parents onClose />`

- [ ] **Step 1: Write failing tests** – `tests/parents/settings.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { resetLevel, withSettings } from '../../src/parents/settings';
import { defaultState } from '../../src/store/schema';

describe('parent settings', () => {
  it('patches settings without touching the rest', () => {
    const s = withSettings(defaultState(), { roundsPerDay: 5 });
    expect(s.settings.roundsPerDay).toBe(5);
    expect(s.settings.vibration).toBe(true);
  });
  it('resets one level and its history', () => {
    const s = defaultState();
    s.levels.fillTen = 3;
    s.history.fillTen = [true, false];
    s.levels.decompose = 2;
    const r = resetLevel(s, 'fillTen');
    expect(r.levels).toEqual({ decompose: 2, fillTen: 1, addBridgeTen: 1 });
    expect(r.history.fillTen).toEqual([]);
  });
});
```
`tests/parents/stats.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { dailyMinutes, typeSummaries, wobblyItems } from '../../src/parents/stats';
import { defaultState } from '../../src/store/schema';

describe('stats', () => {
  it('summarises each type with rate and trend', () => {
    const s = defaultState();
    s.history.decompose = [true, true, false, true];
    s.rounds = [
      { date: '2026-10-05', taskType: 'decompose', firstTry: 5, total: 10, ms: 60000 },
      { date: '2026-10-06', taskType: 'decompose', firstTry: 7, total: 10, ms: 60000 },
    ];
    const [dec, fill, bridge] = typeSummaries(s);
    expect(dec).toMatchObject({ type: 'decompose', level: 1, rate: 0.75, trend: 'up', unlocked: true });
    expect(fill.rate).toBeNull();
    expect(fill.trend).toBeNull();
    expect(bridge.unlocked).toBe(false);
  });
  it('lists 14 days of minutes ending today, oldest first', () => {
    const s = defaultState();
    s.rounds = [
      { date: '2026-10-06', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
      { date: '2026-10-06', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
      { date: '2026-09-01', taskType: 'fillTen', firstTry: 5, total: 10, ms: 90000 },
    ];
    const days = dailyMinutes(s, '2026-10-06');
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe('2026-09-23');
    expect(days[13]).toEqual({ date: '2026-10-06', minutes: 3 });
    expect(days[12].minutes).toBe(0);
  });
  it('ranks the shakiest items first and skips items without errors', () => {
    const s = defaultState();
    s.items = {
      'fillTen:6': { box: 2, wrong: 3, lastSeen: '2026-10-06' },
      'addBridgeTen:8+5': { box: 1, wrong: 1, lastSeen: '2026-10-06' },
      'decompose:7:3': { box: 1, wrong: 4, lastSeen: '2026-10-05' },
      'fillTen:2': { box: 4, wrong: 0, lastSeen: '2026-10-06' },
    };
    expect(wobblyItems(s).map((w) => w.label)).toEqual(['7 = 3 + ?', '8 + 5', '6 + ? = 10']);
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL.

- [ ] **Step 3: Implement** `src/parents/settings.ts`:
```ts
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
```
`src/parents/stats.ts`:
```ts
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
    return { date, minutes: Math.round(ms / 60000) };
  });
}

export function wobblyItems(state: AppState, n = 5): { key: string; label: string; box: number; wrong: number }[] {
  return Object.entries(state.items)
    .filter(([, v]) => v.wrong > 0)
    .sort(([, a], [, b]) => a.box - b.box || b.wrong - a.wrong || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, n)
    .map(([key, v]) => ({ key, label: itemLabel(key), box: v.box, wrong: v.wrong }));
}
```
Check the wobbly expectation by hand: box 1 items first (`decompose:7:3` wrong 4, then `addBridgeTen:8+5` wrong 1), then box 2 (`fillTen:6`); `fillTen:2` has no errors → excluded.

- [ ] **Step 4: Run** `npm test` → PASS.

- [ ] **Step 5: PIN screens** – `src/parents/SetupPin.svelte`:
```svelte
<script lang="ts">
  import { commit, snapshot } from '../state/app.svelte';
  import Keypad from '../tasks/components/Keypad.svelte';
  import { withSettings } from './settings';

  let { title = 'Willkommen bei Garten-Mathe', onDone }: { title?: string; onDone: () => void } = $props();

  let first = $state<string | null>(null);
  let entry = $state('');
  let message = $state('Eltern: Bitte eine 4-stellige PIN festlegen.');

  function submit() {
    if (entry.length !== 4) {
      message = 'Die PIN braucht 4 Ziffern.';
      return;
    }
    if (first === null) {
      first = entry;
      entry = '';
      message = 'Zur Bestätigung die PIN noch einmal eingeben.';
      return;
    }
    if (entry !== first) {
      first = null;
      entry = '';
      message = 'Die beiden PINs waren verschieden. Bitte neu festlegen.';
      return;
    }
    commit(withSettings(snapshot(), { pin: entry }));
    onDone();
  }
</script>

<div class="pin">
  <h1>{title}</h1>
  <p>{message}</p>
  <Keypad bind:value={entry} maxLength={4} masked onsubmit={submit} />
</div>

<style>
  .pin { display: grid; gap: 12px; padding: 32px 0; text-align: center; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  p { margin: 0; font-size: 18px; }
</style>
```
`src/parents/PinGate.svelte`:
```svelte
<script lang="ts">
  import { app } from '../state/app.svelte';
  import Keypad from '../tasks/components/Keypad.svelte';

  let { onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void } = $props();

  let entry = $state('');
  let message = $state('PIN eingeben');

  function submit() {
    if (entry === app.data.settings.pin) onSuccess();
    else {
      entry = '';
      message = 'Falsche PIN';
    }
  }
</script>

<div class="gate">
  <h1>Elternbereich</h1>
  <p>{message}</p>
  <Keypad bind:value={entry} maxLength={4} masked onsubmit={submit} />
  <button class="secondary" onclick={onCancel}>Zurück zum Garten</button>
</div>

<style>
  .gate { display: grid; gap: 12px; padding: 32px 0; text-align: center; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  p { margin: 0; font-size: 18px; }
</style>
```

- [ ] **Step 6: Parents screen** – before writing the 14-day bar list, load the `dataviz` skill and apply its rules for bars, labels and colours; keep it a plain HTML/CSS bar list (no chart library). `src/parents/Parents.svelte`:
```svelte
<script lang="ts">
  import { today } from '../lib/date';
  import type { TaskTypeId } from '../lib/types';
  import { commit, snapshot, app } from '../state/app.svelte';
  import { exportState, importState } from '../store/storage';
  import { resetLevel, withSettings } from './settings';
  import SetupPin from './SetupPin.svelte';
  import { dailyMinutes, typeSummaries, wobblyItems } from './stats';

  let { onClose }: { onClose: () => void } = $props();

  const summaries = $derived(typeSummaries(app.data));
  const days = $derived(dailyMinutes(app.data, today()));
  const maxMinutes = $derived(Math.max(10, ...days.map((d) => d.minutes)));
  const wobbly = $derived(wobblyItems(app.data));
  let changingPin = $state(false);
  let importMessage = $state('');

  const TREND = { up: '↗ besser', down: '↘ schwächer', flat: '→ gleich' } as const;

  function setRounds(delta: number) {
    const next = Math.min(6, Math.max(1, app.data.settings.roundsPerDay + delta));
    commit(withSettings(snapshot(), { roundsPerDay: next }));
  }

  function reset(type: TaskTypeId, label: string) {
    if (confirm(`Stufe für „${label}“ auf 1 zurücksetzen?`)) commit(resetLevel(snapshot(), type));
  }

  function exportBackup() {
    const blob = new Blob([exportState(snapshot())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garten-mathe-backup-${today()}.json`;
    a.click();
    // Revoking immediately can cancel the download on some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = importState(await file.text());
    if (!result.ok) {
      importMessage = result.error;
      return;
    }
    if (!confirm(`Backup mit ${result.state.plants.length} Pflanzen laden? Der aktuelle Stand wird ersetzt.`)) return;
    commit(result.state);
    importMessage = 'Backup geladen.';
  }
</script>

{#if changingPin}
  <SetupPin title="Neue PIN" onDone={() => (changingPin = false)} />
{:else}
  <div class="parents">
    <header>
      <h1>Elternbereich</h1>
      <button class="secondary close" onclick={onClose}>Fertig</button>
    </header>

    {#if !app.storageOk}
      <p class="warn">Speichern auf diesem Gerät klappt gerade nicht. Bitte unten ein Backup exportieren.</p>
    {/if}

    <section>
      <h2>Übersicht</h2>
      {#each summaries as s (s.type)}
        <div class="card" class:locked={!s.unlocked}>
          <strong>{s.label}</strong>
          {#if s.unlocked}
            <span>Stufe {s.level} von 4</span>
            <span>{s.rate === null ? 'noch keine Daten' : `${Math.round(s.rate * 100)} % beim 1. Versuch (letzte 10)`}</span>
            {#if s.trend}<span>{TREND[s.trend]}</span>{/if}
          {:else}
            <span>Wird freigeschaltet, wenn Zerlegen und Auffüllen Stufe 2 erreichen.</span>
          {/if}
        </div>
      {/each}
    </section>

    <section>
      <h2>Übungszeit (14 Tage)</h2>
      <div class="bars">
        {#each days as d (d.date)}
          <div class="bar-row">
            <span class="day">{d.date.slice(8)}.{d.date.slice(5, 7)}.</span>
            <span class="bar" style:width="{(d.minutes / maxMinutes) * 100}%"></span>
            <span class="min">{d.minutes} min</span>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <h2>Wackel-Aufgaben</h2>
      {#if wobbly.length === 0}
        <p>Noch keine – prima!</p>
      {:else}
        <ul>{#each wobbly as w (w.key)}<li><strong>{w.label}</strong> · {w.wrong}× falsch</li>{/each}</ul>
        <p class="tip">Gesprächstipp: Aufgabe „{wobbly[0].label}“ gemeinsam anschauen und fragen: „Wie hast du das gerechnet?“ – nach dem Rechenweg fragen, nicht nach dem Ergebnis.</p>
      {/if}
    </section>

    <section>
      <h2>Einstellungen</h2>
      <div class="row">
        <span>Runden pro Tag: <strong>{app.data.settings.roundsPerDay}</strong></span>
        <button class="mini" onclick={() => setRounds(-1)} aria-label="Weniger">−</button>
        <button class="mini" onclick={() => setRounds(1)} aria-label="Mehr">+</button>
      </div>
      <label class="row"><input type="checkbox" checked={app.data.settings.vibration} onchange={(e) => commit(withSettings(snapshot(), { vibration: e.currentTarget.checked }))} /> Vibration</label>
      <label class="row"><input type="checkbox" checked={app.data.settings.tilt} onchange={(e) => commit(withSettings(snapshot(), { tilt: e.currentTarget.checked }))} /> Pflanzen neigen sich mit dem Handy</label>
      {#each summaries as s (s.type)}
        <button class="secondary" onclick={() => reset(s.type, s.label)}>Stufe zurücksetzen: {s.label}</button>
      {/each}
      <button class="secondary" onclick={() => (changingPin = true)}>PIN ändern</button>
    </section>

    <section>
      <h2>Backup</h2>
      <p>Der Garten liegt nur auf diesem Handy. Ein Backup schützt ihn beim Handywechsel oder wenn Browserdaten gelöscht werden.</p>
      <button class="secondary" onclick={exportBackup}>Backup exportieren</button>
      <label class="secondary file">Backup importieren<input type="file" accept="application/json,.json" onchange={importBackup} /></label>
      {#if importMessage}<p>{importMessage}</p>{/if}
    </section>
  </div>
{/if}

<style>
  .parents { display: grid; gap: 16px; padding: 16px 0 32px; user-select: text; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  h2 { margin: 0 0 8px; font-size: 20px; color: var(--navy); }
  section { display: grid; gap: 8px; background: var(--white); border-radius: 18px; padding: 14px; }
  .close { width: auto; padding: 0 18px; }
  .card { display: grid; gap: 2px; padding: 8px 0; border-bottom: 2px solid var(--cream); }
  .card.locked { opacity: 0.6; }
  .warn { margin: 0; padding: 12px; border-radius: 14px; background: var(--yellow); }
  .bars { display: grid; gap: 4px; }
  .bar-row { display: grid; grid-template-columns: 52px 1fr 56px; align-items: center; gap: 8px; font-size: 14px; }
  .bar { display: block; height: 14px; min-width: 2px; border-radius: 7px; background: var(--green); }
  .min { text-align: right; }
  ul { margin: 0; padding-left: 20px; }
  .tip { margin: 0; font-size: 15px; }
  .row { display: flex; align-items: center; gap: 10px; font-size: 17px; }
  .mini { width: 44px; height: 44px; border: 0; border-radius: 14px; background: var(--cream); font-size: 22px; font-weight: 800; }
  .file { display: grid; place-items: center; }
  .file input { display: none; }
</style>
```

- [ ] **Step 7: App router (final)** – replace `src/App.svelte`:
```svelte
<script lang="ts">
  import type { RoundOutcome } from './engine/round';
  import { limitReached } from './engine/suggest';
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';
  import PlantSheet from './garden/PlantSheet.svelte';
  import { today } from './lib/date';
  import type { PlantRecord, TaskTypeId } from './lib/types';
  import Parents from './parents/Parents.svelte';
  import PinGate from './parents/PinGate.svelte';
  import SetupPin from './parents/SetupPin.svelte';
  import RoundEnd from './screens/RoundEnd.svelte';
  import RoundScreen from './screens/RoundScreen.svelte';
  import { app } from './state/app.svelte';

  type Screen =
    | { name: 'setupPin' }
    | { name: 'garden' }
    | { name: 'round'; taskType: TaskTypeId; wateringPlantId: string | null }
    | { name: 'roundEnd'; outcome: RoundOutcome }
    | { name: 'pin' }
    | { name: 'parents' };

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
  let screen = $state<Screen>(app.data.settings.pin ? { name: 'garden' } : { name: 'setupPin' });
  let selected = $state<PlantRecord | null>(null);

  function startRound(taskType: TaskTypeId, wateringPlantId: string | null) {
    selected = null;
    screen = { name: 'round', taskType, wateringPlantId };
  }
  const toGarden = () => (screen = { name: 'garden' });
</script>

{#if demo}
  <DemoGallery />
{:else if screen.name === 'setupPin'}
  <SetupPin onDone={toGarden} />
{:else if screen.name === 'garden'}
  <Garden onStart={startRound} onParents={() => (screen = { name: 'pin' })} onPlant={(p) => (selected = p)} />
  {#if selected}
    <PlantSheet
      plant={selected}
      canWater={!limitReached(app.data, today())}
      onWater={() => startRound(selected!.taskType, selected!.id)}
      onClose={() => (selected = null)}
    />
  {/if}
{:else if screen.name === 'round'}
  <RoundScreen
    taskType={screen.taskType}
    wateringPlantId={screen.wateringPlantId}
    vibration={app.data.settings.vibration}
    onFinish={(outcome) => (screen = { name: 'roundEnd', outcome })}
    onAbort={toGarden}
  />
{:else if screen.name === 'roundEnd'}
  <RoundEnd outcome={screen.outcome} vibration={app.data.settings.vibration} onDone={toGarden} />
{:else if screen.name === 'pin'}
  <PinGate onSuccess={() => (screen = { name: 'parents' })} onCancel={toGarden} />
{:else}
  <Parents onClose={toGarden} />
{/if}
```

- [ ] **Step 8: Verify**

Run: `npm run check` → 0 errors; `npm test` → PASS.
Browser pane (mobile), after `localStorage.clear()` + reload:
1. First start shows "Willkommen bei Garten-Mathe" → enter `1234` twice → garden.
2. Press the ⚙ for 2 s → PIN gate; wrong PIN → "Falsche PIN"; `1234` → Elternbereich.
3. Play one round first, then check: Übersicht shows a rate, Übungszeit has a bar for today, Wackel-Aufgaben lists items after wrong answers.
4. Runden pro Tag − / + changes the number (1–6); toggles persist after reload.
5. "Backup exportieren" downloads a JSON file; "Backup importieren" with that file shows the confirm and "Backup geladen."; importing a random JSON shows "Die Datei ist kein Garten-Mathe-Backup."

- [ ] **Step 9: Commit**
```bash
git add src tests
git commit -m "feat: add PIN-protected parents area with stats, settings and backup"
```

---

### Task 12: PWA (installable, offline) and GitHub Pages deploy

**Files:**
- Create: `public/logo.svg`, generated icons in `public/`, `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`, `index.html`, `CLAUDE.md`

**Interfaces:**
- Produces: `dist/manifest.webmanifest`, `dist/sw.js`; workflow deploying `dist/` with `BASE_PATH=/garten-mathe/`.

- [ ] **Step 1: App icon** – `public/logo.svg` (flat flower on sky, everything inside the maskable safe zone):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#E4EFEA"/>
  <path d="M0 360 C120 330 220 380 512 340 L512 512 L0 512 Z" fill="#A9C29A"/>
  <rect x="244" y="250" width="24" height="170" rx="12" fill="#4E9A5B"/>
  <ellipse cx="200" cy="330" rx="50" ry="24" transform="rotate(-30 200 330)" fill="#4E9A5B"/>
  <ellipse cx="312" cy="350" rx="50" ry="24" transform="rotate(30 312 350)" fill="#93A62B"/>
  <g fill="#F08C9A">
    <circle cx="318" cy="200" r="48"/><circle cx="287" cy="254" r="48"/><circle cx="225" cy="254" r="48"/>
    <circle cx="194" cy="200" r="48"/><circle cx="225" cy="146" r="48"/><circle cx="287" cy="146" r="48"/>
  </g>
  <circle cx="256" cy="200" r="38" fill="#F5B82E"/>
</svg>
```
Then generate PNG icons:
```powershell
npx pwa-assets-generator --preset minimal-2023 public/logo.svg
Get-ChildItem public
```
Expected in `public/`: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. If the CLI writes elsewhere or names differ, check `npx pwa-assets-generator --help` and move/rename to exactly these names. Delete `public/favicon.svg` and change the `<link rel="icon">` in `index.html` to `<link rel="icon" href="/favicon.ico" sizes="48x48" />`.

- [ ] **Step 2: PWA plugin** – before editing, open the vite-plugin-pwa 2.x docs (https://vite-pwa-org.netlify.app/guide/) and confirm the option names below still exist; adapt names only if the docs differ. Replace `vite.config.ts`:
```ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// HTTPS + host: the phone on the LAN needs a secure context for motion sensors.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    svelte(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Garten-Mathe',
        short_name: 'Garten',
        description: 'Rechnen üben bis 20 im eigenen Garten',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#E4EFEA',
        theme_color: '#4E9A5B',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'] },
    }),
  ],
  server: { host: true },
});
```

- [ ] **Step 3: Verify the build**

Run: `npm run build` → succeeds; `Get-ChildItem dist` lists `manifest.webmanifest`, `sw.js`, `registerSW.js` (or the plugin's equivalent).
Run: `npm run preview -- --port 4173 --strictPort` (background), open `https://localhost:4173/` in the browser pane, then run in the page via the JS tool: `(await navigator.serviceWorker.getRegistration())?.active?.state` → `"activated"` (reload once if `undefined`). Fetch `https://localhost:4173/manifest.webmanifest` → JSON with `"name": "Garten-Mathe"`. Stop preview.
Run: `$env:BASE_PATH='/garten-mathe/'; npm run build; Remove-Item Env:BASE_PATH` → `dist/index.html` references `/garten-mathe/assets/...`.

- [ ] **Step 4: Deploy workflow** – check the current major versions of `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, `actions/deploy-pages` on their GitHub release pages and use the latest majors (the ones below are known to exist). Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: /garten-mathe/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Add to `CLAUDE.md` under Run: `- Deploy: push to main → GitHub Actions → https://gabiwan24.github.io/garten-mathe/`.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: make the app an installable offline PWA and add Pages deploy workflow"
```

- [ ] **Step 6: Publish (outward-facing – ask the user first, do not run without an explicit yes)**

Ask: "Soll ich das öffentliche Repo `gabiwan24/garten-mathe` auf GitHub anlegen, pushen und GitHub Pages einschalten?" Only after a yes:
```bash
gh auth status
gh repo create gabiwan24/garten-mathe --public --source . --push
gh api -X POST repos/gabiwan24/garten-mathe/pages -f build_type=workflow
gh run watch --exit-status
```
If `gh` is missing or not logged in, stop and tell the user to run `gh auth login` themselves. Expected: run succeeds, `https://gabiwan24.github.io/garten-mathe/` returns 200.

---

### Task 13: Test on the phone, finish docs

**Files:**
- Modify: `docs/STATUS.md`, `docs/DECISIONS.md` (append only), `src/sensors/shake.ts` / `src/garden/sway.ts` constants only if tuning is needed

- [ ] **Step 1: Phone test over WLAN** – start `start.bat`; on the Android phone (same WLAN) open `https://<PC-IP>:<port>/` and accept the certificate warning. Find the PC IP with `ipconfig` (IPv4 of the WLAN adapter). Check and note results:
1. Shaking gently splits the plates (no need to tap the button). If it needs hard shaking, lower `DEFAULT_SHAKE.threshold` in `src/sensors/shake.ts` (e.g. 9); if it triggers while just holding the phone, raise it.
2. Vibration clacks once per plate; Prachtpflanze buzz on RoundEnd.
3. Tilting the phone in the garden bends the plants softly at every joint; nothing jitters when the phone lies still. If too strong/weak, adjust `MAX_BASE_DEG` or the non-root formula in `src/garden/sway.ts` and re-run `npm test`.
4. Keypad buttons are big enough, nothing scrolls horizontally, text readable.

- [ ] **Step 2: Install test (after Task 12 Step 6 was approved and deployed)** – open `https://gabiwan24.github.io/garten-mathe/` in Chrome on the phone → menu → "App installieren" → open from the home screen (full screen, portrait) → enable airplane mode → app still starts and the garden is still there.

- [ ] **Step 3: Docs** – overwrite `docs/STATUS.md` (≤ 40 lines) with what now works, what is next (Milestone 2: Gruppe A – Blitzblick, Zahlenstrahl & Nachbarn) and known issues found in Steps 1–2. Append any tuning decisions to `docs/DECISIONS.md` as `2026-10-DD – decision – why`.

- [ ] **Step 4: Final gate**

Run: `npm test` → all PASS; `npm run check` → 0 errors; `npm run build` → success.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "docs: update status after milestone 1 phone test"
```

---

## Spec coverage (self-review)

| Spec section | Task |
|---|---|
| 2 Rahmen (PWA, stack, Pages, localStorage, start.bat) | 1, 3, 12 |
| 4 Architektur (tasks/engine/garden/store/parents) | 3–11 |
| 5 Look, palette, natural background, garden grid, plant sheet | 7, 9, 10 |
| 5 Prozeduraler Generator, families, colour rules | 7 |
| 5 Stages, Prachtpflanze + gold detail, watering ≤ 5, never shrink | 6, 7, 10 |
| 5 Neigen (hierarchical springs, visible-only, off in tasks / reduced motion / setting) | 8, 9, 11 |
| 6 Common task rules (keypad, levels 1–4, error flow, help, no timer, process praise) | 5, 10 |
| 6.1 Schüttelbox with real shaking + fallback + vibration | 8, 10 |
| 6.2 Zehnerfeld + heart pair | 5, 10 |
| 6.3 Bridge-ten guided steps, ranges, unlock rule, first-try over all steps | 5, 6, 10 |
| 7 Engine (round of 10, suggestion, bed choice ≤ 3, levels 85/60, easier after 2 errors, Leitner, daily limit, response time only for parents) | 4, 6, 9, 11 |
| 8 Elternbereich (long press + PIN, stats, settings, backup) | 11 |
| 9 Persistence & errors (schema version, migration, lastGood, storage failure banner, no sensor) | 3, 8, 11 |
| 10 Tests (generators, engine, plant, store, manual phone) | 2–8, 13 |
