<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskResult } from '../../lib/types';
  import Field from '../components/Field.svelte';
  import type { CellState, FillTenTask } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, onDone }: { task: FillTenTask; praise: readonly string[]; onDone: (r: TaskResult) => void } = $props();

  let placed = $state<number[]>([]);
  let flashHidden = $state(false);

  onMount(() => {
    if (task.level !== 3) return;
    const t = setTimeout(() => (flashHidden = true), 2000);
    return () => clearTimeout(t);
  });

  function cellsFor(help: boolean): CellState[] {
    return Array.from({ length: 10 }, (_, i): CellState =>
      i < task.filled ? 'a' : placed.includes(i) ? 'b' : help ? 'ghost' : 'empty',
    );
  }

  function toggle(i: number) {
    if (i < task.filled) return;
    placed = placed.includes(i) ? placed.filter((p) => p !== i) : [...placed, i];
  }
</script>

<TaskShell {task} {praise} praiseExtra={`${task.filled} ❤ ${task.missing}`} {onDone}>
  {#snippet visual({ help })}
    <!-- The field is veiled (hidden but still occupying its space) at the symbolic levels so help
         never changes the height of the visual area and the keypad below does not jump. -->
    {@const veiled = (task.level === 4 || (task.level === 3 && flashHidden)) && !help}
    <div class="stage">
      <div class="fieldwrap" class:veiled aria-hidden={veiled} inert={veiled}>
        <Field cells={cellsFor(help)} columns={5} onCellTap={task.level === 1 ? toggle : undefined} />
      </div>
      {#if veiled && task.level === 3}<div class="covered">?</div>{/if}
    </div>
    {#if task.level === 1}<p class="hint">Tipp: Du kannst Plättchen in die leeren Felder legen.</p>{/if}
  {/snippet}
</TaskShell>

<style>
  .stage { position: relative; width: 100%; }
  .veiled { visibility: hidden; }
  .covered { position: absolute; inset: 0; margin: auto; width: 220px; height: 100px; display: grid; place-items: center; background: var(--olive); color: var(--white); border-radius: 18px; font-size: 48px; font-weight: 800; }
  .hint { margin: 0; font-size: 16px; text-align: center; }
</style>
