/**
 * Tarjeta de resultado en pixel art (1200x630, formato de imagen de LinkedIn) y logica de compartir.
 * Todo corre en el cliente: se dibuja con canvas (sin suavizado) y se comparte con Web Share si el
 * navegador acepta archivos; si no, se descarga el PNG y se copia el texto.
 */
import { CHAR_DESK_ROW, getCharacter, PALETTE, type SpriteDef } from '../sprites';

export const CARD_W = 1200;
export const CARD_H = 630;

export interface CardStat {
  label: string;
  value: string;
}

export interface CardData {
  /** titulo del juego */
  title: string;
  /** linea sobre el titulo, p. ej. "Oferta aceptada" */
  kicker: string;
  stats: CardStat[];
  quip: string;
  /** direccion que se muestra al pie (sin protocolo) */
  url: string;
  /** nivel de seniority 0..4 para elegir el outfit */
  level: number;
}

/** Elige la frase graciosa de forma estable a partir de los numeros de la partida. */
export function pickQuip(quips: string[], seed: number): string {
  if (!quips.length) return '';
  const i = Math.abs(Math.floor(Number.isFinite(seed) ? seed : 0)) % quips.length;
  return quips[i];
}

/** Quita el protocolo y la barra final para mostrar la URL en la tarjeta. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function cardFileName(lang: string): string {
  return `busca-pega-${lang}.png`;
}

/** Dibuja un sprite pixel por pixel con escala entera (sin suavizado). */
export function drawSprite(ctx: CanvasRenderingContext2D, def: SpriteDef, x: number, y: number, scale: number): void {
  const pal = { ...PALETTE, ...(def.palette ?? {}) };
  const rows = def.frames[0];
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.' || ch === ' ') continue;
      const c = pal[ch];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }
  }
}

function pixelFont(): string {
  try {
    if (typeof document !== 'undefined' && document.fonts?.check('16px "Pixelify Sans"')) return '"Pixelify Sans", monospace';
  } catch {
    /* sin API de fuentes */
  }
  return 'monospace';
}

