import { EVENT_DEFS, PROJECTS, SAVE_KEY, SAVE_VERSION, TUTORIAL_STEPS } from './balance';
import { createState } from './engine';
import type { GameState } from './types';

export interface SaveFile {
  version: number;
  savedAt: number;
  state: Omit<GameState, 'outbox' | 'clickLog'>;
}

type Migration = (data: any) => any;

/**
 * Migraciones: la clave N convierte un guardado de la versión N a la N+1.
 * v1 -> v2: el costo del CV ya no depende de cvsSent (queda solo como estadística) y se agregan
 * el tutorial y los clicks de toda la vida. Quien ya jugó no ve el tutorial de nuevo.
 * v2 -> v3: modo libre y contador de ofertas. Un guardado ya terminado cuenta 1 oferta y conserva
 * finished (se le muestra el fin de partida una vez, ahora con «Seguir jugando»).
 */
export const MIGRATIONS: Record<number, Migration> = {
  1: (d) => {
    if (!d || typeof d.state !== 'object' || !d.state) return d;
    const st = d.state;
    const clicks = typeof st.clicks === 'number' && Number.isFinite(st.clicks) ? st.clicks : 0;
    const played = clicks >= 15 || (Number(st.cvsSent) || 0) > 0 || (Number(st.totalCommits) || 0) >= 100;
    return { ...d, state: { ...st, clicksTotal: clicks, tutorialStep: played ? TUTORIAL_STEPS : 0 } };
  },
  2: (d) => {
    if (!d || typeof d.state !== 'object' || !d.state) return d;
    const st = d.state;
    return { ...d, state: { ...st, endless: false, offers: st.finished === true ? 1 : 0 } };
  },
};

export function migrate(file: any): any {
  let data = file;
  let v = Number(data?.version) || 0;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    data = m ? m(data) : data;
    v += 1;
    data.version = v;
  }
  return data;
}

export function serialize(state: GameState, now = Date.now()): string {
  const { outbox: _omit, clickLog: _log, ...rest } = state;
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now, state: rest };
  return JSON.stringify(file);
}

const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);

/** Reconstruye un estado válido a partir de datos parciales o no confiables. */
export function hydrate(raw: any): GameState {
  const base = createState();
  const d = raw ?? {};
  const out: GameState = { ...base };
  for (const k of Object.keys(base) as (keyof GameState)[]) {
    if (['outbox', 'clickLog', 'owned', 'upgrades', 'pending', 'final', 'activeEvent'].includes(k)) continue;
    const bv = base[k];
    const dv = d[k];
    if (typeof bv === 'number') (out as any)[k] = num(dv, bv);
    else if (typeof bv === 'boolean') (out as any)[k] = typeof dv === 'boolean' ? dv : bv;
    else if (Array.isArray(bv) && Array.isArray(dv)) (out as any)[k] = dv.filter((x: unknown) => typeof x === 'string');
  }
  out.owned = { ...base.owned };
  for (const p of PROJECTS) out.owned[p.id] = Math.max(0, Math.floor(num(d.owned?.[p.id], 0)));
  out.upgrades = { ...base.upgrades };
  for (const k of Object.keys(base.upgrades) as (keyof GameState['upgrades'])[]) out.upgrades[k] = d.upgrades?.[k] === true;
  out.pending = Array.isArray(d.pending)
    ? d.pending.slice(0, 5000).map((c: any) => ({ left: num(c?.left, 0), direct: c?.direct === true }))
    : [];
  out.activeEvent =
    d.activeEvent && typeof d.activeEvent.id === 'string'
      ? { id: d.activeEvent.id, left: num(d.activeEvent.left, 0) }
      : null;
  out.final = null; // un proceso final a medias no se restaura
  out.tutorialStep = Math.min(TUTORIAL_STEPS, Math.max(0, Math.floor(out.tutorialStep)));
  out.clicksTotal = Math.max(out.clicksTotal, out.clicks);
  out.copilotLevel = Math.min(5, Math.max(0, Math.floor(out.copilotLevel)));
  out.version = SAVE_VERSION;
  out.outbox = [];
  out.clickLog = [];
  if (out.activeEvent && !(out.activeEvent.id in EVENT_DEFS)) out.activeEvent = null;
  return out;
}

/** Parsea un guardado serializado. Devuelve null si es inválido. */
export function deserialize(text: string): { state: GameState; savedAt: number } | null {
  try {
    const parsed = migrate(JSON.parse(text));
    if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
    return { state: hydrate(parsed.state), savedAt: num(parsed.savedAt, Date.now()) };
  } catch {
    return null;
  }
}

export function exportSave(state: GameState, now = Date.now()): string {
  return btoa(serialize(state, now));
}

export function importSave(code: string): { state: GameState; savedAt: number } | null {
  try {
    return deserialize(atob(code.trim()));
  } catch {
    return null;
  }
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function saveToStorage(state: GameState, storage?: StorageLike): boolean {
  try {
    (storage ?? localStorage).setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage?: StorageLike): { state: GameState; savedAt: number } | null {
  try {
    const raw = (storage ?? localStorage).getItem(SAVE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

export function clearStorage(storage?: StorageLike): void {
  try {
    (storage ?? localStorage).removeItem(SAVE_KEY);
  } catch {
    /* sin almacenamiento */
  }
}
