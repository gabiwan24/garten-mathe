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
    <!-- Level 4 veils the field (hidden but still occupying its space) so help does not move the keypad. -->
    {@const veiled = task.level === 4 && !help && phase === 'answer'}
    <div class="fieldwrap" class:veiled aria-hidden={veiled}>
      <Field cells={cellsFor(step, full, help)} columns={10} />
    </div>
    {#if task.level === 1 && !full}
      <div class="waiting">
        <span class="plus">+</span>
        <Plates count={step === 1 ? task.rest : task.b} color="b" size={22} />
      </div>
    {/if}
  {/snippet}
</TaskShell>

<style>
  .fieldwrap { width: 100%; }
  .veiled { visibility: hidden; }
  .waiting { display: flex; align-items: center; gap: 6px; }
  .plus { font-size: 32px; font-weight: 800; }
</style>
