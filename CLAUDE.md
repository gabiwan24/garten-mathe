# Garten-Mathe
Mathe-Lern-PWA (Zahlenraum 20, verliebte Zahlen, Zehnerübergang) für ein Kind der 2. Klasse; Android-Handy, Garten-Gamification.

## Run
- Start: `start.bat` (free port from 5173, HTTPS self-signed, reachable in the LAN for phone testing)
- Test: `npm test` · Type check: `npm run check`
- Build: `npm run build` (GitHub Pages build uses `BASE_PATH=/garten-mathe/`)
- Plant gallery for visual tuning (dev only): `https://localhost:<port>/?demo`
- Deploy: push to main → GitHub Actions → https://gabiwan24.github.io/garten-mathe/
- Regenerate icons from `public/logo.svg`: `npx pwa-assets-generator` (config: `pwa-assets.config.ts`)

## Stack
Vite 8 + Svelte 5 (runes) + TypeScript 6, vite-plugin-pwa, Vitest 5; no backend, localStorage only.

## Conventions
- Pure logic is framework-free and unit-tested in `tests/`; Svelte components stay thin.
- UI text German; code/comments English.
- Garden slots: `src/garden/layout.ts` (3 rows, dense grid); `slot: null` on a plant = pending seed not yet planted.
- Look: flat cut-out shapes; palette in `src/garden/palette.ts` and CSS vars in `src/app.css`.
- Pedagogy rules (do not break): no visible timers, no lives, no leaderboards, process praise only, plants never shrink, Prachtpflanze only at exactly 10/10 first try without help.

## Gotchas
- Motion sensors and the service worker need a secure context → dev server runs HTTPS (plugin-basic-ssl); accept the certificate warning on the phone once.
- Router invariant: Garden must be unmounted whenever state is committed (round, round end, parents) — swayLoop captures the plant DOM joints once at mount.
- Planting screen commits while mounted, so it must render the garden with `sway={false}`.
- vite.config.ts sets css.postcss to {} on purpose: a parent folder has a Tailwind/PostCSS config that Vite would otherwise pick up.
- Spec: docs/superpowers/specs/2026-10-06-garten-mathe-design.md · Plan: docs/superpowers/plans/2026-10-06-garten-mathe-m1.md

## Compact instructions
Preserve: current goal, changed files + why, open TODOs, unresolved errors verbatim, start/port setup.
