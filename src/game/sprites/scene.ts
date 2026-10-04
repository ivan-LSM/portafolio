import { ellipse, grid, line, outline, PALETTE, put, rect, sprite, type Grid, type SpriteDef } from './gen';

/**
 * Piezas de la escena: el escritorio real de Iván (sin marcas). Tamaño lógico: 144x104, vista de frente (Iván sentado tras el escritorio).
 * Todas las piezas usan SCENE_PALETTE (Sweetie 16 + algunos tonos extra para madera, rosa, RGB, etc.).
 */
export const SCENE_W = 144;
export const SCENE_H = 104;

export const SCENE_PALETTE: Record<string, string> = {
  ...PALETTE,
  A: '#e2b883', // madera clara
  B: '#cf9a62', // madera media
  C: '#a8723f', // madera oscura
  D: '#bf8a55', // veta
  E: '#eae4d6', // pared
  F: '#f6f1e4', // papel
  G: '#e98fb3', // rosa (desk mat)
  H: '#c9709a', // rosa oscuro
  I: '#f7b9d0', // rosa claro
  J: '#10111a', // negro
  K: '#1d2030', // casi negro
  L: '#323650', // gris oscuro
  M: '#a35cf5', // morado RGB
  N: '#ec4bd0', // magenta RGB
  O: '#3f6dff', // azul RGB
  P: '#36e0f0', // cian RGB
  Q: '#d02e3e', // rojo (keycap)
  R: '#8a1b2a', // rojo oscuro
  S: '#f0616d', // rojo claro
  T: '#dd8c28', // ámbar
  U: '#f6c768', // ámbar claro
  V: '#cdb9f2', // lila
  W: '#9a82d3', // lila oscuro
  X: '#fff8ea', // espuma
  Y: '#a8663b', // barril
  Z: '#6d3f23', // barril oscuro
  g: '#3a1a6e',
  h: '#7b2fb5',
  i: '#ff8ac0',
  j: '#ffb1d8',
  k: '#2a1250',
  l: '#5b2a8a',
  m: '#ff9a4d',
  n: '#e8548c',
  o: '#6a2a8c',
  p: '#ffe08a',
  q: '#3a2218',
  r: '#5a3220',
  s: '#7a4a2e',
  t: '#d7dde4',
  u: '#cfe8ff',
  v: '#46b3c9',
  w: '#2a8a9e',
  x: '#ffd84a',
  y: '#8ea0b4',
  z: '#4a4d5c',
};

const make = (g: Grid | Grid[]): SpriteDef => ({ ...sprite(g), palette: SCENE_PALETTE });

const mirrorRow = (r: string) => r + [...r].reverse().join('');

// ---------- Botella térmica negra con sticker (12x30) ----------
function makeBottle(): SpriteDef {
  const g = grid(12, 30);
  // tapa y asa
  rect(g, 3, 0, 6, 4, 'K');
  rect(g, 3, 0, 6, 1, 'L');
  for (const [x, y] of [[9, 1], [10, 1], [10, 2], [10, 3], [9, 4]] as const) put(g, x, y, 'K');
  rect(g, 4, 4, 4, 2, 'L');
  // cuerpo
  for (let y = 6; y < 30; y++) {
    const inset = y === 6 ? 2 : y === 7 ? 1 : 0;
    rect(g, inset, y, 12 - inset * 2, 1, 'K');
  }
  rect(g, 2, 8, 2, 20, 'L'); // brillo
  rect(g, 1, 8, 1, 20, 'f');
  rect(g, 10, 8, 1, 21, 'J');
  rect(g, 0, 29, 12, 1, 'J');
  // anillos
  rect(g, 0, 12, 12, 1, 'J');
  rect(g, 0, 26, 12, 1, 'J');
  // texto genérico (rayitas) sin marca
  for (const x of [4, 6, 8]) rect(g, x, 15, 1, 4, 'e');
  rect(g, 4, 17, 5, 1, 'e');
  // sticker lila (sin personaje)
  ellipse(g, 6.5, 22.5, 2.6, 3, 'V');
  rect(g, 5, 20, 2, 1, 'c');
  put(g, 5, 22, 'W');
  put(g, 8, 23, 'W');
  put(g, 6, 24, 'W');
  outline(g, 'J');
  return make(g);
}
export const BOTTLE = makeBottle();

