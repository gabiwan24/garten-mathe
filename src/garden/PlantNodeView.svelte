<script lang="ts">
  import type { PlantNode } from './plant';
  import Self from './PlantNodeView.svelte';

  let { node }: { node: PlantNode } = $props();
</script>

<g
  data-x={node.x}
  data-y={node.y}
  data-rot={node.rot}
  data-depth={node.depth}
  data-stiffness={node.stiffness ?? undefined}
  transform="translate({node.x} {node.y}) rotate({node.rot})"
>
  {#if node.d}<path d={node.d} fill={node.fill} />{/if}
  {#each node.children as child (child.id)}
    <Self node={child} />
  {/each}
</g>
