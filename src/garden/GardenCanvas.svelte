<script lang="ts">
  import { onMount } from 'svelte';
  import type { PlantRecord, Row, Slot } from '../lib/types';
  import { colsFor, drawOrder, freeSlots, GARDEN_H, gardenWidth, ROWS, slotGeometry, slotKey } from './layout';
  import { TASK_TYPES } from '../tasks/registry';
  import { SCENE } from './palette';
  import { VIEW } from './plant';
  import PlantSvg from './PlantSvg.svelte';
  import Seed from './Seed.svelte';
  import { polarBlob } from './shapes';

  let { plants, sway, onPlant, onSlot, marker = null, markerGold = false, pulseFree = false, focus = null, growing = null }: {
    plants: PlantRecord[];
    sway: boolean;
    onPlant?: (p: PlantRecord) => void;
    onSlot?: (slot: Slot) => void;
    marker?: Slot | null;
    markerGold?: boolean;
    pulseFree?: boolean;
    focus?: Slot | null;
    growing?: string | null;
  } = $props();

  const MOUND_W = 60;
  const PLANT_W = 90;
  const MIN_HIT = 44;
  // Slot buttons sit above every plant and mound, otherwise front-row plant boxes cover back-row slots.
  const SLOT_Z = 10000;

  const cols = $derived(colsFor(plants.length));
  const width = $derived(gardenWidth(cols));
  const placed = $derived(drawOrder(plants));
  const free = $derived(new Set(onSlot || pulseFree ? freeSlots(plants).map(slotKey) : []));

  const allSlots = $derived.by(() => {
    const out: Slot[] = [];
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < cols; col++) out.push({ row: row as Row, col });
    return out;
  });

  const z = (s: Slot) => s.row * 1000 + s.col;
  const mound = (s: Slot) => polarBlob(50, 20, 42, [{ k: 5, amp: 0.05, phase: (s.row * 7 + s.col) % 7 }], 40, 0.32);

  function plantStyle(s: Slot): string {
    const { x, baseY, scale } = slotGeometry(s);
    const w = PLANT_W * scale;
    const h = (w * VIEW.h) / VIEW.w;
    // The stem foot (VIEW.baseY in the viewBox) sits on the mound centre.
    return `left:${x - w / 2}px;top:${baseY - (h * VIEW.baseY) / VIEW.h}px;width:${w}px;z-index:${z(s)}`;
  }
  function moundStyle(s: Slot): string {
    const { x, baseY, scale } = slotGeometry(s);
    const w = MOUND_W * scale;
    return `left:${x - w / 2}px;top:${baseY - w * 0.2}px;width:${w}px;z-index:${z(s)}`;
  }
  function hitStyle(s: Slot): string {
    const { x, baseY, scale } = slotGeometry(s);
    const w = Math.max(MIN_HIT, MOUND_W * scale);
    return `left:${x - w / 2}px;top:${baseY - MIN_HIT / 2}px;width:${w}px;height:${MIN_HIT}px;z-index:${SLOT_Z + z(s)}`;
  }

  let scroller: HTMLDivElement;
  onMount(() => {
    if (focus) scroller.scrollLeft = slotGeometry(focus).x - scroller.clientWidth / 2;
    else if (placed.length) {
      const right = Math.max(...placed.map((p) => slotGeometry(p.slot!).x));
      scroller.scrollLeft = right - scroller.clientWidth + 80;
    }
  });
</script>

<div class="scroller" bind:this={scroller} style="height:{GARDEN_H}px">
  <div class="world" style="width:{width}px">
    {#each allSlots as s (slotKey(s))}
      {@const isFree = free.has(slotKey(s))}
      <svg class="mound" class:pulse={pulseFree && isFree} viewBox="0 0 100 40" style={moundStyle(s)} aria-hidden="true">
        <path d={mound(s)} fill={SCENE.soil} />
      </svg>
    {/each}

    {#each placed as p (p.id)}
      {@const slot = p.slot!}
      {#if onPlant}
        <button class="plant" class:grow={growing === p.id} class:pracht={p.pracht} type="button" style={plantStyle(slot)} onclick={() => onPlant(p)} aria-label="Pflanze ansehen, {TASK_TYPES[p.taskType].label}, Stufe {p.stage}">
          <PlantSvg plant={p} {sway} />
        </button>
      {:else}
        <div class="plant" class:inert={!!onSlot} class:grow={growing === p.id} class:pracht={p.pracht} style={plantStyle(slot)}>
          <PlantSvg plant={p} {sway} />
        </div>
      {/if}
    {/each}

    {#if marker}
      {@const g = slotGeometry(marker)}
      {@const mw = 34 * g.scale}
      <!-- The seed rests on the mound: its tip points up, its belly sits at the mound centre. -->
      <div class="marker" style="left:{g.x - mw / 2}px;top:{g.baseY - (mw * 28) / 20 + 8 * g.scale}px;z-index:{z(marker) + 500}">
        <Seed gold={markerGold} size={mw} />
      </div>
    {/if}

    {#if onSlot}
      {#each allSlots as s (slotKey(s))}
        {#if free.has(slotKey(s))}
          <button class="slot" type="button" style={hitStyle(s)} onclick={() => onSlot(s)} aria-label="Freier Platz Reihe {s.row + 1}, Stelle {s.col + 1}"></button>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  .scroller { overflow-x: auto; overflow-y: hidden; touch-action: pan-x; scrollbar-width: none; margin: 0 -16px; }
  .scroller::-webkit-scrollbar { display: none; }
  .world { position: relative; height: 100%; }
  .mound { position: absolute; display: block; height: auto; pointer-events: none; }
  .plant { position: absolute; display: block; padding: 0; border: 0; background: none; transform-origin: 50% 96%; }
  button.plant { cursor: pointer; }
  /* Planting mode: plants must not swallow taps meant for free slots behind them. */
  .plant.inert { pointer-events: none; }
  .plant.grow { animation: grow 0.9s ease-out; }
  .plant.grow.pracht { animation-duration: 1.4s; }
  @keyframes grow { from { transform: scale(0.1); } to { transform: scale(1); } }
  .marker { position: absolute; pointer-events: none; }
  .slot { position: absolute; padding: 0; border: 0; background: none; cursor: pointer; }
  .pulse { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  @media (prefers-reduced-motion: reduce) {
    .pulse { animation: none; }
    .plant.grow { animation: none; }
  }
</style>
