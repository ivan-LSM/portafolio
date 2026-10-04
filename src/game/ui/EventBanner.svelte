<script lang="ts">
  import { EVENT_DEFS, type EventId } from '../balance';
  import { formatNumber } from '../format';
  import { bannerTone } from './fx';
  import type { GameController } from './controller.svelte';

  /**
   * Aviso de evento o multiplicador superpuesto en la parte alta de la escena. Entra con un pop (título, efecto
   * explícito y barra de tiempo) y luego queda como una pastilla compacta con la cuenta regresiva.
   * Los botones del recruiter y del barril viven en Toasts: aquí solo se muestra el título.
   */
  let { ctl }: { ctl: GameController } = $props();

  /** tiempo en formato grande antes de pasar a la pastilla (ms) */
  const EXPANDED_MS = 3600;

  const b = $derived(ctl.banner);
  const remaining = $derived.by(() => {
    ctl.phase; // se reevalúa cada ~200 ms (los eventos instantáneos dependen del reloj)
    if (!b) return 0;
    const s = ctl.s;
    if (b.id === 'dempsey') return s.dempseyLeft;
    if (b.id === 'cafe') return s.cafeActive;
    if (s.activeEvent?.id === b.id) return s.activeEvent.left;
    if (EVENT_DEFS[b.id as EventId].durationMs === 0) return Math.max(0, b.startedAt + b.totalMs - performance.now());
    return 0;
  });
  const shown = $derived(!!b && remaining > 0 && !ctl.cliff && !ctl.s.finished);
  const timed = $derived(!!b && (b.id === 'dempsey' || b.id === 'cafe' || EVENT_DEFS[b.id as EventId].durationMs > 0));
  const expanded = $derived.by(() => {
    ctl.phase;
    if (!b) return false;
    return !timed || performance.now() - b.startedAt < EXPANDED_MS;
  });
  const tone = $derived(b ? bannerTone(b.id) : 'neutral');
  const pct = $derived(b ? Math.max(0, Math.min(100, (remaining / b.totalMs) * 100)) : 0);
  const secs = $derived(Math.ceil(remaining / 1000));
  const title = $derived(b ? ctl.t(`event.${b.id}.short`) : '');
  const effect = $derived.by(() => {
    if (!b) return '';
    if (b.id === 'cafederramado') return ctl.t(b.value ? 'event.cafederramado.effect' : 'event.cafederramado.effectJoke');
    return ctl.t(`event.${b.id}.effect`, { ...ctl.effectParams(b.id), n: formatNumber(b.value ?? 0) });
  });
</script>

