# Decisions
<!-- one line each: YYYY-MM-DD – decision – why. Append only. -->
2026-10-06 – Vite + Svelte 5 + TypeScript PWA, no backend – small bundle, offline-capable, free GitHub Pages hosting
2026-10-06 – Dev server over HTTPS (plugin-basic-ssl) – motion sensors require a secure context on the phone
2026-10-06 – A watering round only grows the watered plant (+1 stage, max 5), no new plant – "Gießen" should mean caring for that plant; normal rounds keep "1 Runde = 1 Pflanze"
2026-10-06 – Tap-to-place plates instead of drag (fillTen level 1) – more reliable for small fingers
2026-10-06 – "Schütteln" button always visible next to real shaking – sensor availability can't be detected before the first event
2026-10-07 – css.postcss {} in vite.config.ts – stops Vite from picking up the parent folder's Tailwind/PostCSS config
2026-10-07 – Backup import keeps the current PIN – an imported file must not lock the parents out or swap the PIN silently
2026-10-07 – Aborting a round plants nothing and does not count toward the daily limit – only finished rounds are practice
2026-10-07 – addBridgeTen unlocks when decompose and fillTen are each level ≥ 2 – the bridge needs both decomposing and filling to ten as basis
2026-10-07 – Leitner focus share 0.4 per task and only boxes ≤ 3 – weak items get repeated without making rounds feel like drills
2026-10-07 – Watering rounds count toward the daily limit – one limit for all practice keeps the daily time bounded
2026-10-07 – Maskable icon is full-bleed via pwa-assets.config.ts – Android masks crop it, so no transparent padding or white corners
2026-10-07 – Day refresh via visibilitychange/focus (clock in state/app.svelte.ts) – the daily limit resets over midnight without an app restart
2026-10-07 – Shake detector: threshold 6 m/s², re-arm 3, 3 strokes within 1 s, gravity low-pass fallback when the phone reports no linear acceleration, hint when no motion data arrives – first phone test: shaking did not trigger (old threshold 11 was too high for a gentle shake)
2026-10-07 – Manifest display fullscreen (+ display_override fullscreen→standalone) and top safe-area padding – the user wants no Android status bar; reinstall may be needed for the phone to pick up the new display mode
2026-10-07 – 3-row dense slot grid with stagger and per-row scale – many plants fit in a wide garden and the back rows read as depth
2026-10-07 – A new seed is stored immediately with `slot: null` – a closed app never loses an earned seed
2026-10-07 – Marker + confirm button instead of instant planting – taps on the dense grid are easy to miss
2026-10-07 – Golden seed for a Prachtpflanze – the reward is visible before planting while stage and species stay secret
2026-10-07 – Planting screen renders the garden without sway – it commits while mounted, which would break the router invariant (swayLoop captures DOM joints once)
2026-10-07 – Schema v2 migration distributes existing plants over the rows (slotForIndex) – old gardens fill all three rows instead of one
2026-10-07 – Pending-seed banner sits above the footer under the garden instead of at the top – keeps the header calm and the banner next to the Weiter button
2026-10-07 – No falling-seed animation: after confirm the plant grows directly from the soil – keeps it short and simple
