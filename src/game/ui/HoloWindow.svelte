<script lang="ts">
  import type { HoloWin } from './holo';

  /** Ventanita holografica con barra de titulo. Se posiciona en unidades de escena; sale con glitch por CSS. */
  let { win }: { win: HoloWin } = $props();
</script>

<div class="win {win.tone}" style="--life: {win.lifeMs ?? 2500}ms; left: calc({win.slot.x} * var(--px) * 1px); top: calc({win.slot.y} * var(--px) * 1px); width: calc({win.slot.w} * var(--px) * 1px);">
  <div class="bar">
    <span class="dots"><i></i><i></i></span>
    <span class="ttl">{win.title}</span>
  </div>
  <div class="body">
    {#each win.lines as line, i (i)}
      <p>{line}</p>
    {/each}
  </div>
</div>

<style>
  .win {
    --c: #73eff7;
    --ink: #1a1c2c;
    position: absolute;
    box-sizing: border-box;
    background: rgb(26 28 44 / 0.84);
    border: calc(var(--px) * 1px) solid var(--c);
    box-shadow:
      calc(var(--px) * 1px) calc(var(--px) * 1px) 0 rgb(26 28 44 / 0.5),
      0 0 calc(var(--px) * 2px) color-mix(in srgb, var(--c) 45%, transparent);
    font-family: var(--font-pixel);
    font-size: max(8px, calc(var(--px) * 2.75px));
    line-height: 1.2;
    color: #f4f4f4;
    transform-origin: 50% 50%;
    animation:
      pop 0.28s steps(4) both,
      out 0.4s steps(4) calc(var(--life, 2500ms) - 0.4s) forwards;
  }
  .green {
    --c: #38b764;
  }
  .red {
    --c: #b13e53;
  }
  .gold {
    --c: #ffcd75;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: calc(var(--px) * 1px);
    padding: 0 calc(var(--px) * 1px);
    background: var(--c);
    color: var(--ink);
    font-weight: 700;
    line-height: 1.35;
  }
  .red .bar {
    color: #f4f4f4;
  }
  .dots {
    display: inline-flex;
    gap: calc(var(--px) * 0.5px);
  }
  .dots i {
    display: block;
    width: calc(var(--px) * 1px);
    height: calc(var(--px) * 1px);
    background: currentColor;
    opacity: 0.7;
  }
  .ttl {
    min-width: 0;
    overflow: hidden;
    text-overflow: clip;
    white-space: nowrap;
    letter-spacing: 0.04em;
  }
  .body {
    padding: calc(var(--px) * 1px) calc(var(--px) * 1.5px) calc(var(--px) * 1.5px);
  }
  .body p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .green .body p {
    color: #a7f070;
  }
  .red .body p {
    color: #ff9aa8;
  }
  .gold .body p {
    color: #ffcd75;
  }
  .cyan .body p {
    color: #73eff7;
  }

  @keyframes pop {
    0% {
      transform: scale(0.35);
      opacity: 0;
    }
    35% {
      transform: scale(1.1) translateX(calc(var(--px) * 1px));
      opacity: 1;
    }
    70% {
      transform: scale(0.96) translateX(calc(var(--px) * -1px));
    }
    100% {
      transform: none;
    }
  }
  @keyframes out {
    0% {
      transform: translateX(calc(var(--px) * -1.5px));
      clip-path: inset(0 0 55% 0);
    }
    35% {
      transform: translateX(calc(var(--px) * 1.5px));
      clip-path: inset(45% 0 0 0);
    }
    70% {
      transform: none;
      clip-path: inset(0);
      opacity: 0.55;
    }
    100% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .win {
      animation: none;
    }
  }
</style>
