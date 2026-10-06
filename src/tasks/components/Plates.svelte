<script lang="ts">
  let { count, color = 'a', size = 28, highlight = false }: { count: number; color?: 'a' | 'b'; size?: number; highlight?: boolean } = $props();
</script>

<div class="plates" class:highlight style:--size="{size}px">
  {#each Array.from({ length: count }) as _, i (i)}<span class="plate {color}"></span>{/each}
</div>

<style>
  .plates { display: grid; grid-template-columns: repeat(5, var(--size)); gap: 5px; justify-content: center; min-height: var(--size); padding: 6px; border-radius: 14px; }
  .plates.highlight { outline: 3px dashed var(--red-orange); }
  .plate { width: var(--size); height: var(--size); border-radius: 50%; }
  .plate.a { background: var(--blue); }
  .plate.b { background: var(--red-orange); }
</style>
