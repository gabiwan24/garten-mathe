<script lang="ts">
  import { GOLD, GOLD_SHINE, PALETTE, SCENE } from './palette';

  let { gold = false, size = 64, bob = true }: { gold?: boolean; size?: number; bob?: boolean } = $props();

  // Teardrop in a 20x28 box, tip up; one hand-cut path keeps the paper look.
  const BODY = 'M10,1.5C14.5,8 17.5,13 16.8,19C16.2,24 13,26.8 10,26.8C7,26.8 3.8,24 3.2,19C2.5,13 5.5,8 10,1.5Z';
  const SHINE = 'M7.2,14.5C7.4,11.8 8.6,9.6 9.8,8.2C9.6,11 9.3,14 8.2,17C7.6,17 7.1,16 7.2,14.5Z';
</script>

<svg class="seed" class:bob viewBox="0 0 20 28" width={size} height={(size * 28) / 20} aria-hidden="true">
  <g class="body">
    <path d={BODY} fill={gold ? GOLD : SCENE.soil} />
    <path d={SHINE} fill={gold ? GOLD_SHINE : PALETTE.cream} />
  </g>
</svg>

<style>
  .seed { display: block; overflow: visible; }
  .bob .body { animation: bob 1.8s ease-in-out infinite; transform-origin: 50% 100%; }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
  @media (prefers-reduced-motion: reduce) {
    .bob .body { animation: none; }
  }
</style>
