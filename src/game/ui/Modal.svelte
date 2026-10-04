<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    /** nombre accesible del diálogo */
    label: string;
    /** si se pasa, Esc lo cierra; si no, Esc no hace nada (el diálogo no se puede descartar) */
    onclose?: () => void;
    children: Snippet;
  }
  let { label, onclose, children }: Props = $props();

  let dialog: HTMLElement | undefined = $state();

  const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const focusables = () => (dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null) : []);

  onMount(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = focusables()[0] ?? dialog;
    first?.focus({ preventScroll: true });

    // Foco atrapado: Tab y Shift+Tab giran dentro del diálogo; Esc solo cierra si se puede
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onclose) {
          e.preventDefault();
          onclose();
        }
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const list = focusables();
      if (!list.length) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const a = document.activeElement as HTMLElement | null;
      const inside = a ? dialog.contains(a) : false;
      if (!inside) {
        e.preventDefault();
        list[0].focus();
      } else if (e.shiftKey && a === list[0]) {
        e.preventDefault();
        list[list.length - 1].focus();
      } else if (!e.shiftKey && a === list[list.length - 1]) {
        e.preventDefault();
        list[0].focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  });
</script>

<div class="overlay">
  <div class="dialog px-border game-panel" role="dialog" aria-modal="true" aria-label={label} tabindex="-1" bind:this={dialog}>
    {@render children()}
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 0.75rem;
    background: rgb(15 16 27 / 0.78);
    overflow: auto;
  }
  .dialog {
    width: min(100%, 34rem);
    max-height: 100%;
    overflow: auto;
    margin: 3px;
    padding: 1rem;
    outline: none;
  }
</style>
