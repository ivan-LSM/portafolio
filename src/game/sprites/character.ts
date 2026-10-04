/**
 * PERSONAJE: Iván chibi, de frente, sentado tras el escritorio (estilo Game Dev Tycoon / Bongo Cat), 42x43.
 *
 * Todo el arte esta dibujado a mano, pixel por pixel, en matrices de strings (cabeza, parches de
 * cara, ropa, brazos, audifonos, gota). Las funciones de abajo solo apilan esas capas.
 *
 * Contrato para la escena:
 *   - El torso termina en la fila CHAR_DESK_ROW (las piernas no existen, quedan tras el escritorio).
 *   - Desde CHAR_DESK_ROW hacia abajo solo hay antebrazos y manos (patas estilo Bongo Cat: mangas
 *     gruesas que bajan rectas desde cada hombro, manos de mitón), que se dibujan sobre la mesa.
 *     El cuerpo queda quieto: solo se mueven las patas (una arriba, otra abajo).
 *   - CHAR_CX es la columna central de la cara.
 *
 *   getCharacter(seniority, frame)  -> SpriteDef de un solo frame (con cache)
 *   getCharacterSheet(seniority)    -> SpriteDef con todos los frames (CHAR_FRAMES, en ese orden)
 */
import { grid, stamp, toRows, type Grid, type SpriteDef } from './gen';

export const CHAR_W = 42;
export const CHAR_H = 43;
/** Fila (dentro del sprite) donde termina el torso y empiezan antebrazos y manos sobre el escritorio. */
export const CHAR_DESK_ROW = 29;
/** Columna central de la cara dentro del sprite. */
export const CHAR_CX = 18;

export const CHAR_FRAMES = [
  'typing0',
  'typing1',
  'idle0',
  'idle1',
  'happy',
  'shock',
  'spiral',
  'swayL',
  'swayR',
  'fall0',
  'fall1',
  'sip',
] as const;
export type CharFrame = (typeof CHAR_FRAMES)[number];

// ---------- Paleta ----------
const BASE_PALETTE: Record<string, string> = {
  '0': '#1a1c2c', // contorno
  h: '#231a22', // pelo
  H: '#3d2c31', // pelo, flequillo
  L: '#6e5459', // pelo, brillo
  s: '#e8b088', // piel
  S: '#c48660', // piel, sombra
  k: '#e8907a', // mejilla
  g: '#b8c4cf', // marco de los lentes
  q: '#f3dcc4', // lente
  e: '#e6ecf2', // aro plateado / ojo abierto
  w: '#f8f8f8', // dientes, blanco
  m: '#7a2a34', // boca
  d: '#a9b7c4', // sombra de los audifonos
  b: '#73eff7', // brillo de codigo (cian)
  n: '#a7f070', // brillo de codigo (verde)
  a: '#41a6f6', // gota de sudor
  r: '#c8404f', // guante
  R: '#ef6a6a', // guante, brillo
};

interface Outfit {
  o: string; // tela principal
  O: string; // tela, luz
  p: string; // tela, sombra
  c: string; // puno de la manga
  z: string;
  Z: string;
  y: string;
  Y: string;
  u: string;
  U: string;
}
const OUTFITS: Outfit[] = [
  // 0 Junior: poleron verde oliva con cierre
  { o: '#5f6e3b', O: '#7d8e4c', p: '#434f2a', c: '#434f2a', z: '#d9dde0', Z: '#8a949b', y: '#d9dde0', Y: '#8a949b', u: '#5f6e3b', U: '#434f2a' },
  // 1 Semi Senior: polo negra con cuello y botones
  { o: '#25262f', O: '#4a4d5e', p: '#15161c', c: '#4a4d5e', z: '#454859', Z: '#8b93a1', y: '#f4f4f4', Y: '#f4f4f4', u: '#25262f', U: '#15161c' },
  // 2 Senior: chaqueta camel abierta sobre polo negra
  { o: '#b98b55', O: '#d6aa6c', p: '#8c6338', c: '#8c6338', z: '#d6aa6c', Z: '#8c6338', y: '#f4f4f4', Y: '#f4f4f4', u: '#2a2c3a', U: '#454859' },
  // 3 Tech Lead: parka azul marino, bufanda beige
  { o: '#2d4073', O: '#43599a', p: '#1f2c52', c: '#1f2c52', z: '#e4d3ae', Z: '#bda57a', y: '#aeb6c0', Y: '#7d8590', u: '#2d4073', U: '#1f2c52' },
  // 4 CTO: camisa a rayas verticales cafe y crema
  { o: '#eadcbf', O: '#f6ecd6', p: '#c9b68f', c: '#7b5236', z: '#f6ecd6', Z: '#c9b68f', y: '#7b5236', Y: '#5a3a24', u: '#eadcbf', U: '#c9b68f' },
];

