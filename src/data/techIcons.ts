import {
  siAstro, siCisco, siCloudflare, siCloudflarepages, siCss, siDart, siDocker, siFlutter, siGit, siGithubactions,
  siGnubash, siGooglemaps, siHtml5, siJavascript, siJsonwebtokens, siLatex, siLinux, siNestjs, siNginx, siOpencv,
  siPostgresql, siPrisma, siPython, siPytorch, siRailway, siRedis, siResend, siRoboflow, siSqlite,
  siTailwindcss, siTypescript, siUltralytics, siUml, siVitest, siZod,
} from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

/** Orden de las reglas importa: la primera que coincide gana. Lo que no coincide usa monograma pixel. */
const RULES: [RegExp, SimpleIcon][] = [
  [/^typescript$/i, siTypescript],
  [/^javascript$/i, siJavascript],
  [/^python$/i, siPython],
  [/^dart(\/|$)/i, siDart],
  [/^nestjs$/i, siNestjs],
  [/^jwt$/i, siJsonwebtokens],
  [/^postgresql(?!.*postgis)/i, siPostgresql],
  [/^redis$/i, siRedis],
  [/^flutter$/i, siFlutter],
  [/^astro$/i, siAstro],
  [/^tailwind/i, siTailwindcss],
  [/^html/i, siHtml5],
  [/^css$/i, siCss],
  [/^linux$/i, siLinux],
  [/^bash$/i, siGnubash],
  [/^docker/i, siDocker],
  [/^nginx$/i, siNginx],
  [/^git$/i, siGit],
  [/^github actions$/i, siGithubactions],
  [/^railway$/i, siRailway],
  [/^cloudflare pages$/i, siCloudflarepages],
  [/^cloudflare/i, siCloudflare],
  [/^yolo/i, siUltralytics],
  [/^cisco/i, siCisco],
  [/^latex$/i, siLatex],
  [/^uml$/i, siUml],
  [/^prisma$/i, siPrisma],
  [/^zod$/i, siZod],
  [/^vitest$/i, siVitest],
  [/^pytorch$/i, siPytorch],
  [/^opencv$/i, siOpencv],
  [/^roboflow$/i, siRoboflow],
  [/^resend$/i, siResend],
  [/^google places$/i, siGooglemaps],
  [/sqlite/i, siSqlite],
];

export interface TechIconData {
  svgPath?: string;
  hex?: string;
  /** Contraste del color de marca contra el fondo oscuro / claro del sitio. */
  darkBad?: boolean;
  lightBad?: boolean;
  mono: string;
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Monograma de 2 letras para tecnologías sin logo en Simple Icons. */
function monogram(name: string): string {
  const words = name.replace(/[()]/g, '').split(/[\s/]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2);
  return letters.toUpperCase();
}

export function getTechIcon(name: string): TechIconData {
  const mono = monogram(name);
  const icon = RULES.find(([re]) => re.test(name.trim()))?.[1];
  if (!icon) return { mono };
  const lum = luminance(icon.hex);
  return { svgPath: icon.path, hex: `#${icon.hex}`, darkBad: lum < 0.18, lightBad: lum > 0.45, mono };
}