// ---------- Perfume de vidrio ámbar (6x12) ----------
function makePerfume(): SpriteDef {
  const g = grid(6, 12);
  rect(g, 1, 0, 4, 3, 'K');
  rect(g, 1, 0, 4, 1, 'L');
  rect(g, 0, 3, 6, 9, 'T');
  rect(g, 1, 3, 1, 8, 'U');
  rect(g, 4, 4, 1, 7, 'C');
  rect(g, 2, 6, 3, 3, 'F');
  rect(g, 2, 7, 3, 1, 'd');
  outline(g, 'J');
  return make(g);
}
export const PERFUME = makePerfume();

// ---------- Taza blanca (14x12), vapor y barril (reemplaza la taza tras 10 cafés) ----------
function makeMug(): SpriteDef {
  const g = grid(14, 12);
  rect(g, 1, 1, 9, 10, 'c');
  rect(g, 8, 1, 2, 10, 'd');
  rect(g, 2, 2, 7, 2, 'f'); // café oscuro dentro (vista elevada)
  rect(g, 2, 2, 7, 1, '1');
  for (const [x, y] of [[10, 3], [11, 3], [12, 3], [12, 4], [12, 5], [12, 6], [11, 7], [10, 7]] as const) put(g, x, y, 'c');
  rect(g, 2, 10, 7, 1, 'd');
  outline(g);
  return make(g);
}
export const MUG = makeMug();

function makeBarrelMug(): SpriteDef {
  const g = grid(14, 12);
  // barril chiquito con espuma
  ellipse(g, 6.5, 7, 6.2, 4.8, 'Y');
  rect(g, 0, 3, 14, 1, '.');
  for (const y of [5, 9]) rect(g, 1, y, 12, 1, 'z');
  rect(g, 2, 4, 1, 7, 'S');
  rect(g, 10, 4, 1, 7, 'Z');
  // espuma
  rect(g, 2, 1, 10, 2, 'X');
  rect(g, 4, 0, 6, 1, 'X');
  put(g, 3, 3, 'X');
  put(g, 7, 3, 'X');
  put(g, 11, 3, 'X');
  put(g, 3, 4, 'X');
  outline(g);
  return make(g);
}
export const BARREL_MUG = makeBarrelMug();

/** Barril grande del evento "Barril explosivo" (22x26). Frame 0 normal, 1 con espuma desbordando. */
function bigBarrel(foam: boolean): Grid {
  const g = grid(22, 26);
  ellipse(g, 10.5, 15, 10, 10, 'Y');
  rect(g, 0, 0, 22, 6, '.');
  rect(g, 0, 22, 22, 4, '.');
  rect(g, 1, 6, 20, 17, 'Y');
  for (let x = 3; x < 20; x += 4) rect(g, x, 6, 1, 17, 'Z');
  for (const y of [8, 21]) rect(g, 0, y, 22, 2, 'z');
  rect(g, 0, 14, 22, 1, 'e');
  rect(g, 0, 15, 22, 1, 'z');
  rect(g, 2, 6, 2, 17, 'S');
  rect(g, 17, 6, 3, 17, 'Z');
  // tapa con espuma
  rect(g, 2, 3, 18, 3, 'X');
  rect(g, 5, 1, 12, 2, 'X');
  put(g, 3, 6, 'X');
  put(g, 8, 6, 'X');
  put(g, 14, 7, 'X');
  put(g, 19, 6, 'X');
  put(g, 3, 7, 'X');
  put(g, 14, 6, 'X');
  if (foam) {
    rect(g, 1, 6, 3, 5, 'X');
    rect(g, 18, 6, 3, 7, 'X');
    rect(g, 9, 6, 3, 3, 'X');
    for (const [x, y] of [[6, 0], [10, 0], [13, 0], [8, -1]] as const) put(g, x, y, 'X');
  }
  outline(g);
  return g;
}
export const BARREL_BIG = make([bigBarrel(false), bigBarrel(true)]);

function steamFrame(phase: number): Grid {
  const g = grid(10, 12);
  const drift = [0, 1, 0, -1];
  for (const base of [2, 6]) {
    for (let y = 0; y < 11; y++) {
      const x = base + drift[(Math.floor(y / 2) + phase + (base === 6 ? 2 : 0)) % 4];
      put(g, x, 11 - y, y % 4 === 3 ? '.' : y > 7 ? 'd' : 'c');
    }
  }
  return g;
}
export const STEAM = make([0, 1, 2, 3].map(steamFrame));

