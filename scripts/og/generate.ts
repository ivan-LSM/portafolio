/**
 * Genera imágenes Open Graph 1200x630 (pixel art, paleta Sweetie 16).
 *   npm run og
 * Salida: public/og/default-{es,en}.png y public/og/<slug>-{es,en}.png
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'og');
mkdirSync(OUT, { recursive: true });

const C = {
  bg: '#1a1c2c',
  surface: '#333c57',
  text: '#f4f4f4',
  muted: '#94b0c2',
  blue: '#41a6f6',
  cyan: '#73eff7',
  lime: '#a7f070',
  yellow: '#ffcd75',
  orange: '#ef7d57',
  red: '#b13e53',
  shadow: '#0f101b',
};
const ACCENTS = [C.blue, C.cyan, C.lime, C.yellow, C.orange, C.red];

const fontDir = join(ROOT, 'node_modules', '@fontsource', 'pixelify-sans', 'files');
const fonts = [
  { name: 'Pixelify Sans', weight: 400 as const, data: readFileSync(join(fontDir, 'pixelify-sans-latin-400-normal.woff')) },
  { name: 'Pixelify Sans', weight: 700 as const, data: readFileSync(join(fontDir, 'pixelify-sans-latin-700-normal.woff')) },
];

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

/** Generador pseudoaleatorio determinista para decoraciones. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

const PX = 16;
function pixels(seed: number): Node[] {
  const r = rng(seed);
  const out: Node[] = [];
  // Escalera de bloques en la esquina inferior derecha + motas dispersas
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j <= i; j++) {
      if (r() < 0.25) continue;
      out.push(h('div', { position: 'absolute', right: j * PX, bottom: (8 - i) * PX, width: PX, height: PX, background: ACCENTS[(i + j) % 6], opacity: 0.18 + (j / 9) * 0.5 }));
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * (1200 / PX)) * PX;
    const y = Math.floor(r() * (630 / PX)) * PX;
    out.push(h('div', { position: 'absolute', left: x, top: y, width: PX, height: PX, background: ACCENTS[Math.floor(r() * 6)], opacity: 0.10 }));
  }
  return out;
}

/** Barra superior de colores (paleta). */
const stripe = h('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 16 }, ACCENTS.map((c) => h('div', { flex: 1, background: c })));

/** Marco pixel con sombra dura. */
function frame(children: unknown, accent = C.blue): Node {
  return h('div', { position: 'absolute', left: 56, top: 56, right: 72, bottom: 72, background: C.shadow }, [
    h('div', { position: 'absolute', left: -16, top: -16, right: 16, bottom: 16, background: C.surface, border: `8px solid ${accent}`, flexDirection: 'column', padding: 48 }, children),
  ]);
}

const chip = (label: string, color: string) =>
  h('div', { background: C.bg, border: `4px solid ${color}`, color: C.text, fontSize: 28, padding: '6px 16px', marginRight: 14, marginBottom: 14 }, label);

const text = (s: string, size: number, color: string, extra: Record<string, unknown> = {}) =>
  h('div', { fontSize: size, color, ...extra }, s);

function base(seed: number, content: unknown, accent?: string): Node {
  return h('div', { width: 1200, height: 630, background: C.bg, position: 'relative', fontFamily: 'Pixelify Sans' }, [
    ...pixels(seed),
    stripe,
    frame(content, accent),
  ]);
}

const NAME = 'Iván Salas Molina';
const URL_TXT = 'ivan-lsm.github.io';
const ROLE = { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' };
const TAGLINE = {
  es: 'APIs REST, PostgreSQL/PostGIS, Redis, Docker',
  en: 'REST APIs, PostgreSQL/PostGIS, Redis, Docker',
};

function defaultCard(lang: 'es' | 'en') {
  return base(7, [
    text('> hola_mundo.exe', 30, C.lime, { marginBottom: 28 }),
    text(NAME, 92, C.text, { fontWeight: 700, lineHeight: 1.05 }),
    text(ROLE[lang], 56, C.cyan, { marginTop: 14 }),
    text(TAGLINE[lang], 30, C.muted, { marginTop: 28 }),
    h('div', { marginTop: 'auto', justifyContent: 'space-between', alignItems: 'flex-end' }, [
      text(URL_TXT, 34, C.yellow),
    ]),
  ]);
}

interface Project {
  slug: string;
  lang: 'es' | 'en';
  title: string;
  summary: string;
  stack: string[];
  order: number;
}

function loadProjects(): Project[] {
  const list: Project[] = [];
  for (const lang of ['es', 'en'] as const) {
    const dir = join(ROOT, 'src', 'content', 'projects', lang);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const { data } = matter(readFileSync(join(dir, f), 'utf8'));
      list.push({ slug: f.replace(/\.md$/, ''), lang, title: data.title, summary: data.summary, stack: data.stack, order: data.order });
    }
  }
  return list;
}

function clamp(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 3).trimEnd() + '...';
}

function projectCard(p: Project) {
  const accent = ACCENTS[p.order % ACCENTS.length];
  const titleSize = p.title.length > 40 ? 52 : 64;
  return base(
    p.order * 31 + 5,
    [
      text(p.lang === 'es' ? 'PROYECTO' : 'PROJECT', 26, accent, { marginBottom: 16 }),
      text(clamp(p.title, 64), titleSize, C.text, { fontWeight: 700, lineHeight: 1.1 }),
      text(clamp(p.summary, 150), 30, C.muted, { marginTop: 22, lineHeight: 1.3 }),
      h('div', { marginTop: 'auto', flexDirection: 'column' }, [
        h('div', { flexWrap: 'wrap' }, p.stack.slice(0, 4).map((s, i) => chip(clamp(s.replace(/ \(.*\)$/, ''), 22), ACCENTS[(i + p.order) % 6]))),
        h('div', { justifyContent: 'space-between', alignItems: 'center' }, [
          text(`${NAME}`, 28, C.text),
          text(URL_TXT, 28, C.yellow),
        ]),
      ]),
    ],
    accent,
  );
}

async function render(node: Node, file: string) {
  const svg = await satori(node as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(join(OUT, file), png);
  console.log('og:', file, `${(png.length / 1024).toFixed(0)} KB`);
}

for (const lang of ['es', 'en'] as const) await render(defaultCard(lang), `default-${lang}.png`);
for (const p of loadProjects()) await render(projectCard(p), `${p.slug}-${p.lang}.png`);