function paletteFor(level: number): Record<string, string> {
  return { ...BASE_PALETTE, ...OUTFITS[level] };
}

// ---------- Cabeza (24 de ancho, filas 0..15: pelo, cara y barbilla) ----------
// Pelo muy oscuro, ondulado, tipo cortina con raya al medio; lentes finos plateados;
// argolla plateada en la oreja izquierda; piel trigueña clara.
const HEAD: string[] = [
  '........00000000........',
  '......00hLhhhhLh00......',
  '.....0hhLLhHHhLLhh0.....',
  '....0hLhhhHssHhhhLh0....',
  '...0hhLhhHHssHHhhLhh0...',
  '..0hhLhHHHssssHHHhLhh0..',
  '.0hhLhhhHHssssHHhhhLhh0.',
  '.0hLhhhHssssssssHhhhLh0.',
  '.0hhhHssssssssssssHhhh0.',
  '.0hLhssgggssssgggsshLh0.',
  '.0hhHsgq0qggggq0qgsHhh0.',
  '.0hHhsgq0qgssgq0qgshHh0.',
  '0hhhSssgggssssgggssShhh0',
  '0h0eSskssmwwwwmssksS0h0.',
  '.0e0SsssssmmmmsssssS00..',
  '.....0SsssssssssS0......',
];

// Parches de cara. Los ojos ocupan las filas 10-11 (columnas 6..17); la ceja de la fila 9
// y la boca las filas 13-14 (columnas 6..17). Ningun parche usa '.', asi que reemplazan todo.
const EYES = {
  open: ['sgggssssgggs', 'gq0qggggq0qg', 'gq0qgssgq0qg'],
  // concentrado: mira hacia abajo, con el reflejo del codigo en los lentes
  typeA: ['sgggssssgggs', 'gbqqggggqqng', 'gq0qgssgq0qg'],
  typeB: ['sgggssssgggs', 'gqqbggggnqqg', 'gq0qgssgq0qg'],
  blink: ['sgggssssgggs', 'gqqqggggqqqg', 'g000gssg000g'],
  happy: ['sgggssssgggs', 'gq0qggggq0qg', 'g0q0gssg0q0g'],
  shock: ['sgggssssgggs', 'geeeggggeeeg', 'ge0egssge0eg'],
  // ojos en espiral: una X oscura sobre blanco, de 3x3, que tapa el borde superior del lente
  spiral: ['s0e0ssss0e0s', 'ge0egggge0eg', 'g0e0gssg0e0g'],
  // determinado (guardia de boxeo): cejas inclinadas hacia adentro
  fierce: ['sgghsssshggs', 'gq0qggggq0qg', 'gq0qgssgq0qg'],
} as const;
const MOUTH = {
  soft: ['kssmssssmssk', 'ssssmmmmssss'],
  focus: ['kssssssssssk', 'sssssmmsssss'],
  big: ['kksmwwwwmskk', 'ssssmmmmssss'],
  o: ['kssssmmssssk', 'sssssmmsssss'],
  wavy: ['kssmmssmmssk', 'sssssmmsssss'],
  grit: ['kssmmmmmmssk', 'sssssmmmsss' + 's'],
  scream: ['kssmwwwwmssk', 'sssmmmmmmsss'],
} as const;

// Pelo levantado (caida del prestigio): reemplaza el tope de la cabeza (filas -4..2).
const HAIR_UP: string[] = [
  '.......0..0..0..0.......',
  '......0h00h00h00h0......',
  '......0hLhhhhhhLh0......',
  '.....0hhLhhhhhhLhh0.....',
  '....0hhhLhhhhhhLhhh0....',
  '....0hhLhhhhhhhhLhh0....',
  '....0hhLLhhhhhhLLhh0....',
];

