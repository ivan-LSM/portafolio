import {
  EVENT_DEFS,
  EVENT_MAX_MS,
  EVENT_MIN_MS,
  BARRIL_FREE_CVS,
  CV_RESOLVE_MAX_MS,
  CV_RESOLVE_MIN_MS,
  EXPOSICION_SECONDS,
  HACKATHON_MULT,
  PRODFAIL_MULT,
  type EventId,
} from './balance';
import type { GameState, Rng } from './types';

const EVENT_IDS = Object.keys(EVENT_DEFS) as EventId[];

/** Tiempo hasta el próximo evento (45–90 s). */
export function rollEventDelay(rng: Rng): number {
  return EVENT_MIN_MS + rng() * (EVENT_MAX_MS - EVENT_MIN_MS);
}

export function pickEvent(rng: Rng): EventId {
  const total = EVENT_IDS.reduce((s, id) => s + EVENT_DEFS[id].weight, 0);
  let r = rng() * total;
  for (const id of EVENT_IDS) {
    r -= EVENT_DEFS[id].weight;
    if (r < 0) return id;
  }
  return EVENT_IDS[EVENT_IDS.length - 1];
}

/** Multiplicador de producción por evento activo. */
export function eventProdMult(state: GameState): number {
  const id = state.activeEvent?.id;
  if (id === 'hackathon') return HACKATHON_MULT;
  if (id === 'prodfail') return PRODFAIL_MULT;
  return 1;
}

export function cvsBlocked(state: GameState): boolean {
  return state.activeEvent?.id === 'junior5';
}

/** Aplica el efecto inmediato de un evento. `prodPerSec` es la producción permanente (sin café ni eventos). */
export function startEvent(state: GameState, id: EventId, prodPerSec: number): void {
  const def = EVENT_DEFS[id];
  let value: number | undefined;
  if (id === 'exposicion') {
    value = prodPerSec * EXPOSICION_SECONDS;
    state.commits += value;
    state.totalCommits += value;
  } else if (id === 'joseph') {
    state.josephPending = true;
  } else if (id === 'cafederramado') {
    value = state.cafeActive > 0 ? 1 : 0;
    state.cafeActive = 0;
  }
  if (def.durationMs > 0) state.activeEvent = { id, left: def.durationMs };
  state.outbox.push({ t: 'event', id, value });
}

/** Acepta al recruiter: +1 entrevista. */
export function acceptRecruiter(state: GameState): boolean {
  if (state.activeEvent?.id !== 'recruiter') return false;
  state.activeEvent = null;
  state.interviews += 1;
  state.interviewsTotal += 1;
  return true;
}

/** Hace explotar el barril del evento: BARRIL_FREE_CVS CVs gratis (no cuentan para el costo de los siguientes). */
export function popBarril(state: GameState, rng: Rng): number {
  if (state.activeEvent?.id !== 'barril') return 0;
  state.activeEvent = null;
  for (let i = 0; i < BARRIL_FREE_CVS; i++) {
    state.pending.push({ left: CV_RESOLVE_MIN_MS + rng() * (CV_RESOLVE_MAX_MS - CV_RESOLVE_MIN_MS), direct: false });
  }
  state.outbox.push({ t: 'barrilPop', n: BARRIL_FREE_CVS });
  return BARRIL_FREE_CVS;
}
