const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** Número corto: 950, 1.2K, 3.4M. `decimals` aplica solo a valores < 1000. */
export function formatNumber(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n, decimals);
  if (n < 1000) {
    const f = 10 ** decimals;
    const v = Math.floor(n * f + 1e-9) / f;
    return decimals > 0 ? v.toFixed(decimals) : String(v);
  }
  let i = 0;
  let v = n;
  while (v >= 1000 && i < UNITS.length - 1) {
    v /= 1000;
    i++;
  }
  // Evita "1000K": si el redondeo llega a 1000 sube de unidad
  let s = v >= 100 ? Math.floor(v).toString() : (Math.floor(v * 10) / 10).toFixed(1);
  if (s.endsWith('.0')) s = s.slice(0, -2);
  return s + UNITS[i];
}

/** mm:ss */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