// ---------- Ropa (filas 16..24 de la cabeza; la fila 25 es CHAR_DESK_ROW) ----------
const NECK = '......000ssssss000......';
/** Torso (filas 19..24): contorno + 14 de interior + contorno. */
const T = (inner: string): string => '....0' + inner + '0....';

const BODY: string[][] = [
  // 0 Junior: poleron con capucha, cierre al centro y cordones
  [
    NECK,
    '...00OOOOpSSSSpOOOO00...',
    '..0oOOOOOppssppOOOOOo0..',
    T('ppoowozZowoopp'),
    T('oooowozZowoooo'),
    T('oooowozZowoooo'),
    T('ooooZozZoZoooo'),
    T('pOOOOOzZOOOOOp'),
    T('pooooozZooooop'),
  ],
  // 1 Semi Senior: polo con cuello y botones
  [
    NECK,
    '...00OOzzzSSSSzzzOO00...',
    '..0ooOzzzzzsszzzzzOoo0..',
    T('pOooooZZooooOp'),
    T('pOooooZwooooOp'),
    T('pOooooZZooooOp'),
    T('pOooooZwooooOp'),
    T('pOooooZZooooOp'),
    T('pOooooZZooooOp'),
  ],
  // 2 Senior: chaqueta camel abierta sobre polo negra
  [
    NECK,
    '...00ooOOOSSSSOOOoo00...',
    '..0ooOOOOOpuupOOOOOoo0..',
    T('pooopuUUupooop'),
    T('pooopuUUupooop'),
    T('pooopuUUupooop'),
    T('pOOOpuUUupOOOp'),
    T('pooopuuuupooop'),
    T('pooopuuuupooop'),
  ],
  // 3 Tech Lead: parka con bufanda beige enrollada y cola colgando
  [
    NECK,
    '...00oozzZzzzzZzzoo00...',
    '..0ooOzZzzzzzzzzZzOoo0..',
    T('ooZZZZZZZZZZoo'),
    T('ooozZzypoooooo'),
    T('ooozZzypoooooo'),
    T('ooozZzypoooooo'),
    T('oooZoZypoOOOop'),
    T('poooooypooooop'),
  ],
  // 4 CTO: camisa a rayas verticales con cuello y botones
  [
    NECK,
    '...00oyOOOSSSSOOOyo00...',
    '..0oooOOOOpsspOOOOooo0..',
    T('oyooyoOOoyooyo'),
    T('oyooyoyOoyooyo'),
    T('oyooyoOOoyooyo'),
    T('oyooyoyOoyooyo'),
    T('oyooyoOOoyooyo'),
    T('oyooyoOOoyooyo'),
  ],
];

// ---------- Audifonos blancos (Tech Lead): mitad izquierda, 14 de ancho; se refleja ----------
// Columna c de la capa = columna de cabeza c-2. Filas -2..15 de la cabeza.
const HP_HALF: string[] = [
  '..........0000',
  '........00wwww',
  '.......0ww....',
  '......0w......',
  '.....0w.......',
  '....0w........',
  '...0w.........',
  '..0w..........',
  '.0w...........',
  '.0w...........',
  '.0w...........',
  '..0000........',
  '.0wwwd0.......',
  '.0wwwd0.......',
  '.0wwdd0.......',
  '.0wwdd0.......',
  '.0wddd0.......',
  '..0000........',
];
const mirror = (rows: readonly string[]): string[] => rows.map((r) => [...r].reverse().join(''));
const HEADPHONES: string[] = HP_HALF.map((r, i) => r + mirror(HP_HALF)[i]);

// ---------- Gota de sudor (rechazo) ----------
const DROP: string[] = ['..0..', '.0a0.', '0waa0', '0aaa0', '.000.'];

// ---------- Brazos (mitad izquierda; la derecha es el espejo) ----------
interface Arm {
  /** Filas de la cabeza donde empieza el dibujo. */
  row: number;
  /** Columna de cabeza donde cae la columna 0 del dibujo (puede ser negativa). */
  col: number;
  art: string[];
}

