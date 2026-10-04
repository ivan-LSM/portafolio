import { ellipse, grid, line, outline, put, rect, sprite, stamp, type Grid, type SpriteDef } from './gen';
import { SCENE_PALETTE } from './scene';

/**
 * Cuatro pósters de pared (20x26): homenajes hechos con iconografía propia
 * (siluetas, objetos, colores y frases); ninguno reproduce un personaje.
 * Cada póster = marco de 1 px + borde de papel + arte de 16x22.
 */
export const POSTER_W = 20;
export const POSTER_H = 26;
export type PosterId = 'jojo' | 'joseph' | 'ippo' | 'gragas';
export const POSTER_IDS: PosterId[] = ['jojo', 'joseph', 'ippo', 'gragas'];

const AW = 16;
const AH = 22;

function frame(art: Grid): SpriteDef {
  const g = grid(POSTER_W, POSTER_H);
  rect(g, 0, 0, POSTER_W, POSTER_H, 'K'); // marco
  rect(g, 1, 1, POSTER_W - 2, POSTER_H - 2, 'F'); // papel
  // sombreado del papel: sombra abajo/derecha, luz arriba/izquierda
  rect(g, 1, POSTER_H - 2, POSTER_W - 2, 1, 't');
  rect(g, POSTER_W - 2, 1, 1, POSTER_H - 2, 't');
  put(g, 1, 1, 'c');
  put(g, 2, 1, 'c');
  stamp(g, 2, 2, art.map((r) => r.join('')));
  // esquina levemente curvada
  put(g, POSTER_W - 2, POSTER_H - 2, 'd');
  return { ...sprite(g), palette: SCENE_PALETTE };
}

const art = () => grid(AW, AH);

/** 「ゴ」 en píxeles (6x5): コ + dakuten. */
export function goGlyph(g: Grid, x: number, y: number, c: string): void {
  for (let i = 0; i < 4; i++) {
    put(g, x + i, y + 1, c);
    put(g, x + i, y + 4, c);
  }
  put(g, x + 3, y + 2, c);
  put(g, x + 3, y + 3, c);
  put(g, x + 4, y, c);
  put(g, x + 5, y + 1, c);
  put(g, x + 5, y, c);
}

// ---------- 1) JoJo: silueta dramática + 「ゴゴゴ」 ----------
function jojo(): SpriteDef {
  const g = art();
  const bands = ['k', 'k', 'g', 'g', 'g', 'l', 'l', 'l', 'h', 'h', 'h', 'l', 'l', 'h', 'h', 'l', 'g', 'g', 'k', 'k', 'k', 'k'];
  bands.forEach((c, y) => rect(g, 0, y, AW, 1, c));
  // rayas de "energía" detrás
  for (let i = 0; i < 6; i++) line(g, 8, 11, 8 + Math.round(Math.cos(i * 1.05) * 12), 11 + Math.round(Math.sin(i * 1.05) * 12), i % 2 ? 'l' : 'o');
  goGlyph(g, 0, 0, 'x');
  goGlyph(g, 10, 5, 'x');
  goGlyph(g, 0, 10, 'x');
  goGlyph(g, 10, 15, 'x');
  stamp(
    g,
    3,
    3,
    [
      '..#.#.#...',
      '.#######..',
      '..#####...',
      '..#####...',
      '...###....',
      '..#####...',
      '.#######..',
      '##.###.##.',
      '#..###..##',
      '#..###...#',
      '...####...',
      '...####...',
      '..##.###..',
      '..##..##..',
      '.##...###.',
      '.##....##.',
      '##.....###',
    ].map((r) => r.replaceAll('#', 'J')),
  );
  return frame(g);
}

// ---------- 2) Homenaje a Joseph: atardecer, bufanda y gorra ----------
function joseph(): SpriteDef {
  const g = art();
  const bands = ['o', 'o', 'o', 'n', 'n', 'n', 'n', 'm', 'm', 'm', 'm', 'p', 'p', 'p', 'm', 'k', 'k', 'k', 'k', 'k', 'k', 'k'];
  bands.forEach((c, y) => rect(g, 0, y, AW, 1, c));
  ellipse(g, 11, 10, 4.5, 4, 'p');
  rect(g, 0, 14, AW, 8, 'k');
  // colinas
  for (let x = 0; x < AW; x++) {
    const h = 14 + Math.round(Math.sin(x / 2.5) * 1.2);
    rect(g, x, h, 1, AH - h, 'k');
  }
  // busto de espaldas con gorra (solo silueta, sin cara)
  ellipse(g, 6.5, 10, 3.2, 3.4, 'J');
  ellipse(g, 6.5, 19, 6.5, 5, 'J');
  rect(g, 5, 11, 3, 4, 'J');
  stamp(g, 2, 5, ['..JJJJJ...', '.JJJJJJJ..', 'JJJJJJJJJJ'].map((r) => r.replaceAll('J', 'J')));
  rect(g, 9, 8, 3, 1, 'J');
  // bufanda ondeando
  const scarf: [number, number][] = [[8, 13], [9, 13], [10, 12], [11, 12], [12, 11], [13, 11], [14, 10], [15, 10]];
  for (const [x, y] of scarf) {
    put(g, x, y, 'v');
    put(g, x, y + 1, 'v');
    put(g, x, y + 2, 'w');
  }
  put(g, 6, 14, 'v');
  put(g, 7, 14, 'v');
  put(g, 6, 15, 'w');
  put(g, 7, 15, 'w');
  // "Tu siguiente línea será…" (garabatos de texto)
  for (const [x, y, w] of [[2, 19, 5], [8, 19, 4], [2, 21, 3], [6, 21, 6]] as const) rect(g, x, y, w, 1, 'y');
  return frame(g);
}

