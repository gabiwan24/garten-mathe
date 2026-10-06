<script lang="ts">
  import type { RoundOutcome } from './engine/round';
  import { limitReached } from './engine/suggest';
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';
  import PlantSheet from './garden/PlantSheet.svelte';
  import { today } from './lib/date';
  import type { PlantRecord, TaskTypeId } from './lib/types';
  import RoundEnd from './screens/RoundEnd.svelte';
  import RoundScreen from './screens/RoundScreen.svelte';
  import { app } from './state/app.svelte';

  type Screen =
    | { name: 'garden' }
    | { name: 'round'; taskType: TaskTypeId; wateringPlantId: string | null }
    | { name: 'roundEnd'; outcome: RoundOutcome };

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
  let screen = $state<Screen>({ name: 'garden' });
  let selected = $state<PlantRecord | null>(null);

  function startRound(taskType: TaskTypeId, wateringPlantId: string | null) {
    selected = null;
    screen = { name: 'round', taskType, wateringPlantId };
  }
</script>

{#if demo}
  <DemoGallery />
{:else if screen.name === 'garden'}
  <Garden onStart={startRound} onParents={() => console.info('parents')} onPlant={(p) => (selected = p)} />
  {#if selected}
    <PlantSheet
      plant={selected}
      canWater={!limitReached(app.data, today())}
      onWater={() => startRound(selected!.taskType, selected!.id)}
      onClose={() => (selected = null)}
    />
  {/if}
{:else if screen.name === 'round'}
  <RoundScreen
    taskType={screen.taskType}
    wateringPlantId={screen.wateringPlantId}
    vibration={app.data.settings.vibration}
    onFinish={(outcome) => (screen = { name: 'roundEnd', outcome })}
    onAbort={() => (screen = { name: 'garden' })}
  />
{:else}
  <RoundEnd outcome={screen.outcome} vibration={app.data.settings.vibration} onDone={() => (screen = { name: 'garden' })} />
{/if}
