<script lang="ts">
  import { app } from '../state/app.svelte';
  import Keypad from '../tasks/components/Keypad.svelte';

  let { onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void } = $props();

  let entry = $state('');
  let message = $state('PIN eingeben');

  function submit() {
    if (entry === app.data.settings.pin) onSuccess();
    else {
      entry = '';
      message = 'Falsche PIN';
    }
  }
</script>

<div class="gate">
  <h1>Elternbereich</h1>
  <p>{message}</p>
  <Keypad bind:value={entry} maxLength={4} masked onsubmit={submit} />
  <button class="secondary" onclick={onCancel}>Zurück zum Garten</button>
</div>

<style>
  .gate { display: grid; gap: 12px; padding: 32px 0; text-align: center; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  p { margin: 0; font-size: 18px; }
</style>