// ---------- 3) Homenaje a Hajime no Ippo: guantes rojos y estela ∞ ----------
function ippo(): SpriteDef {
  const g = art();
  for (let y = 0; y < AH; y++) rect(g, 0, y, AW, 1, y < 8 ? 'f' : y < 15 ? '8' : 'f');
  // estela ∞ pálida (dos pasadas para que se vea como estela de movimiento)
  for (let i = 0; i < 90; i++) {
    const t = (i / 90) * Math.PI * 2;
    const x = Math.round(7.5 + 7.4 * Math.sin(t));
    const y = Math.round(16 + 4 * Math.sin(2 * t));
    put(g, x, y, i % 3 === 0 ? 'u' : 'b');
    if (i % 2 === 0) put(g, x, y + 1, 'a');
  }
  // clavo + cordones
  put(g, 8, 0, 'd');
  put(g, 7, 0, 'd');
  line(g, 7, 1, 4, 4, 'd');
  line(g, 8, 1, 11, 4, 'd');
  // guantes colgando
  const glove = (x: number, y: number) => {
    rect(g, x, y + 2, 6, 5, 'Q');
    rect(g, x + 1, y, 4, 3, 'Q');
    rect(g, x + 1, y + 2, 2, 3, 'S');
    rect(g, x + 4, y + 3, 2, 4, 'R');
    rect(g, x, y + 7, 6, 2, 'c');
    rect(g, x, y + 8, 6, 1, 'd');
    put(g, x + 6, y + 4, 'Q');
    put(g, x + 6, y + 5, 'R');
    put(g, x - 1, y + 3, 'Q');
    put(g, x - 1, y + 4, 'Q');
  };
  glove(2, 4);
  glove(9, 5);
  return frame(g);
}

// ---------- 4) Homenaje a Gragas: barril con espuma en una taberna ----------
function gragas(): SpriteDef {
  const g = art();
  rect(g, 0, 0, AW, AH, 'r');
  for (let x = 0; x < AW; x += 4) rect(g, x, 0, 1, AH, 'q');
  rect(g, 0, 17, AW, 5, 'q');
  rect(g, 0, 17, AW, 1, 's');
  // resplandor cálido
  ellipse(g, 8, 8, 7, 5, 's');
  // barril
  ellipse(g, 8, 12, 6, 5.6, 'Y');
  rect(g, 2, 8, 12, 9, 'Y');
  for (const y of [9, 15]) rect(g, 2, y, 12, 1, 'z');
  for (const x of [5, 8, 11]) rect(g, x, 8, 1, 9, 'Z');
  rect(g, 3, 8, 1, 9, 'S');
  rect(g, 2, 17, 12, 1, 'Z');
  // espuma desbordando
  rect(g, 3, 5, 10, 3, 'X');
  rect(g, 5, 3, 6, 2, 'X');
  for (const [x, y] of [[2, 7], [3, 8], [3, 9], [13, 7], [13, 8], [12, 9], [9, 8], [9, 9], [6, 8]] as const) put(g, x, y, 'X');
  for (const [x, y] of [[4, 2], [8, 2], [11, 3], [6, 1]] as const) put(g, x, y, 'X');
  // charco en el suelo
  rect(g, 4, 18, 8, 1, 'U');
  return frame(g);
}

export const POSTERS: Record<PosterId, SpriteDef> = {
  jojo: jojo(),
  joseph: joseph(),
  ippo: ippo(),
  gragas: gragas(),
};

/** Glifo 「ゴ」 amarillo con contorno morado oscuro: flota alrededor del personaje durante el proceso final. */
function makeGoGlyph(): SpriteDef {
  const g = grid(8, 7);
  goGlyph(g, 1, 1, 'x');
  outline(g, 'k');
  return { ...sprite(g), palette: SCENE_PALETTE };
}
export const GO_GLYPH = makeGoGlyph();
