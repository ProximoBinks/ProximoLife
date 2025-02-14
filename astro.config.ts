import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
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
  output: 'server',
  adapter: netlify(),
});
