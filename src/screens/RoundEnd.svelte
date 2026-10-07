<script lang="ts">
  import { onMount } from 'svelte';
  import type { RoundOutcome } from '../engine/round';
  import Background from '../garden/Background.svelte';
  import Bed from '../garden/Bed.svelte';
  import Seed from '../garden/Seed.svelte';
  import { vibrate } from '../sensors/vibrate';

  let { outcome, vibration, onDone, onPlant }: {
    outcome: RoundOutcome;
    vibration: boolean;
    onDone: () => void;
    onPlant: (plantId: string) => void;
  } = $props();

  onMount(() => {
    if (outcome.plant.pracht) vibrate([80, 60, 160], vibration);
  });
</script>

<Background />
<div class="end">
  {#if outcome.watered}
    <div class="stage" class:pracht={outcome.plant.pracht}><Bed plant={outcome.plant} sway={false} /></div>
    <h1>Deine Pflanze ist gewachsen! 💧</h1>
    <p>Jetzt ist sie auf Stufe {outcome.plant.stage} von 5.</p>
  {:else}
    <!-- The seed is generic on purpose: stage and species stay secret until it is planted. -->
    <div class="seedstage" class:pracht={outcome.plant.pracht}><Seed gold={outcome.plant.pracht} size={96} /></div>
    <h1>{outcome.plant.pracht ? 'Ein goldener Samen!' : 'Du hast einen Samen!'}</h1>
  {/if}
  <p>
    {outcome.plant.pracht
      ? 'Alle 10 beim ersten Mal richtig!'
      : `Du hast 10 Aufgaben geübt. ${outcome.score.firstTry} davon klappten gleich beim ersten Mal.`}
  </p>
  {#if outcome.levelDelta > 0}<p class="level">Du bist eine Stufe weiter! ⭐</p>{/if}
  {#if outcome.watered}
    <button class="big" onclick={onDone}>Zum Garten</button>
  {:else}
    <button class="big" onclick={() => onPlant(outcome.plant.id)}>Samen einpflanzen</button>
  {/if}
</div>

<style>
  .end { display: grid; gap: 12px; justify-items: center; padding: 64px 0 24px; text-align: center; }
  .stage { width: 52%; animation: plant 0.7s cubic-bezier(0.3, 1.6, 0.5, 1); transform-origin: bottom center; }
  .stage.pracht { animation-duration: 1.1s; }
  .seedstage { padding: 24px 0; animation: plant 0.7s cubic-bezier(0.3, 1.6, 0.5, 1); transform-origin: bottom center; }
  .seedstage.pracht { animation-duration: 1.1s; }
  @keyframes plant { from { transform: scale(0.1); opacity: 0; } }
  h1 { margin: 0; font-size: 30px; font-weight: 800; color: var(--navy); }
  p { margin: 0; font-size: 20px; background: var(--white); border-radius: 16px; padding: 10px 14px; }
  .level { color: var(--green); font-weight: 800; }
  .big { margin-top: 8px; }
</style>
