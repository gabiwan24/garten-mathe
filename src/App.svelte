<script lang="ts">
  import type { RoundOutcome } from './engine/round';
  import { limitReached } from './engine/suggest';
  import DemoGallery from './garden/DemoGallery.svelte';
  import Garden from './garden/Garden.svelte';
  import PlantSheet from './garden/PlantSheet.svelte';
  import type { PlantRecord, TaskTypeId } from './lib/types';
  import Parents from './parents/Parents.svelte';
  import PinGate from './parents/PinGate.svelte';
  import SetupPin from './parents/SetupPin.svelte';
  import RoundEnd from './screens/RoundEnd.svelte';
  import RoundScreen from './screens/RoundScreen.svelte';
  import { app, clock } from './state/app.svelte';

  type Screen =
    | { name: 'setupPin' }
    | { name: 'garden' }
    | { name: 'round'; taskType: TaskTypeId; wateringPlantId: string | null }
    | { name: 'roundEnd'; outcome: RoundOutcome }
    | { name: 'pin' }
    | { name: 'parents' };

  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
  let screen = $state<Screen>(app.data.settings.pin ? { name: 'garden' } : { name: 'setupPin' });
  let selected = $state<PlantRecord | null>(null);

  function startRound(taskType: TaskTypeId, wateringPlantId: string | null) {
    selected = null;
    screen = { name: 'round', taskType, wateringPlantId };
  }
  const toGarden = () => (screen = { name: 'garden' });
</script>

{#if demo}
  <DemoGallery />
{:else if screen.name === 'setupPin'}
  <SetupPin onDone={toGarden} />
{:else if screen.name === 'garden'}
  <Garden onStart={startRound} onParents={() => (screen = { name: 'pin' })} onPlant={(p) => (selected = p)} onSeed={() => {}} />
  {#if selected}
    <PlantSheet
      plant={selected}
      canWater={!limitReached(app.data, clock.day)}
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
    onAbort={toGarden}
  />
{:else if screen.name === 'roundEnd'}
  <RoundEnd outcome={screen.outcome} vibration={app.data.settings.vibration} onDone={toGarden} />
{:else if screen.name === 'pin'}
  <PinGate onSuccess={() => (screen = { name: 'parents' })} onCancel={toGarden} />
{:else}
  <Parents onClose={toGarden} />
{/if}
