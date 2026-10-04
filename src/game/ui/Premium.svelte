<script lang="ts">
  import type { PremiumId } from '../balance';
  import type { GameController } from './controller.svelte';
  import ShopItem from './ShopItem.svelte';

  let { ctl }: { ctl: GameController } = $props();
  const ids: PremiumId[] = ['linkedin', 'whiteboard', 'portafolio', 'referido'];
</script>

<section class="premium px-border game-panel" aria-labelledby="premium-title">
  <div class="head">
    <h3 id="premium-title">{ctl.t('interviews.title')}: <span class="n">{ctl.s.interviews}</span></h3>
    <span class="sub">{ctl.t('premium.intro')}</span>
  </div>
  <ul>
    {#each ids as id (id)}
      <li><ShopItem {ctl} {id} dense /></li>
    {/each}
  </ul>
</section>

<style>
  .premium {
    margin: 3px 3px 0.5rem;
    padding: 0.6rem 0.75rem;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 0.75rem;
    margin-bottom: 0.4rem;
  }
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--yellow);
  }
  .n {
    color: var(--green);
  }
  .sub {
    font-size: 0.8rem;
    color: var(--muted);
  }
  @media (min-width: 1024px) and (max-height: 900px) {
    .sub {
      display: none;
    }
  }
  ul {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
