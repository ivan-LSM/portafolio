<script lang="ts">
  import { PROJECTS, type ShopId } from '../balance';
  import type { GameController } from './controller.svelte';
  import ShopItem from './ShopItem.svelte';

  let { ctl }: { ctl: GameController } = $props();

  type Tab = 'projects' | 'upgrades';
  const tabs: Tab[] = ['projects', 'upgrades'];

  const ids = $derived.by((): ShopId[] => {
    if (ctl.tab === 'projects') return PROJECTS.map((p) => p.id);
    return ['udemy', 'copilot', 'bootcamp', 'teclado', 'cafe'];
  });
</script>

<section class="shop px-border game-panel" class:tut-hl={ctl.tutorialTarget === 'shop'} data-tut="shop" aria-labelledby="shop-title">
  <div class="head">
    <h3 id="shop-title" class="title">{ctl.t('shop.title')}</h3>
    <div class="tabs" role="tablist" aria-label={ctl.t('shop.title')}>
      {#each tabs as tab (tab)}
        <button
          type="button"
          role="tab"
          id={`tab-${tab}`}
          aria-selected={ctl.tab === tab}
          aria-controls="shop-panel"
          class="px-btn px-btn-sm chip"
            onclick={() => (ctl.tab = tab)}
        >
          {ctl.t(`shop.tab.${tab}`)}
        </button>
      {/each}
    </div>
  </div>

  <div id="shop-panel" role="tabpanel" aria-labelledby={`tab-${ctl.tab}`} class="panel">
    <ul class="items">
      {#each ids as id (id)}
        <li><ShopItem {ctl} {id} /></li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .shop {
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: calc(100% - 6px);
    margin: 3px;
    padding: 0.75rem;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 0.75rem;
    margin-bottom: 0.4rem;
  }
  .title {
    margin: 0;
    font-size: 1.25rem;
    color: var(--yellow);
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.25rem;
  }
  .tabs :global(.chip[aria-selected='true']) {
    background: var(--accent);
    color: var(--accent-ink);
    --bc: var(--accent);
  }
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1 1 auto;
  }
  .items {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding: 0.25rem 0.25rem 0.5rem 0;
    list-style: none;
    overflow-y: auto;
    min-height: 0;
    flex: 1 1 auto;
    align-content: start;
  }
</style>
