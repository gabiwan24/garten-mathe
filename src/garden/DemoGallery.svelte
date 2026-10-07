<script lang="ts">
  import type { PlantFamily, PlantRecord, PlantStage } from '../lib/types';
  import Background from './Background.svelte';
  import Bed from './Bed.svelte';

  const families: PlantFamily[] = ['flower', 'fruit', 'coral'];
  const stages: PlantStage[] = [2, 3, 4, 5];
  const plants: PlantRecord[] = families.flatMap((family, f) =>
    [1, 2, 3].flatMap((seedBase) => [
      ...stages.map((stage) => ({ id: `${family}-${seedBase}-${stage}`, seed: seedBase * 97 + f, family, taskType: 'decompose' as const, stage, pracht: false, date: '2026-10-06', slot: null })),
      { id: `${family}-${seedBase}-p`, seed: seedBase * 97 + f, family, taskType: 'decompose' as const, stage: 5 as const, pracht: true, date: '2026-10-06', slot: null },
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
