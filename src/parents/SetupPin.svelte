<script lang="ts">
  import { commit, snapshot } from '../state/app.svelte';
  import Keypad from '../tasks/components/Keypad.svelte';
  import { withSettings } from './settings';

  let { title = 'Willkommen bei Garten-Mathe', onDone }: { title?: string; onDone: () => void } = $props();

  let first = $state<string | null>(null);
  let entry = $state('');
  let message = $state('Eltern: Bitte eine 4-stellige PIN festlegen.');

  function submit() {
    if (entry.length !== 4) {
      message = 'Die PIN braucht 4 Ziffern.';
      return;
    }
    if (first === null) {
      first = entry;
      entry = '';
      message = 'Zur Bestätigung die PIN noch einmal eingeben.';
      return;
    }
    if (entry !== first) {
      first = null;
      entry = '';
      message = 'Die beiden PINs waren verschieden. Bitte neu festlegen.';
      return;
    }
    commit(withSettings(snapshot(), { pin: entry }));
    onDone();
  }
</script>

<div class="pin">
  <h1>{title}</h1>
  <p>{message}</p>
  <Keypad bind:value={entry} maxLength={4} masked onsubmit={submit} />
</div>

<style>
  .pin { display: grid; gap: 12px; padding: 32px 0; text-align: center; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  p { margin: 0; font-size: 18px; }
</style>
