<script lang="ts">
  import type { CellState } from '../model';

  let { cells, columns, onCellTap }: { cells: CellState[]; columns: 5 | 10; onCellTap?: (index: number) => void } = $props();

  // Zwanzigerfeld: visible gap after every 5 so the "Kraft der 5" is seen, not counted.
  const template = $derived(columns === 10 ? 'repeat(5, 1fr) 6px repeat(5, 1fr)' : 'repeat(5, 1fr)');
  const col = (i: number) => (columns === 10 ? (i % 10) + 1 + (i % 10 >= 5 ? 1 : 0) : undefined);
</script>

<div class="field" style:grid-template-columns={template}>
  {#each cells as cell, i (i)}
    {#if onCellTap}
      <button type="button" class="cell {cell}" style:grid-column={col(i)} onclick={() => onCellTap(i)} aria-label="Feld {i + 1}"></button>
    {:else}
      <span class="cell {cell}" style:grid-column={col(i)}></span>
    {/if}
  {/each}
</div>

<style>
  .field { display: grid; width: 100%; gap: 6px; padding: 10px; background: var(--cream); border-radius: 18px; }
  .cell { display: block; aspect-ratio: 1; border-radius: 50%; border: 0; padding: 0; background: var(--slot); transition: background-color 0.3s; }
  .cell.a { background: var(--blue); }
  .cell.b { background: var(--red-orange); }
  .cell.ghost { background: transparent; outline: 3px dashed var(--red-orange); outline-offset: -4px; }
</style>
