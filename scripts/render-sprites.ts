/**
 * Renderiza la escena y los iconos a PNG para revisarlos a ojo (sin navegador).
 *   npx tsx scripts/render-sprites.ts [carpeta-salida]   (por defecto node_modules/.cache/sprites)
 * Genera scene.png, scene-cto.png, charsheet.png, hero.png, posters.png e icons.png.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BACK,
  BARREL_MUG,
  CHAIR,
  CHAR_FRAMES,
  CHAR_DESK_ROW,
  CHAR_H,
  CHAR_W,
  DESK,
  ENVELOPE,
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
  POSTERS,
  POSTER_H,
  POSTER_IDS,
  POSTER_W,
  SCENE_H,
  SCENE_W,
  SPEAKER,
  STEAM,
  getCharacter,
  getCharacterSheet,
  type CharFrame,
  type SpriteDef,
} from '../src/game/sprites';

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Img {
  data: Uint8Array;
  constructor(
    public w: number,
    public h: number,
    bg: RGB,
  ) {
    this.data = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) this.data.set(bg, i * 3);
  }
  set(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data.set(c, (y * this.w + x) * 3);
  }
  draw(s: SpriteDef, frame: number, ox: number, oy: number) {
    const pal = s.palette ?? PALETTE;
    s.frames[frame].forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) this.set(ox + x, oy + y, hex(c));
      }
    });
  }
  scaled(k: number): Img {
    const o = new Img(this.w * k, this.h * k, [0, 0, 0]);
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) o.set(x, y, [...this.data.slice((Math.floor(y / k) * this.w + Math.floor(x / k)) * 3, (Math.floor(y / k) * this.w + Math.floor(x / k)) * 3 + 3)] as RGB);
    return o;
  }
  png(): Buffer {
    const raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 3 + 1)] = 0;
      Buffer.from(this.data.buffer, y * this.w * 3, this.w * 3).copy(raw, y * (this.w * 3 + 1) + 1);
    }
    const crcTable = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
    const crc = (b: Buffer) => {
      let c = 0xffffffff;
      for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type: string, d: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(d.length);
      const td = Buffer.concat([Buffer.from(type), d]);
      const c = Buffer.alloc(4);
      c.writeUInt32BE(crc(td));
      return Buffer.concat([len, td, c]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const out = process.argv[2] ?? 'node_modules/.cache/sprites';
mkdirSync(out, { recursive: true });

// ---- escena completa (x6) ----
const WALL = hex('#e8e1d3');
function renderScene(opts: { frame?: number; seniority?: number; charFrame?: CharFrame; cafes?: boolean; lampOn?: boolean; ring?: number } = {}): Img {
  const scene = new Img(SCENE_W, SCENE_H, WALL);
  scene.draw(BACK, 0, LAYOUT.back.x, LAYOUT.back.y);
  scene.draw(SPEAKER, opts.ring ?? 0, LAYOUT.speaker.x, LAYOUT.speaker.y);
  POSTER_IDS.forEach((id, i) => scene.draw(POSTERS[id], 0, LAYOUT.posters[i].x, LAYOUT.posters[i].y));
  scene.draw(CHAIR, 0, LAYOUT.chair.x, LAYOUT.chair.y);
  scene.draw(DESK, 0, LAYOUT.desk.x, LAYOUT.desk.y);
  scene.draw(LAMP_GLOW, opts.lampOn === false ? 1 : 0, LAYOUT.lampGlow.x, LAYOUT.lampGlow.y);
  scene.draw(LAMP, opts.lampOn === false ? 1 : 0, LAYOUT.lamp.x, LAYOUT.lamp.y);
  scene.draw(MAT, 0, LAYOUT.mat.x, LAYOUT.mat.y);
  scene.draw(ROUTER, (opts.frame ?? 0) % 2, LAYOUT.router.x, LAYOUT.router.y);
  scene.draw(opts.cafes ? BARREL_MUG : MUG, 0, LAYOUT.mug.x, LAYOUT.mug.y);
  scene.draw(STEAM, 1, LAYOUT.steam.x, LAYOUT.steam.y);
  scene.draw(KEYBOARD, 0, LAYOUT.keyboard.x, LAYOUT.keyboard.y);
  scene.draw(MOUSE, opts.frame ?? 0, LAYOUT.mouse.x, LAYOUT.mouse.y);
  scene.draw(getCharacter(opts.seniority ?? 0, opts.charFrame ?? 'typing0'), 0, LAYOUT.character.x, LAYOUT.character.y);
  return scene;
}
writeFileSync(join(out, 'scene.png'), renderScene().scaled(6).png());
writeFileSync(join(out, 'scene-idle.png'), renderScene({ charFrame: 'idle0' }).scaled(6).png());
writeFileSync(join(out, 'scene-cto.png'), renderScene({ seniority: 4, charFrame: 'happy', cafes: true }).scaled(6).png());
writeFileSync(join(out, 'scene-lamp-off.png'), renderScene({ charFrame: 'idle0', lampOn: false }).scaled(6).png());
writeFileSync(join(out, 'scene-sip.png'), renderScene({ charFrame: 'sip', seniority: 2, ring: 2 }).scaled(6).png());
writeFileSync(join(out, 'scene-lead.png'), renderScene({ seniority: 3, charFrame: 'typing1' }).scaled(6).png());

// ---- hoja del personaje: todos los frames x 5 atuendos (x5), con la linea del escritorio ----
{
  const W = CHAR_W + 2;
  const H = CHAR_H + 2;
  const sheet = new Img(CHAR_FRAMES.length * W, 5 * H, hex('#e8e1d3'));
  for (let l = 0; l < 5; l++)
    for (let f = 0; f < CHAR_FRAMES.length; f++) {
      for (let y = CHAR_DESK_ROW; y < CHAR_H; y++) for (let x = 0; x < W; x++) sheet.set(f * W + x, l * H + 1 + y, hex(y === CHAR_DESK_ROW ? '#b9824f' : '#d9a066'));
      sheet.draw(getCharacterSheet(l), f, f * W + 1, l * H + 1);
    }
  writeFileSync(join(out, 'charsheet.png'), sheet.scaled(5).png());
  const hero = new Img(W * 3, H, hex('#e8e1d3'));
  hero.draw(getCharacterSheet(0), 2, 1, 1);
  hero.draw(getCharacterSheet(0), CHAR_FRAMES.indexOf('happy'), W + 1, 1);
  hero.draw(getCharacterSheet(0), CHAR_FRAMES.indexOf('shock'), 2 * W + 1, 1);
  writeFileSync(join(out, 'hero.png'), hero.scaled(10).png());
}

// ---- pósters (x8) ----
{
  const sheet = new Img(POSTER_IDS.length * (POSTER_W + 2) + 2, POSTER_H + 4, hex('#e8e1d3'));
  POSTER_IDS.forEach((id, i) => sheet.draw(POSTERS[id], 0, 2 + i * (POSTER_W + 2), 2));
  writeFileSync(join(out, 'posters.png'), sheet.scaled(8).png());
}

// ---- iconos ----
const ids = Object.keys(ICONS) as (keyof typeof ICONS)[];
const sheet = new Img(ids.length * 18 + 2, 20 + 14, hex('#333c57'));
ids.forEach((id, i) => sheet.draw(ICONS[id], 0, 2 + i * 18, 2));
sheet.draw(ENVELOPE, 0, 2, 20);
writeFileSync(join(out, 'icons.png'), sheet.scaled(8).png());
console.log('ok ->', out);
