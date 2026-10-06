<script lang="ts">
  import { SCENE } from './palette';
  import { polarBlob, starPath } from './shapes';

  const cloudA = polarBlob(80, 46, 30, [{ k: 6, amp: 0.12, phase: 0.4 }], 48, 0.5);
  const cloudB = polarBlob(250, 84, 22, [{ k: 5, amp: 0.14, phase: 1.2 }], 48, 0.5);
  const meadow = 'M0,170 C60,150 120,185 200,165 S330,150 400,172 L400,800 L0,800 Z';
  const tufts = [[40, 260], [300, 330], [150, 430], [360, 520], [80, 620], [250, 720]].map(([x, y]) => starPath(x, y, 9, 3, 7));
</script>

<svg class="bg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
  <rect width="400" height="800" fill={SCENE.sky} />
  <circle cx="330" cy="64" r="34" fill={SCENE.sun} />
  <path d={cloudA} fill={SCENE.cloud} />
  <path d={cloudB} fill={SCENE.cloud} />
  <path d={meadow} fill={SCENE.meadow} />
  {#each tufts as d, i (i)}<path {d} fill={SCENE.grass} />{/each}
</svg>

<style>
  .bg { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; }
  /* app.css gives body its own background, which would paint over this z-index:-1 scene; html still supplies the sky colour. */
  :global(body) { background: transparent; }
</style>
