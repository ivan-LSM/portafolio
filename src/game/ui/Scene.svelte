<script lang="ts">
  import { onMount } from 'svelte';
  import Sprite from '../sprites/Sprite.svelte';
  import EventBanner from './EventBanner.svelte';
  import Fx from './Fx.svelte';
  import HoloHud from './HoloHud.svelte';
  import {
    BACK,
    BARREL_BIG,
    BARREL_MUG,
    CHAIR,
    CLIFF,
    DESK,
    GO_GLYPH,
    ROUTER,
    KEYBOARD,
    LAMP,
    LAMP_GLOW,
    LAYOUT,
    MAT,
    MOUSE,
    MUG,
    POSTERS,
    POSTER_H,
    POSTER_IDS,
    SCENE_H,
    SCENE_W,
    SPEAKER,
    STEAM,
    getCharacter,
    type CharFrame,
    type PosterId,
  } from '../sprites';
  import { ARROW_CLICKS, TECH_TEST_STAGE } from '../balance';
  import { cafeIsBarrel } from '../engine';
  import { formatNumber } from '../format';
  import { CLIFF_MS, CLIFF_REDUCED_MS, type GameController } from './controller.svelte';

  let { ctl }: { ctl: GameController } = $props();

  const s = $derived(ctl.s);
  const level = $derived(Math.min(4, s.prestige));
  const barrelMug = $derived(cafeIsBarrel(s));

  onMount(() => ctl.loadLamp());

  let steamFrame = $state(0);
  $effect(() => {
    if (s.cafeActive <= 0 || ctl.reduced) return;
    const id = setInterval(() => (steamFrame = (steamFrame + 1) % 4), 220);
    return () => clearInterval(id);
  });

  // Animaciones ambientales: todas cuelgan de ctl.phase (cambia cada ~200 ms) y se apagan con movimiento reducido.
  const mouseFrame = $derived(ctl.reduced ? 0 : Math.floor(ctl.phase / 5) % 3);
  const routerFrame = $derived(ctl.reduced ? 0 : Math.floor(ctl.phase / 7) % 2);
  const barrelFrame = $derived(ctl.phase % 2);

  /**
   * Frame del personaje. Prioridad: caida de prestigio > partida terminada > Dempsey > prueba tecnica (espiral)
   * > shock por rechazo > sorbo de cafe > feliz > tecleando > reposo (idle1 = parpadeo breve cada ~1.6 s).
   */
  const charFrame = $derived.by((): CharFrame => {
    const ph = ctl.phase; // dependencia: se reevalua cada 200 ms
    const now = performance.now();
    if (ctl.cliff) {
      if (ctl.reduced) return 'fall0';
      return now - ctl.cliffStart < 600 ? 'happy' : ph % 2 ? 'fall1' : 'fall0';
    }
    if (s.finished) return 'happy';
    if (s.dempseyLeft > 0 && !ctl.reduced) return ph % 2 ? 'swayR' : 'swayL';
    if (s.final && s.final.stage === TECH_TEST_STAGE) return 'spiral';
    if (now < ctl.shockUntil) return 'shock';
    if (now < ctl.sipUntil) return 'sip';
    if (now < ctl.happyUntil) return 'happy';
    if (now - ctl.lastClickAt < 700) return ctl.typingFrame ? 'typing1' : 'typing0';
    if (ctl.reduced) return 'idle0';
    return ph % 8 === 0 ? 'idle1' : 'idle0';
  });

  /** sorbo en curso: la taza sale de la mesa; al volver suelta un puff de vapor */
  const sipping = $derived(charFrame === 'sip');
  const puffing = $derived.by(() => {
    ctl.phase;
    const now = performance.now();
    return ctl.sipUntil > 0 && now >= ctl.sipUntil && now < ctl.sipUntil + 900;
  });
  const steamShown = $derived((s.cafeActive > 0 && !sipping) || puffing);
  const steamIdx = $derived(puffing ? ctl.phase % 4 : steamFrame);
  const ringFrame = $derived.by(() => {
    ctl.phase;
    if (performance.now() >= ctl.assistantUntil) return 0;
    return 1 + (ctl.reduced ? 0 : ctl.phase % 4);
  });
  let hoverPoster = $state<PosterId | null>(null);

  /** el mouse se mueve 1 px a la derecha en el parpadeo de reposo (la mano derecha lo sostiene) */
  const mouseNudge = $derived(charFrame === 'idle1' ? 1 : 0);

  const gain = $derived(ctl.clickGain);
  const gainText = $derived(formatNumber(gain, gain < 10 ? 1 : 0).replace(/\.0$/, ''));
  const showArrow = $derived(s.clicksTotal < ARROW_CLICKS);
  const tutClick = $derived(ctl.tutorialTarget === 'click');

  const pos = (p: { x: number; y: number }) => `left: calc(${p.x} * var(--px) * 1px); top: calc(${p.y} * var(--px) * 1px);`;
  const kb = LAYOUT.keyboard;
  /** caja de click de un objeto (unidades de escena + margen) */
  const box = (p: { x: number; y: number }, d: { w: number; h: number }, m: number) =>
    `left: calc(${p.x - m} * var(--px) * 1px); top: calc(${p.y - m} * var(--px) * 1px); width: calc(${d.w + 2 * m} * var(--px) * 1px); height: calc(${d.h + 2 * m} * var(--px) * 1px);`;
  const barrel = $derived(s.activeEvent?.id === 'barril' ? s.activeEvent : null);

  /** posiciones de los 「ゴ」 que flotan alrededor del personaje durante el proceso final */
  const GLYPHS = [
    { x: 40, y: 44, d: 0 },
    { x: 94, y: 44, d: 0.3 },
    { x: 32, y: 56, d: 0.6 },
    { x: 100, y: 58, d: 0.9 },
    { x: 56, y: 30, d: 1.2 },
    { x: 78, y: 30, d: 0.15 },
  ];
