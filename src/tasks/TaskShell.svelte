<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { TaskResult } from '../lib/types';
  import Keypad from './components/Keypad.svelte';
  import type { AnyTask, ShellState } from './model';

  let { task, praise, praiseExtra = '', helpText = '', ready = true, onDone, visual }: {
    task: AnyTask;
    praise: readonly string[];
    praiseExtra?: string;
    helpText?: string;
    ready?: boolean;
    onDone: (result: TaskResult) => void;
    visual?: Snippet<[ShellState]>;
  } = $props();

  let step = $state(0);
  let entry = $state('');
  let totalWrong = $state(0);
  let usedHelp = $state(false);
  let help = $state(false);
  let phase = $state<ShellState['phase']>('answer');
  let message = $state('');
  let wrongThisStep = 0;
  const started = performance.now();

  function submit() {
    const expected = task.steps[step].answer;
    if (Number(entry) === expected) {
      entry = '';
      wrongThisStep = 0;
      message = '';
      if (step < task.steps.length - 1) {
        step += 1;
        return;
      }
      phase = 'praise';
      message = totalWrong === 0 && !usedHelp ? praise[Math.floor(Math.random() * praise.length)] : 'Geschafft!';
      setTimeout(finish, 1200);
      return;
    }
    entry = '';
    totalWrong += 1;
    wrongThisStep += 1;
    help = true;
    if (wrongThisStep === 1) message = 'Fast! Schau mal genau hin …';
    else {
      phase = 'solution';
      message = 'So geht es:';
    }
  }

  function finish() {
    onDone({ itemKey: task.key, correctFirstTry: totalWrong === 0, usedHelp, attempts: totalWrong, ms: Math.round(performance.now() - started) });
  }

  function askHelp() {
    usedHelp = true;
    help = true;
  }
</script>

<div class="task">
  {#if ready}<p class="prompt">{task.steps[step].prompt}</p>{/if}
  {#if ready && task.steps.length > 1}<p class="steps">Schritt {step + 1} von {task.steps.length}</p>{/if}

  <div class="visual">{@render visual?.({ step, help, phase })}</div>

  {#if message}<p class="message" class:praise={phase === 'praise'}>{message}</p>{/if}
  {#if phase === 'praise' && praiseExtra}<p class="extra">{praiseExtra}</p>{/if}

  {#if phase === 'solution'}
    <p class="solution">{task.solutionText}</p>
    <button class="big" onclick={finish}>Weiter</button>
  {:else}
    {#if help && helpText}<p class="help-text">{helpText}</p>{/if}
    <Keypad bind:value={entry} disabled={!ready || phase !== 'answer'} onsubmit={submit} />
    <button class="secondary help" onclick={askHelp} disabled={!ready || help || phase !== 'answer'}>Hilfe</button>
  {/if}
</div>

<style>
  .task { display: grid; gap: 10px; padding: 8px 0 16px; }
  .prompt { margin: 0; font-size: 26px; font-weight: 800; text-align: center; color: var(--navy); }
  .steps { margin: 0; text-align: center; font-size: 15px; }
  .visual { display: grid; justify-items: center; gap: 8px; min-height: 40px; }
  .message { margin: 0; text-align: center; font-size: 20px; color: var(--navy); }
  .message.praise { font-size: 24px; color: var(--green); }
  .extra { margin: 0; text-align: center; font-size: 40px; font-weight: 800; color: var(--pink); }
  .solution { margin: 0; text-align: center; font-size: 34px; font-weight: 800; }
  .help-text { margin: 0; text-align: center; font-size: 18px; background: var(--white); border-radius: 14px; padding: 8px; }
  .help:disabled { opacity: 0.45; }
</style>
