import { describe, expect, it } from 'vitest';
import {
  BACK,
  BARREL_BIG,
  BARREL_MUG,
  BOTTLE,
  CHARACTER,
  CHAR_FRAMES,
  CHAR_CX,
  CHAR_DESK_ROW,
  CHAR_H,
  CHAR_W,
  CHAIR,
  CLIFF,
  DESK,
  ENVELOPE,
  GO_GLYPH,
  ROUTER,
  ICONS,
  KEYBOARD,
  LAMP,
  LAMP_GLOW,
  LAYOUT,
  MAT,
  MOUSE,
  MUG,
  PALETTE,
  PERFUME,
  PLANT,
  POSTERS,
  POSTER_H,
  POSTER_W,
  SCENE_H,
  SCENE_W,
  SPEAKER,
  STEAM,
  UI_ICONS,
  getCharacter,
  getCharacterSheet,
} from '../sprites';
import { ACHIEVEMENTS } from '../achievements';
import { EVENT_DEFS } from '../balance';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

const outfits = [0, 1, 2, 3, 4].map((l) => [`CHARACTER nivel ${l}`, getCharacterSheet(l)] as const);
const all = {
  ...ICONS,
  ...UI_ICONS,
  CHARACTER,
  ENVELOPE,
  KEYBOARD,
  LAMP,
  LAMP_GLOW,
  BACK,
  CHAIR,
  DESK,
  MUG,
  PLANT,
  STEAM,
  MAT,
  MOUSE,
  SPEAKER,
  BOTTLE,
  PERFUME,
  ROUTER,
  BARREL_MUG,
  BARREL_BIG,
  CLIFF,
  GO_GLYPH,
  ...Object.fromEntries(Object.entries(POSTERS).map(([k, v]) => [`POSTER ${k}`, v])),
  ...Object.fromEntries(outfits),
};

describe('sprites', () => {
  for (const [name, def] of Object.entries(all)) {
    it(`${name}: dimensiones y paleta consistentes`, () => {
      const pal = def.palette ?? PALETTE;
      for (const frame of def.frames) {
        expect(frame).toHaveLength(def.h);
        for (const row of frame) {
          expect(row).toHaveLength(def.w);
          for (const ch of row) if (ch !== '.') expect(pal[ch], `${name}: '${ch}'`).toBeDefined();
        }
      }
    });
  }
  it('los iconos de tienda son 16x16', () => {
    for (const d of Object.values(ICONS)) expect([d.w, d.h]).toEqual([16, 16]);
  });
  it('los pósters miden 20x26', () => {
    for (const d of Object.values(POSTERS)) expect([d.w, d.h]).toEqual([POSTER_W, POSTER_H]);
    expect([POSTER_W, POSTER_H]).toEqual([20, 26]);
  });
  it('el personaje tiene todos los frames para los 5 atuendos y getCharacter devuelve un frame', () => {
    expect(CHAR_FRAMES).toEqual(['typing0', 'typing1', 'idle0', 'idle1', 'happy', 'shock', 'spiral', 'swayL', 'swayR', 'fall0', 'fall1', 'sip']);
    for (let l = 0; l < 5; l++) {
      const sheet = getCharacterSheet(l);
      expect(sheet.frames).toHaveLength(CHAR_FRAMES.length);
      for (const f of CHAR_FRAMES) {
        const one = getCharacter(l, f);
        expect([one.w, one.h, one.frames.length]).toEqual([CHAR_W, CHAR_H, 1]);
      }
    }
    // contrato de la escena: la fila del escritorio y el centro de la cara caen dentro del sprite
    expect(CHAR_DESK_ROW).toBeLessThan(CHAR_H);
    expect(CHAR_CX).toBeLessThan(CHAR_W);
    // los atuendos se distinguen entre sí
    const set = new Set([0, 1, 2, 3, 4].map((l) => getCharacter(l, 'idle0').frames[0].join('')));
    expect(set.size).toBe(5);
    // niveles fuera de rango se acotan
    expect(getCharacter(99, 'idle0').frames[0]).toEqual(getCharacter(4, 'idle0').frames[0]);
  });
});

