// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Used to generate absolute canonical URLs, OG tags, and sitemap.xml.
  site: 'https://domainpricing.net',

  vite: {
    plugins: [tailwindcss()],
  },
});