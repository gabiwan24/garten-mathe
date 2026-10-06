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
