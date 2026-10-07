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
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1)!;
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
  {#key `${plant.seed}|${plant.family}|${plant.stage}|${plant.pracht}`}<PlantNodeView node={root} />{/key}
</svg>

<style>
  .plant { display: block; width: 100%; height: auto; overflow: visible; }
</style>