// ---------- Planta (16x22): se conserva el sprite, la escena actual no tiene lugar para ella ----------
function makePlant(): SpriteDef {
  const g = grid(16, 22);
  ellipse(g, 7.5, 6, 2.2, 6, '6');
  ellipse(g, 4, 9, 2.4, 4.2, '6');
  ellipse(g, 11.5, 9, 2.4, 4.2, '6');
  ellipse(g, 2.5, 12, 1.8, 3, '7');
  ellipse(g, 13, 12, 1.8, 3, '7');
  line(g, 7, 2, 7, 11, '5');
  line(g, 4, 6, 4, 11, '5');
  line(g, 11, 6, 11, 11, '5');
  for (let r = 0; r < 8; r++) rect(g, 3 + (r >> 2), 13 + r, 10 - 2 * (r >> 2), 1, r < 2 ? '4' : '3');
  rect(g, 3, 13, 10, 2, '3');
  rect(g, 2, 13, 12, 2, '4');
  rect(g, 4, 15, 8, 6, '3');
  rect(g, 10, 15, 2, 6, '2');
  rect(g, 4, 20, 8, 1, '2');
  rect(g, 4, 14, 8, 1, '1');
  outline(g);
  return make(g);
}
export const PLANT = makePlant();

// ---------- Respaldo de la silla visto de frente (40x28): negro con ribete rojo, asoma tras los hombros ----------
/** Mitad izquierda (20 columnas); la derecha es el espejo. */
const CHAIR_HALF = [
  '.........JJJJJJJJJJJ',
  '.......JJLLLLLLLLLLL',
  '.....JJLLKKKKKKKKKKK',
  '....JLLKKKKKKKKKKKKK',
  '...JLKKKKKKKKKKKKKKK',
  '..JLKKKKKKKKKKKKKKKK',
  '.JLKKKKQKKKKKKKKKKKK',
  '.JLKKKQKKKKKKKKKKKKK',
  'JLKKKQKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQLLLLLLLLLLLLLLL',
  'JLKKQJJJJJJJJJJJJJJJ',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
  'JLKKQKKKKKKKKKKKKKKK',
];
export const CHAIR = make(CHAIR_HALF.map((r) => [...mirrorRow(r)]));

