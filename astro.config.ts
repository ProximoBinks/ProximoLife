import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  site: "https://proximo.life",
  output: "server",
  adapter: netlify(),
  // sanitize-html is CommonJS and require()s ESM-only packages (htmlparser2, and a hoisted
  // escape-string-regexp v5), which Netlify's function runtime can't load. Bundling the
  // chain in production builds resolves those requires at build time; postcss stays
  // external (it is CommonJS). Dev keeps it external, where Node loads it natively.
  vite: {
    plugins: [tailwind(), {
      name: "bundle-sanitize-html",
      apply: "build",
      config: () => ({ ssr: { noExternal: ["sanitize-html", "htmlparser2", "escape-string-regexp", "deepmerge", "is-plain-object", "parse-srcset", "launder"] } }),
    }],
  },
  build: { inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
