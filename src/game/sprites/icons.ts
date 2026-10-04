import { ellipse, grid, line, outline, put, rect, sprite, stamp, type SpriteDef } from './gen';

/** Iconos 16x16 de la tienda. Contorno navy de 1 px automático, paleta Sweetie 16. */

function icon(draw: (g: string[][]) => void, after?: (g: string[][]) => void): SpriteDef {
  const g = grid(16, 16);
  draw(g);
  outline(g);
  after?.(g);
  return sprite(g);
}

// ----- Producción: proyectos reales -----

/** YOLO: ojo dentro de un visor de detección. */
const yolo = icon(
  (g) => {
    ellipse(g, 7.5, 7.5, 6, 3.6, 'c');
    ellipse(g, 7.5, 7.5, 3, 3, '9');
    ellipse(g, 7.5, 7.5, 1.5, 1.5, '0');
    put(g, 6, 6, 'c');
  },
  (g) => {
    for (const [x, y, dx, dy] of [
      [0, 0, 1, 1],
      [15, 0, -1, 1],
      [0, 15, 1, -1],
      [15, 15, -1, -1],
    ] as const) {
      for (let i = 0; i < 4; i++) {
        put(g, x + dx * i, y, '5');
        put(g, x, y + dy * i, '5');
      }
    }
  },
);

/** Reservas: bus turístico. */
const reservas = icon((g) => {
  rect(g, 1, 3, 14, 9, '4');
  rect(g, 1, 3, 14, 1, 'c');
  rect(g, 1, 9, 14, 1, '2');
  rect(g, 1, 10, 14, 2, '3');
  rect(g, 2, 5, 3, 3, 'b');
  rect(g, 6, 5, 3, 3, 'b');
  rect(g, 10, 5, 3, 3, 'b');
  put(g, 2, 5, 'c');
  put(g, 6, 5, 'c');
  put(g, 10, 5, 'c');
  rect(g, 1, 12, 14, 1, 'e');
  for (const cx of [4, 11]) {
    ellipse(g, cx, 12.5, 2, 2, 'f');
    put(g, cx, 12, 'd');
    put(g, cx, 13, 'd');
  }
});

/** GymUBB: mancuerna. */
const gymubb = icon((g) => {
  rect(g, 4, 7, 8, 2, 'd');
  rect(g, 4, 8, 8, 1, 'e');
  rect(g, 1, 3, 3, 10, '2');
  rect(g, 1, 3, 1, 10, '3');
  rect(g, 4, 5, 2, 6, '2');
  rect(g, 4, 5, 1, 6, '3');
  rect(g, 10, 5, 2, 6, '2');
  rect(g, 10, 5, 1, 6, '3');
  rect(g, 12, 3, 3, 10, '2');
  rect(g, 12, 3, 1, 10, '3');
});

/** SIGESPU: marcador de mapa. */
const sigespu = icon((g) => {
  ellipse(g, 7.5, 5.5, 5, 5, '2');
  for (let r = 0; r < 5; r++) rect(g, 3 + r, 9 + r, 10 - 2 * r, 1, '2');
  ellipse(g, 7.5, 5.5, 2, 2, 'c');
  put(g, 4, 3, '3');
  put(g, 5, 2, '3');
  put(g, 4, 4, '3');
  rect(g, 4, 14, 8, 1, 'e');
});

/** Gestión de pedidos: recibo. */
const pedidos = icon((g) => {
  rect(g, 3, 1, 10, 14, 'c');
  rect(g, 3, 1, 10, 2, 'a');
  for (let x = 3; x <= 12; x += 2) put(g, x, 14, '.');
  rect(g, 5, 4, 6, 1, 'e');
  rect(g, 5, 6, 4, 1, 'e');
  rect(g, 5, 8, 6, 1, 'e');
  rect(g, 5, 10, 3, 1, 'e');
  rect(g, 9, 12, 2, 1, '2');
});

// ----- Mejoras -----

