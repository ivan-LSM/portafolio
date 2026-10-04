<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameLang } from '../i18n';
  import { GameController } from './controller.svelte';
  import CvPanel from './CvPanel.svelte';
  import EndScreen from './EndScreen.svelte';
  import Extras from './Extras.svelte';
  import FinalModal from './FinalModal.svelte';
  import Feed from './Feed.svelte';
  import FinalProcess from './FinalProcess.svelte';
  import Hud from './Hud.svelte';
  import Premium from './Premium.svelte';
  import Scene from './Scene.svelte';
  import Shop from './Shop.svelte';
  import Toasts from './Toasts.svelte';
  import Tutorial from './Tutorial.svelte';

  let { lang }: { lang: GameLang } = $props();

  // eslint-disable-next-line svelte/no-unused-svelte-ignore
  const ctl = new GameController(lang, () => location.origin + location.pathname.replace(/\/(es|en)\/.*$/, `/${lang}/`));
  let ready = $state(false);

  type Layout = 'desktop' | 'tablet' | 'mobile';
  /** desktop >= 1024: 3 columnas; tablet 640-1023: 2 columnas; mobile < 640: una columna con barra de pestañas */
  let layout = $state<Layout>('desktop');
  type Tab = 'play' | 'cvs' | 'shop' | 'ach';
  let tab = $state<Tab>('play');
  let panel: HTMLElement | undefined = $state();

  const modal = $derived((ctl.s.finished && !ctl.cliff) || ctl.s.final !== null || ctl.finalNotice !== null);
  const tabs = $derived<Tab[]>(layout === 'mobile' ? ['play', 'cvs', 'shop', 'ach'] : ['cvs', 'shop', 'ach']);
  // en tablet no existe la pestaña «Jugar»: la escena siempre está a la izquierda
  const curTab = $derived<Tab>(layout !== 'mobile' && tab === 'play' ? 'cvs' : tab);
  /** pestaña que contiene el área que resalta el tutorial (para resaltar el botón si no está a la vista) */
  const tutTab = $derived<Tab | null>(
    ctl.tutorialTarget === 'shop' ? 'shop' : ctl.tutorialTarget === 'cvs' ? 'cvs' : ctl.tutorialTarget === 'click' && layout === 'mobile' ? 'play' : null,
  );

  // durante la animación del precipicio la escena tiene que verse
  $effect(() => {
    if (ctl.cliff && layout === 'mobile') tab = 'play';
  });

  function scrollToPanel() {
    panel?.scrollIntoView({ block: 'start', behavior: ctl.reduced ? 'auto' : 'smooth' });
  }

  onMount(() => {
    const mqD = window.matchMedia('(min-width: 1024px)');
    const mqT = window.matchMedia('(min-width: 640px)');
    const upd = () => (layout = mqD.matches ? 'desktop' : mqT.matches ? 'tablet' : 'mobile');
    upd();
    mqD.addEventListener('change', upd);
    mqT.addEventListener('change', upd);

    // El panel mide lo que queda de viewport bajo el header fijo del sitio
    const header = document.querySelector('header');
    const measure = () => {
      if (header) ctl.headerH = Math.round(header.getBoundingClientRect().height);
    };
    measure();
    const ro = header ? new ResizeObserver(measure) : null;
    if (header) ro?.observe(header);
    window.addEventListener('resize', measure);

    ctl.start();
    ready = true;

    // Al ir a #game (o al empezar a jugar) el panel completo queda a la vista bajo el header
    const onHash = () => {
      if (location.hash === '#game') requestAnimationFrame(scrollToPanel);
    };
    window.addEventListener('hashchange', onHash);
    let fitted = false;
    const onFirstTouch = () => {
      if (fitted || !panel) return;
      fitted = true;
      const r = panel.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < ctl.headerH) scrollToPanel();
    };
    panel?.addEventListener('pointerdown', onFirstTouch, { once: true });
    if (location.hash === '#game') requestAnimationFrame(scrollToPanel);

    return () => {
      ctl.stop();
      mqD.removeEventListener('change', upd);
      mqT.removeEventListener('change', upd);
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('hashchange', onHash);
    };
  });
