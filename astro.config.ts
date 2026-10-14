import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  site: "https://proximo.life",
  output: "server",
  adapter: netlify(),
  // sanitize-html is CommonJS and require()s ESM-only packages (htmlparser2, and a hoisted
  // escape-string-regexp v5) plus packages Netlify's function bundle doesn't resolve from
  // the chunk (postcss, dayjs). Bundling its whole chain in production builds leaves no
  // runtime require()s. Dev keeps it external, where Node loads it natively.
  vite: {
    plugins: [tailwind(), {
      name: "bundle-sanitize-html",
      apply: "build",
      config: () => ({ ssr: { noExternal: ["sanitize-html", "htmlparser2", "escape-string-regexp", "deepmerge", "is-plain-object", "parse-srcset", "launder", "dayjs", "postcss", "nanoid", "picocolors", "source-map-js", "entities", "domhandler", "domelementtype", "domutils", "dom-serializer"] } }),
    }],
  },
  build: { inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
