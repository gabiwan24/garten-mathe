<script lang="ts">
  import { onMount } from 'svelte';
  import { plantSeed } from '../engine/planting';
  import Background from '../garden/Background.svelte';
  import GardenCanvas from '../garden/GardenCanvas.svelte';
  import { focusSlot } from '../garden/layout';
  import Seed from '../garden/Seed.svelte';
  import type { Slot } from '../lib/types';
  import { vibrate } from '../sensors/vibrate';
  import { app, commit, snapshot } from '../state/app.svelte';

  let { plantId, vibration, onDone }: { plantId: string; vibration: boolean; onDone: () => void } = $props();

  // Props are fixed for this screen's lifetime (the router remounts it), so reading them once is intended.
  /* svelte-ignore state_referenced_locally */
  const initial = app.data.plants.find((p) => p.id === plantId);
  // Missing or already planted: never trap the child on an empty screen.
  const invalid = !initial || initial.slot !== null;
  const pracht = initial?.pracht ?? false;

  // Scroll to the end of what is already planted, onto the first free slot there.
  const focus = focusSlot(app.data.plants);

  let marker = $state<Slot | null>(null);
  let phase = $state<'choose' | 'grown'>('choose');

  onMount(() => {
    if (invalid) onDone();
  });

  function confirm() {
    if (!marker || phase !== 'choose') return;
    const next = plantSeed(snapshot(), plantId, marker);
    // Do not claim success unless the seed really got a slot.
    if (!next.plants.find((x) => x.id === plantId)?.slot) {
      marker = null;
      return;
    }
    commit(next);
    marker = null;
    phase = 'grown';
    vibrate(pracht ? [80, 60, 160] : [30, 40, 30], vibration);
  }
</script>

<Background />
{#if !invalid}
  <div class="plant">
    <div class="banner">
      {#if phase === 'choose'}<Seed gold={pracht} size={34} bob />{/if}
      <p aria-live="polite">{phase === 'grown' ? 'Deine Pflanze wächst!' : marker ? 'Hier pflanzen?' : 'Tippe auf eine freie Erdstelle.'}</p>
    </div>

    <main>
      <GardenCanvas
        plants={app.data.plants}
        sway={false}
        pulseFree={phase === 'choose'}
        onSlot={phase === 'choose' ? (s) => (marker = s) : undefined}
        {marker}
        markerGold={pracht}
        {focus}
        growing={phase === 'grown' ? plantId : null}
      />
    </main>

    <footer>
      {#if phase === 'choose'}
        <button class="big" disabled={!marker} onclick={confirm}>Hier einpflanzen</button>
      {:else}
        <button class="big" onclick={onDone}>Zum Garten</button>
      {/if}
    </footer>
  </div>
{/if}

<style>
  .plant { display: flex; flex-direction: column; height: calc(100dvh - env(safe-area-inset-top)); }
  .banner { display: flex; align-items: center; gap: 12px; margin-top: 12px; min-height: 64px; padding: 8px 14px; background: var(--white); border-radius: 18px; }
  .banner p { margin: 0; font-size: 20px; font-weight: 800; color: var(--navy); }
  main { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
  main > :global(.scroller) { flex: none; }
  footer { padding: 12px 0 calc(12px + env(safe-area-inset-bottom)); }
  .big:disabled { background: var(--cream); color: var(--ink); opacity: 0.7; box-shadow: 0 4px 0 var(--press-light); cursor: default; }
</style>