<div class="banner-slot" role="status" aria-live="polite" aria-atomic="true">
  {#if shown && b}
    <span class="sr-only-text">{title}. {effect}</span>
    {#key b.key}
      <div class="banner {tone}" class:expanded class:pill={!expanded} aria-hidden="true">
        <div class="tb"><span class="dots"><i></i><i></i></span><span class="tbt">event.exe</span></div>
        <div class="body">
          {#if expanded}
            <p class="title">{title}</p>
            <p class="effect">{effect}</p>
            {#if timed}<div class="bar"><span class="fill" style="width: {pct}%"></span></div>{/if}
          {:else}
            <span class="title">{title}</span>
            <span class="count">{ctl.t('banner.left', { s: secs })}</span>
            <div class="bar mini"><span class="fill" style="width: {pct}%"></span></div>
          {/if}
        </div>
      </div>
    {/key}
  {/if}
</div>

<style>
  /* Misma ventana holografica del HUD (ver HoloWindow.svelte): marco de 1 unidad, barra de titulo y fondo oscuro translucido */
  .banner-slot {
    position: absolute;
    top: calc(var(--px) * 4px);
    left: calc(var(--px) * 12px);
    right: calc(var(--px) * 12px);
    z-index: 25;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .banner {
    --c: #ffcd75;
    box-sizing: border-box;
    max-width: 100%;
    min-width: min(100%, 14rem);
    background: rgb(26 28 44 / 0.88);
    border: calc(var(--px) * 1px) solid var(--c);
    box-shadow:
      calc(var(--px) * 1px) calc(var(--px) * 1px) 0 rgb(26 28 44 / 0.5),
      0 0 calc(var(--px) * 2px) color-mix(in srgb, var(--c) 45%, transparent);
    font-family: var(--font-pixel);
    animation: entry 0.3s steps(4) both;
  }
  .banner.expanded {
    width: min(100%, 30rem);
  }
  .banner.good {
    --c: #73eff7;
    border-image: repeating-linear-gradient(90deg, #b13e53 0 12px, #ef7d57 12px 24px, #ffcd75 24px 36px, #a7f070 36px 48px, #38b764 48px 60px, #41a6f6 60px 72px, #73eff7 72px 84px, #5d275d 84px 96px) 1 / calc(var(--px) * 1px) / 0 stretch;
  }
  .banner.bad {
    --c: #b13e53;
    animation:
      entry 0.3s steps(4) both,
      redblink 0.5s steps(1) infinite;
  }
  .tb {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0 0.3rem;
    background: var(--c);
    color: #1a1c2c;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.04em;
  }
  .good .tb {
    background: repeating-linear-gradient(90deg, #b13e53 0 12px, #ef7d57 12px 24px, #ffcd75 24px 36px, #a7f070 36px 48px, #38b764 48px 60px, #41a6f6 60px 72px, #73eff7 72px 84px, #5d275d 84px 96px);
    background-size: 96px 100%;
    animation: scroll 0.8s steps(8) infinite;
  }
  .bad .tb {
    color: #f4f4f4;
  }
  .dots {
    display: inline-flex;
    gap: 2px;
  }
  .dots i {
    display: block;
    width: 4px;
    height: 4px;
    background: currentColor;
    opacity: 0.7;
  }
  .body {
    padding: 0.3rem 0.5rem 0.4rem;
    background: repeating-linear-gradient(transparent 0 2px, rgb(115 239 247 / 0.05) 2px 4px);
    color: #f4f4f4;
    text-align: center;
  }
  .expanded .title {
    margin: 0;
    font-size: calc(var(--px) * 0.4rem + 0.3rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: 0.02em;
    color: #73eff7;
    text-shadow: 2px 2px 0 #1a1c2c;
    overflow-wrap: anywhere;
  }
  .expanded .effect {
    margin: 0.2rem 0 0;
    font-size: calc(var(--px) * 0.1rem + 0.8rem);
    line-height: 1.15;
    color: #f4f4f4;
  }
  .good .title {
    animation: rainbow-text 0.64s steps(1) infinite;
  }
  .bad .title {
    color: #ff9aa8;
  }
  .bar {
    height: 6px;
    margin-top: 0.35rem;
    background: #333c57;
    box-shadow: 0 0 0 1px #566c86;
  }
  .fill {
    display: block;
    height: 100%;
    background: #73eff7;
  }
  .good .fill {
    background: #a7f070;
  }
  .bad .fill {
    background: #ff6b81;
  }

  /* Pastilla compacta mientras dura el efecto */
  .pill {
    animation: none;
    min-width: 0;
  }
  .pill.bad {
    animation: redblink 0.5s steps(1) infinite;
  }
  .pill .tb {
    display: none;
  }
  .pill .body {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0 0.5rem;
    padding: 0.15rem 0.5rem 0.25rem;
    font-size: 0.9rem;
    line-height: 1.15;
  }
  .pill .title {
    font-weight: 700;
    color: #73eff7;
  }
  .pill.bad .title {
    color: #ff9aa8;
  }
  .pill .count {
    color: #f4f4f4;
  }
  .pill .bar.mini {
    flex: 1 0 100%;
    height: 3px;
    margin-top: 0.2rem;
    box-shadow: none;
  }

  /* movil: el aviso grande tapaba al personaje; queda mas bajo en alto */
  @media (max-width: 639px) {
    .banner-slot {
      top: calc(var(--px) * 3px);
      left: calc(var(--px) * 8px);
      right: calc(var(--px) * 8px);
    }
    .expanded .tb {
      display: none;
    }
    .expanded .body {
      padding: 0.15rem 0.4rem 0.25rem;
    }
    .expanded .title {
      font-size: 0.95rem;
    }
    .expanded .effect {
      margin-top: 0.1rem;
      font-size: 0.72rem;
    }
    .expanded .bar {
      height: 4px;
      margin-top: 0.2rem;
    }
  }

  @keyframes entry {
    0% {
      transform: translateY(-60%) scale(0.5);
      opacity: 0;
    }
    50% {
      transform: translateY(4%) scale(1.06) translateX(2px);
      opacity: 1;
    }
    75% {
      transform: scale(0.97) translateX(-2px);
    }
    100% {
      transform: none;
    }
  }
  @keyframes scroll {
    to {
      background-position-x: 96px;
    }
  }
  @keyframes redblink {
    0%,
    100% {
      border-color: #b13e53;
    }
    50% {
      border-color: #ef7d57;
    }
  }
  @keyframes rainbow-text {
    0% {
      color: #ef7d57;
    }
    25% {
      color: #ffcd75;
    }
    50% {
      color: #a7f070;
    }
    75% {
      color: #73eff7;
    }
  }

  /* Movimiento reducido: ventana fija, sin arcoiris animado ni parpadeo */
  @media (prefers-reduced-motion: reduce) {
    .banner,
    .banner.good,
    .banner.bad,
    .pill,
    .pill.bad,
    .good .tb,
    .good .title {
      animation: none;
    }
    .good .tb {
      background: #38b764;
    }
    .good .title {
      color: #a7f070;
    }
  }
</style>
