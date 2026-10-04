<script lang="ts">
  import { FINAL_COST } from '../balance';
  import { canStartFinal, pFinal } from '../engine';
  import type { GameController } from './controller.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const s = $derived(ctl.s);
</script>

<section class="final px-border game-panel" aria-labelledby="final-title">
  <h3 id="final-title">{ctl.t('final.title')}</h3>
  <p class="desc">{ctl.t('final.desc', { n: FINAL_COST, p: Math.round(pFinal(s) * 100) })}</p>
  <div class="row">
    <button type="button" class="px-btn px-btn-sm" class:px-btn-primary={canStartFinal(s)} disabled={!canStartFinal(s)} onclick={() => ctl.startFinal()}>
      {ctl.t('final.button')}
    </button>
    {#if s.interviews < FINAL_COST}
      <span class="need">{ctl.t('final.need', { n: FINAL_COST })} ({s.interviews}/{FINAL_COST})</span>
    {/if}
  </div>
  {#if s.finalFails > 0}<p class="need">{ctl.t('final.attempts', { n: s.finalFails })}</p>{/if}
</section>

<style>
  .final {
    margin: 3px 3px 0.5rem;
    padding: 0.6rem 0.75rem;
  }
  h3 {
    margin: 0 0 0.2rem;
    font-size: 1.25rem;
    color: var(--yellow);
  }
  .desc,
  .need {
    margin: 0.2rem 0;
    font-size: 0.82rem;
    color: var(--muted);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    --bc: var(--border);
  }
</style>
