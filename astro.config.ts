import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  site: "https://proximo.life",
  output: "server",
  adapter: netlify(),
  vite: { plugins: [tailwind()] },
  build: { inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
