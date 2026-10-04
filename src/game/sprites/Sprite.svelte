<script lang="ts">
  import { PALETTE, type SpriteDef } from './gen';

  interface Props {
    def: SpriteDef;
    frame?: number;
    /** Escala entera en píxeles CSS por píxel de sprite. Si se omite usa --px del contenedor (3 por defecto). */
    scale?: number;
    label?: string;
    class?: string;
  }
  let { def, frame = 0, scale, label = '', class: klass = '' }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rows = def.frames[((frame % def.frames.length) + def.frames.length) % def.frames.length];
    const pal = def.palette ?? PALETTE;
    ctx.clearRect(0, 0, def.w, def.h);
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  const mult = $derived(scale ? `${scale}` : 'var(--px, 3)');
</script>

<canvas
  bind:this={canvas}
  class="sprite {klass}"
  width={def.w}
  height={def.h}
  style:width="calc({def.w} * {mult} * 1px)"
  style:height="calc({def.h} * {mult} * 1px)"
  role={label ? 'img' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
></canvas>

<style>
  .sprite {
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
    flex: none;
  }
</style>
