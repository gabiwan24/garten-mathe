<script lang="ts">
  let { value = $bindable(''), maxLength = 2, masked = false, disabled = false, onsubmit }: {
    value?: string;
    maxLength?: number;
    masked?: boolean;
    disabled?: boolean;
    onsubmit: () => void;
  } = $props();

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;
  type Key = (typeof KEYS)[number];

  function press(k: Key) {
    if (disabled) return;
    if (k === 'del') value = value.slice(0, -1);
    else if (k === 'ok') {
      if (value !== '') onsubmit();
    } else if (value.length < maxLength) value += k;
  }

  // Physical keyboard support makes desktop testing possible.
  function onkeydown(e: KeyboardEvent) {
    if (/^\d$/.test(e.key)) press(e.key as Key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') press('ok');
  }
</script>

<svelte:window {onkeydown} />

<div class="display" aria-live="polite">{masked ? '•'.repeat(value.length) : value}</div>
<div class="pad">
  {#each KEYS as k (k)}
    <button
      type="button"
      class="key"
      class:ok={k === 'ok'}
      class:del={k === 'del'}
      {disabled}
      onclick={() => press(k)}
      aria-label={k === 'del' ? 'Löschen' : k === 'ok' ? 'Fertig' : k}
    >{k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}</button>
  {/each}
</div>

<style>
  .display { height: 64px; line-height: 64px; font-size: 48px; font-weight: 800; text-align: center; background: var(--white); border-radius: 18px; margin-bottom: 10px; }
  .pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .key { height: 60px; border: 0; border-radius: 18px; background: var(--white); font-size: 30px; font-weight: 800; box-shadow: 0 4px 0 var(--press-light); }
  .key:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--press-light); }
  .key.ok { background: var(--green); color: var(--white); box-shadow: 0 4px 0 var(--press); }
  .key.del { background: var(--cream); }
  .key:disabled { opacity: 0.45; }
</style>
