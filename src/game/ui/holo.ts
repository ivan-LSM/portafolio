/**
 * Logica pura del HUD holografico: cooldowns, tope de ventanas, posiciones libres y estado de la cara.
 * Todas las coordenadas estan en unidades de escena (144x104).
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type HoloTone = 'cyan' | 'green' | 'red' | 'gold';
export type HoloKind = 'term' | 'cv' | 'interview' | 'reject' | 'install' | 'achv' | 'event' | 'assistant';

export interface HoloWin {
  id: number;
  kind: HoloKind;
  tone: HoloTone;
  title: string;
  lines: string[];
  slot: Rect;
  /** vida de la ventana (ms); por defecto HOLO_LIFE_MS */
  lifeMs?: number;
}

export const HOLO_LIFE_MS = 2500;
/** Vida de la respuesta del asistente (se lee mas texto). */
export const ASSISTANT_LIFE_MS = 4200;
/** Separacion minima entre dos ventanas nuevas (ms). */
export const HOLO_MIN_GAP_MS = 350;
export const HOLO_MAX_DESKTOP = 3;
export const HOLO_MAX_MOBILE = 1;
/** Cada cuantos clicks sale una linea de terminal. */
export const HOLO_TERM_EVERY = 12;
export const HOLO_STORAGE_KEY = 'busca-pega-holo';
export const SPARK_LEN = 20;

export const KIND_RULES: Record<HoloKind, { cooldown: number; priority: number }> = {
  term: { cooldown: 4500, priority: 1 },
  cv: { cooldown: 2200, priority: 1 },
  install: { cooldown: 800, priority: 2 },
  reject: { cooldown: 2600, priority: 3 },
  interview: { cooldown: 2600, priority: 3 },
  event: { cooldown: 0, priority: 4 },
  achv: { cooldown: 0, priority: 5 },
  assistant: { cooldown: 0, priority: 5 },
};

export function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  return a.x < b.x + b.w + margin && a.x + a.w + margin > b.x && a.y < b.y + b.h + margin && a.y + a.h + margin > b.y;
}

export function expandRect(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

/** Zonas libres candidatas para las ventanas (laterales del personaje). */
export const HOLO_SLOTS: readonly Rect[] = [
  { x: 4, y: 22, w: 42, h: 18 },
  { x: 100, y: 22, w: 40, h: 18 },
  { x: 4, y: 42, w: 42, h: 18 },
  { x: 100, y: 42, w: 40, h: 18 },
];

/** Zona fija de la respuesta del asistente: la zona libre de la derecha (sobre el termo y el router), lejos de la lampara y de la cara. */
export const ASSISTANT_SLOT: Rect = { x: 97, y: 20, w: 45, h: 17 };

/** Cara de respaldo si la escena todavia no define LAYOUT.face. */
export const FACE_FALLBACK: Rect = { x: 62, y: 39, w: 20, h: 19 };

/** Zonas donde nunca va una ventana: cara con sus etiquetas y teclado con su area de click. */
export function forbiddenZones(face: Rect, keyboard: Rect): Rect[] {
  return [
    { x: face.x - 3, y: face.y - 8, w: face.w + 30, h: face.h + 12 },
    { x: keyboard.x - 5, y: keyboard.y - 3, w: keyboard.w + 10, h: keyboard.h + 8 },
  ];
}

/** Elige una zona que no toque lo prohibido ni las ventanas ocupadas; null si no hay. */
export function pickSlot(slots: readonly Rect[], forbidden: Rect[], occupied: Rect[], rand: () => number): Rect | null {
  const free = slots.filter((s) => !forbidden.some((f) => rectsOverlap(s, f)) && !occupied.some((o) => rectsOverlap(s, o)));
  if (!free.length) return null;
  return free[Math.min(free.length - 1, Math.floor(rand() * free.length))];
}

export interface SpawnState {
  wins: { id: number; kind: HoloKind; born: number }[];
  lastByKind: Partial<Record<HoloKind, number>>;
  lastAny: number;
}

export interface SpawnPlan {
  ok: boolean;
  /** ventana que hay que retirar para hacer sitio */
  evictId?: number;
}

/** Decide si una ventana nueva puede salir: cooldown por tipo, separacion global, tope y prioridad. */
export function planSpawn(st: SpawnState, kind: HoloKind, now: number, max: number): SpawnPlan {
  const rule = KIND_RULES[kind];
  const last = st.lastByKind[kind];
  if (last !== undefined && now - last < rule.cooldown) return { ok: false };
  if (rule.priority < 3 && now - st.lastAny < HOLO_MIN_GAP_MS) return { ok: false };
  if (st.wins.length < max) return { ok: true };
  if (rule.priority < 3) return { ok: false };
  // lleno: una ventana importante desplaza a la mas vieja de menor o igual prioridad
  let victim: SpawnState['wins'][number] | undefined;
  for (const w of st.wins) {
    if (KIND_RULES[w.kind].priority > rule.priority) continue;
    if (!victim || KIND_RULES[w.kind].priority < KIND_RULES[victim.kind].priority || (KIND_RULES[w.kind].priority === KIND_RULES[victim.kind].priority && w.born < victim.born)) victim = w;
  }
  return victim ? { ok: true, evictId: victim.id } : { ok: false };
}

/** Anade una muestra a la serie (ventana deslizante). */
export function pushSample(arr: readonly number[], v: number, max = SPARK_LEN): number[] {
  const out = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice();
  out.push(v);
  return out;
}

/** Alturas enteras (0..rows) para dibujar la sparkline en pixeles; la escala es la del maximo de la serie. */
export function sparkHeights(arr: readonly number[], rows: number): number[] {
  const max = Math.max(1e-9, ...arr);
  return arr.map((v) => (v <= 0 ? 0 : Math.max(1, Math.round((v / max) * rows))));
}

/** Barra de carga de 0..100 a n segmentos. */
export function barSegments(pct: number, n: number): number {
  return Math.max(0, Math.min(n, Math.round((pct / 100) * n)));
}

/** CPU/RAM simulados: crecen con la produccion de forma logaritmica, con un piso bajo. */
export function loadPct(rate: number, base: number, span: number): number {
  const v = base + Math.log10(1 + Math.max(0, rate)) * span;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Reloj mm:ss (o h:mm:ss) del tiempo de partida. */
export function clockText(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export type FaceState = 'focus' | 'idle' | 'happy' | 'stress' | 'tech' | 'dempsey' | 'resign';

export interface FaceInput {
  cliff: boolean;
  finished: boolean;
  dempsey: boolean;
  techTest: boolean;
  shock: boolean;
  happy: boolean;
  typing: boolean;
}

/** Misma prioridad que el frame del personaje en Scene.svelte. */
export function faceState(i: FaceInput): FaceState {
  if (i.cliff) return 'resign';
  if (i.finished) return 'happy';
  if (i.dempsey) return 'dempsey';
  if (i.techTest) return 'tech';
  if (i.shock) return 'stress';
  if (i.happy) return 'happy';
  if (i.typing) return 'focus';
  return 'idle';
}

/** Medidor de focus: sube con el combo y con tipear; sin actividad queda en un piso. */
export function focusPct(combo: number, typing: boolean, dempsey: boolean): number {
  const v = (typing ? 25 : 8) + combo * 3 + (dempsey ? 20 : 0);
  return Math.max(0, Math.min(100, Math.round(v)));
}