// Brazo apoyado: antebrazo en diagonal hacia el teclado, mano baja con dedos marcados.
const ARM_DOWN: Arm = {
  row: 19,
  col: 0,
  art: [
    '.0oOp.......',
    '.0oOp.......',
    '0ooOp.......',
    '0ooOp.......',
    '0ooOp.......',
    '0ooOp.......',
    '0ooOp0......',
    '.0oOp000000.',
    '..0cc0sSsSs0',
    '...000sssss0',
    '......00000.',
  ],
};
// Brazo tipeando: la mano queda dos filas mas arriba que la de reposo.
const ARM_UP: Arm = {
  row: 19,
  col: 0,
  art: [
    '.0oOp.......',
    '.0oOp.......',
    '0ooOp.......',
    '0ooOp.......',
    '0ooOp0......',
    '.0oOp000000.',
    '..0cc0sSsSs0',
    '...000sssss0',
    '......00000.',
    '............',
    '............',
  ],
};
// Guardia de boxeo: guantes rojos junto a las mejillas, antebrazos al frente, codos en el escritorio.
const ARM_GUARD: Arm = {
  row: 15,
  col: 3,
  art: [
    '.0000.......',
    '0RRrr0......',
    '0Rrrr0......',
    '0rrrr0......',
    '0rrrr0......',
    '0cccc0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '.0000.......',
  ],
};
// Brazo arriba (caida y festejo): antebrazo vertical junto a la cabeza, punio cerrado.
const ARM_RAISED: Arm = {
  row: 1,
  col: -5,
  art: [
    '.0000.......',
    '0sSsS0......',
    '0ssss0......',
    '0sssS0......',
    '.0000.......',
    '0cccc0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOpooooo0.',
    '.0000000000.',
  ],
};

// Sorbo de cafe: el antebrazo derecho sube junto a la cara con el puno cerrado; la taza se estampa aparte (SIP_MUG).
const ARM_SIP: Arm = {
  row: 13,
  col: -3,
  art: [
    '.0000.......',
    '0sSsS0......',
    '0ssss0......',
    '0sssS0......',
    '.0000.......',
    '0cccc0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOp0......',
    '0ooOpooooo0.',
    '.0000000000.',
  ],
};
// Taza chica vista de frente (9x6, el asa queda a la derecha), a la altura del menton para dejar los ojos y la boca a la vista.
const SIP_MUG: string[] = [
  '.00000...',
  '0wHHHw0..',
  '0wwwwd000',
  '0wewwd0w0',
  '0wwwdd000',
  '.00000...',
];
const SIP_MUG_X = 20;
const SIP_MUG_Y = 16;

// ---------- Patas estilo Bongo Cat (capa nueva que reemplaza los antebrazos del v4) ----------
// Origen del brazo izquierdo: columna 4, fila 29 (CHAR_DESK_ROW). La manga mide 5 px de interior con contorno
// solido; la mano es un miton redondeado de 9x7 con dedos insinuados y sombra S. El derecho es el espejo.
// 'oOoop' es la manga (se cambia por rayas en el atuendo del CTO); 'c' es el puno de cada atuendo.
const PAW_DOWN: string[] = [
  '.0oOoop0.',
  '.0oOoop0.',
  '.0oOoop0.',
  '.0oOoop0.',
  '.0oOoop0.',
  '.0oOoop0.',
  '.0ccccc0.',
  '.0sssss0.',
  '0sssssss0',
  '0ssSssSs0',
  '0ssSssSs0',
  '.0SSSSS0.',
  '..00000..',
];
const PAW_UP: string[] = [
  '.0oOoop0.',
  '.0ccccc0.',
  '.0sssss0.',
  '0sssssss0',
  '0ssssssS0',
  '0sssssss0',
  '0ssSssSs0',
  '0ssSssSs0',
  '.0SSSSS0.',
  '..00000..',
];
// Brazo derecho de reposo: baja desde el hombro con una diagonal corta hacia afuera y apoya la mano en el mouse.
const PAW_MOUSE: string[] = [
  '0poOoo0..........',
  '0poOoo0..........',
  '.0poOoo0.........',
  '..0poOoo0........',
  '...0poOoo0.......',
  '....0poOoo0......',
  '.....0ccccc0.....',
  '.....0sssss0.....',
  '....0sssssss0....',
  '....0ssSssSs0....',
  '....0ssSssSs0....',
  '....0sssssss0....',
  '.....0SSSSS0.....',
  '......00000......',
];
const PAW_COL = 4;
const PAW_ROW = CHAR_DESK_ROW;
const PAW_MOUSE_COL = 24;
// arranque del brazo (hombro y manga hasta la fila 28), tomado del brazo en reposo del v4
const ARM_STUB: Arm = { row: 19, col: 0, art: ARM_DOWN.art.slice(0, 6) };