</script>

<div class="game" data-no-tap>
  <p class="intro">{ctl.t('intro')}</p>

  {#if !ready}
    <p class="loading">{ctl.t('loading')}</p>
  {:else}
    <div class="panel" data-layout={layout} style="--hh: {ctl.headerH}px" bind:this={panel} role="group" aria-label={ctl.t('a11y.panel')}>
      <div class="inner" inert={modal}>
        {#if layout === 'mobile'}
          <Hud {ctl} compact evLine={curTab !== 'play'} />
          <Tutorial {ctl} />
          <div class="body" data-tab={tab}>
            {#if curTab === 'play'}
              <Scene {ctl} />
              <Feed {ctl} limit={3} />
            {:else if curTab === 'cvs'}
              <CvPanel {ctl} />
              <Premium {ctl} />
              <FinalProcess {ctl} />
            {:else if curTab === 'shop'}
              <div class="shop-wrap"><Shop {ctl} /></div>
            {:else}
              <Extras {ctl} part="both" />
            {/if}
          </div>
          <div class="tabbar" role="tablist" aria-label={ctl.t('tab.label')}>
            {#each tabs as tb (tb)}
              <button
                type="button"
                role="tab"
                class="px-btn px-btn-sm chip"
                class:tut-hl={tutTab === tb && curTab !== tb}
                aria-selected={curTab === tb}
                onclick={() => (tab = tb)}
              >
                {ctl.t(`tab.${tb}`)}
              </button>
            {/each}
          </div>
        {:else if layout === 'tablet'}
          <Tutorial {ctl} />
          <div class="cols two">
            <div class="col scroll left">
              <Hud {ctl} />
              <Scene {ctl} />
              <Feed {ctl} fill limit={10} />
            </div>
            <div class="col side">
              <div class="tabbar top" role="tablist" aria-label={ctl.t('tab.label')}>
                {#each tabs as tb (tb)}
                  <button
                    type="button"
                    role="tab"
                    class="px-btn px-btn-sm chip"
                    class:tut-hl={tutTab === tb && curTab !== tb}
                    aria-selected={curTab === tb}
                    onclick={() => (tab = tb)}
                  >
                    {ctl.t(`tab.${tb}`)}
                  </button>
                {/each}
              </div>
              <div class="body" class:fill={curTab === 'shop'}>
                {#if curTab === 'cvs'}
                  <CvPanel {ctl} />
                  <Premium {ctl} />
                  <FinalProcess {ctl} />
                {:else if curTab === 'shop'}
                  <div class="shop-wrap"><Shop {ctl} /></div>
                {:else}
                  <Extras {ctl} part="both" />
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <Tutorial {ctl} />
          <div class="cols three">
            <div class="col scroll left">
              <Hud {ctl} />
              <Scene {ctl} />
              <Feed {ctl} fill limit={14} />
            </div>
            <div class="col scroll mid">
              <CvPanel {ctl} />
              <Premium {ctl} />
              <FinalProcess {ctl} />
            </div>
            <div class="col shop-col">
              <Shop {ctl} />
            </div>
          </div>
        {/if}
      </div>

      {#if ctl.s.finished && !ctl.cliff}
        <EndScreen {ctl} />
      {:else if ctl.s.final || ctl.finalNotice}
        <FinalModal {ctl} />
      {/if}
    </div>

    {#if layout === 'desktop'}
      <Extras {ctl} part="both" />
    {/if}
    <Toasts {ctl} />
  {/if}
</div>

<style>
  .game {
    display: grid;
    gap: 1rem;
  }
  .intro {
    margin: 0;
    max-width: 48rem;
    color: var(--muted);
  }
  .loading {
    font-family: var(--font-pixel);
    color: var(--cyan);
  }

  /* Panel de altura fija: lo que queda de viewport bajo el header, con tope de 900 px */
  .panel {
    position: relative;
    display: flex;
    flex-direction: column;
    height: clamp(30rem, calc(100dvh - var(--hh, 4.5rem) - 1.5rem), 56.25rem);
    margin: 3px;
    /* el html ya reserva scroll-padding-top: 5.5rem; se ajusta a la altura real del header */
    scroll-margin-top: calc(var(--hh, 4.5rem) + 0.5rem - 5.5rem);
    background: var(--bg);
    box-shadow:
      0 0 0 3px var(--border),
      6px 6px 0 3px var(--shadow);
    overflow: hidden;
  }
  .inner {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    padding: 0.6rem;
  }

  .cols {
    display: grid;
    flex: 1 1 auto;
    min-height: 0;
    gap: 0.5rem;
  }
  .cols.three {
    grid-template-columns: 19.5rem minmax(0, 1fr) minmax(0, 1fr);
  }
  @media (min-width: 1200px) {
    .cols.three {
      grid-template-columns: 29rem minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .cols.two {
    grid-template-columns: minmax(18.5rem, 1fr) minmax(0, 1.1fr);
  }
  .col {
    min-width: 0;
    min-height: 0;
    padding-right: 8px;
    padding-bottom: 8px;
  }
  .col.scroll {
    overflow-y: auto;
    overflow-x: hidden;
  }
  /* columna izquierda: HUD y escena fijos, y el registro de eventos ocupa el resto del alto */
  .col.left {
    display: flex;
    flex-direction: column;
  }
  .col.left > :global(.scene-wrap),
  .col.left > :global(.hud) {
    flex: none;
  }
  .col.shop-col {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .col.side {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .col.side .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .col.side .body.fill {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Pestañas (tablet arriba de la columna derecha; móvil abajo del panel) */
  .tabbar {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 0.25rem;
    flex: none;
  }
  .tabbar :global(.chip[aria-selected='true']) {
    background: var(--accent);
    color: var(--accent-ink);
    --bc: var(--accent);
  }
  .tabbar.top {
    margin-bottom: 0.4rem;
  }
  .tabbar :global(.chip) {
    justify-content: center;
    margin: 3px;
    padding: 0.35rem 0.25rem;
    font-size: 0.9rem;
    text-align: center;
  }
  [data-layout='mobile'] .tabbar {
    padding: 0.25rem 0.25rem 0;
  }

  /* Móvil: HUD arriba, contenido que se desplaza por dentro y barra de pestañas abajo */
  [data-layout='mobile'] .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;
    padding-bottom: 8px;
  }
  [data-layout='mobile'] .body[data-tab='shop'] {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .shop-wrap {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }

  /* Resalte del tutorial */
  :global(.tut-hl) {
    outline: 4px dashed var(--yellow);
    outline-offset: 2px;
    animation: tut-blink 0.9s steps(2) infinite;
  }
  @keyframes tut-blink {
    50% {
      outline-color: var(--cyan);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.tut-hl) {
      animation: none;
    }
  }

  /* Guiño del premium "Portafolio decente": la sección Proyectos parpadea con una etiqueta */
  :global(#projects.game-blink) {
    animation: game-blink 0.8s steps(1) infinite;
  }
  :global(#projects.game-blink .section-title::after) {
    content: var(--game-tag, '');
    margin-left: 0.5rem;
    font-size: 0.6em;
    color: var(--yellow);
  }
  @keyframes game-blink {
    50% {
      background: var(--surface);
      outline: 4px dashed var(--yellow);
      outline-offset: -8px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(#projects.game-blink) {
      outline: 4px dashed var(--yellow);
      outline-offset: -8px;
    }
  }
</style>
