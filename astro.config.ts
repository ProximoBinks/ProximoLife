import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Astro's official recommendation is to put TS settings in tsconfig.json
  // not in astro.config.ts, so we remove `typescript: { strict: true }`.

  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'hybrid',
  adapter: netlify(),
});
