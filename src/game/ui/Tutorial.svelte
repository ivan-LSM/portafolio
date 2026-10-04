<script lang="ts">
  import { TUTORIAL_STEPS } from '../balance';
  import type { GameController } from './controller.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const step = $derived(ctl.s.tutorialStep);
</script>

{#if ctl.tutorialActive}
  <div class="tut px-border" role="region" aria-label={ctl.t('tut.title')}>
    <div class="txt">
      <span class="n">{ctl.t('tut.step', { n: step + 1, total: TUTORIAL_STEPS })}</span>
      <strong aria-live="polite">{ctl.t(`tut.step${step + 1}`)}</strong>
    </div>
    <div class="btns">
      <button type="button" class="px-btn px-btn-sm" onclick={() => ctl.nextTutorial()}>{ctl.t('tut.next')}</button>
      <button type="button" class="px-btn px-btn-sm" onclick={() => ctl.skipTutorial()}>{ctl.t('tut.skip')}</button>
    </div>
  </div>
{/if}

<style>
  .tut {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem 0.75rem;
    margin: 3px 3px 0.5rem;
    padding: 0.4rem 0.6rem;
    background: var(--surface);
    --bc: var(--yellow);
    font-family: var(--font-pixel);
  }
  .txt {
    display: grid;
    min-width: 0;
    flex: 1 1 12rem;
  }
  .n {
    font-size: 0.75rem;
    color: var(--cyan);
  }
  strong {
    font-size: 0.95rem;
    line-height: 1.2;
  }
  .btns {
    display: flex;
    gap: 0.15rem;
  }
  .btns :global(.px-btn) {
    margin: 3px;
    padding: 0.15rem 0.5rem;
    font-size: 0.85rem;
  }
  @media (max-width: 639px) {
    .tut {
      flex-wrap: nowrap;
      padding: 0.25rem 0.4rem;
      margin-bottom: 0.3rem;
    }
    .txt {
      flex: 1 1 auto;
    }
    strong {
      font-size: 0.82rem;
    }
    .btns {
      flex-direction: column;
      gap: 0;
    }
    .btns :global(.px-btn) {
      margin: 2px 3px;
      padding: 0 0.4rem;
      font-size: 0.75rem;
    }
  }
</style>
