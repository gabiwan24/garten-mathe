<script lang="ts">
  import type { TaskResult } from '../../lib/types';
  import Field from '../components/Field.svelte';
  import Plates from '../components/Plates.svelte';
  import type { AddBridgeTenTask, CellState } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, onDone }: { task: AddBridgeTenTask; praise: readonly string[]; onDone: (r: TaskResult) => void } = $props();

  // Row 1 = cells 0..9, row 2 = cells 10..19.
  function cellsFor(step: number, full: boolean, help: boolean): CellState[] {
    const tenFilled = full || (task.guided && step >= 1);
    return Array.from({ length: 20 }, (_, i): CellState => {
      if (i < task.a) return 'a';
      if (i < 10) return tenFilled ? 'b' : help && task.guided ? 'ghost' : 'empty';
      if (i < 10 + task.rest) return full ? 'b' : 'empty';
      return 'empty';
    });
  }

  const helpText = $derived(task.guided ? '' : `Erst ${task.toTen} bis zur 10, dann noch ${task.rest}: ${task.a} + ${task.toTen} + ${task.rest}`);
</script>

<TaskShell {task} {praise} {helpText} {onDone}>
  {#snippet visual({ step, help, phase })}
    {@const full = phase !== 'answer' || (task.guided ? step >= 2 : help)}
    {#if task.level < 4 || help || phase !== 'answer'}
      <Field cells={cellsFor(step, full, help)} columns={10} />
      {#if task.level === 1 && !full}
        <div class="waiting">
          <span class="plus">+</span>
          <Plates count={step === 1 ? task.rest : task.b} color="b" size={22} />
        </div>
      {/if}
    {/if}
  {/snippet}
</TaskShell>

<style>
  .waiting { display: flex; align-items: center; gap: 6px; }
  .plus { font-size: 32px; font-weight: 800; }
</style>
