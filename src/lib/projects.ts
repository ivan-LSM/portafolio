import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/utils';

export type Project = CollectionEntry<'projects'> & { slug: string };

/** Proyectos de un idioma, ordenados por `order`. */
export async function getProjects(lang: Lang): Promise<Project[]> {
  const all = await getCollection('projects', (p) => p.id.startsWith(`${lang}/`));
  return all
    .map((p) => ({ ...p, slug: p.id.slice(lang.length + 1).replace(/\.md$/, '') }))
    .sort((a, b) => a.data.order - b.data.order);
}
