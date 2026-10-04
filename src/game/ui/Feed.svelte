<script lang="ts">
  import type { FeedItem, GameController } from './controller.svelte';

  /**
   * Registro de rechazos, entrevistas y eventos. `fill` lo hace ocupar todo el alto libre de su columna
   * (con scroll interno); sin `fill` muestra solo las últimas `limit` líneas.
   */
  let { ctl, limit = 12, fill = false }: { ctl: GameController; limit?: number; fill?: boolean } = $props();
  const items = $derived(ctl.feed.slice(0, limit));

  /** Íconos pixel 7x7 por tipo de línea. */
  const ICON: Record<FeedItem['kind'], string[]> = {
    interview: ['.......', '......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
    reject: ['#.....#', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '#.....#'],
    ghost: ['..###..', '.#####.', '##.#.##', '#######', '#######', '#######', '#.#.#.#'],
    event: ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....'],
    info: ['..###..', '..###..', '.......', '..###..', '..###..', '..###..', '..###..'],
  };
  const path = (kind: FeedItem['kind']) =>
    ICON[kind]
      .flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `M${x} ${y}h1v1h-1z` : '')))
      .join('');
</script>

<section class="feed" class:fill aria-label={ctl.t('feed.title')}>
  <h4>{ctl.t('feed.title')}</h4>
  {#if items.length === 0}
    <p class="empty">{ctl.t('feed.empty')}</p>
  {:else}
    <ul aria-live="off">
      {#each items as it, i (it.id)}
        <li class="{it.kind}" class:latest={i === 0}>
          <svg class="ico" viewBox="0 0 7 7" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true"><path d={path(it.kind)} fill="currentColor" /></svg>
          <span class="txt">{it.text}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .feed {
    margin: 0.6rem 3px 0;
    padding-top: 0.4rem;
    border-top: 4px dotted var(--border);
  }
  .feed.fill {
    display: flex;
    flex-direction: column;
    flex: 1 1 8rem;
    min-height: 6rem;
  }
  h4 {
    flex: none;
    margin: 0 0 0.3rem;
    font-family: var(--font-pixel);
    font-size: 1.05rem;
    color: var(--cyan);
  }
  .empty {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
  }
  ul {
    display: grid;
    gap: 0.25rem;
    align-content: start;
    margin: 0;
    padding: 0 6px 0 0;
    list-style: none;
  }
  .fill ul {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  li {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr);
    align-items: start;
    gap: 0.5rem;
    padding: 0.2rem 0.4rem;
    font-size: 0.95rem;
    line-height: 1.25;
    color: var(--text);
    background: var(--surface);
    border-left: 4px solid var(--border);
    animation: fadein 0.3s steps(3);
  }
  .ico {
    margin-top: 0.15em;
    flex: none;
  }
  .txt {
    overflow-wrap: anywhere;
  }
  li.latest {
    font-weight: 600;
  }
  li.interview {
    border-color: var(--green);
    color: var(--green);
    font-weight: 600;
  }
  li.reject {
    border-color: var(--red);
  }
  li.reject .ico {
    color: var(--red);
  }
  li.ghost {
    border-color: var(--muted);
    color: var(--muted);
    font-style: italic;
  }
  li.event {
    border-color: var(--yellow);
  }
  li.event .ico {
    color: var(--yellow);
  }
  li.info .ico {
    color: var(--cyan);
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    li {
      animation: none;
    }
  }
</style>
