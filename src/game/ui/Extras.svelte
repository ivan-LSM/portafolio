<script lang="ts">
  import { ACHIEVEMENTS } from '../achievements';
  import Sprite from '../sprites/Sprite.svelte';
  import { UI_ICONS } from '../sprites';
  import type { GameController } from './controller.svelte';

  let { ctl, part = 'both' }: { ctl: GameController; part?: 'ach' | 'data' | 'both' } = $props();
  const s = $derived(ctl.s);

  let mode = $state<'none' | 'export' | 'import' | 'reset'>('none');
  let exportCode = $state('');
  let importText = $state('');
  let codeBox: HTMLTextAreaElement | undefined = $state();

  function doExport() {
    ctl.save();
    exportCode = ctl.exportCode();
    mode = 'export';
  }
  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportCode);
    } catch {
      codeBox?.select();
    }
  }
  function doImport() {
    if (ctl.importCode(importText)) {
      importText = '';
      mode = 'none';
    }
  }
  function doReset() {
    ctl.reset();
    mode = 'none';
  }
</script>

<div class="extras" class:single={part !== 'both'}>
  {#if part !== 'data'}
  <section class="ach px-border game-panel" aria-labelledby="ach-title">
    <h3 id="ach-title">{ctl.t('ach.title')} <span class="count">{s.achievements.length}/{ACHIEVEMENTS.length}</span></h3>
    <ul>
      {#each ACHIEVEMENTS as a (a.id)}
        {@const done = s.achievements.includes(a.id)}
        <li class:done>
          <span class="badge" aria-hidden="true"><Sprite def={done ? UI_ICONS.star : UI_ICONS.starEmpty} scale={1} /></span>
          <span>
            <strong>{done ? ctl.t(`ach.${a.id}.name`) : '???'}</strong>
            <small>{ctl.t(`ach.${a.id}.desc`)}</small>
          </span>
        </li>
      {/each}
    </ul>
  </section>
  {/if}

  {#if part !== 'ach'}
  <section class="data px-border game-panel" aria-labelledby="data-title">
    <h3 id="data-title">{ctl.t('data.title')}</h3>
    <div class="row">
      <button type="button" class="px-btn px-btn-sm" onclick={doExport}>{ctl.t('data.export')}</button>
      <button type="button" class="px-btn px-btn-sm" onclick={() => (mode = mode === 'import' ? 'none' : 'import')}>{ctl.t('data.import')}</button>
      <button type="button" class="px-btn px-btn-sm" onclick={() => (mode = 'reset')}>{ctl.t('data.reset')}</button>
      <button type="button" class="px-btn px-btn-sm" aria-pressed={ctl.holoOn} title={ctl.t('holo.toggleLabel')} onclick={() => ctl.setHolo(!ctl.holoOn)}>
        {ctl.t('holo.toggle')} {ctl.holoOn ? 'ON' : 'OFF'}
      </button>
    </div>

    {#if mode === 'export'}
      <label for="exp-code">{ctl.t('data.exportLabel')}</label>
      <textarea id="exp-code" bind:this={codeBox} readonly rows="3" value={exportCode} onfocus={(e) => e.currentTarget.select()}></textarea>
      <div class="row">
        <button type="button" class="px-btn px-btn-sm" onclick={copyExport}>{ctl.t('data.copy')}</button>
        <button type="button" class="px-btn px-btn-sm" onclick={() => (mode = 'none')}>{ctl.t('data.close')}</button>
      </div>
    {:else if mode === 'import'}
      <label for="imp-code">{ctl.t('data.importLabel')}</label>
      <textarea id="imp-code" rows="3" bind:value={importText}></textarea>
      <div class="row">
        <button type="button" class="px-btn px-btn-sm px-btn-primary" disabled={!importText.trim()} onclick={doImport}>{ctl.t('data.importApply')}</button>
        <button type="button" class="px-btn px-btn-sm" onclick={() => (mode = 'none')}>{ctl.t('data.close')}</button>
      </div>
    {:else if mode === 'reset'}
      <p class="warn" role="alert">{ctl.t('data.resetConfirm')}</p>
      <div class="row">
        <button type="button" class="px-btn px-btn-sm danger" onclick={doReset}>{ctl.t('data.yes')}</button>
        <button type="button" class="px-btn px-btn-sm" onclick={() => (mode = 'none')}>{ctl.t('data.no')}</button>
      </div>
    {/if}
  </section>
  {/if}
</div>

<style>
  .extras.single {
    grid-template-columns: minmax(0, 1fr);
  }
  .extras {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    align-items: start;
  }
  section {
    margin: 3px;
    padding: 1rem;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.3rem;
    color: var(--yellow);
  }
  .count {
    font-size: 0.9rem;
    color: var(--cyan);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.4rem;
  }
  li {
    display: flex;
    gap: 0.5rem;
    opacity: 0.55;
  }
  li.done {
    opacity: 1;
  }
  .badge {
    font-family: var(--font-pixel);
    color: var(--yellow);
  }
  li strong {
    display: block;
    font-family: var(--font-pixel);
    line-height: 1.2;
  }
  small {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    margin: 0.5rem 0;
  }
  label {
    display: block;
    font-family: var(--font-pixel);
    font-size: 0.9rem;
    color: var(--cyan);
  }
  textarea {
    width: calc(100% - 6px);
    margin: 3px;
    background: var(--bg);
    color: var(--text);
    border: 0;
    box-shadow: 0 0 0 3px var(--border);
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    resize: vertical;
  }
  .warn {
    margin: 0.5rem 0;
    color: var(--red);
    font-family: var(--font-pixel);
  }
  .danger {
    --bc: var(--red);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
