# Status
_Updated: 2026-10-07_

## Now
Feature "Selbst einpflanzen + breiter Garten" is done on branch feat-planting (stacked on fix-shake, PR #2: shake fix + fullscreen).
Open: phone test, then merge.

## Works
- 3 task types with 4 levels each, Prachtpflanze (10/10 first try, no help), watering, Leitner + level engine, daily limit
- Round end gives a seed (golden for a Prachtpflanze); the child plants it on a free soil slot (marker + confirm button)
- Wide scrollable garden, 3 dense rows with stagger and row scale; pending seeds survive a closed app
- Schema v2 migration spreads existing plants over the rows
- PIN-protected parents area, backup, installable offline PWA, fullscreen manifest

## Next
1. Phone test: planting flow, scrolling, performance with many plants, gold seed, shake, fullscreen
2. Merge fix-shake (PR #2) and feat-planting; publish to GitHub Pages
3. Milestone 2 tasks: Blitzblick, Zahlenstrahl & Nachbarn; sanitize() in withDefaults, downgrade protection

## Known issues
- Android back button closes the app (no history entries yet)
- Garden renders all plants; add windowing if > ~500
- Focus uses array order, not planting order
- Non-pracht vibrate pattern (planting) not observable in a desktop browser
- Plants are narrow, so young sprouts look sparse in the wide garden
- Older minor items: sway re-entry snap, PlantSheet lacks aria-modal/Escape, "10 Aufgaben" hard-coded, PIN stored in plain text
