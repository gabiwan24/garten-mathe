<script lang="ts">
  import { onDestroy } from 'svelte';
  import { limitReached, suggestType, unlockedTypes } from '../engine/suggest';
  import type { PlantRecord, TaskTypeId } from '../lib/types';
  import { prefersReducedMotion } from '../sensors/tilt';
  import { app, clock } from '../state/app.svelte';
  import { TASK_TYPES } from '../tasks/registry';
  import Background from './Background.svelte';
  import GardenCanvas from './GardenCanvas.svelte';
  import { pendingSeed } from './layout';

  let { onStart, onParents, onPlant, onSeed }: {
    onStart: (type: TaskTypeId, wateringPlantId: string | null) => void;
    onParents: () => void;
    onPlant: (plant: PlantRecord) => void;
    onSeed: (plantId: string) => void;
  } = $props();

  const sway = app.data.settings.tilt && !prefersReducedMotion();
  const limit = $derived(limitReached(app.data, clock.day));
  const suggested = $derived(suggestType(app.data));
  const types = $derived(unlockedTypes(app.data).slice(0, 3));

  const seed = $derived(pendingSeed(app.data.plants));
  // Evaluated once: the canvas only uses it on mount.
  const focus = app.data.plants.filter((p) => p.slot !== null).at(-1)?.slot ?? null;

  // Long press keeps the parents' area out of reach for accidental taps.
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let pressing = $state(false);
  function pressStart() {
    pressEnd();
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
  onDestroy(pressEnd);
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

  <main>
    {#if app.data.plants.length === 0}
      <p class="empty">Dein Garten ist noch leer.<br />Starte deine erste Runde!</p>
    {/if}
    <GardenCanvas plants={app.data.plants} {sway} {onPlant} {focus} />
  </main>

  {#if seed}
    <button class="seed-banner" onclick={() => onSeed(seed.id)}>🌱 Du hast noch einen Samen – einpflanzen</button>
  {/if}

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
  .garden { display: flex; flex-direction: column; height: calc(100dvh - env(safe-area-inset-top)); }
  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 0 0; }
  h1 { margin: 0; font-size: 28px; font-weight: 800; color: var(--navy); }
  .gear { width: 48px; height: 48px; border: 0; border-radius: 50%; background: var(--cream); font-size: 24px; position: relative; }
  .gear.pressing { animation: fill 2s linear forwards; }
  @keyframes fill { from { box-shadow: inset 0 0 0 0 var(--green); } to { box-shadow: inset 0 0 0 24px var(--green); } }
  main { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; position: relative; }
  main > :global(.scroller) { flex: none; }
  .empty { position: absolute; top: 8px; left: 0; right: 0; z-index: 5000; margin: 0; text-align: center; font-size: 20px; color: var(--ink); background: var(--white); border-radius: 18px; padding: 16px; }
  .seed-banner { min-height: 48px; margin-top: 8px; border: 0; border-radius: 16px; background: var(--white); font-size: 16px; font-weight: 800; color: var(--navy); padding: 8px 12px; }
  footer { padding: 12px 0 calc(12px + env(safe-area-inset-bottom)); display: grid; gap: 10px; }
  .chips { display: flex; gap: 8px; }
  .chip { flex: 1; min-height: 48px; border: 0; border-radius: 16px; background: var(--white); font-size: 15px; font-weight: 800; padding: 6px; }
  .rest { margin: 0; text-align: center; font-size: 20px; background: var(--white); border-radius: 18px; padding: 16px; }
</style>
