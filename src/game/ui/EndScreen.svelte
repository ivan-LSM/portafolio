<script lang="ts">
  import { SENIORITY } from '../balance';
  import { canPrestige, seniorityOf } from '../engine';
  import { formatNumber, formatTime } from '../format';
  import Sprite from '../sprites/Sprite.svelte';
  import { UI_ICONS } from '../sprites';
  import type { GameController } from './controller.svelte';
  import Modal from './Modal.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const s = $derived(ctl.s);

  let busy = $state(false);

  const stats = $derived([
    ['end.stat.time', formatTime(s.elapsedMs)],
    ['end.stat.clicks', formatNumber(s.clicks)],
    ['end.stat.commits', formatNumber(s.totalCommits)],
    ['end.stat.cvs', formatNumber(s.cvsSent)],
    ['end.stat.rejections', formatNumber(s.rejections)],
    ['end.stat.ghostings', formatNumber(s.ghostings)],
    ['end.stat.interviews', formatNumber(s.interviewsTotal)],
    ['end.stat.attempts', String(s.finalFails + 1)],
    ['end.stat.seniority', ctl.t(`seniority.${seniorityOf(s)}`)],
  ] as const);

  const nextLevel = $derived(SENIORITY[Math.min(s.prestige + 1, SENIORITY.length - 1)]);

  async function share() {
    if (busy) return;
    busy = true;
    try {
      await ctl.shareResultCard();
    } finally {
      busy = false;
    }
  }
</script>

<Modal label={ctl.t('a11y.dialog.end')}>
<section class="end" aria-labelledby="end-title">
  <h3 id="end-title"><Sprite def={UI_ICONS.trophy} scale={3} /> {ctl.t('end.title')}</h3>
  <p class="sub">{ctl.t('end.subtitle')}</p>
  <dl class="stats">
    {#each stats as [k, v] (k)}
      <div><dt>{ctl.t(k)}</dt><dd>{v}</dd></div>
    {/each}
  </dl>
  <div class="row main">
    <button type="button" class="px-btn px-btn-primary go" onclick={() => ctl.continuePlaying()}>{ctl.t('end.continue')}</button>
  </div>
  <p class="hint">{ctl.t('end.continueHint')}</p>
  <div class="row">
    <button type="button" class="px-btn" disabled={busy} onclick={share}>{ctl.t('end.shareCard')}</button>
    <button type="button" class="px-btn" onclick={() => ctl.copyResultText()}>{ctl.t('end.copyText')}</button>
    <a class="px-btn" href="#projects" onclick={() => ctl.continuePlaying()}>{ctl.t('end.projects')}</a>
  </div>

  <div class="prestige">
    {#if canPrestige(s)}
      <p>{ctl.t('prestige.desc', { next: ctl.t(`seniority.${nextLevel}`) })}</p>
      <button type="button" class="px-btn" disabled={ctl.cliff} onclick={() => ctl.prestige()}>{ctl.t('prestige.button')}</button>
    {:else}
      <p>{ctl.t('prestige.max')}</p>
    {/if}
  </div>
</section>
</Modal>

<style>
  .end {
    text-align: center;
  }
  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin: 0;
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    color: var(--yellow);
  }
  .sub {
    margin: 0.25rem 0 1rem;
    color: var(--muted);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.5rem 1rem;
    margin: 0 0 1rem;
    text-align: left;
  }
  dt {
    font-family: var(--font-pixel);
    font-size: 0.8rem;
    color: var(--cyan);
  }
  dd {
    margin: 0;
    font-family: var(--font-pixel);
    font-size: 1.3rem;
    font-weight: 700;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .main {
    margin-bottom: 0.35rem;
  }
  .go {
    font-size: 1.2rem;
    padding-inline: 1.75rem;
  }
  .hint {
    margin: 0 0 0.9rem;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .prestige {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 4px dotted var(--border);
  }
  .prestige p {
    margin: 0 0 0.5rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
