<script lang="ts">
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
</script>

{#if demo}
  <DemoGallery />
{:else}
  <Garden
    onStart={(type, wateringPlantId) => console.info('start round', type, wateringPlantId)}
    onParents={() => console.info('parents')}
    onPlant={(plant) => console.info('plant', plant.id)}
  />
{/if}
