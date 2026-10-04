<script lang="ts">
  /**
   * Capa HUD holografica sobre la escena: el POV es el monitor que mira al personaje.
   * Marco con brackets, barra de estado, etiquetas de estado junto a la cara y ventanas emergentes.
   * Todo en unidades de escena (calc(N * var(--px) * 1px)); aria-hidden porque la informacion real esta en el HUD de stats.
   */
  import { onMount } from 'svelte';
  import { TECH_TEST_STAGE } from '../balance';
  import { totalPerSec } from '../engine';
  import { LAYOUT } from '../sprites';
  import type { GameController } from './controller.svelte';
  import HoloWindow from './HoloWindow.svelte';
  import { FACE_FALLBACK, HOLO_MAX_DESKTOP, HOLO_MAX_MOBILE, SPARK_LEN, barSegments, clockText, faceState, focusPct, loadPct, pushSample, sparkHeights, type Rect } from './holo';

  let { ctl }: { ctl: GameController } = $props();

  const s = $derived(ctl.s);
  const face: Rect = (LAYOUT as { face?: Rect }).face ?? FACE_FALLBACK;
  const u = (n: number) => `calc(${n} * var(--px) * 1px)`;

  // tope de ventanas segun el ancho de pantalla (1 en movil)
  onMount(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => (ctl.holoMax = mq.matches ? HOLO_MAX_MOBILE : HOLO_MAX_DESKTOP);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  });

  // sparkline de commits/s: una muestra por segundo
  let spark = $state<number[]>(Array(SPARK_LEN).fill(0));
  $effect(() => {
    if (!ctl.holoOn) return;
    let last = ctl.s.totalCommits;
    const id = setInterval(() => {
      const now = ctl.s.totalCommits;
      spark = pushSample(spark, Math.max(0, now - last));
      last = now;
    }, 1000);
    return () => clearInterval(id);
  });
  const sparkH = $derived(sparkHeights(spark, 4));

  const rate = $derived(totalPerSec(s));
  const cpu = $derived(barSegments(loadPct(rate, 10, 24), 5));
  const ram = $derived(barSegments(loadPct(rate, 22, 16), 5));
  const clock = $derived(clockText(s.elapsedMs));

  const fstate = $derived.by(() => {
    ctl.phase; // se reevalua cada ~200 ms
    const now = performance.now();
    return faceState({
      cliff: ctl.cliff,
      finished: s.finished,
      dempsey: s.dempseyLeft > 0,
      techTest: !!s.final && s.final.stage === TECH_TEST_STAGE,
      shock: now < ctl.shockUntil,
      happy: now < ctl.happyUntil,
      typing: now - ctl.lastClickAt < 700,
    });
  });
  const focus = $derived.by(() => {
    ctl.phase;
    return focusPct(ctl.combo, performance.now() - ctl.lastClickAt < 700, s.dempseyLeft > 0);
  });
  const focusSegs = $derived(barSegments(focus, 8));
  const tone = $derived(fstate === 'stress' || fstate === 'resign' ? 'red' : fstate === 'happy' ? 'gold' : fstate === 'tech' || fstate === 'dempsey' ? 'green' : 'cyan');
</script>

