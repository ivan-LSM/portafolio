import { sfx } from './sfx';

let installed = false;

/**
 * Un único listener delegado: reproduce `uiTap` al hacer click en botones .px-btn,
 * enlaces de navegación y chips de filtro. Sin sonidos de hover. Los elementos con
 * `data-no-tap` (p. ej. los botones del minijuego, que tienen sus propios sonidos) se ignoran.
 */
export function initUiTapSounds(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as Element | null)?.closest?.('.px-btn, header nav a, .chip, #theme-toggle');
      if (!el || el.closest('[data-no-tap]') || (el as HTMLButtonElement).disabled) return;
      sfx.play('uiTap');
    },
    { passive: true },
  );
}