describe('escena de frente', () => {
  it('el personaje cabe en el sprite y su fila de mesa cae en el borde trasero del escritorio', () => {
    expect(LAYOUT.character.y + CHAR_DESK_ROW).toBe(64);
    expect(LAYOUT.face.x + LAYOUT.face.w).toBeLessThanOrEqual(LAYOUT.character.x + CHAR_W);
    expect(LAYOUT.face.y).toBeGreaterThanOrEqual(LAYOUT.character.y);
    expect(LAYOUT.face.y + LAYOUT.face.h).toBeLessThanOrEqual(LAYOUT.character.y + CHAR_DESK_ROW);
  });
  it('teclado, mouse y mousepad quedan dentro de la escena y el mouse pegado al borde derecho del teclado', () => {
    for (const [d, p] of [[KEYBOARD, LAYOUT.keyboard], [MOUSE, LAYOUT.mouse], [MAT, LAYOUT.mat], [BACK, LAYOUT.back], [DESK, LAYOUT.desk]] as const) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + d.w).toBeLessThanOrEqual(SCENE_W);
      expect(p.y + d.h).toBeLessThanOrEqual(SCENE_H);
    }
    expect(LAYOUT.mouse.x).toBeGreaterThanOrEqual(LAYOUT.keyboard.x + KEYBOARD.w - 4);
    expect(LAYOUT.keyboard.y).toBe(LAYOUT.character.y + CHAR_DESK_ROW + 1);
  });
  it('el teclado tiene frames de reposo y de cada mitad, y el mouse 3 de brillo', () => {
    expect(KEYBOARD.frames).toHaveLength(3);
    expect(MOUSE.frames).toHaveLength(3);
  });
  it('el parlante tiene reposo y 4 frames de anillo, la lampara y su luz tienen encendido y apagado', () => {
    expect(SPEAKER.frames).toHaveLength(5);
    expect(LAMP.frames).toHaveLength(2);
    expect(LAMP_GLOW.frames).toHaveLength(2);
    expect(LAMP.frames[0]).not.toEqual(LAMP.frames[1]);
    expect(SPEAKER.frames[0]).not.toEqual(SPEAKER.frames[1]);
  });
  it('el frame sip existe en los 5 atuendos y difiere del reposo', () => {
    for (let l = 0; l < 5; l++) expect(getCharacter(l, 'sip').frames[0]).not.toEqual(getCharacter(l, 'idle0').frames[0]);
  });
  it('el mouse mira al espectador: los botones y la rueda quedan en la mitad de abajo', () => {
    const f = MOUSE.frames[0];
    const rows = f.map((r) => [...r].filter((c) => c !== '.').length);
    expect(rows.reduce((a, b) => a + b, 0)).toBeGreaterThan(40);
  });
  it('las patas alternan en el tecleo y el cuerpo no cambia', () => {
    const a = getCharacter(0, 'typing0').frames[0];
    const b = getCharacter(0, 'typing1').frames[0];
    expect(a).not.toEqual(b);
    // la fila del torso (la 24) es identica en ambos frames del tecleo
    expect(a[24]).toEqual(b[24]);
  });
});

describe('i18n del juego', () => {
  it('es y en tienen las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });
  it('el asistente tiene 10 respuestas por idioma y los objetos tienen etiqueta', () => {
    for (const d of [es, en] as Record<string, unknown>[]) {
      expect(d['assistant.say']).toHaveLength(10);
      for (const k of ['mug.label', 'lamp.label.on', 'lamp.label.off', 'assistant.label', 'holo.assistant']) expect(d[k], k).toBeTypeOf('string');
    }
  });
  it('sin emojis', () => {
    const re = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    expect(re.test(JSON.stringify(es) + JSON.stringify(en))).toBe(false);
  });
  it('cada logro y cada evento tiene sus textos en ambos idiomas', () => {
    for (const d of [es, en] as Record<string, unknown>[]) {
      for (const a of ACHIEVEMENTS) {
        expect(d[`ach.${a.id}.name`], a.id).toBeTypeOf('string');
        expect(d[`ach.${a.id}.desc`], a.id).toBeTypeOf('string');
      }
      for (const id of Object.keys(EVENT_DEFS)) expect(d[`event.${id}.title`], id).toBeTypeOf('string');
      for (const p of ['jojo', 'joseph', 'ippo', 'gragas']) expect(d[`poster.${p}`], p).toBeTypeOf('string');
    }
    expect(es['ach.hardstuck.desc']).toBe('Llevas 3 seasons sin subir');
    expect(en['seniority.lead.tip']).toBe('Finally out of Master');
    expect(es['seniority.lead.tip']).toBe('Por fin saliste de Master');
  });
});