async function ensureFont(): Promise<void> {
  try {
    await Promise.race([document.fonts.load('700 32px "Pixelify Sans"'), new Promise((r) => setTimeout(r, 800))]);
  } catch {
    /* se usa monospace */
  }
}

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, border = '#1a1c2c', bw = 6): void {
  ctx.fillStyle = border;
  ctx.fillRect(x - bw, y - bw, w + bw * 2, h + bw * 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

/** Parte `text` en lineas que quepan en `maxW`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawCard(ctx: CanvasRenderingContext2D, d: CardData): void {
  const font = pixelFont();
  ctx.imageSmoothingEnabled = false;
  ctx.textBaseline = 'top';

  // fondo: noche con bandas y estrellas fijas
  ctx.fillStyle = '#1a1c2c';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = '#29366f';
  ctx.fillRect(0, 400, CARD_W, 230);
  ctx.fillStyle = '#333c57';
  ctx.fillRect(0, 540, CARD_W, 90);
  const stars: [number, number][] = [[80, 40], [220, 90], [430, 30], [610, 70], [790, 28], [980, 60], [1120, 110], [320, 170], [1060, 230], [700, 150]];
  ctx.fillStyle = '#f4f4f4';
  for (const [x, y] of stars) ctx.fillRect(x, y, 6, 6);
  ctx.fillStyle = '#ffcd75';
  for (const [x, y] of [[150, 140], [900, 40], [540, 120]]) ctx.fillRect(x, y, 6, 6);

  // marco exterior
  ctx.strokeStyle = '#ffcd75';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);

  // personaje en un recuadro
  const def = getCharacter(d.level, 'happy');
  const scale = Math.max(1, Math.floor(430 / def.h));
  const cw = def.w * scale;
  const ch = def.h * scale;
  const cx = 70;
  const cy = CARD_H - 120 - ch;
  // escritorio profundo: de CHAR_DESK_ROW a 2 filas del sprite bajo su ultima fila; luego canto y frente corto
  const deskY = cy + CHAR_DESK_ROW * scale;
  const topEnd = cy + ch + 2 * scale;
  const edge = 6;
  const frontH = 30;
  const boxTop = cy - 20;
  const boxH = topEnd + edge + frontH - boxTop;
  frame(ctx, cx - 20, boxTop, cw + 40, boxH, '#41a6f6');
  ctx.fillStyle = '#73eff7';
  ctx.fillRect(cx - 20, boxTop, cw + 40, 18);
  const dx = cx - 20;
  const dw = cw + 40;
  // madera de 2 tonos (bandas de 2 filas del sprite) con vetas de 1 px
  ctx.fillStyle = '#ef7d57';
  ctx.fillRect(dx, deskY, dw, topEnd - deskY);
  ctx.fillStyle = '#d9663f';
  for (let y = deskY + scale; y < topEnd; y += 2 * scale) ctx.fillRect(dx, y, dw, scale);
  ctx.fillStyle = '#ffcd75';
  for (let y = deskY + 3; y < topEnd; y += 2 * scale) {
    ctx.fillRect(dx + 30 + ((y * 7) % 90), y, 70, 1);
    ctx.fillRect(dx + 260 + ((y * 5) % 80), y + scale, 90, 1);
  }
  ctx.fillStyle = '#1a1c2c'; // canto
  ctx.fillRect(dx, topEnd, dw, edge);
  ctx.fillStyle = '#5d275d'; // frente de la mesa
  ctx.fillRect(dx, topEnd + edge, dw, frontH);
  drawSprite(ctx, def, cx, cy, scale);

  // columna derecha
  const rx = cx + cw + 80;
  const rw = CARD_W - rx - 60;
  ctx.fillStyle = '#73eff7';
  ctx.font = `700 34px ${font}`;
  ctx.fillText(d.kicker.toUpperCase(), rx, 50);

  ctx.font = `700 92px ${font}`;
  ctx.fillStyle = '#1a1c2c';
  ctx.fillText(d.title.toUpperCase(), rx + 6, 96);
  ctx.fillStyle = '#ffcd75';
  ctx.fillText(d.title.toUpperCase(), rx, 90);

  // stats en 2 columnas
  const colW = Math.floor((rw - 24) / 2);
  const rowH = 78;
  const top = 214;
  d.stats.forEach((s, i) => {
    const x = rx + (i % 2) * (colW + 24);
    const y = top + Math.floor(i / 2) * (rowH + 14);
    frame(ctx, x, y, colW, rowH, '#333c57', '#1a1c2c', 5);
    ctx.fillStyle = '#73eff7';
    ctx.font = `400 22px ${font}`;
    ctx.fillText(s.label, x + 14, y + 8);
    ctx.fillStyle = '#f4f4f4';
    ctx.font = `700 36px ${font}`;
    ctx.fillText(s.value, x + 14, y + 34);
  });

  // frase
  const rows = Math.ceil(d.stats.length / 2);
  const qy = top + rows * (rowH + 14) + 6;
  ctx.fillStyle = '#a7f070';
  ctx.font = `400 24px ${font}`;
  wrap(ctx, `"${d.quip}"`, rw)
    .slice(0, 2)
    .forEach((l, i) => ctx.fillText(l, rx, qy + i * 32));

  // URL
  ctx.fillStyle = '#ffcd75';
  ctx.font = `700 32px ${font}`;
  ctx.fillText(d.url, rx, CARD_H - 62);
}

export async function renderCardBlob(d: CardData): Promise<Blob | null> {
  try {
    await ensureFont();
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    drawCard(ctx, d);
    return await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
  } catch {
    return null;
  }
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'textOnly' | 'failed';

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, name: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comparte la tarjeta: Web Share con el PNG si el navegador lo permite; si no, descarga el PNG y copia
 * el texto. Cancelar el dialogo del sistema no es un error ('cancelled').
 */
export async function shareCard(card: CardData, text: string, fileName: string, title: string): Promise<ShareOutcome> {
  const blob = await renderCardBlob(card);
  if (!blob) return (await copyShareText(text)) ? 'textOnly' : 'failed';
  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title });
      return 'shared';
    }
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    // otro fallo del share: se cae a la descarga
  }
  const saved = downloadBlob(blob, fileName);
  const copied = await copyShareText(text);
  if (saved) return 'downloaded';
  return copied ? 'textOnly' : 'failed';
}
