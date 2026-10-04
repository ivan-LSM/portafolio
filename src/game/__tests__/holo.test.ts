import { describe, expect, it } from 'vitest';
import {
  FACE_FALLBACK,
  HOLO_SLOTS,
  KIND_RULES,
  barSegments,
  clockText,
  faceState,
  focusPct,
  forbiddenZones,
  loadPct,
  pickSlot,
  planSpawn,
  pushSample,
  rectsOverlap,
  sparkHeights,
  type HoloKind,
  type SpawnState,
} from '../ui/holo';
import { KEYBOARD, LAYOUT } from '../sprites';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

const empty = (): SpawnState => ({ wins: [], lastByKind: {}, lastAny: -10_000 });
const kb = { x: LAYOUT.keyboard.x, y: LAYOUT.keyboard.y, w: KEYBOARD.w, h: KEYBOARD.h };

describe('geometria de ventanas', () => {
  it('detecta cruces de rectangulos', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 5, h: 5 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 })).toBe(false);
  });
  it('ningun slot disponible toca la cara, sus etiquetas ni el teclado', () => {
    const forbidden = forbiddenZones(FACE_FALLBACK, kb);
    for (let i = 0; i < 50; i++) {
      const slot = pickSlot(HOLO_SLOTS, forbidden, [], Math.random);
      expect(slot).not.toBeNull();
      for (const f of forbidden) expect(rectsOverlap(slot!, f)).toBe(false);
    }
  });
  it('no repite una zona ocupada y devuelve null si no queda ninguna', () => {
    const forbidden = forbiddenZones(FACE_FALLBACK, kb);
    const occupied: typeof HOLO_SLOTS[number][] = [];
    for (let i = 0; i < HOLO_SLOTS.length; i++) {
      const s = pickSlot(HOLO_SLOTS, forbidden, occupied, Math.random);
      if (!s) break;
      expect(occupied.some((o) => rectsOverlap(o, s))).toBe(false);
      occupied.push(s);
    }
    expect(pickSlot(HOLO_SLOTS, forbidden, HOLO_SLOTS.slice(), Math.random)).toBeNull();
  });
});

describe('cooldowns y tope de ventanas', () => {
  it('respeta el cooldown por tipo', () => {
    const st = empty();
    expect(planSpawn(st, 'term', 10_000, 3).ok).toBe(true);
    st.lastByKind.term = 10_000;
    st.lastAny = 10_000;
    expect(planSpawn(st, 'term', 12_000, 3).ok).toBe(false);
    expect(planSpawn(st, 'term', 10_000 + KIND_RULES.term.cooldown, 3).ok).toBe(true);
  });
  it('los tipos de baja prioridad respetan la separacion global', () => {
    const st = empty();
    st.lastAny = 10_000;
    expect(planSpawn(st, 'cv', 10_100, 3).ok).toBe(false);
    expect(planSpawn(st, 'achv', 10_100, 3).ok).toBe(true);
  });
  it('con el tope lleno descarta lo trivial y desplaza lo viejo con lo importante', () => {
    const st = empty();
    st.wins = [
      { id: 1, kind: 'term', born: 100 },
      { id: 2, kind: 'cv', born: 200 },
      { id: 3, kind: 'install', born: 300 },
    ];
    expect(planSpawn(st, 'term', 5000, 3).ok).toBe(false);
    const p = planSpawn(st, 'reject', 5000, 3);
    expect(p).toEqual({ ok: true, evictId: 1 });
    // el movil solo admite una
    const m = empty();
    m.wins = [{ id: 9, kind: 'achv', born: 0 }];
    expect(planSpawn(m, 'interview', 5000, 1).ok).toBe(false);
    expect(planSpawn(m, 'achv', 5000, 1)).toEqual({ ok: true, evictId: 9 });
  });
  it('toda prioridad esta definida', () => {
    const kinds: HoloKind[] = ['term', 'cv', 'interview', 'reject', 'install', 'achv', 'event', 'assistant'];
    for (const k of kinds) expect(KIND_RULES[k].priority).toBeGreaterThan(0);
  });
});

describe('estado y medidores', () => {
  it('la sparkline es una ventana deslizante', () => {
    let a: number[] = [];
    for (let i = 0; i < 30; i++) a = pushSample(a, i, 20);
    expect(a).toHaveLength(20);
    expect(a[19]).toBe(29);
    expect(sparkHeights([0, 5, 10], 4)).toEqual([0, 2, 4]);
    expect(sparkHeights([0, 0], 4)).toEqual([0, 0]);
  });
  it('barras y carga acotadas', () => {
    expect(barSegments(100, 5)).toBe(5);
    expect(barSegments(-4, 5)).toBe(0);
    expect(loadPct(1e12, 10, 24)).toBe(100);
    expect(loadPct(0, 10, 24)).toBe(10);
  });
  it('reloj mm:ss', () => {
    expect(clockText(65_000)).toBe('01:05');
    expect(clockText(3_725_000)).toBe('1:02:05');
  });
  it('el estado de la cara sigue la prioridad del personaje', () => {
    const base = { cliff: false, finished: false, dempsey: false, techTest: false, shock: false, happy: false, typing: false };
    expect(faceState(base)).toBe('idle');
    expect(faceState({ ...base, typing: true })).toBe('focus');
    expect(faceState({ ...base, typing: true, happy: true })).toBe('happy');
    expect(faceState({ ...base, happy: true, shock: true })).toBe('stress');
    expect(faceState({ ...base, shock: true, techTest: true })).toBe('tech');
    expect(faceState({ ...base, techTest: true, dempsey: true })).toBe('dempsey');
    expect(faceState({ ...base, dempsey: true, cliff: true })).toBe('resign');
  });
  it('el focus sube con el combo y se acota', () => {
    expect(focusPct(10, true, false)).toBeGreaterThan(focusPct(0, true, false));
    expect(focusPct(999, true, true)).toBe(100);
  });
});

describe('textos del HUD', () => {
  it('existen en ambos idiomas y la lista de commits no esta vacia', () => {
    for (const d of [es, en] as Record<string, unknown>[]) {
      for (const k of ['focus', 'idle', 'happy', 'stress', 'tech', 'dempsey', 'resign']) {
        expect(d[`holo.state.${k}`], k).toBeTypeOf('string');
      }
      expect(Array.isArray(d['holo.commits'])).toBe(true);
      expect((d['holo.commits'] as string[]).length).toBeGreaterThanOrEqual(8);
    }
  });
});
