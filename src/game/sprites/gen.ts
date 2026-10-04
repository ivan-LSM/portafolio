/**
 * Utilidades mínimas para construir sprites como matrices de caracteres.
 * Cada carácter es una clave de la paleta ('.' = transparente).
 * Los sprites exportados siguen siendo `string[]` (una fila por string).
 */
export type Grid = string[][];

/**
 * Paleta Sweetie 16 (Lospec). Los mismos valores que --color-sw-* en global.css.
 * Es una constante fija a propósito: los sprites se ven igual en tema claro y oscuro.
 */
export const PALETTE: Record<string, string> = {
  '0': '#1a1c2c', // navy (contorno)
  '1': '#5d275d', // purple
  '2': '#b13e53', // red
  '3': '#ef7d57', // orange
  '4': '#ffcd75', // yellow
  '5': '#a7f070', // lime
  '6': '#38b764', // green
  '7': '#257179', // teal
  '8': '#29366f', // ocean
  '9': '#3b5dc9', // blue
  a: '#41a6f6', // sky
  b: '#73eff7', // cyan
  c: '#f4f4f4', // white
  d: '#94b0c2', // gray
  e: '#566c86', // slate
  f: '#333c57', // surface
};

export const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string>(w).fill('.'));

export function put(g: Grid, x: number, y: number, c: string): void {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(g, i, j, c);
}

export function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
    for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / rx;
      const dy = (j - cy) / ry;
      if (dx * dx + dy * dy <= 1.0) put(g, i, j, c);
    }
  }
}

export function line(g: Grid, x0: number, y0: number, x1: number, y1: number, c: string): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) put(g, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}

/** Estampa arte en strings; '.' y ' ' no modifican el destino. */
export function stamp(g: Grid, x: number, y: number, art: string[]): void {
  art.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch !== '.' && ch !== ' ') put(g, x + i, y + j, ch);
    }
  });
}

/** Añade un contorno de 1 px (4 vecinos) en las celdas transparentes junto a píxeles opacos. */
export function outline(g: Grid, c = '0'): void {
  const h = g.length;
  const w = g[0].length;
  const marks: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      if (
        (x > 0 && g[y][x - 1] !== '.' && g[y][x - 1] !== c) ||
        (x < w - 1 && g[y][x + 1] !== '.' && g[y][x + 1] !== c) ||
        (y > 0 && g[y - 1][x] !== '.' && g[y - 1][x] !== c) ||
        (y < h - 1 && g[y + 1][x] !== '.' && g[y + 1][x] !== c)
      )
        marks.push([x, y]);
    }
  }
  for (const [x, y] of marks) g[y][x] = c;
}

export const toRows = (g: Grid): string[] => g.map((r) => r.join(''));

export interface SpriteDef {
  w: number;
  h: number;
  /** Cada frame es un array de strings de h filas por w columnas. */
  frames: string[][];
  /** Paleta propia (por defecto Sweetie 16). */
  palette?: Record<string, string>;
}

export function sprite(frames: Grid[] | Grid): SpriteDef {
  const list = Array.isArray(frames[0]?.[0]) ? (frames as Grid[]) : [frames as Grid];
  return { w: list[0][0].length, h: list[0].length, frames: list.map(toRows) };
}