type Paw = 'down' | 'up' | 'mouse';
type Limb = Arm | Paw;

/** Atuendo del CTO: la manga lleva las rayas cafe y crema de la camisa. */
function sleeve(art: string[], level: number): string[] {
  if (level !== 4) return art;
  return art.map((r) => r.replace('oOoop', 'oyoyp').replace('poOoo', 'pyoyo'));
}
function pawArt(kind: Paw, level: number): string[] {
  return sleeve(kind === 'down' ? PAW_DOWN : kind === 'up' ? PAW_UP : PAW_MOUSE, level);
}

// ---------- Composicion ----------
interface Pose {
  eyes: readonly [string, string, string];
  mouth: readonly [string, string];
  left: Limb;
  right: Limb;
  dx?: number;
  hairUp?: boolean;
  drop?: boolean;
  /** Respiracion: cabeza y hombros bajan 1 px (el torso se comprime). */
  bob?: boolean;
  /** Sorbo de cafe: la taza queda frente a la boca. */
  mug?: boolean;
}

const POSES: Record<CharFrame, Pose> = {
  // tecleo: una pata arriba y otra abajo, alternando
  typing0: { eyes: EYES.typeA, mouth: MOUTH.focus, left: 'up', right: 'down' },
  typing1: { eyes: EYES.typeB, mouth: MOUTH.focus, left: 'down', right: 'up' },
  // reposo: la izquierda en el teclado y la derecha en el mouse
  idle0: { eyes: EYES.open, mouth: MOUTH.soft, left: 'down', right: 'mouse' },
  idle1: { bob: true, eyes: EYES.blink, mouth: MOUTH.soft, left: 'down', right: 'mouse' },
  // feliz: una pata en alto (puno) y la otra en el teclado
  happy: { eyes: EYES.happy, mouth: MOUTH.big, left: 'down', right: ARM_RAISED },
  // shock: las dos patas levantadas a los lados, con la gota de sudor
  shock: { eyes: EYES.shock, mouth: MOUTH.o, left: ARM_RAISED, right: ARM_RAISED, drop: true },
  // espiral (prueba tecnica): las dos patas flojas sobre el teclado
  spiral: { eyes: EYES.spiral, mouth: MOUTH.wavy, left: 'down', right: 'down' },
  swayL: { eyes: EYES.fierce, mouth: MOUTH.grit, left: ARM_GUARD, right: ARM_GUARD, dx: -3 },
  swayR: { eyes: EYES.fierce, mouth: MOUTH.grit, left: ARM_GUARD, right: ARM_GUARD, dx: 3 },
  fall0: { eyes: EYES.shock, mouth: MOUTH.scream, left: ARM_RAISED, right: ARM_RAISED },
  fall1: { eyes: EYES.shock, mouth: MOUTH.scream, left: ARM_RAISED, right: ARM_RAISED, hairUp: true },
  // sorbito: ojos contentos, la pata derecha sube con la taza a la boca y la izquierda sigue en el teclado
  sip: { eyes: EYES.happy, mouth: MOUTH.focus, left: 'down', right: ARM_SIP, mug: true },
};

const HEAD_X = 6;
const HEAD_Y = 4;

function stampArm(g: Grid, ox: number, oy: number, side: 'left' | 'right', arm: Arm): void {
  if (side === 'left') stamp(g, ox + arm.col, oy + arm.row, arm.art);
  else stamp(g, ox + 24 - arm.art[0].length - arm.col, oy + arm.row, mirror(arm.art));
}

/** Un brazo completo: arranque del hombro + pata (o el brazo del v4 para guardia, festejo y caida). */
function stampLimb(g: Grid, ox: number, side: 'left' | 'right', limb: Limb, level: number): void {
  if (typeof limb !== 'string') {
    stampArm(g, ox, HEAD_Y, side, limb);
    return;
  }
  stampArm(g, ox, HEAD_Y, side, ARM_STUB);
  const art = pawArt(limb, level);
  if (side === 'left') stamp(g, PAW_COL, PAW_ROW, art);
  else if (limb === 'mouse') stamp(g, PAW_MOUSE_COL, PAW_ROW, art);
  else stamp(g, 35 - PAW_COL - art[0].length + 1, PAW_ROW, mirror(art));
}

