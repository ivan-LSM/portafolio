<script lang="ts">
  import { CV_COST_SECONDS } from '../balance';
  import { cvCost, cvCostFor, cvSendBlock, maxCVs, outboxCap, pInterview, type CvBlock } from '../engine';
  import { formatNumber } from '../format';
  import { ENVELOPE } from '../sprites';
  import Sprite from '../sprites/Sprite.svelte';
  import type { GameController } from './controller.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const s = $derived(ctl.s);
  const cap = $derived(outboxCap(s));
  const used = $derived(s.pending.length);
  const max = $derived(maxCVs(s));
  const slots = $derived(Math.max(cap, used));
  const shown = $derived(Math.min(used, 6));

  function reason(b: CvBlock | null): string {
    if (!b) return '';
    if (b.reason === 'event') return ctl.t('cv.reason.event', { title: ctl.t(`event.${b.id}.title`), s: Math.ceil(b.left / 1000) });
    if (b.reason === 'full') {
      return b.free > 0
        ? ctl.t('cv.reason.fullFor', { n: b.free, used: b.used, cap: b.cap })
        : ctl.t('cv.reason.full', { used: b.used, cap: b.cap });
    }
    return ctl.t('cv.reason.commits', { n: formatNumber(b.missing) });
  }

  const buttons = $derived(
    [
      { key: 'x1', n: 1, label: 'x1', run: () => ctl.sendCVs(1), block: cvSendBlock(s, 1), cost: cvCostFor(s, 1) },
      { key: 'x10', n: 10, label: 'x10', run: () => ctl.sendCVs(10), block: cvSendBlock(s, 10), cost: cvCostFor(s, 10) },
      {
        key: 'max',
        n: max,
        label: max > 1 ? `${ctl.t('cv.maxShort')} (${max})` : ctl.t('cv.maxShort'),
        run: () => ctl.sendCVs('max'),
        block: max > 0 ? null : cvSendBlock(s, 1),
        cost: cvCostFor(s, max),
      },
    ].map((b) => ({ ...b, ok: !b.block, why: reason(b.block) })),
  );
</script>

<section class="cv px-border game-panel" class:tut-hl={ctl.tutorialTarget === 'cvs'} data-tut="cvs" aria-labelledby="cv-title">
  <div class="head">
    <h3 id="cv-title">{ctl.t('cv.title')}</h3>
    <span class="cap" class:full={used >= cap}>{ctl.t('cv.outbox')} <strong>{used}/{cap}</strong></span>
  </div>
  <p class="line" title={ctl.t('cv.perCvHint', { s: CV_COST_SECONDS })}>
    {ctl.t('cv.perCv', { n: formatNumber(cvCost(s)) })} · {ctl.t('cv.chanceShort', { p: Math.round(pInterview(s) * 100) })}
  </p>

  <div class="slots" role="img" aria-label={`${ctl.t('cv.outbox')} ${used}/${cap}`} title={ctl.t('cv.outboxHint')}>
    {#each { length: slots } as _, i (i)}
      <span class="slot" class:on={i < used}></span>
    {/each}
  </div>

  <div class="buttons">
    {#each buttons as b (b.key)}
      <div class="cell">
        <button
          type="button"
          class="px-btn px-btn-sm"
          class:primary={b.ok}
          disabled={!b.ok}
          title={ctl.t('cv.sendTitle', { n: formatNumber(b.cost || cvCost(s)) })}
          aria-describedby={b.ok ? undefined : `cv-why-${b.key}`}
          onclick={b.run}
        >
          {b.label}
        </button>
        {#if !b.ok}<span class="why" id={`cv-why-${b.key}`}>{b.why}</span>{/if}
      </div>
    {/each}
  </div>

  <div class="envelopes" aria-hidden="true">
    {#each { length: shown } as _, i (i)}
      <span class="env" style="animation-delay: {i * 90}ms"><Sprite def={ENVELOPE} scale={2} /></span>
    {/each}
    {#if used > shown}<span class="more">+{used - shown}</span>{/if}
  </div>

</section>

<style>
  .cv {
    margin: 3px 3px 0.5rem;
    padding: 0.6rem 0.75rem;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0 0.75rem;
  }
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--yellow);
  }
  .cap {
    font-family: var(--font-pixel);
    font-size: 0.9rem;
    color: var(--cyan);
  }
  .cap strong {
    color: var(--text);
  }
  .cap.full strong {
    color: var(--orange);
  }
  .line {
    margin: 0.1rem 0 0.35rem;
    font-size: 0.82rem;
    color: var(--muted);
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 0.5rem;
  }
  .slot {
    flex: 1 1 0;
    min-width: 6px;
    max-width: 22px;
    height: 10px;
    background: var(--bg);
    box-shadow: 0 0 0 2px var(--border);
    margin: 2px;
  }
  .slot.on {
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
  }
  .buttons {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem 0.4rem;
    align-items: start;
  }
  .cell {
    display: grid;
    gap: 0.1rem;
    justify-items: stretch;
  }
  .cell button {
    justify-content: center;
    margin: 3px;
    text-align: center;
  }
  .why {
    padding: 0 0.25rem;
    font-family: var(--font-pixel);
    font-size: 0.78rem;
    line-height: 1.15;
    color: var(--orange);
    overflow-wrap: anywhere;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-ink);
    --bc: var(--accent);
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    background: var(--surface-2);
    color: var(--text);
    --bc: var(--border);
  }
  .envelopes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    margin: 0.3rem 0 0;
  }
  @media (min-width: 1024px) and (max-height: 900px) {
    .envelopes {
      display: none;
    }
  }
  .env {
    display: block;
    animation: envbob 1.2s steps(3) infinite;
  }
  .more {
    font-family: var(--font-pixel);
    color: var(--cyan);
  }
  @keyframes envbob {
    50% {
      transform: translateY(-3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .env {
      animation: none;
    }
  }
</style>
