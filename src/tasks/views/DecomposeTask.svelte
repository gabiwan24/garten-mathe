<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskResult } from '../../lib/types';
  import { watchShake } from '../../sensors/shake';
  import { vibrate } from '../../sensors/vibrate';
  import Plates from '../components/Plates.svelte';
  import type { DecomposeTask } from '../model';
  import TaskShell from '../TaskShell.svelte';

  let { task, praise, vibration, onDone }: {
    task: DecomposeTask;
    praise: readonly string[];
    vibration: boolean;
    onDone: (r: TaskResult) => void;
  } = $props();

  const showBox = $derived(task.level !== 4);
  let shaken = $state(false);
  let leftHidden = $state(false);
  let stopShake = () => {};

  function shake() {
    if (shaken) return;
    shaken = true;
    stopShake();
    // One short buzz per plate feels like plates clacking into the box.
    vibrate(Array.from({ length: task.total }, () => [18, 45]).flat(), vibration);
    if (task.level === 3) setTimeout(() => (leftHidden = true), 2000);
  }

  onMount(() => {
    if (task.level !== 4) stopShake = watchShake(shake);
    return () => stopShake();
  });
</script>

<TaskShell {task} {praise} ready={!showBox || shaken} {onDone}>
  {#snippet visual({ help })}
    {#if !showBox}
      <!-- Level 4 has no box: help shows the split directly. It is rendered veiled (hidden but occupying its
           real height, which is two rows for 6+ plates) so help never moves the keypad. -->
      <div class="split" class:veiled={!help} aria-hidden={!help} inert={!help}>
        <Plates count={task.left} size={22} />
        <Plates count={task.right} color="b" size={22} highlight />
      </div>
    {/if}
    {#if showBox}
      <div class="box">
        {#if !shaken}
          <Plates count={task.total} size={22} />
          <p class="hint">{task.total} Plättchen sind in der Box.<br />Schüttel das Handy!</p>
          <button class="secondary" onclick={shake}>oder hier tippen zum Schütteln</button>
        {:else}
          <div class="halves">
            <div class="half drop">
              {#if leftHidden}<div class="lid">{task.left}</div>{:else}<Plates count={task.left} size={22} />{/if}
            </div>
            <div class="divider"></div>
            <div class="half">
              {#if help}<Plates count={task.right} color="b" size={22} highlight />{:else}<div class="lid">?</div>{/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/snippet}
</TaskShell>

<style>
  .box { width: 100%; display: grid; gap: 8px; justify-items: center; background: var(--cream); border-radius: 20px; padding: 12px; }
  .veiled { visibility: hidden; }
  .split { display: flex; gap: 16px; justify-content: center; align-items: center; }
  .hint { margin: 0; text-align: center; font-size: 20px; }
  .halves { display: grid; grid-template-columns: 1fr 6px 1fr; width: 100%; min-height: 110px; align-items: center; }
  .half { display: grid; justify-items: center; }
  .divider { height: 100%; background: var(--soil); border-radius: 3px; }
  .lid { width: 120px; height: 90px; display: grid; place-items: center; background: var(--olive); color: var(--white); border-radius: 16px; font-size: 44px; font-weight: 800; }
  .drop { animation: drop 0.5s ease-out; }
  @keyframes drop { from { transform: translateY(-30px); opacity: 0; } }
</style>
