<script lang="ts">
  import { FINAL_STAGES, FINAL_STAGE_MS } from '../balance';
  import Sprite from '../sprites/Sprite.svelte';
  import { UI_ICONS } from '../sprites';
  import type { GameController } from './controller.svelte';
  import Modal from './Modal.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const s = $derived(ctl.s);
  const run = $derived(s.final);
  const stageNames = [1, 2, 3];
  /** progreso global 0..1 del proceso en curso */
  const progress = $derived(run ? Math.min(1, run.elapsed / (FINAL_STAGES * FINAL_STAGE_MS)) : 0);
  const failed = $derived(!run && ctl.finalNotice);
</script>

<Modal label={ctl.t('a11y.dialog.final')} onclose={failed ? () => ctl.dismissFinalNotice() : undefined}>
  {#if run}
    <h3>{ctl.t('modal.final.title')}</h3>
    <p class="sub">{ctl.t('modal.final.sub')}</p>
    <ol class="stages" aria-label={ctl.t('hud.final')}>
      {#each stageNames as n (n)}
        <li class:done={run.stage > n - 1} class:current={run.stage === n - 1}>
          <span class="dot" aria-hidden="true">{#if run.stage > n - 1}<Sprite def={UI_ICONS.check} scale={1} />{:else}{n}{/if}</span>
          <span>{ctl.t(`final.stage.${n}`)}</span>
        </li>
      {/each}
    </ol>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)} aria-label={ctl.t('final.title')}>
      <div class="fill" style="width: {progress * 100}%"></div>
    </div>
  {:else if failed}
    <h3 class="bad">{ctl.t('modal.fail.title')}</h3>
    <p class="msg" role="status">{ctl.t('final.failed')}</p>
    <p class="sub">{ctl.t('final.attempts', { n: failed.attempt })}</p>
    <button type="button" class="px-btn px-btn-primary" onclick={() => ctl.dismissFinalNotice()}>{ctl.t('modal.fail.ok')}</button>
  {/if}
</Modal>

<style>
  h3 {
    margin: 0 0 0.25rem;
    font-size: clamp(1.3rem, 4vw, 1.8rem);
    color: var(--yellow);
  }
  h3.bad {
    color: var(--orange);
  }
  .sub {
    margin: 0.25rem 0 0.75rem;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .msg {
    margin: 0.5rem 0;
    line-height: 1.4;
  }
  .stages {
    display: grid;
    gap: 0.35rem;
    margin: 0.5rem 0;
    padding: 0;
    list-style: none;
  }
  .stages li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-pixel);
    font-size: 1.1rem;
    color: var(--muted);
  }
  .dot {
    display: inline-grid;
    place-items: center;
    width: 1.6rem;
    height: 1.6rem;
    background: var(--surface-2);
    box-shadow: 0 0 0 2px var(--border);
    font-size: 0.85rem;
  }
  .current {
    color: var(--yellow) !important;
  }
  .current .dot {
    background: var(--yellow);
    color: #1a1c2c;
    animation: blink 0.6s steps(1) infinite;
  }
  .done {
    color: var(--green) !important;
  }
  .done .dot {
    background: var(--green);
    color: #1a1c2c;
  }
  .bar {
    height: 12px;
    margin: 0.75rem 0 0.25rem;
    background: var(--bg);
    box-shadow: 0 0 0 3px var(--border);
  }
  .fill {
    height: 100%;
    background: repeating-linear-gradient(90deg, var(--accent) 0 8px, var(--cyan) 8px 10px);
    transition: width 0.1s linear;
  }
  @media (prefers-reduced-motion: reduce) {
    .current .dot {
      animation: none;
    }
  }
</style>