</script>

<div class="scene-wrap">
<div class="scene px-border" class:shake={ctl.shake} role="group" aria-label={ctl.t('scene.alt')}>
  <div
    class="room"
    class:cliff={ctl.cliff}
    style="width: calc({SCENE_W} * var(--px) * 1px); height: calc({SCENE_H} * var(--px) * 1px); --cliff-ms: {ctl.reduced ? CLIFF_REDUCED_MS : CLIFF_MS}ms"
  >
    <div class="piece" style={pos(LAYOUT.back)}><Sprite def={BACK} /></div>

    {#each POSTER_IDS as id, i (id)}
      <span
        class="poster"
        style={pos(LAYOUT.posters[i])}
        role="img"
        tabindex="0"
        aria-label={ctl.t(`poster.${id}`)}
        onmouseenter={() => (hoverPoster = id)}
        onmouseleave={() => (hoverPoster = null)}
        onfocus={() => (hoverPoster = id)}
        onblur={() => (hoverPoster = null)}
      >
        <Sprite def={POSTERS[id]} />
      </span>
    {/each}

    <div class="piece" style={pos(LAYOUT.speaker)}><Sprite def={SPEAKER} frame={ringFrame} /></div>

    <div class="piece" style={pos(LAYOUT.chair)}><Sprite def={CHAIR} /></div>
    <div class="piece" style={pos(LAYOUT.desk)}><Sprite def={DESK} /></div>
    <div class="piece" style={pos(LAYOUT.lampGlow)}><Sprite def={LAMP_GLOW} frame={ctl.lampOn ? 0 : 1} /></div>
    <div class="piece" style={pos(LAYOUT.lamp)}><Sprite def={LAMP} frame={ctl.lampOn ? 0 : 1} /></div>
    <div class="piece" style={pos(LAYOUT.mat)}><Sprite def={MAT} /></div>
    <div class="piece" style={pos(LAYOUT.router)}><Sprite def={ROUTER} frame={routerFrame} /></div>
    {#if !sipping}
      <div class="piece" style={pos(LAYOUT.mug)}><Sprite def={barrelMug ? BARREL_MUG : MUG} /></div>
    {/if}
    {#if steamShown}
      <div class="piece steam" class:puff={puffing && !ctl.reduced} style={pos(LAYOUT.steam)}><Sprite def={STEAM} frame={steamIdx} /></div>
    {/if}
    <div class="piece" style={pos(kb)}><Sprite def={KEYBOARD} frame={ctl.keyFrame} /></div>
    <div class="piece" style={pos({ x: LAYOUT.mouse.x + mouseNudge, y: LAYOUT.mouse.y })}><Sprite def={MOUSE} frame={mouseFrame} /></div>

    <div class="piece character" class:falling={ctl.cliff && !ctl.reduced} style={pos(LAYOUT.character)}>
      <Sprite def={getCharacter(level, charFrame)} label={ctl.t('char.alt')} />
    </div>

    {#if s.final}
      <div class="gogogo" aria-hidden="true" class:calm={ctl.reduced}>
        {#each GLYPHS as gl, i (i)}
          <span class="go" style="{pos(gl)} animation-delay: {gl.d}s"><Sprite def={GO_GLYPH} /></span>
        {/each}
      </div>
    {/if}

    {#if barrel}
      <button
        type="button"
        class="barrel"
        style={pos(LAYOUT.barrelEvent)}
        aria-label={ctl.t('barril.label')}
        onclick={() => ctl.popBarril()}
      >
        <Sprite def={BARREL_BIG} frame={barrelFrame} />
      </button>
    {/if}

    <button
      type="button"
      class="kb-hit"
      class:pulse={showArrow}
      class:tut-hl={tutClick}
      tabindex="-1"
      style="left: calc({kb.x - 4} * var(--px) * 1px); top: calc({kb.y - 4} * var(--px) * 1px); width: calc({KEYBOARD.w + 8} * var(--px) * 1px); height: calc({KEYBOARD.h + 10} * var(--px) * 1px);"
      aria-label={ctl.t('click.label')}
      onclick={() => ctl.click()}
    >
      <span class="sr-only-text">{ctl.t('click.label')}</span>
    </button>

    <button type="button" class="obj" style={box(LAYOUT.mug, MUG, 2)} aria-label={ctl.t('mug.label')} onclick={() => ctl.sip()}></button>
    <button type="button" class="obj" style={box(LAYOUT.lamp, LAMP, 0)} aria-label={ctl.t(ctl.lampOn ? 'lamp.label.off' : 'lamp.label.on')} aria-pressed={ctl.lampOn} onclick={() => ctl.toggleLamp()}></button>
    <button type="button" class="obj" style={box(LAYOUT.speaker, SPEAKER, 1)} aria-label={ctl.t('assistant.label')} onclick={() => ctl.assistantSay()}></button>
    <span class="sr-only-text" role="status">{ctl.assistantLine}</span>

    {#if hoverPoster}
      <span class="tip" aria-hidden="true" style="top: calc({LAYOUT.posters[0].y + POSTER_H + 3} * var(--px) * 1px);">{ctl.t(`poster.${hoverPoster}`)}</span>
    {/if}

    <Fx {ctl} />
    <EventBanner {ctl} />

    {#if ctl.cliff}
      <div class="abyss" aria-hidden="true"></div>
      <div class="piece ledge" style="left: calc({LAYOUT.ledge.x} * var(--px) * 1px); top: calc({LAYOUT.ledge.y} * var(--px) * 1px)" aria-hidden="true"><Sprite def={CLIFF} /></div>
      <p class="caption" role="status">{ctl.t('prestige.cliff.caption')}</p>
    {/if}

    <HoloHud {ctl} />
  </div>
</div>
<div class="target" class:has-arrow={showArrow}>
  {#if showArrow}
    <svg class="arrow" viewBox="0 0 9 8" width="36" height="32" aria-hidden="true" shape-rendering="crispEdges">
      <g fill="#1a1c2c">
        <rect x="4" y="1" width="3" height="4" /><rect x="2" y="5" width="7" height="1" /><rect x="3" y="6" width="5" height="1" /><rect x="4" y="7" width="3" height="1" />
      </g>
      <g fill="#ffcd75">
        <rect x="3" y="0" width="3" height="4" /><rect x="1" y="4" width="7" height="1" /><rect x="2" y="5" width="5" height="1" /><rect x="3" y="6" width="3" height="1" /><rect x="4" y="7" width="1" height="1" />
      </g>
    </svg>
  {/if}
  <button type="button" class="click-big px-btn" class:tut-hl={tutClick} data-tut="click" title={ctl.t('click.hint')} onclick={() => ctl.click()}>
    <span class="lbl">{ctl.t(gain === 1 ? 'click.big' : 'click.bigPlural', { n: gainText })}</span>
    <span class="sub">{ctl.t('click.bigSub')}</span>
  </button>
</div>
</div>

<style>
  /* la escala (entera) del pixel art depende del ancho que tenga la columna */
  .scene-wrap {
    container-type: inline-size;
    width: 100%;
  }
  .scene {
    --px: 2;
    background: var(--bg-alt);
    width: fit-content;
    max-width: calc(100% - 6px);
    overflow: hidden;
    margin-inline: auto;
  }
  @container (min-width: 450px) {
    .scene {
      --px: 3;
    }
  }
  @container (min-width: 600px) {
    .scene {
      --px: 4;
    }
  }
  .room {
    position: relative;
    /* La pared y el piso son fijos (no cambian con el tema): los sprites se ven igual en claro y oscuro. */
    background:
      repeating-linear-gradient(90deg, transparent 0 calc(var(--px) * 7px), rgb(120 100 70 / 0.06) calc(var(--px) * 7px) calc(var(--px) * 8px)),
      #e8e1d3;
    overflow: hidden;
  }
  .piece {
    position: absolute;
    pointer-events: none;
  }
  .poster {
    position: absolute;
    display: block;
    cursor: help;
    outline-offset: 2px;
  }
  /* tooltip unico de los posters: vive en la escena (no se corta en los bordes) y queda sobre el HUD */
  .tip {
    position: absolute;
    left: 50%;
    z-index: 40;
    width: max-content;
    max-width: calc(100% - 12px);
    box-sizing: border-box;
    padding: 0.35rem 0.5rem;
    transform: translateX(-50%);
    background: #1a1c2c;
    color: #f4f4f4;
    font-family: var(--font-pixel);
    font-size: 0.8rem;
    line-height: 1.25;
    text-align: center;
    box-shadow: 0 0 0 2px #ffcd75;
    pointer-events: none;
  }
  .poster:focus-visible {
    outline: 2px dashed #ffcd75;
  }
  /* objetos interactivos (taza, lampara, parlante): botones transparentes con hover sutil y foco visible */
  .obj {
    position: absolute;
    z-index: 6;
    padding: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .obj:hover {
    background: rgb(255 255 255 / 0.16);
  }
  .obj:active {
    background: rgb(255 255 255 / 0.3);
  }
  .obj:focus-visible {
    outline: 2px dashed #ffcd75;
    outline-offset: 1px;
  }
  .steam.puff {
    animation: puff 0.9s steps(6) both;
    transform-origin: 50% 100%;
  }
  .kb-hit {
    position: absolute;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    outline-offset: -3px;
    -webkit-tap-highlight-color: transparent;
  }
  .kb-hit:hover {
    background: rgb(255 255 255 / 0.12);
  }
  .kb-hit:active {
    background: rgb(255 255 255 / 0.25);
  }
  .kb-hit.pulse {
    outline: 3px dashed #ffcd75;
    outline-offset: 1px;
    animation: kb-pulse 1s steps(2) infinite;
  }
  .target {
    position: relative;
    margin: 0.6rem 3px 0;
  }
  .target.has-arrow {
    padding-top: 2.1rem;
  }
  .arrow {
    position: absolute;
    top: 0;
    left: 50%;
    margin-left: -18px;
    animation: arrow-bounce 0.7s steps(2) infinite;
    pointer-events: none;
  }
  .click-big {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: calc(100% - 6px);
    margin: 3px;
    padding: 0.55rem 0.75rem;
    background: var(--accent);
    color: var(--accent-ink);
    text-align: center;
    outline: 3px solid var(--yellow);
    outline-offset: 3px;
    animation: border-pulse 1s steps(2) infinite;
  }
  .click-big .lbl {
    font-size: clamp(1.15rem, 4.5vw, 1.5rem);
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .click-big .sub {
    font-size: 0.8rem;
    font-weight: 400;
    opacity: 0.85;
  }
  .shake .room {
    transform: translate(1px, 1px);
  }

  /* 「ゴゴゴ」 durante el proceso final */
  .gogogo {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .go {
    position: absolute;
    animation: gogo 0.5s steps(2) infinite;
  }
  .gogogo.calm .go {
    animation: none;
  }

  /* Barril explosivo */
  .barrel {
    position: absolute;
    z-index: 8;
    padding: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    filter: drop-shadow(0 0 calc(var(--px) * 2px) #ffcd75);
    animation: barrel-bob 0.6s steps(2) infinite;
  }
  .barrel:focus-visible {
    outline: 3px dashed #ffcd75;
    outline-offset: 3px;
  }

  /* Precipicio de prestigio */
  .abyss {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: linear-gradient(#0e1020, #1a1c2c 60%, #29366f);
    animation: abyss-in 0.5s steps(5) forwards;
  }
  .ledge {
    z-index: 11;
  }
  .character {
    z-index: 5;
  }
  .room.cliff .character {
    z-index: 12;
  }
  .character.falling {
    animation: cliff-drop var(--cliff-ms) cubic-bezier(0.45, 0, 0.9, 0.55) forwards;
  }
  .caption {
    position: absolute;
    z-index: 13;
    top: calc(8 * var(--px) * 1px);
    left: 50%;
    width: min(92%, 34rem);
    margin: 0;
    transform: translateX(-50%);
    text-align: center;
    font-family: var(--font-pixel);
    font-size: clamp(0.95rem, 3.2vw, 1.35rem);
    line-height: 1.3;
    color: #ffcd75;
    text-shadow: 2px 2px 0 #1a1c2c;
    animation: caption-in 0.5s steps(4) both;
  }

  /* escritorio con poca altura: el botón de click ocupa menos para dejarle sitio al registro de eventos */
  @media (min-width: 1024px) and (max-height: 820px) {
    .click-big {
      padding: 0.3rem 0.75rem;
    }
    .click-big .sub {
      display: none;
    }
    .target {
      margin-top: 0.45rem;
    }
  }
  @media (max-width: 639px) {
    .click-big {
      padding: 0.3rem 0.5rem;
    }
    .click-big .sub {
      display: none;
    }
    .target {
      margin-top: 0.4rem;
    }
    .target.has-arrow {
      padding-top: 1.6rem;
    }
    .arrow {
      width: 27px;
      height: 24px;
      margin-left: -14px;
    }
  }
  @keyframes border-pulse {
    0%,
    100% {
      outline-color: var(--yellow);
      outline-offset: 3px;
    }
    50% {
      outline-color: var(--cyan);
      outline-offset: 6px;
    }
  }
  @keyframes kb-pulse {
    50% {
      outline-color: #73eff7;
      outline-offset: 3px;
    }
  }
  @keyframes arrow-bounce {
    50% {
      transform: translateY(8px);
    }
  }
  @keyframes puff {
    0% {
      transform: scale(0.5, 0.4);
      opacity: 0;
    }
    30% {
      transform: scale(1.4, 1.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.1, 1.7) translateY(calc(var(--px) * -3px));
      opacity: 0;
    }
  }
  @keyframes gogo {
    0% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(calc(var(--px) * 1px), calc(var(--px) * -1px));
    }
  }
  @keyframes barrel-bob {
    50% {
      transform: translateY(calc(var(--px) * -1px));
    }
  }
  @keyframes abyss-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 0.94;
    }
  }
  @keyframes caption-in {
    from {
      opacity: 0;
      transform: translate(-50%, calc(var(--px) * 3px));
    }
  }
  /* camina hasta el borde del precipicio y cae fuera de la escena */
  @keyframes cliff-drop {
    0% {
      transform: translate(0, calc(var(--px) * 0px)) rotate(0);
    }
    28% {
      transform: translate(calc(var(--px) * 8px), calc(var(--px) * -2px)) rotate(0);
    }
    100% {
      transform: translate(calc(var(--px) * 44px), calc(var(--px) * 110px)) rotate(80deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .click-big,
    .kb-hit.pulse,
    .arrow {
      animation: none;
    }
    .shake .room {
      transform: none;
    }
    .go,
    .barrel,
    .caption {
      animation: none;
    }
    .abyss {
      animation: none;
      opacity: 0.94;
    }
  }
</style>
