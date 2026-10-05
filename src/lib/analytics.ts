/** Analítica anónima y sin cookies con GoatCounter (el script se carga en BaseLayout). */

interface GoatCounterApi {
  count: (vars: { path: string; title?: string; event?: boolean }) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounterApi;
  }
}

/** Cuenta un evento. Segura en SSR y si el script no cargó (localhost, bloqueadores). */
export function track(event: string, title?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.goatcounter?.count({ path: event, title: title ?? event, event: true });
  } catch {
    // la analítica nunca debe romper el sitio
  }
}

/** Cuenta un evento una sola vez por sesión del navegador. */
export function trackOnce(event: string): void {
  if (typeof window === 'undefined') return;
  const key = `gc-once:${event}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // sin sessionStorage: se cuenta de todos modos
  }
  track(event);
}
