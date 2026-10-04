import { describe, expect, it } from 'vitest';
import { createState } from '../engine';
import { bannerTone, bannerTotalMs, clickMult, INSTANT_BANNER_MS, multLabel, numberSize, prodMult } from '../ui/fx';
import { EVENT_DEFS } from '../balance';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

describe('multiplicadores visuales', () => {
  it('sin efectos activos todo vale 1', () => {
    const s = createState();
    expect(clickMult(s)).toBe(1);
    expect(prodMult(s)).toBe(1);
  });
  it('cafe y hackathon se combinan', () => {
    const s = createState();
    s.cafeActive = 1000;
    s.activeEvent = { id: 'hackathon', left: 1000 };
    expect(prodMult(s)).toBe(6);
    expect(clickMult(s)).toBe(3);
    s.dempseyLeft = 1000;
    expect(clickMult(s)).toBe(6);
  });
  it('prodfail baja la produccion', () => {
    const s = createState();
    s.activeEvent = { id: 'prodfail', left: 1000 };
    expect(prodMult(s)).toBe(0.5);
    expect(multLabel(0.5)).toBe('x0.5');
    expect(multLabel(3)).toBe('x3');
  });
  it('el tamano crece con la magnitud dentro de un rango', () => {
    expect(numberSize(1000, false)).toBeGreaterThan(numberSize(1, false));
    expect(numberSize(1e12, false)).toBeLessThanOrEqual(1.8);
    expect(numberSize(5, true)).toBeGreaterThan(numberSize(5, false));
  });
  it('tonos y duraciones del banner', () => {
    expect(bannerTone('hackathon')).toBe('good');
    expect(bannerTone('prodfail')).toBe('bad');
    expect(bannerTotalMs('exposicion')).toBe(INSTANT_BANNER_MS);
    expect(bannerTotalMs('hackathon')).toBe(EVENT_DEFS.hackathon.durationMs);
  });
  it('todos los eventos tienen titulo corto y efecto en es y en, sin emojis', () => {
    for (const id of [...Object.keys(EVENT_DEFS), 'dempsey', 'cafe']) {
      for (const d of [es, en] as Record<string, unknown>[]) {
        expect(typeof d[`event.${id}.short`]).toBe('string');
        expect(typeof d[`event.${id}.effect`]).toBe('string');
        expect(String(d[`event.${id}.effect`])).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});
