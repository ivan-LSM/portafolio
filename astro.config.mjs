// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ivan-lsm.github.io',
  base: '/portafolio',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    svelte(),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-CL', en: 'en-US' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
