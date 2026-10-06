<script lang="ts">
  import { finishRound, makePlantId, type RoundOutcome } from '../engine/round';
  import { Round, ROUND_SIZE } from '../engine/session';
  import { today } from '../lib/date';
  import { randomSeed } from '../lib/rng';
  import type { TaskResult, TaskTypeId } from '../lib/types';
  import { commit, snapshot } from '../state/app.svelte';
  import { TASK_TYPES } from '../tasks/registry';
  import AddBridgeTenTask from '../tasks/views/AddBridgeTenTask.svelte';
  import DecomposeTask from '../tasks/views/DecomposeTask.svelte';
  import FillTenTask from '../tasks/views/FillTenTask.svelte';

  let { taskType, wateringPlantId, vibration, onFinish, onAbort }: {
    taskType: TaskTypeId;
    wateringPlantId: string | null;
    vibration: boolean;
    onFinish: (outcome: RoundOutcome) => void;
    onAbort: () => void;
  } = $props();

  // Props are fixed for the lifetime of this screen (the router remounts it per round), so capturing them once is intended.
  const start = snapshot();
  /* svelte-ignore state_referenced_locally */
  const round = new Round({ taskType, level: start.levels[taskType], items: start.items, seed: randomSeed(), wateringPlantId });
  /* svelte-ignore state_referenced_locally */
  const praise = TASK_TYPES[taskType].praise;
  let task = $state(round.current);
  let index = $state(0);
  let confirmAbort = $state(false);

  function done(result: TaskResult) {
    round.record(result);
    if (round.done) {
      const outcome = finishRound(snapshot(), round, today(), makePlantId(round.seed));
      commit(outcome.state);
      onFinish(outcome);
    } else {
      task = round.current;
      index = round.index;
    }
  }
</script>

<div class="round">
  <header>
    {#if confirmAbort}
      <span>Wirklich aufhören? Dann wächst keine Pflanze.</span>
      <button class="mini" onclick={onAbort}>Ja</button>
      <button class="mini" onclick={() => (confirmAbort = false)}>Nein</button>
    {:else}
      <button class="mini close" onclick={() => (confirmAbort = true)} aria-label="Runde abbrechen">×</button>
      <div class="dots" aria-label="Aufgabe {index + 1} von {ROUND_SIZE}">
        {#each Array.from({ length: ROUND_SIZE }) as _, i (i)}<span class="dot" class:done={i < index} class:current={i === index}></span>{/each}
      </div>
    {/if}
  </header>

  {#key index}
    {#if task.kind === 'decompose'}
      <DecomposeTask {task} {praise} {vibration} onDone={done} />
    {:else if task.kind === 'fillTen'}
      <FillTenTask {task} {praise} onDone={done} />
    {:else}
      <AddBridgeTenTask {task} {praise} onDone={done} />
    {/if}
  {/key}
</div>

<style>
  .round { min-height: 100dvh; background: var(--sky); }
  header { display: flex; align-items: center; gap: 10px; padding: 12px 0 4px; min-height: 60px; }
  .mini { min-width: 44px; height: 44px; border: 0; border-radius: 14px; background: var(--cream); font-size: 20px; font-weight: 800; }
  .close { font-size: 28px; }
  .dots { flex: 1; display: flex; gap: 6px; justify-content: center; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--white); }
  .dot.done { background: var(--green); }
  .dot.current { background: var(--yellow); }
</style>