// ======================================================================
// Escena de frente (r7): pared, mesa en perspectiva de un punto, teclado 60% y mouse.
// El mobiliario se construye con un lienzo de colores libres (helpers de poligonos y mezcla) y se
// convierte a sprite con paleta propia. El personaje, en cambio, esta dibujado a mano (character.ts).
// ======================================================================
type Hex = string | null;
type Pt = [number, number];
class Cv {
  d: Hex[][];
  constructor(
    public w: number,
    public h: number,
  ) {
    this.d = Array.from({ length: h }, () => Array<Hex>(w).fill(null));
  }
  px(x: number, y: number, c: Hex): void {
    x = Math.round(x);
    y = Math.round(y);
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y][x] = c;
  }
  get(x: number, y: number): Hex {
    return this.d[y]?.[x] ?? null;
  }
  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
  /** estampa arte de strings con una paleta (caracter -> color) */
  stamp(x: number, y: number, rows: string[], pal: Record<string, string>): void {
    rows.forEach((r, j) => {
      for (let i = 0; i < r.length; i++) if (r[i] !== '.' && r[i] !== ' ') this.px(x + i, y + j, pal[r[i]]);
    });
  }
  spr(x: number, y: number, s: SpriteDef, f = 0): void {
    this.stamp(x, y, s.frames[f], s.palette ?? SCENE_PALETTE);
  }
  poly(p: Pt[], f: string | ((x: number, y: number) => Hex), edge?: string): void {
    const inside = (x: number, y: number): boolean => {
      let ins = false;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const [xi, yi] = p[i];
        const [xj, yj] = p[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (inside(x + 0.5, y + 0.5)) this.px(x, y, typeof f === 'string' ? f : f(x, y));
    if (edge) for (let i = 0; i < p.length; i++) this.line(p[i][0], p[i][1], p[(i + 1) % p.length][0], p[(i + 1) % p.length][1], edge);
  }
  /** mezcla con alfa cuantizado a 1/6 para limitar el numero de colores distintos */
  blend(x: number, y: number, c: string, a: number): void {
    const b = this.get(x, y);
    if (!b) return;
    const q = Math.round(a * 6) / 6;
    if (q <= 0) return;
    const rgb = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = rgb(b);
    const B = rgb(c);
    this.px(x, y, '#' + [0, 1, 2].map((i) => Math.round(A[i] * (1 - q) + B[i] * q).toString(16).padStart(2, '0')).join(''));
  }
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+-=?@^_~<>:;/|';
/** convierte lienzos (frames) en un SpriteDef con paleta propia */
function cvToDef(frames: Cv[]): SpriteDef {
  const map = new Map<string, string>();
  const palette: Record<string, string> = {};
  const rows = frames.map((cv) =>
    cv.d.map((r) =>
      r
        .map((c) => {
          if (!c) return '.';
          let ch = map.get(c);
          if (!ch) {
            ch = CHARSET[map.size];
            if (!ch) throw new Error('scene.ts: demasiados colores en un sprite');
            map.set(c, ch);
            palette[ch] = c;
          }
          return ch;
        })
        .join(''),
    ),
  );
  return { w: frames[0].w, h: frames[0].h, frames: rows, palette };
}

const WALL_H = 64; // y donde empieza la superficie de la mesa
const DESK_FRONT = 94;
const DESK_BL = 5;
const DESK_BR = 139;
// teclado: trapecio (esquinas) justo bajo el torso
const KB_POLY: Pt[] = [[58, 65], [82, 65], [86, 78], [54, 78]];
const KB_X = 52;
const KB_Y = 65;
const MAT_POLY: Pt[] = [[82, 72], [110, 74], [114, 90], [84, 88]];

// ---------- Fondo: pared, estanteria con libros, cuaderno, perfume y parlante, tomacorriente (144x64) ----------
function makeBack(): SpriteDef {
  const c = new Cv(SCENE_W, WALL_H);
  c.rect(0, 0, SCENE_W, WALL_H, '#eae4d6');
  for (let y = 51; y < WALL_H; y++) for (let x = 0; x < SCENE_W; x++) if ((x + y) % 7 === 0) c.px(x, y, '#e2dbca');
  c.rect(0, 60, SCENE_W, 4, '#d9d0bd'); // zocalo en sombra
  // estanteria
  c.rect(2, 41, 48, 2, '#a8723f');
  c.rect(2, 43, 48, 1, '#6d3f23');
  const books: [number, number, string][] = [[3, 9, '#b13e53'], [6, 11, '#3b5dc9'], [9, 8, '#38b764'], [12, 10, '#ffcd75'], [15, 9, '#5d275d']];
  for (const [x, h, col] of books) {
    c.rect(x, 41 - h, 3, h, col);
    c.px(x + 1, 41 - h + 2, '#f4f4f4');
    c.px(x + 1, 41 - h + 4, '#f4f4f4');
  }
  c.rect(19, 36, 8, 5, '#f4f4f4');
  c.rect(19, 36, 8, 1, '#94b0c2');
  c.rect(20, 37, 6, 3, '#ef7d57');
  c.spr(29, 29, PERFUME);
  // tomacorriente
  c.rect(133, 53, 6, 8, '#d7dde4');
  c.rect(133, 53, 6, 1, '#f4f4f4');
  for (const [x, y] of [[135, 55], [137, 55], [135, 58], [137, 58]] as const) c.px(x, y, '#566c86');
  return cvToDef([c]);
}
export const BACK = makeBack();

// ---------- Parlante inteligente (asistente) 14x12: cilindro de tela con anillo de luz superior ----------
// Frame 0: reposo (anillo apagado). Frames 1-4: un cometa cian da la vuelta al anillo.
const SPK_RING: Pt[] = [[4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 2], [11, 2], [9, 3], [8, 3], [7, 3], [6, 3], [5, 3], [4, 3], [3, 2], [2, 2]];
const SPK_TOP = [
  '....000000....',
  '..00......00..',
  '.0..ffffff..0.',
  '..00......00..',
];
function speakerFrame(k: number): Cv {
  const c = new Cv(14, 12);
  c.stamp(0, 0, SPK_TOP, { '0': '#10111a', f: '#1d2030' });
  // cuerpo de tela punteada: izquierda con luz, derecha en sombra
  for (let y = 4; y <= 10; y++) {
    const x0 = y === 4 || y === 10 ? 1 : 0;
    const x1 = 13 - x0;
    for (let x = x0; x <= x1; x++) {
      let col = (x + y) % 2 === 0 ? '#4a4d5c' : '#3a3d4e';
      if (x <= x0 + 1) col = (x + y) % 2 === 0 ? '#6a7088' : '#565c74';
      else if (x >= x1 - 2) col = (x + y) % 2 === 0 ? '#2a2d3c' : '#20222f';
      if (y === 10) col = '#20222f';
      c.px(x, y, col);
    }
    c.px(x0, y, '#10111a');
    c.px(x1, y, '#10111a');
  }
  c.rect(2, 11, 10, 1, '#10111a');
  for (let x = 1; x <= 12; x++) c.px(x, 4, '#10111a');
  const lit = k > 0;
  const colors = ['#e8ffff', '#73eff7', '#73eff7', '#41a6f6', '#41a6f6', '#2a8a9e'];
  SPK_RING.forEach(([x, y], i) => {
    let col = '#3d5a73';
    if (lit) {
      const d = (i - (k - 1) * 4 + 32) % 16;
      if (d < colors.length) col = colors[d];
    }
    c.px(x, y, col);
  });
  // punto de estado al frente
  c.px(6, 8, lit ? '#73eff7' : '#3d5a73');
  c.px(7, 8, lit ? '#73eff7' : '#3d5a73');
  return c;
}
export const SPEAKER = cvToDef([0, 1, 2, 3, 4].map(speakerFrame));

// ---------- Lampara articulada de escritorio (26x24): base con brillo, resorte, tornillos de laton, pantalla con degradado ----------
// Frame 0 encendida, frame 1 apagada (cambia solo la bombilla).
const LAMP_SHADE = [
  '..............000',
  '.............0ttL0',
  '............0ttLLf0',
  '...........0ttLLLff0',
  '..........0ttLLLLfff0',
  '.........0ttLLLLLffff0',
  '........0tLLLLLLLLffff0',
  '........000000000000000',
];
function lampFrame(on: boolean): Cv {
  const c = new Cv(26, 24);
  const o = '#1a1c2c';
  // brazos: el superior sube del tornillo a la pantalla, el inferior baja a la base
  const tube = (x0: number, y0: number, x1: number, y1: number): void => {
    c.line(x0, y0, x1, y1, '#333c57');
    c.line(x0 + 1, y0, x1 + 1, y1, '#333c57');
    c.line(x0, y0, x1, y1, '#566c86');
  };
  tube(7, 13, 12, 5);
  tube(7, 14, 6, 19);
  // resorte del brazo inferior: bobinas claras y oscuras alternadas
  for (let y = 15; y <= 18; y++) c.px(7 + (y % 2 ? 0 : -1), y, y % 2 ? '#8ea0b4' : '#c3d0dc');
  // base: disco chato con brillo
  c.rect(3, 20, 9, 1, '#c3d0dc');
  c.rect(2, 21, 11, 1, '#8ea0b4');
  c.rect(3, 22, 9, 1, '#566c86');
  c.px(4, 20, '#f4f4f4');
  c.px(5, 20, '#f4f4f4');
  c.stamp(1, 1, LAMP_SHADE, { '0': o, t: '#c9d6e2', L: '#8ea0b4', f: '#566c86' });
  // contorno automatico de todo salvo la bombilla
  const snap = c.d.map((r) => r.slice());
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      if (snap[y][x]) continue;
      if (snap[y - 1]?.[x] || snap[y + 1]?.[x] || snap[y][x - 1] || snap[y][x + 1]) c.px(x, y, o);
    }
  // tornillos de laton (articulacion y pivote de la pantalla) y bombilla
  for (const [x, y] of [[7, 13], [6, 19]] as const) {
    c.rect(x - 1, y - 1, 3, 3, '#f6c768');
    c.px(x, y, '#c08a2e');
    c.px(x - 1, y - 1, '#fff3c4');
  }
  c.rect(11, 4, 2, 2, '#f6c768');
  c.px(12, 5, '#c08a2e');
  const hot = on ? '#fff3c4' : '#c7ced8';
  const mid = on ? '#ffd84a' : '#9aa5b4';
  c.rect(14, 9, 5, 2, mid);
  c.rect(15, 9, 3, 2, hot);
  c.px(15, 11, mid);
  c.px(16, 11, hot);
  c.px(17, 11, mid);
  return c;
}
export const LAMP = cvToDef([lampFrame(true), lampFrame(false)]);

// ---------- Luz de la lampara (48x40, sobrepuesta a pared y mesa): cono calido tramado o penumbra fria ----------
// Frame 0: cono con dithering (Bayer 4x4) que baja desde la pantalla. Frame 1 (apagada): zona mas fria y oscura.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const GLOW_X = 21;
const GLOW_Y0 = 57;
function lampGlowFrame(on: boolean): Cv {
  const c = new Cv(48, 40);
  const oy = 56; // el lienzo empieza en la fila 56 de la escena
  for (let ly = 0; ly < c.h; ly++)
    for (let x = 0; x < c.w; x++) {
      const y = ly + oy;
      if (y >= DESK_FRONT - 4 || y === WALL_H || y === WALL_H + 1) continue; // canto trasero de la mesa y borde delantero intactos
      const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const wall = y < WALL_H;
      if (on) {
        if (y < GLOW_Y0) continue;
        const half = 5 + (y - GLOW_Y0) * 0.62;
        const t = Math.abs(x - GLOW_X) / half;
        if (t >= 1) continue;
        const i = (1 - Math.pow(t, 1.6)) * Math.max(0, 1 - (y - GLOW_Y0) / 32) * (wall ? 0.55 : 0.85);
        if (i > th) c.px(x, ly, wall ? '#f7efcf' : i > 0.5 ? '#f8e3a6' : '#f1cc84');
      } else {
        const d = Math.hypot((x - GLOW_X) / 26, (y - 74) / 16);
        if (d >= 1) continue;
        const i = (1 - d) * 0.4;
        if (i > th) c.px(x, ly, wall ? '#d3ccbf' : '#b79f82');
      }
    }
  return c;
}
export const LAMP_GLOW = cvToDef([lampGlowFrame(true), lampGlowFrame(false)]);

// ---------- Mesa en perspectiva de un punto (144x104): superficie, canto, patas, sombras, lampara, botella, cable y halo frio ----------
function makeDesk(): SpriteDef {
  const c = new Cv(SCENE_W, SCENE_H);
  const by = WALL_H;
  c.rect(0, by, SCENE_W, 40, '#cdbfa6'); // pared en sombra a los lados de la mesa
  c.rect(0, 96, SCENE_W, 8, '#3a2f3a'); // piso
  c.poly([[DESK_BL, by], [DESK_BR, by], [SCENE_W, DESK_FRONT], [0, DESK_FRONT]], (x, y) => ((x * 5 + y * 3) % 41 === 0 && y > 68 ? '#d6a46b' : '#e2b883'));
  // vetas que convergen al punto de fuga (72, 20)
  const k = (by - 20) / (DESK_FRONT - 20);
  for (const fx of [14, 34, 54, 90, 110, 130]) c.line(fx, DESK_FRONT - 1, 72 + (fx - 72) * k, by + 1, '#cf9a62');
  c.line(DESK_BL, by, DESK_BR, by, '#a8723f');
  c.line(DESK_BL, by + 1, DESK_BR, by + 1, '#cf9a62');
  c.line(DESK_BL, by, 0, DESK_FRONT, '#a8723f');
  c.line(DESK_BR, by, SCENE_W, DESK_FRONT, '#a8723f');
  // canto frontal y patas
  c.rect(0, DESK_FRONT, SCENE_W, 1, '#f6f1e4');
  c.rect(0, DESK_FRONT + 1, SCENE_W, 5, '#cf9a62');
  c.rect(0, DESK_FRONT + 1, SCENE_W, 1, '#e2b883');
  c.rect(0, DESK_FRONT + 5, SCENE_W, 1, '#a8723f');
  c.rect(4, DESK_FRONT + 6, 6, 4, '#a8723f');
  c.rect(134, DESK_FRONT + 6, 6, 4, '#a8723f');
  // sombras de 1 px bajo los objetos apoyados
  const shadow = (x: number, baseY: number, w: number): void => {
    for (let i = 0; i < w; i++) c.blend(x + i + 1, baseY, '#6d3f23', 0.55);
    c.blend(x + w + 1, baseY - 1, '#6d3f23', 0.3);
  };
  shadow(7, 69, 11);
  shadow(104, 67, 12);
  shadow(14, 92, 14);
  shadow(118, 75, 18);
  // sombra del teclado
  c.poly(
    KB_POLY.map(([x, y]) => [x + 1, y + 2] as Pt),
    (x, y) => {
      c.blend(x, y, '#6d3f23', 0.45);
      return null;
    },
  );
  // brillo RGB bajo el teclado (borde delantero)
  for (let x = 54; x < 87; x++) {
    c.blend(x, 79, ['#a35cf5', '#ec4bd0', '#3f6dff', '#36e0f0'][Math.floor(x / 4) % 4], 0.5);
    c.blend(x, 80, '#a35cf5', 0.2);
  }
  // halo frio de la pantalla (que esta de este lado) sobre el borde inferior de la mesa
  for (let y = 84; y < 94; y++)
    for (let x = 18; x < 126; x++) {
      const d = Math.abs(x - 72) / 54;
      const e = (y - 83) / 11;
      if ((x + y) % 2 === 0 || y > 90) c.blend(x, y, '#73eff7', 0.15 * (1 - d) * e);
    }
  // botella (atras a la derecha) y cable del router al tomacorriente
  c.spr(104, 37, BOTTLE);
  c.line(136, 61, 136, 69, '#333c57');
  return cvToDef([c]);
}
export const DESK = makeDesk();
export const DESK_SURFACE_H = DESK_FRONT - WALL_H;

// ---------- Mousepad rosado (33x19) ----------
function makeMat(): SpriteDef {
  const c = new Cv(33, 19);
  const local = MAT_POLY.map(([x, y]) => [x - 82, y - 72] as Pt);
  c.poly(local, (x, y) => ((x + y) % 11 === 0 ? '#c9709a' : '#e98fb3'), '#c9709a');
  c.line(1, 1, 27, 3, '#f7b9d0');
  return cvToDef([c]);
}
export const MAT = makeMat();

// ---------- Teclado mecanico 60% rojo y negro en perspectiva (36x16): reposo, mitad izquierda, mitad derecha ----------
function keyboardFrame(pressed: 0 | 1 | 2): Cv {
  const c = new Cv(36, 16);
  c.poly(
    KB_POLY.map(([x, y]) => [x - KB_X, y - KB_Y] as Pt),
    '#10111a',
    '#323650',
  );
  for (let r = 0; r < 5; r++) {
    const y = 2 + r * 2;
    const t = y / 13;
    const L = Math.round(6 - 4 * t) + 2;
    const R = Math.round(30 + 4 * t) - 2;
    for (let x = L; x + 1 <= R; x += 3) {
      const red = x <= L + 2 || x + 4 > R || (r === 4 && x > 12 && x < 24);
      const down = (pressed === 1 && x < 18) || (pressed === 2 && x >= 18);
      const top = red ? (down ? '#8a1b2a' : '#d02e3e') : down ? '#1d2030' : '#4a4d5c';
      const side = red ? (down ? '#5a1019' : '#f0616d') : down ? '#10111a' : '#323650';
      c.px(x, y + (down ? 1 : 0), top);
      c.px(x + 1, y + (down ? 1 : 0), side);
      if (down && r === 2) c.px(x, y - 1, '#73eff7');
    }
  }
  return c;
}
export const KEYBOARD = cvToDef([keyboardFrame(0), keyboardFrame(1), keyboardFrame(2)]);

// ---------- Mouse visto de frente (8x13): los botones y la rueda miran al espectador, inalambrico, sin cable ----------
// La mano derecha del personaje descansa sobre la mitad de arriba (el dorso), asi que solo asoman los botones y el brillo RGB.
const MOUSE_ART = [
  '.000000.',
  '0ffLLLL0',
  '0fLLLLL0',
  '0fLLLLL0',
  '0LLLLLL0',
  '0JJbbJJ0',
  '0fLbbLL0',
  '0fLbbLL0',
  '0LLJJLL0',
  '0LLJJLL0',
  '.0LLLL0.',
  '..0000..',
];
function mouseFrame(glow: string, glow2: string): Cv {
  const c = new Cv(8, 13);
  c.stamp(0, 0, MOUSE_ART, { '0': '#10111a', L: '#4a4d5c', f: '#6a7088', b: '#73eff7', J: '#10111a' });
  for (let x = 1; x < 7; x++) c.px(x, 12, x % 2 ? glow : glow2);
  return c;
}
export const MOUSE = cvToDef([mouseFrame('#a35cf5', '#ec4bd0'), mouseFrame('#ec4bd0', '#3f6dff'), mouseFrame('#3f6dff', '#36e0f0')]);


// ---------- Router wifi negro con 3 antenas y LEDs de actividad (19x14) ----------
function routerFrame(on: boolean): Cv {
  const c = new Cv(19, 14);
  const J = '#10111a';
  // antenas: la central recta y las laterales apenas abiertas, con contorno
  for (const [bx, dx] of [[3, -1], [9, 0], [15, 1]] as const) {
    for (let y = 0; y < 7; y++) {
      const x = bx + (y < 3 ? dx : 0);
      c.px(x - 1, y, J);
      c.px(x + 1, y, J);
      c.px(x, y, y === 0 ? J : '#4a4d5c');
    }
  }
  // carcasa: cara superior inclinada y frente
  c.rect(0, 7, 19, 6, J);
  c.rect(1, 8, 17, 1, '#4a4d5c');
  c.rect(1, 9, 17, 3, '#1d2030');
  c.rect(1, 9, 17, 1, '#323650');
  // LEDs: power verde fijo, actividad cian alternada
  const dim = '#2a4a5a';
  c.px(2, 10, '#a7f070');
  c.px(4, 10, on ? '#73eff7' : dim);
  c.px(6, 10, on ? dim : '#73eff7');
  c.px(8, 10, on ? '#73eff7' : dim);
  // puertos
  for (const x of [11, 13, 15]) c.rect(x, 10, 2, 1, J);
  // sombra de 1 px sobre la mesa
  c.rect(1, 13, 18, 1, '#a8723f');
  return c;
}
export const ROUTER = cvToDef([routerFrame(true), routerFrame(false)]);

// ---------- Sobre de CV (16x12) ----------
function makeEnvelope(): SpriteDef {
  const g = grid(16, 12);
  rect(g, 1, 1, 14, 10, 'c');
  rect(g, 1, 10, 14, 1, 'd');
  line(g, 1, 1, 7, 6, 'd');
  line(g, 14, 1, 8, 6, 'd');
  line(g, 1, 10, 6, 6, 'd');
  line(g, 14, 10, 9, 6, 'd');
  rect(g, 7, 5, 2, 2, '2');
  outline(g);
  return make(g);
}
export const ENVELOPE = makeEnvelope();

/**
 * Posiciones (px logicos) de cada pieza dentro de la escena de 144x104, vista de frente.
 * La superficie del escritorio empieza en y = 68 (= character.y + CHAR_DESK_ROW): el torso queda sobre
 * el borde y las manos se apoyan en el teclado. Piso desde y = 96.
 * Orden de capas: pared, posters, silla, escritorio, mat, piezas del escritorio, teclado, mouse, personaje.
 */
export const LAYOUT = {
  /** fondo fijo: pared, estanteria con libros/perfume/parlante y tomacorriente (144x104) */
  back: { x: 0, y: 0 },
  chair: { x: 52, y: 38 },
  /** mesa en perspectiva con lampara, botella, cable, sombras y halo frio (144x104, transparente arriba) */
  desk: { x: 0, y: 0 },
  mat: { x: 82, y: 72 },
  router: { x: 118, y: 62 },
  mug: { x: 14, y: 80 },
  steam: { x: 15, y: 67 },
  /** teclado 60% rojo/negro en perspectiva, justo bajo el torso */
  keyboard: { x: 52, y: 65 },
  /** mouse con brillo RGB, pegado al borde derecho del teclado, a la altura de la mano derecha */
  mouse: { x: 86, y: 72 },
  /** el personaje de frente: su fila CHAR_DESK_ROW (29) cae en el borde trasero de la mesa (y = 64) */
  character: { x: 54, y: 35 },
  /** cabeza y cara del personaje en coordenadas de escena (pelo, lentes, boca y menton) */
  face: { x: 60, y: 39, w: 24, h: 17 },
  /** lampara articulada (26x24) y su luz (48x40) sobrepuesta a pared y mesa; el parlante en la estanteria */
  lamp: { x: 5, y: 45 },
  lampGlow: { x: 0, y: 56 },
  speaker: { x: 36, y: 29 },
  /** el barril del evento reposa en el piso, a la derecha */
  barrelEvent: { x: 118, y: 76 },
  /** borde del precipicio: su tope queda a la altura de los pies del personaje */
  ledge: { x: 0, y: 73 },
  posters: [
    { x: 10, y: 2 },
    { x: 42, y: 2 },
    { x: 74, y: 2 },
    { x: 106, y: 2 },
  ],
} as const;

// ---------- Precipicio pixel (80x30) para la animación de prestigio ----------
function makeCliff(): SpriteDef {
  const g = grid(80, 30);
  for (let y = 0; y < 30; y++) {
    // el borde se va metiendo hacia adentro (voladizo desmoronado)
    const edge = 76 - Math.floor(y * 0.55) + Math.round(Math.sin(y * 1.3) * 2);
    for (let x = 0; x < edge; x++) {
      let c = y < 2 ? '6' : y < 4 ? '7' : 'e';
      if (y >= 4) {
        const n = (x * 7 + y * 13) % 11;
        if (n === 0) c = 'd';
        else if (n === 5) c = 'f';
        else if (n === 8 && y > 8) c = 'f';
      }
      g[y][x] = c;
    }
    if (y < 2) for (let x = Math.max(0, edge - 4); x < edge; x += 2) g[y + 1][x] = '5';
  }
  // grietas
  for (const [x0, y0, x1, y1] of [[60, 6, 56, 14], [40, 8, 44, 18], [20, 5, 18, 12]] as const) line(g, x0, y0, x1, y1, 'f');
  outline(g, 'f');
  return make(g);
}
export const CLIFF = makeCliff();
