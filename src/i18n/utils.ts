import es from './es.json';
import en from './en.json';

export const LOCALES = ['es', 'en'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LANG: Lang = 'es';

const dictionaries = { es, en } satisfies Record<Lang, Record<keyof typeof es, string>>;

export type TKey = keyof typeof es;

export function isLang(x: unknown): x is Lang {
  return x === 'es' || x === 'en';
}

/** Devuelve el texto de UI tipado para un idioma y clave. */
export function t(lang: Lang, key: TKey): string {
  return dictionaries[lang][key];
}

export const OG_LOCALE: Record<Lang, string> = { es: 'es_CL', en: 'en_US' };

/** Ruta (con trailing slash) dentro del idioma indicado. */
export function localePath(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return withBase(`/${lang}/${clean ? clean + '/' : ''}`);
}

/** Base path del sitio sin slash final ('' si es la raiz). */
export function basePrefix(): string {
  return (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
}

/** Antepone el base path a una ruta absoluta del sitio (sin dobles slashes). */
export function withBase(path: string): string {
  return `${basePrefix()}/${path.replace(/^\/+/, '')}`;
}

/** Cambia el idioma en un pathname que ya incluye el base path. */
export function swapLangPath(pathname: string, lang: Lang): string {
  const base = basePrefix();
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return `${base}${rest.replace(/^\/(es|en)\//,`/${lang}/`)}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}
