<script lang="ts">
  import { LAYOUT } from '../sprites';
  import { COMBO_MILESTONES } from './fx';
  import type { GameController } from './controller.svelte';

  /** Capa de números con carisma sobre la escena: "+N" del click, combo, y hitos de entrevista y rechazo. Todo aria-hidden. */
  let { ctl }: { ctl: GameController } = $props();
  /** zona de los numeros: a la derecha de la cara (cara en x 60..84), sobre el mouse y la botella, para no taparle la cara */
  const anchor = { x: LAYOUT.face.x + LAYOUT.face.w + 4, y: LAYOUT.keyboard.y - 3, w: 30, h: 10 };
  /** franja frontal del escritorio: centrada bajo el teclado y sobre la barra de estado del HUD */
  const comboX = LAYOUT.keyboard.x + 20;
  const comboY = 86;
  const tier = $derived(ctl.combo >= 50 ? 3 : ctl.combo >= 25 ? 2 : ctl.combo >= 10 ? 1 : 0);
  const big = $derived(COMBO_MILESTONES.includes(ctl.combo));
</script>

<div class="fx" aria-hidden="true">
  <div
    class="kb-fx"
    style="left: calc({anchor.x} * var(--px) * 1px); top: calc({anchor.y} * var(--px) * 1px); width: calc({anchor.w} * var(--px) * 1px); height: calc({anchor.h} * var(--px) * 1px);"
  >
    {#each ctl.particles as p (p.id)}
      <span class="particle" style="left: {p.x}%; --rot: {p.rot}deg; --sz: {p.size}rem">
        <span class="num" class:rainbow={p.rainbow}>{p.text}{#if p.mult}<small class="mx">{p.mult}</small>{/if}</span>
      </span>
    {/each}
  </div>

  {#if ctl.combo >= 3}
    <div class="combo-slot" style="left: calc({comboX} * var(--px) * 1px); top: calc({comboY} * var(--px) * 1px);">
      {#key ctl.combo}
        <span class="combo t{tier}" class:big>{ctl.t('combo.label', { n: ctl.combo })}</span>
      {/key}
    </div>
  {/if}

  {#each ctl.fx as f (f.id)}
    <span class="hit {f.kind}" style="left: {f.x}%"><span class="inner">{f.text}</span></span>
  {/each}
</div>

<style>
  .fx {
    position: absolute;
    inset: 0;
    z-index: 9;
    pointer-events: none;
    overflow: hidden;
    --ink: #1a1c2c;
    --outline: 2px 0 0 var(--ink), -2px 0 0 var(--ink), 0 2px 0 var(--ink), 0 -2px 0 var(--ink), 2px 2px 0 var(--ink), -2px -2px 0 var(--ink), 2px -2px 0 var(--ink),
      -2px 2px 0 var(--ink);
  }
  .kb-fx {
    position: absolute;
  }
  .particle {
    position: absolute;
    top: 0;
    font-family: var(--font-pixel);
    font-weight: 700;
    line-height: 1;
    font-size: var(--sz);
    white-space: nowrap;
    animation: floatup 0.95s steps(8) forwards;
  }
  .num {
    display: inline-flex;
    align-items: baseline;
    gap: 0.2em;
    color: #ffcd75;
    text-shadow: var(--outline);
    transform-origin: 50% 80%;
    animation: pop 0.24s steps(2) both;
  }
  .num.rainbow {
    animation:
      pop 0.24s steps(2) both,
      rainbow 0.64s steps(1) infinite;
  }
  .mx {
    font-size: 0.6em;
    color: #f4f4f4;
    text-shadow: var(--outline);
  }

  .combo-slot {
    position: absolute;
    translate: -50% 0;
  }
  .combo {
    display: block;
    padding: 0.1rem 0.4rem;
    font-family: var(--font-pixel);
    font-weight: 700;
    font-size: 0.85rem;
    line-height: 1.1;
    white-space: nowrap;
    color: #f4f4f4;
    background: var(--ink);
    box-shadow: 0 0 0 2px #73eff7;
    animation: bump 0.16s steps(2) both;
  }
  .combo.t1 {
    color: #ffcd75;
    box-shadow: 0 0 0 2px #ffcd75;
  }
  .combo.t2 {
    color: #ef7d57;
    box-shadow: 0 0 0 2px #ef7d57;
    font-size: 0.95rem;
  }
  .combo.t3 {
    font-size: 1.05rem;
    animation:
      bump 0.16s steps(2) both,
      rainbow 0.64s steps(1) infinite,
      rainbow-box 0.64s steps(1) infinite;
  }
  .combo.big {
    font-size: 1.25rem;
    animation:
      bigpop 0.45s steps(5) both,
      rainbow 0.64s steps(1) infinite,
      rainbow-box 0.64s steps(1) infinite;
  }

  .hit {
    position: absolute;
    translate: -50% 0;
    font-family: var(--font-pixel);
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    text-shadow: var(--outline);
  }
  .hit.interview {
    top: calc(var(--px) * 40px);
    font-size: clamp(1.3rem, 1.4rem + 0.5vw, 1.9rem);
    color: #a7f070;
    animation: rise 1.5s steps(12) forwards;
  }
  .hit.interview .inner {
    display: block;
    animation: pop 0.3s steps(3) both;
  }
  .hit.reject {
    top: calc(var(--px) * 30px);
    font-size: 1.15rem;
    color: #ef5b6b;
    animation: drop 1.1s steps(10) forwards;
  }
  .hit.reject .inner {
    display: block;
    animation: shake 0.18s steps(2) infinite;
  }

  @media (max-width: 639px) {
    .particle {
      font-size: min(var(--sz), 1.05rem);
      animation-name: floatup-m;
    }
    .combo {
      font-size: 0.7rem;
    }
    .combo.t2 {
      font-size: 0.75rem;
    }
    .combo.t3 {
      font-size: 0.8rem;
    }
    .combo.big {
      font-size: 0.95rem;
    }
  }
  @keyframes floatup-m {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    to {
      transform: translateY(-22px);
      opacity: 0;
    }
  }
  @keyframes floatup {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    to {
      transform: translateY(-52px);
      opacity: 0;
    }
  }
  @keyframes pop {
    0% {
      transform: scale(0.6) rotate(var(--rot, 0deg));
    }
    50% {
      transform: scale(1.25) rotate(var(--rot, 0deg));
    }
    100% {
      transform: scale(1) rotate(var(--rot, 0deg));
    }
  }
  @keyframes bump {
    0% {
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.18);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes bigpop {
    0% {
      transform: scale(0.5);
    }
    40% {
      transform: scale(1.5);
    }
    70% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes rainbow {
    0% {
      color: #b13e53;
    }
    12.5% {
      color: #ef7d57;
    }
    25% {
      color: #ffcd75;
    }
    37.5% {
      color: #a7f070;
    }
    50% {
      color: #38b764;
    }
    62.5% {
      color: #41a6f6;
    }
    75% {
      color: #73eff7;
    }
    87.5% {
      color: #e08bd8;
    }
  }
  @keyframes rainbow-box {
    0% {
      box-shadow: 0 0 0 2px #b13e53;
    }
    25% {
      box-shadow: 0 0 0 2px #ffcd75;
    }
    50% {
      box-shadow: 0 0 0 2px #38b764;
    }
    75% {
      box-shadow: 0 0 0 2px #41a6f6;
    }
  }
  @keyframes rise {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    75% {
      opacity: 1;
    }
    to {
      transform: translateY(-44px);
      opacity: 0;
    }
  }
  @keyframes drop {
    from {
      transform: translateY(-8px);
      opacity: 1;
    }
    60% {
      opacity: 1;
    }
    to {
      transform: translateY(34px);
      opacity: 0;
    }
  }
  @keyframes shake {
    0% {
      transform: translateX(-2px);
    }
    50% {
      transform: translateX(2px);
    }
  }

  /* Movimiento reducido: color fijo y texto estático (los hitos se ven un momento y se van) */
  @media (prefers-reduced-motion: reduce) {
    .particle,
    .num,
    .num.rainbow,
    .combo,
    .combo.t3,
    .combo.big,
    .hit,
    .hit .inner {
      animation: none;
    }
    .hit {
      animation: hold 1.4s steps(1) forwards;
    }
    .num.rainbow {
      color: #ffcd75;
    }
    .combo.t3,
    .combo.big {
      color: #ffcd75;
      box-shadow: 0 0 0 2px #ffcd75;
    }
    @keyframes hold {
      to {
        opacity: 0;
      }
    }
  }
</style>
