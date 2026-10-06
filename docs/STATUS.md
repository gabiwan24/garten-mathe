# Status
_Updated: 2026-10-07_

## Now
M1 is finished on branch m1-build (17+ commits). All tasks reviewed, final review done and its fixes applied.
Open: publish to GitHub Pages (needs the user's approval, plan Task 12 Step 6) and phone test (plan Task 13).

## Works
- 3 task types with 4 levels each: Zahlen zerlegen (real shaking + tap fallback), Zehnerfeld auffüllen, Plus über die 10 (guided)
- Garden with procedural plants + tilt sway (sway loop sleeps when everything is at rest)
- Prachtpflanze (exactly 10/10 first try without help)
- Watering (grows only the watered plant)
- Leitner boxes + level engine
- Daily limit (resets over midnight via visibilitychange/focus)
- PIN-protected parents area with stats, settings, backup
- Installable offline PWA

## Next
1. Phone test: shake threshold, long press on the gear under Android, "OK" visible without scrolling at 360x640, gold-rim shine, garden header overlapping cloud/sun, battery/warmth with garden open
2. Publish repo + GitHub Pages
3. Milestone 2: Blitzblick, Zahlenstrahl & Nachbarn; sanitize() in withDefaults, downgrade protection before schema v2, Android back button via history, garden rendering for >500 plants

## Known issues
Deferred minor list:
- re-entry snap of sway after unregister
- `:global(body)` placement
- `.extra` 46 px keypad jump during the disabled praise
- "10 Aufgaben" hard-coded
- PlantSheet has no aria-modal/Escape
- decompose ms includes waiting-for-shake time
- wobbly list uses cumulative `wrong`
- trend ignores level changes
- generic conversation tip
- all Nunito woff subsets precached
- PIN stored in plain text
