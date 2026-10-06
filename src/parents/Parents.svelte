<script lang="ts">
  import { today } from '../lib/date';
  import type { TaskTypeId } from '../lib/types';
  import { commit, snapshot, app } from '../state/app.svelte';
  import { exportState, importState } from '../store/storage';
  import { resetLevel, withSettings } from './settings';
  import SetupPin from './SetupPin.svelte';
  import { dailyMinutes, typeSummaries, wobblyItems } from './stats';

  let { onClose }: { onClose: () => void } = $props();

  const summaries = $derived(typeSummaries(app.data));
  const days = $derived(dailyMinutes(app.data, today()));
  const maxMinutes = $derived(Math.max(10, ...days.map((d) => d.minutes)));
  const wobbly = $derived(wobblyItems(app.data));
  let changingPin = $state(false);
  let importMessage = $state('');

  const TREND = { up: '↗ besser', down: '↘ schwächer', flat: '→ gleich' } as const;

  function setRounds(delta: number) {
    const next = Math.min(6, Math.max(1, app.data.settings.roundsPerDay + delta));
    commit(withSettings(snapshot(), { roundsPerDay: next }));
  }

  function reset(type: TaskTypeId, label: string) {
    if (confirm(`Stufe für „${label}“ auf 1 zurücksetzen?`)) commit(resetLevel(snapshot(), type));
  }

  function exportBackup() {
    const blob = new Blob([exportState(snapshot())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garten-mathe-backup-${today()}.json`;
    a.click();
    // Revoking immediately can cancel the download on some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = importState(await file.text());
    if (!result.ok) {
      importMessage = result.error;
      return;
    }
    const n = result.state.plants.length;
    if (!confirm(`Backup mit ${n} ${n === 1 ? 'Pflanze' : 'Pflanzen'} laden? Der aktuelle Stand wird ersetzt.`)) return;
    commit(result.state);
    importMessage = 'Backup geladen.';
  }
</script>

{#if changingPin}
  <SetupPin title="Neue PIN" onDone={() => (changingPin = false)} />
{:else}
  <div class="parents">
    <header>
      <h1>Elternbereich</h1>
      <button class="secondary close" onclick={onClose}>Fertig</button>
    </header>

    {#if !app.storageOk}
      <p class="warn">Speichern auf diesem Gerät klappt gerade nicht. Bitte unten ein Backup exportieren.</p>
    {/if}

    <section>
      <h2>Übersicht</h2>
      {#each summaries as s (s.type)}
        <div class="card" class:locked={!s.unlocked}>
          <strong>{s.label}</strong>
          {#if s.unlocked}
            <span>Stufe {s.level} von 4</span>
            <span>{s.rate === null ? 'noch keine Daten' : `${Math.round(s.rate * 100)} % beim 1. Versuch (letzte 10)`}</span>
            {#if s.trend}<span>{TREND[s.trend]}</span>{/if}
          {:else}
            <span>Wird freigeschaltet, wenn Zerlegen und Auffüllen Stufe 2 erreichen.</span>
          {/if}
        </div>
      {/each}
    </section>

    <section>
      <h2>Übungszeit (14 Tage)</h2>
      <!-- One series, one colour; the value is printed at the bar end so no tooltip is needed on touch. -->
      <div class="bars" role="list" aria-label="Übungszeit in Minuten pro Tag">
        {#each days as d, i (d.date)}
          <div class="bar-row" class:today={i === days.length - 1} role="listitem">
            <span class="day">{d.date.slice(8)}.{d.date.slice(5, 7)}.</span>
            <span class="track">
              {#if d.minutes > 0}<span class="bar" style:width="{(d.minutes / maxMinutes) * 100}%"></span>{/if}
            </span>
            <span class="min">{d.minutes} min</span>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <h2>Wackel-Aufgaben</h2>
      {#if wobbly.length === 0}
        <p>Noch keine – prima!</p>
      {:else}
        <ul>{#each wobbly as w (w.key)}<li><strong>{w.label}</strong> · {w.wrong}× falsch</li>{/each}</ul>
        <p class="tip">Gesprächstipp: Aufgabe „{wobbly[0].label}“ gemeinsam anschauen und fragen: „Wie hast du das gerechnet?“ – nach dem Rechenweg fragen, nicht nach dem Ergebnis.</p>
      {/if}
    </section>

    <section>
      <h2>Einstellungen</h2>
      <div class="row">
        <span>Runden pro Tag: <strong>{app.data.settings.roundsPerDay}</strong></span>
        <button class="mini" onclick={() => setRounds(-1)} aria-label="Weniger">−</button>
        <button class="mini" onclick={() => setRounds(1)} aria-label="Mehr">+</button>
      </div>
      <label class="row"><input type="checkbox" checked={app.data.settings.vibration} onchange={(e) => commit(withSettings(snapshot(), { vibration: e.currentTarget.checked }))} /> Vibration</label>
      <label class="row"><input type="checkbox" checked={app.data.settings.tilt} onchange={(e) => commit(withSettings(snapshot(), { tilt: e.currentTarget.checked }))} /> Pflanzen neigen sich mit dem Handy</label>
      {#each summaries as s (s.type)}
        <button class="secondary" onclick={() => reset(s.type, s.label)}>Stufe zurücksetzen: {s.label}</button>
      {/each}
      <button class="secondary" onclick={() => (changingPin = true)}>PIN ändern</button>
    </section>

    <section>
      <h2>Backup</h2>
      <p>Der Garten liegt nur auf diesem Handy. Ein Backup schützt ihn beim Handywechsel oder wenn Browserdaten gelöscht werden.</p>
      <button class="secondary" onclick={exportBackup}>Backup exportieren</button>
      <label class="secondary file">Backup importieren<input type="file" accept="application/json,.json" onchange={importBackup} /></label>
      {#if importMessage}<p>{importMessage}</p>{/if}
    </section>
  </div>
{/if}

<style>
  .parents { display: grid; gap: 16px; padding: 16px 0 32px; user-select: text; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  h1 { margin: 0; font-size: 26px; color: var(--navy); }
  h2 { margin: 0 0 8px; font-size: 20px; color: var(--navy); }
  section { display: grid; gap: 8px; background: var(--white); border-radius: 18px; padding: 14px; }
  /* Two-line button labels (long task names) otherwise touch the button edges. */
  .secondary { padding: 10px 14px; line-height: 1.25; }
  .close { width: auto; padding: 0 18px; }
  .card { display: grid; gap: 2px; padding: 8px 0; border-bottom: 2px solid var(--cream); }
  .card.locked { opacity: 0.6; }
  .warn { margin: 0; padding: 12px; border-radius: 14px; background: var(--yellow); }
  .bars { display: grid; gap: 4px; }
  .bar-row { display: grid; grid-template-columns: 52px 1fr 56px; align-items: center; gap: 8px; font-size: 15px; font-variant-numeric: tabular-nums; }
  .bar-row.today { font-weight: 800; }
  .track { display: block; height: 18px; }
  /* Square at the baseline, rounded data end; thin enough to leave air between rows. */
  .bar { display: block; height: 100%; min-width: 4px; border-radius: 0 4px 4px 0; background: var(--green); }
  .min { text-align: right; }
  ul { margin: 0; padding-left: 20px; }
  .tip { margin: 0; font-size: 15px; }
  .row { display: flex; align-items: center; gap: 10px; font-size: 17px; }
  .row span { flex: 1; }
  .mini { width: 44px; height: 44px; border: 0; border-radius: 14px; background: var(--cream); font-size: 22px; font-weight: 800; }
  .file { display: grid; place-items: center; }
  .file input { display: none; }
</style>
