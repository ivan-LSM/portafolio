<script lang="ts">
  import { PROJECTS, type ShopId } from '../balance';
  import { canBuy, costOf, isPremium } from '../engine';
  import { formatNumber } from '../format';
  import Sprite from '../sprites/Sprite.svelte';
  import { ICONS, type IconId } from '../sprites';
  import type { GameController } from './controller.svelte';

  let { ctl, id, dense = false }: { ctl: GameController; id: ShopId; dense?: boolean } = $props();
  const s = $derived(ctl.s);

  const it = $derived.by(() => {
    const cost = costOf(s, id);
    const premium = isPremium(id);
    const isProj = PROJECTS.some((p) => p.id === id);
    const hidden = isProj && !s.revealed.includes(id as never);
    let status = '';
    let extra = '';
    if (!Number.isFinite(cost)) status = id === 'copilot' ? 'maxed' : 'bought';
    if (id === 'cafe') {
      if (s.cafeActive > 0) {
        status = 'active';
        extra = ctl.t('shop.active', { s: Math.ceil(s.cafeActive / 1000) });
      } else if (s.cafeCooldown > 0) {
        status = 'cooldown';
        extra = ctl.t('shop.cooldown', { s: Math.ceil(s.cafeCooldown / 1000) });
      }
    }
    if (id === 'copilot' && s.copilotLevel > 0) extra = ctl.t('item.copilot.level', { n: s.copilotLevel });
    if (isProj) {
      const def = PROJECTS.find((p) => p.id === id)!;
      extra = `${ctl.t('shop.owned', { n: s.owned[def.id] })} · ${ctl.t('shop.cps', { n: def.cps })}`;
    }
    const costText = Number.isFinite(cost)
      ? premium
        ? ctl.t('shop.cost.interviews', { n: cost })
        : ctl.t('shop.cost.commits', { n: formatNumber(cost) })
      : status === 'maxed'
        ? ctl.t('shop.maxed')
        : ctl.t('shop.bought');
    const enabled = canBuy(s, id);
    let missing = '';
    if (Number.isFinite(cost) && !enabled && !status) {
      if (premium) missing = ctl.t('shop.missingInterviews', { n: Math.max(1, Math.ceil(cost - s.interviews)) });
      else missing = ctl.t('shop.missing', { n: formatNumber(Math.max(1, Math.ceil(cost - s.commits))) });
    }
    return { cost, hidden, status, extra, costText, enabled, missing };
  });
</script>

{#if it.hidden}
  <div class="item locked" aria-hidden="true">
    <span class="icon-wrap"><span class="qmark">?</span></span>
    <span class="body"><span class="name">{ctl.t('shop.locked')}</span></span>
  </div>
{:else}
  <button
    type="button"
    class="item px-btn"
    class:dense
    class:ready={it.enabled}
    disabled={!it.enabled}
    title={`${ctl.t(`item.${id}.desc`)} (${it.costText})`}
    onclick={() => ctl.buy(id)}
  >
    <span class="icon-wrap"><Sprite def={ICONS[id as IconId]} scale={2} /></span>
    <span class="body">
      <span class="name">{ctl.t(`item.${id}.name`)}</span>
      <span class="desc">{ctl.t(`item.${id}.desc`)}</span>
      <span class="meta">
        <strong class="cost">{it.costText}</strong>
        {#if it.extra}<span class="extra">{it.extra}</span>{/if}
        {#if it.missing}<span class="missing">{it.missing}</span>{/if}
      </span>
    </span>
  </button>
{/if}

<style>
  .item {
    display: flex;
    width: calc(100% - 6px);
    align-items: center;
    gap: 0.6rem;
    text-align: left;
    padding: 0.4rem 0.6rem;
    background: var(--surface-2);
    font-weight: 400;
  }
  .item:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: grayscale(0.5);
    --bc: var(--border);
    transform: none;
    border-style: dashed;
  }
  .item.ready {
    --bc: var(--green);
    background: var(--surface);
  }
  .item.locked {
    margin: 3px;
    opacity: 0.5;
    padding: 0.4rem 0.6rem;
    display: flex;
    gap: 0.6rem;
    align-items: center;
    background: var(--surface-2);
    box-shadow: 0 0 0 3px var(--border);
    border-radius: 0;
  }
  .icon-wrap {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: none;
    background: var(--bg);
  }
  .qmark {
    font-family: var(--font-pixel);
    font-size: 1.5rem;
    color: var(--muted);
  }
  .body {
    display: grid;
    gap: 0.05rem;
    min-width: 0;
  }
  .name {
    font-family: var(--font-pixel);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.15;
  }
  .desc {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    line-height: 1.25;
    color: var(--muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* en escritorio con poca altura la descripción queda solo en el tooltip (title) para que la columna no scrollee */
  @media (min-width: 1024px) and (max-height: 900px) {
    .dense .desc {
      display: none;
    }
    .dense {
      gap: 0.4rem;
      padding: 0.2rem 0.4rem;
    }
    .dense .name {
      font-size: 0.92rem;
    }
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.6rem;
    font-size: 0.8rem;
  }
  .cost {
    color: var(--yellow);
    font-family: var(--font-pixel);
  }
  .extra {
    color: var(--cyan);
    font-family: var(--font-pixel);
  }
  .missing {
    color: var(--muted);
    font-family: var(--font-pixel);
  }
</style>