/** Curso online (libro azul con sello). */
const udemy = icon((g) => {
  rect(g, 2, 2, 12, 12, '9');
  rect(g, 2, 2, 3, 12, '8');
  rect(g, 3, 2, 1, 12, '9');
  rect(g, 5, 13, 9, 1, 'c');
  rect(g, 7, 4, 6, 4, '4');
  rect(g, 7, 4, 6, 1, 'c');
  rect(g, 7, 9, 5, 1, 'c');
  rect(g, 7, 11, 3, 1, 'a');
});

/** Asistente de código (cara de robot genérica). */
const copilot = icon((g) => {
  rect(g, 7, 2, 2, 2, 'e');
  ellipse(g, 7.5, 1.5, 1.4, 1.4, '2');
  rect(g, 2, 4, 12, 10, 'd');
  rect(g, 2, 4, 12, 1, 'c');
  rect(g, 2, 13, 12, 1, 'e');
  rect(g, 0, 7, 2, 4, 'e');
  rect(g, 14, 7, 2, 4, 'e');
  rect(g, 3, 6, 10, 5, '8');
  rect(g, 4, 7, 2, 3, 'b');
  rect(g, 10, 7, 2, 3, 'b');
  rect(g, 6, 12, 4, 1, 'e');
});

/** Bootcamp: birrete. */
const bootcamp = icon((g) => {
  rect(g, 4, 8, 8, 4, '8');
  rect(g, 4, 8, 8, 1, '9');
  const widths = [2, 6, 10, 14, 10, 6, 2];
  widths.forEach((w, i) => rect(g, 8 - w / 2, 2 + i, w, 1, i < 3 ? 'a' : '9'));
  rect(g, 6, 5, 2, 1, 'b');
  line(g, 13, 5, 13, 10, '4');
  rect(g, 12, 10, 2, 3, '4');
  put(g, 12, 12, '3');
  put(g, 13, 12, '3');
});

/** Teclado mecánico RGB. */
const teclado = icon((g) => {
  rect(g, 0, 4, 16, 9, 'e');
  rect(g, 0, 4, 16, 1, 'd');
  const rgb = ['2', '3', '4', '5', 'b', 'a', '9'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      rect(g, 1 + c * 3, 5 + r * 2, 2, 1, 'c');
      put(g, 1 + c * 3, 6 + r * 2, rgb[(r + c * 2) % rgb.length]);
      put(g, 2 + c * 3, 6 + r * 2, rgb[(r + c * 2) % rgb.length]);
    }
  }
  rect(g, 4, 11, 8, 1, 'c');
});

/** Café: taza con vapor. */
const cafe = icon(
  (g) => {
    rect(g, 2, 6, 9, 8, 'c');
    rect(g, 9, 6, 2, 8, 'd');
    rect(g, 2, 6, 9, 2, '1');
    for (const [x, y] of [
      [11, 8],
      [12, 8],
      [13, 8],
      [13, 9],
      [13, 10],
      [13, 11],
      [12, 12],
      [11, 12],
    ] as const)
      put(g, x, y, 'c');
    rect(g, 4, 14, 5, 1, 'd');
  },
  (g) => {
    for (const [x, y] of [
      [4, 1],
      [5, 2],
      [4, 3],
      [5, 4],
      [8, 0],
      [7, 1],
      [8, 2],
      [7, 3],
    ] as const)
      put(g, x, y, 'd');
  },
);

// ----- Premium -----

/** Perfil profesional: tarjeta "in" genérica. */
const linkedin = icon((g) => {
  rect(g, 1, 2, 14, 12, '9');
  rect(g, 1, 2, 14, 1, 'a');
  put(g, 4, 5, 'c');
  put(g, 4, 6, 'c');
  rect(g, 4, 8, 1, 4, 'c');
  rect(g, 7, 7, 1, 5, 'c');
  rect(g, 8, 7, 3, 1, 'c');
  rect(g, 10, 8, 1, 4, 'c');
  rect(g, 12, 11, 1, 1, 'a');
});