function buildFrame(level: number, pose: Pose): string[] {
  const g = grid(CHAR_W, CHAR_H);
  const ox = HEAD_X + (pose.dx ?? 0);
  const oy = HEAD_Y + (pose.bob ? 1 : 0);
  stamp(g, ox, oy, HEAD);
  if (pose.hairUp && level !== 3) stamp(g, ox, oy - 4, HAIR_UP);
  stamp(g, ox + 6, oy + 9, [...pose.eyes]);
  stamp(g, ox + 6, oy + 13, [...pose.mouth]);
  stamp(g, ox, oy + 16, pose.bob ? BODY[level].filter((_, i) => i !== 5) : BODY[level]);
  // los audifonos salen volando un par de pixeles en el frame de caida con pelo levantado
  if (level === 3) stamp(g, ox - 2, oy - 2 - (pose.hairUp ? 2 : 0), HEADPHONES);
  stampLimb(g, ox, 'left', pose.left, level);
  stampLimb(g, ox, 'right', pose.right, level);
  if (pose.mug) stamp(g, SIP_MUG_X, SIP_MUG_Y, SIP_MUG);
  if (pose.drop) stamp(g, ox + (level === 3 ? 25 : 23), oy + (level === 3 ? 9 : 6), DROP);
  return toRows(g);
}

function assertShape(): void {
  const chk = (name: string, rows: readonly string[], w: number): void => {
    rows.forEach((r, i) => {
      if (r.length !== w) throw new Error(`character.ts: ${name} fila ${i} mide ${r.length}, se esperaba ${w}`);
    });
  };
  chk('HEAD', HEAD, 24);
  chk('HAIR_UP', HAIR_UP, 24);
  chk('HEADPHONES', HEADPHONES, 28);
  BODY.forEach((b, i) => {
    if (b.length !== 9) throw new Error(`character.ts: BODY ${i} tiene ${b.length} filas`);
    chk(`BODY ${i}`, b, 24);
  });
  for (const [k, v] of Object.entries(EYES)) chk(`EYES ${k}`, v, 12);
  for (const [k, v] of Object.entries(MOUTH)) chk(`MOUTH ${k}`, v, 12);
  for (const [k, a] of Object.entries({ ARM_DOWN, ARM_UP, ARM_GUARD })) chk(k, a.art, 12);
  chk('ARM_RAISED', ARM_RAISED.art, 12);
  chk('ARM_SIP', ARM_SIP.art, 12);
  chk('SIP_MUG', SIP_MUG, 9);
  chk('DROP', DROP, 5);
}
assertShape();

const sheetCache = new Map<number, SpriteDef>();
const frameCache = new Map<string, SpriteDef>();

const clampLevel = (n: number): number => Math.max(0, Math.min(4, Math.trunc(Number.isFinite(n) ? n : 0)));

/** Todos los frames (en el orden de CHAR_FRAMES) para un nivel de seniority 0..4. */
export function getCharacterSheet(seniority: number): SpriteDef {
  const lvl = clampLevel(seniority);
  let d = sheetCache.get(lvl);
  if (!d) {
    d = { w: CHAR_W, h: CHAR_H, frames: CHAR_FRAMES.map((f) => buildFrame(lvl, POSES[f])), palette: paletteFor(lvl) };
    sheetCache.set(lvl, d);
  }
  return d;
}

/** Un solo frame del personaje (por nombre o por indice, que da la vuelta). */
export function getCharacter(seniority: number, frame: CharFrame | number = 'idle0'): SpriteDef {
  const lvl = clampLevel(seniority);
  const n = CHAR_FRAMES.length;
  const idx = typeof frame === 'number' ? ((frame % n) + n) % n : Math.max(0, CHAR_FRAMES.indexOf(frame));
  const key = `${lvl}:${idx}`;
  let d = frameCache.get(key);
  if (!d) {
    const sheet = getCharacterSheet(lvl);
    d = { w: CHAR_W, h: CHAR_H, frames: [sheet.frames[idx]], palette: sheet.palette };
    frameCache.set(key, d);
  }
  return d;
}

export const CHARACTER: SpriteDef = getCharacterSheet(0);
