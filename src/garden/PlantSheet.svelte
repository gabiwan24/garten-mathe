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
  .backdrop { position: fixed; inset: 0; z-index: 10; border: 0; background: rgba(31, 42, 68, 0.35); }
  .sheet { position: fixed; z-index: 11; left: 50%; bottom: 0; transform: translateX(-50%); width: min(480px, 100%); display: grid; gap: 10px; padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); background: var(--sky); border-radius: 24px 24px 0 0; text-align: center; }
  .preview { width: 40%; justify-self: center; }
  p { margin: 0; font-size: 18px; }
  .type { font-size: 22px; font-weight: 800; color: var(--navy); }
</style>