/** Pizarra. */
const whiteboard = icon((g) => {
  rect(g, 1, 1, 14, 10, 'd');
  rect(g, 2, 2, 12, 8, 'c');
  line(g, 3, 4, 8, 4, '9');
  line(g, 3, 6, 11, 6, '2');
  line(g, 3, 8, 6, 8, '6');
  rect(g, 10, 8, 3, 1, 'a');
  rect(g, 3, 11, 10, 1, 'e');
  rect(g, 4, 12, 1, 3, 'e');
  rect(g, 11, 12, 1, 3, 'e');
});

/** Portafolio: carpeta con </>. */
const portafolio = icon((g) => {
  rect(g, 1, 2, 6, 3, '3');
  rect(g, 1, 4, 14, 10, '4');
  rect(g, 1, 4, 14, 1, 'c');
  rect(g, 1, 12, 14, 2, '3');
  stamp(g, 4, 6, ['..8', '.8.', '8..', '.8.', '..8']);
  stamp(g, 11, 6, ['8..', '.8.', '..8', '.8.', '8..']);
  line(g, 9, 6, 7, 10, '8');
});

/** Contacto que te refiere: apretón de manos. */
const referido = icon((g) => {
  rect(g, 0, 4, 3, 8, '9');
  rect(g, 13, 4, 3, 8, '6');
  rect(g, 3, 5, 10, 6, '4');
  rect(g, 3, 9, 10, 2, '3');
  rect(g, 5, 4, 6, 1, '4');
  for (const x of [6, 8, 10]) rect(g, x, 8, 1, 3, '3');
  rect(g, 3, 6, 4, 1, 'c');
});

export const ICONS = {
  yolo,
  reservas,
  gymubb,
  sigespu,
  pedidos,
  udemy,
  copilot,
  bootcamp,
  teclado,
  cafe,
  linkedin,
  whiteboard,
  portafolio,
  referido,
} satisfies Record<string, SpriteDef>;

export type IconId = keyof typeof ICONS;

// ----- Iconos de interfaz (toasts, logros, etapas) -----

/** Candado abierto. */
const lock = icon((g) => {
  rect(g, 4, 1, 2, 6, 'd');
  rect(g, 5, 1, 5, 2, 'd');
  rect(g, 9, 1, 2, 3, 'd');
  rect(g, 2, 7, 12, 8, '4');
  rect(g, 2, 7, 12, 1, 'c');
  rect(g, 2, 13, 12, 2, '3');
  rect(g, 7, 9, 2, 3, '0');
});

/** Trofeo. */
const trophy = icon((g) => {
  rect(g, 4, 1, 8, 7, '4');
  rect(g, 4, 1, 2, 6, 'c');
  rect(g, 5, 8, 6, 1, '3');
  rect(g, 2, 2, 2, 4, '3');
  rect(g, 12, 2, 2, 4, '3');
  rect(g, 7, 9, 2, 3, '3');
  rect(g, 4, 12, 8, 3, '4');
  rect(g, 4, 14, 8, 1, '3');
});

/** Estrella llena / vacía. */
function starIcon(fill: string, shade: string): SpriteDef {
  const g = grid(16, 16);
  const widths = [2, 2, 4, 14, 12, 10, 8, 8, 6];
  widths.forEach((w, i) => rect(g, 8 - w / 2, 1 + i, w, 1, fill));
  rect(g, 4, 11, 3, 3, fill);
  rect(g, 9, 11, 3, 3, fill);
  rect(g, 7, 10, 2, 1, fill);
  rect(g, 8, 4, 3, 6, shade);
  outline(g);
  return sprite(g);
}
const star = starIcon('4', '3');
const starEmpty = starIcon('e', 'f');

/** Check verde. */
const check = icon((g) => {
  line(g, 2, 8, 6, 12, '5');
  line(g, 2, 9, 6, 13, '5');
  line(g, 6, 12, 13, 3, '5');
  line(g, 6, 13, 13, 4, '6');
  line(g, 7, 12, 13, 4, '5');
});

export const UI_ICONS = { lock, trophy, star, starEmpty, check } satisfies Record<string, SpriteDef>;