{#if ctl.holoOn && !ctl.cliff}
  <div class="holo" aria-hidden="true" data-lang={ctl.lang}>
    <div class="scan"></div>
    <div class="sweep"></div>
    <i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br bro"></i>

    <div class="ret {tone}" style="--fx: {face.x}; --fy: {face.y}; --fw: {face.w}; --fh: {face.h};" class:glitch={fstate === 'stress'}>
      <span class="tag" style="left: {u(face.x - 2)}; top: {u(face.y - 7)};"><span class="nm-l">{ctl.t('holo.name')}</span><span class="nm-s">IVAN</span></span>
      <div class="chip" style="left: {u(face.x + face.w + 4)}; top: {u(face.y + 1)};">
        <span class="st">{ctl.t(`holo.state.${fstate}`)}</span>
        <span class="meter"><span class="lb">{ctl.t('holo.focus')} {focus}%</span>
          <span class="segs">{#each Array(8) as _, i (i)}<i class:on={i < focusSegs}></i>{/each}</span>
        </span>
      </div>
    </div>

    {#each ctl.holoWins as w (w.id)}
      <HoloWindow win={w} />
    {/each}

    <div class="status">
      <span class="rec"><i class="dot"></i>{ctl.t('holo.rec')}</span>
      <span class="clock">{clock}</span>
      <span class="lbl">{ctl.t('holo.cpu')}</span><span class="segs sm">{#each Array(5) as _, i (i)}<i class:on={i < cpu}></i>{/each}</span>
      <span class="lbl ramlbl">{ctl.t('holo.ram')}</span><span class="segs sm ramsegs">{#each Array(5) as _, i (i)}<i class:on={i < ram}></i>{/each}</span>
      <span class="spark">{#each sparkH as h, i (i)}<i style="height: {u(h)}"></i>{/each}</span>
    </div>
  </div>
{/if}

<style>
  .holo {
    --c: #73eff7;
    position: absolute;
    inset: 0;
    z-index: 20;
    overflow: hidden;
    pointer-events: none;
    font-family: var(--font-pixel);
    font-size: max(8px, calc(var(--px) * 2.75px));
    line-height: 1.15;
    color: var(--c);
    text-shadow: 0 0 calc(var(--px) * 1px) rgb(115 239 247 / 0.45);
  }
  .holo i {
    display: block;
  }
  /* scanlines estaticas muy sutiles y una linea de barrido lenta */
  .scan {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(transparent 0 calc(var(--px) * 1px), rgb(115 239 247 / 0.045) calc(var(--px) * 1px) calc(var(--px) * 2px));
  }
  .sweep {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: calc(var(--px) * 1px);
    background: rgb(115 239 247 / 0.12);
    animation: sweep 7s steps(52) infinite;
  }

  /* brackets del marco del monitor */
  .br {
    position: absolute;
    width: calc(var(--px) * 7px);
    height: calc(var(--px) * 7px);
    border: 0 solid var(--c);
    opacity: 0.85;
  }
  .tl {
    left: calc(var(--px) * 2px);
    top: calc(var(--px) * 2px);
    border-width: calc(var(--px) * 1px) 0 0 calc(var(--px) * 1px);
  }
  .tr {
    right: calc(var(--px) * 2px);
    top: calc(var(--px) * 2px);
    border-width: calc(var(--px) * 1px) calc(var(--px) * 1px) 0 0;
  }
  .bl {
    left: calc(var(--px) * 2px);
    bottom: calc(var(--px) * 9px);
    border-width: 0 0 calc(var(--px) * 1px) calc(var(--px) * 1px);
  }
  .bro {
    right: calc(var(--px) * 2px);
    bottom: calc(var(--px) * 9px);
    border-width: 0 calc(var(--px) * 1px) calc(var(--px) * 1px) 0;
  }

  /* etiquetas junto a la cara (nombre y estado), nunca sobre ojos ni boca; sin encuadre */
  .ret {
    --c: #73eff7;
    position: absolute;
    inset: 0;
    color: var(--c);
  }
  .ret.red {
    --c: #ff6b81;
  }
  .ret.gold {
    --c: #ffcd75;
  }
  .ret.green {
    --c: #a7f070;
  }
  .tag {
    position: absolute;
    padding: 0 calc(var(--px) * 1px);
    background: rgb(26 28 44 / 0.7);
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.04em;
  }
  .chip {
    position: absolute;
    display: grid;
    gap: calc(var(--px) * 0.5px);
    padding: calc(var(--px) * 0.5px) calc(var(--px) * 1px);
    background: rgb(26 28 44 / 0.7);
    border-left: calc(var(--px) * 1px) solid var(--c);
  }
  .st {
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.04em;
  }
  .meter {
    display: grid;
    gap: calc(var(--px) * 0.5px);
    font-size: 0.85em;
    color: #f4f4f4;
    text-shadow: none;
    white-space: nowrap;
  }
  .segs {
    display: flex;
    gap: calc(var(--px) * 0.5px);
  }
  .segs i {
    width: calc(var(--px) * 2px);
    height: calc(var(--px) * 1.5px);
    background: rgb(115 239 247 / 0.2);
  }
  .segs i.on {
    background: var(--c);
  }
  .ret.glitch {
    animation: glitch 0.9s steps(1) 1;
  }

  /* barra de estado inferior */
  .status {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--px) * 7px);
    display: flex;
    align-items: center;
    gap: calc(var(--px) * 2.5px);
    padding: 0 calc(var(--px) * 3px);
    background: rgb(26 28 44 / 0.62);
    border-top: calc(var(--px) * 1px) solid rgb(115 239 247 / 0.7);
    white-space: nowrap;
  }
  .rec {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--px) * 1px);
    font-weight: 700;
    color: #ff6b81;
    text-shadow: none;
  }
  .dot {
    width: calc(var(--px) * 2px);
    height: calc(var(--px) * 2px);
    background: #ff6b81;
    animation: blink 1s steps(1) infinite;
  }
  .clock {
    color: #f4f4f4;
    text-shadow: none;
  }
  .lbl {
    opacity: 0.85;
  }
  .segs.sm i {
    width: calc(var(--px) * 1.5px);
    height: calc(var(--px) * 2px);
  }
  .spark {
    display: flex;
    align-items: flex-end;
    gap: 0;
    height: calc(var(--px) * 4px);
    margin-left: auto;
  }
  .spark i {
    width: calc(var(--px) * 1px);
    background: var(--c);
    min-height: 0;
  }
  .nm-s {
    display: none;
  }
  @media (max-width: 639px) {
    .meter,
    .nm-l {
      display: none;
    }
    .nm-s {
      display: inline;
    }
    .ramlbl,
    .ramsegs {
      display: none;
    }
  }

  @keyframes blink {
    50% {
      opacity: 0.15;
    }
  }
  @keyframes sweep {
    to {
      transform: translateY(calc(104 * var(--px) * 1px));
    }
  }
  @keyframes glitch {
    0% {
      transform: translateX(calc(var(--px) * -1px));
    }
    20% {
      transform: translateX(calc(var(--px) * 2px));
    }
    40% {
      transform: translateX(calc(var(--px) * -1px));
    }
    60% {
      transform: translateX(calc(var(--px) * 1px));
    }
    80%,
    100% {
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sweep {
      display: none;
    }
    .dot,
    .ret.glitch {
      animation: none;
    }
  }
</style>
