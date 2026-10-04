import es from './es.json';
import en from './en.json';

export type GameLang = 'es' | 'en';
export type GameKey = keyof typeof es;

const dicts: Record<GameLang, Record<string, string | string[]>> = { es, en };

export function makeT(lang: GameLang) {
  const d = dicts[lang];
  return (key: string, params?: Record<string, string | number>): string => {
    const v = d[key];
    let s = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : key;
    if (params) for (const [k, val] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(val));
    return s;
  };
}

/** Elige una variante de un texto con lista (por índice pseudoaleatorio). */
export function pick(lang: GameLang, key: string, n: number): string {
  const v = dicts[lang][key];
  return Array.isArray(v) ? v[n % v.length] : String(v ?? key);
}
