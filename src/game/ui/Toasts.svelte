<script lang="ts">
  import Sprite from '../sprites/Sprite.svelte';
  import { UI_ICONS } from '../sprites';
  import { MAX_TOASTS, type GameController } from './controller.svelte';

  let { ctl }: { ctl: GameController } = $props();

  const ev = $derived(ctl.s.activeEvent);
  /** El recruiter y el barril son avisos con tiempo límite: aparecen en el viewport con su botón. */
  const prompt = $derived(ev && (ev.id === 'recruiter' || ev.id === 'barril') ? ev : null);
  /** En pantallas angostas solo se muestra el toast más reciente (más el aviso con botón); el resto se resume en "+N". */
  let narrow = $state(false);
  $effect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    narrow = mq.matches;
    const on = (e: MediaQueryListEvent) => (narrow = e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  });
  const limit = $derived(narrow ? 1 : MAX_TOASTS - (prompt ? 1 : 0));
  const visible = $derived(ctl.toasts.slice(-limit));
  const hidden = $derived(narrow ? Math.max(0, ctl.toasts.length - visible.length) : 0);
</script>

<div class="toasts" style="top: calc({ctl.headerH}px + 0.5rem)" aria-live="polite" aria-label={ctl.t('a11y.toasts')} role="log">
  {#if prompt}
    <div class="toast prompt" aria-live="off">
      <span class="text">{ctl.t(`event.${prompt.id}.title`)}</span>
      {#if prompt.id === 'recruiter'}
        <button type="button" class="px-btn px-btn-sm px-btn-primary" onclick={() => ctl.acceptRecruiter()}>
          {ctl.t('event.recruiter.accept', { s: Math.ceil(prompt.left / 1000) })}
        </button>
      {:else}
        <button type="button" class="px-btn px-btn-sm px-btn-primary" onclick={() => ctl.popBarril()}>
          {ctl.t('event.barril.pop', { s: Math.ceil(prompt.left / 1000) })}
        </button>
      {/if}
    </div>
  {/if}
  {#each visible as toast (toast.id)}
    <div class="toast {toast.kind}">
      {#if toast.kind === 'unlock'}<Sprite def={UI_ICONS.lock} scale={2} />{:else if toast.kind === 'achv'}<Sprite def={UI_ICONS.trophy} scale={2} />{/if}
      <span class="text">{toast.text}</span>
      {#if toast.href}
        <a href={toast.href} target="_blank" rel="noopener">{toast.linkText}<span class="sr-only-text"> (↗)</span></a>
      {/if}
      <button type="button" class="x" aria-label={ctl.t('toast.close')} onclick={() => ctl.dismissToast(toast.id)}>×</button>
    </div>
  {/each}
  {#if hidden > 0}
    <div class="more" aria-hidden="true">+{hidden}</div>
  {/if}
</div>

<style>
  .toasts {
    position: fixed;
    right: 1rem;
    z-index: 60;
    display: grid;
    gap: 0.6rem;
    width: min(22rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 5rem);
    overflow: hidden;
    pointer-events: none;
  }
  @media (max-width: 639px) {
    .toasts {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .toast {
    pointer-events: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.75rem;
    margin: 3px;
    padding: 0.5rem 0.7rem;
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-pixel);
    font-size: 0.95rem;
    line-height: 1.25;
    box-shadow:
      0 -3px 0 0 var(--bc, var(--border)),
      0 3px 0 0 var(--bc, var(--border)),
      -3px 0 0 0 var(--bc, var(--border)),
      3px 0 0 0 var(--bc, var(--border)),
      5px 8px 0 0 var(--shadow);
    animation: slidein 0.25s steps(4);
  }
  .toast.unlock {
    --bc: var(--green);
  }
  .toast.achv {
    --bc: var(--yellow);
  }
  .toast.prompt {
    --bc: var(--accent);
  }
  .more {
    justify-self: end;
    margin-right: 3px;
    padding: 0 0.4rem;
    background: var(--surface);
    color: var(--muted);
    font-family: var(--font-pixel);
    font-size: 0.85rem;
    line-height: 1.3;
    box-shadow: 0 0 0 2px var(--border);
  }
  @media (max-width: 640px) {
    .toasts {
      gap: 0.35rem;
      width: min(20rem, calc(100vw - 1.5rem));
    }
    .toast {
      gap: 0.15rem 0.5rem;
      padding: 0.3rem 0.5rem;
      font-size: 0.8rem;
      line-height: 1.2;
    }
  }
  .text {
    flex: 1 1 10rem;
  }
  a {
    color: var(--accent);
  }
  .toast :global(.px-btn) {
    margin: 0;
  }
  .x {
    margin-left: auto;
    background: none;
    border: 0;
    color: var(--muted);
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
  }
  @keyframes slidein {
    from {
      transform: translateY(-110%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
