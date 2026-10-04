import { CAFE_DURATION_MS, CAFE_MULT, DEMPSEY_MS, DEMPSEY_MULT, EVENT_DEFS, type EventId } from '../balance';
import { eventProdMult } from '../events';
import type { GameState } from '../types';

/** Solo lectura: no cambia ninguna regla, replica los multiplicadores que ya usa el motor. */

/** Multiplicador actual del valor de cada click (café y Dempsey Roll). */
export function clickMult(s: GameState): number {
  return (s.cafeActive > 0 ? CAFE_MULT : 1) * (s.dempseyLeft > 0 ? DEMPSEY_MULT : 1);
}

/** Multiplicador actual de la producción por segundo (café y eventos como hackathon o prodfail). */
export function prodMult(s: GameState): number {
  return (s.cafeActive > 0 ? CAFE_MULT : 1) * eventProdMult(s);
}

/** "x2", "x3", "x0.5": el signo de multiplicar va como la letra x. */
export function multLabel(m: number): string {
  return `x${Number.isInteger(m) ? m : String(Math.round(m * 100) / 100)}`;
}

/** Tamaño (rem) de un "+N" flotante según su magnitud: crece con el log del valor, dentro de un rango. */
export function numberSize(v: number, rainbow: boolean): number {
  const base = 1 + Math.min(0.8, Math.log10(Math.max(1, v)) * 0.16);
  return Math.round((rainbow ? base * 1.3 : base) * 100) / 100;
}

export type BannerId = EventId | 'dempsey' | 'cafe';
export type BannerTone = 'good' | 'bad' | 'neutral';

/** Tono visual del banner: borde arcoíris (good), rojo (bad) o dorado (neutral). */
export function bannerTone(id: BannerId): BannerTone {
  switch (id) {
    case 'hackathon':
    case 'dempsey':
    case 'cafe':
      return 'good';
    case 'prodfail':
    case 'junior5':
    case 'cafederramado':
    case 'joseph':
      return 'bad';
    default:
      return 'neutral';
  }
}

/** Duración total (ms) de lo que muestra el banner; los eventos instantáneos usan INSTANT_BANNER_MS. */
export const INSTANT_BANNER_MS = 4500;
export function bannerTotalMs(id: BannerId): number {
  if (id === 'dempsey') return DEMPSEY_MS;
  if (id === 'cafe') return CAFE_DURATION_MS;
  return EVENT_DEFS[id].durationMs || INSTANT_BANNER_MS;
}

/** Hitos del combo cosmético. */
export const COMBO_MILESTONES = [10, 25, 50, 100];
export const COMBO_GAP_MS = 400;
export const COMBO_HOLD_MS = 900;
