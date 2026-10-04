import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { CATEGORIES, STATUSES } from './data/categories';

/**
 * Un archivo por proyecto e idioma: src/content/projects/{es,en}/<slug>.md
 * El id resultante es "<lang>/<slug>".
 */
const projects = defineCollection({
  loader: glob({ pattern: '{es,en}/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(260),
      role: z.string(),
      period: z.string(),
      status: z.enum(STATUSES),
      stack: z.array(z.string()).min(1),
      highlights: z.array(z.string()).min(3).max(5),
      repo: z.url().optional(),
      order: z.number(),
      category: z.enum(CATEGORIES),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z
        .array(
          z.object({
            src: image(),
            /* miniatura estática (útil cuando src es animada) */
            thumb: image().optional(),
            animated: z.boolean().default(false),
            alt: z.string(),
          }),
        )
        .default([]),
      contributors: z.array(z.object({ name: z.string(), url: z.url() })).default([]),
    }),
});

export const collections = { projects };
