<script lang="ts">
  import { canPrestige, outboxCap, seniorityOf, totalPerSec } from '../engine';
  import { formatNumber } from '../format';
  import { multLabel, prodMult } from './fx';
  import type { GameController } from './controller.svelte';

  let { ctl, compact = false, evLine = false }: { ctl: GameController; compact?: boolean; evLine?: boolean } = $props();
  const s = $derived(ctl.s);
  const rate = $derived(totalPerSec(s));
  const cap = $derived(outboxCap(s));
  const ev = $derived(s.activeEvent);
  const pm = $derived(prodMult(s));
  function quit() {
    if (confirm(ctl.t('prestige.confirm'))) ctl.prestige();
  }
</script>

<div class="hud px-border game-panel" class:compact>
  <dl class="stats" aria-label={ctl.t('title')}>
    <div class="stat big">
      <dt>{ctl.t('hud.commits')}</dt>
      <dd>{formatNumber(s.commits)}</dd>
    </div>
    <div class="stat">
      <dt>{ctl.t('hud.perSec')}</dt>
      <dd>
        {formatNumber(rate, rate < 10 ? 1 : 0)}
        {#if pm !== 1}<span class="mult" class:down={pm < 1} title={ctl.t('hud.multTip')}>{multLabel(pm)}</span>{/if}
      </dd>
    </div>
    <div class="stat" class:full={s.pending.length >= cap}>
      <dt>{compact ? ctl.t('hud.cvsShort') : ctl.t('hud.cvs')}</dt>
      <dd>{s.pending.length}/{cap}</dd>
    </div>
    <div class="stat">
      <dt>{ctl.t('hud.interviews')}</dt>
      <dd>{s.interviews}</dd>
    </div>
    <div class="stat" title={seniorityOf(s) === 'lead' ? ctl.t('seniority.lead.tip') : undefined}>
      <dt>{ctl.t('hud.seniority')}</dt>
      <dd class="lvl">{ctl.t(`seniority.${seniorityOf(s)}`)}</dd>
    </div>
    {#if s.endless}
      <div class="stat offers">
        <dt>{ctl.t('hud.offers')}</dt>
        <dd>{s.offers}</dd>
      </div>
    {/if}
  </dl>
  <button type="button" class="help px-btn px-btn-sm" aria-label={ctl.t('tut.help')} title={ctl.t('tut.help')} onclick={() => ctl.replayTutorial()}>
    {ctl.t('tut.helpShort')}
  </button>
  {#if s.endless && canPrestige(s)}
    <button type="button" class="quit px-btn px-btn-sm" disabled={ctl.cliff} onclick={quit}>{ctl.t('prestige.button')}</button>
  {/if}
  <!-- el aviso de evento vive en el banner de la escena; en móvil, fuera de la pestaña Jugar, queda esta línea corta -->
  {#if evLine && ev && ev.left > 0 && ev.id !== 'recruiter' && ev.id !== 'barril'}
    <p class="ev">{ctl.t('hud.event', { title: ctl.t(`event.${ev.id}.short`), s: Math.ceil(ev.left / 1000) })}</p>
  {/if}
</div>

<style>
  .hud {
    position: relative;
    margin: 3px 3px 0.6rem;
    padding: 0.5rem 0.75rem;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem 0.75rem;
    margin: 0;
    padding-right: 2.6rem;
  }
  .stat {
    min-width: 0;
  }
  .offers dd {
    color: var(--lime, #a7f070);
  }
  .quit {
    margin-top: 0.4rem;
    width: 100%;
  }
  .big {
    grid-column: span 2;
  }
  dt {
    font-family: var(--font-pixel);
    font-size: 0.78rem;
    color: var(--cyan);
    line-height: 1.15;
  }
  dd {
    margin: 0;
    font-family: var(--font-pixel);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .big dd {
    font-size: 1.7rem;
    color: var(--yellow);
  }
  .lvl {
    font-size: 0.95rem;
  }
  .mult {
    display: inline-block;
    margin-left: 0.3rem;
    padding: 0 0.3rem;
    font-size: 0.85em;
    line-height: 1.25;
    vertical-align: 0.1em;
    color: #1a1c2c;
    background: #ffcd75;
    box-shadow: 0 0 0 2px #1a1c2c;
    animation: mult-rainbow 0.64s steps(1) infinite;
  }
  .mult.down {
    color: #f4f4f4;
    background: #b13e53;
    animation: none;
  }
  @keyframes mult-rainbow {
    0% {
      background: #ef7d57;
    }
    16% {
      background: #ffcd75;
    }
    33% {
      background: #a7f070;
    }
    50% {
      background: #73eff7;
    }
    66% {
      background: #41a6f6;
    }
    83% {
      background: #e08bd8;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .mult {
      animation: none;
    }
  }
  .full dd {
    color: var(--orange);
  }
  .help {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    min-width: 2rem;
    justify-content: center;
    padding: 0.1rem 0.4rem;
  }
  .ev {
    margin: 0.35rem 0 0;
    padding: 0.2rem 0.5rem;
    font-family: var(--font-pixel);
    font-size: 0.85rem;
    line-height: 1.2;
    color: var(--accent-ink);
    background: var(--yellow);
    overflow-wrap: anywhere;
  }
  @media (min-width: 1024px) and (max-height: 820px) {
    .hud {
      margin-bottom: 0.4rem;
      padding: 0.3rem 0.6rem;
    }
    .stats {
      gap: 0.1rem 0.6rem;
    }
    dt {
      font-size: 0.7rem;
    }
    dd {
      font-size: 1rem;
    }
    .big dd {
      font-size: 1.4rem;
    }
    .lvl {
      font-size: 0.85rem;
    }
  }
  .compact {
    padding: 0.35rem 0.6rem;
  }
  .compact .stats {
    gap: 0.1rem 0.5rem;
  }
  .compact dt {
    font-size: 0.68rem;
  }
  .compact dd {
    font-size: 1rem;
  }
  .compact .big dd {
    font-size: 1.3rem;
  }
  .compact .lvl {
    font-size: 0.8rem;
  }
  .compact .ev {
    margin-top: 0.2rem;
    padding: 0.1rem 0.4rem;
    font-size: 0.75rem;
  }
</style>
