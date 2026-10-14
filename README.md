# Proximo Life

A personal diary built with Astro, Convex, and Tailwind CSS, hosted on Netlify.

## Local development

Use Node.js 24 (minimum 22.12), then run:

```sh
npm ci
npm run dev
```

This workspace is connected to the **proximo-life** Convex project: [dashboard](https://dashboard.convex.dev/t/elliot-koh/proximo-life). Development uses `doting-mosquito-154`; production uses `impressive-sockeye-856`. All four original Supabase posts have been imported and verified in both deployments. `.env.local` contains the development URL and generated local passwords/secrets; it is ignored by Git. Open `/admin/new-post` and use `ADMIN_PASSWORD` from that file to publish. Readers use `BLOG_PASSWORD`. These are intentionally separate and replace the old password that was embedded in browser code.

For a new checkout, copy `.env.example` to `.env.local`, run `npx convex dev`, and set:

| Variable | Where | Purpose |
| --- | --- | --- |
| `CONVEX_URL` | Astro/Netlify | Deployment URL |
| `CONVEX_SERVER_SECRET` | Astro/Netlify **and the matching Convex deployment** | Random shared server credential, never public |
| `SESSION_SECRET` | Astro/Netlify | Random secret of at least 32 characters for signed sessions |
| `ADMIN_PASSWORD` | Astro/Netlify | Writer sign-in |
| `BLOG_PASSWORD` | Astro/Netlify | Reader sign-in |
| `POSTMARK_SERVER_TOKEN` | Astro/Netlify | SMTP token; rotate the previously committed credential |
| `CONTACT_EMAIL` | Astro/Netlify | Verified sender and recipient |

Use a password manager or `openssl rand -hex 32` to generate secrets. Set the shared secret with `npx convex env set CONVEX_SERVER_SECRET <value>` (use `--prod` for production). Never use a `PUBLIC_` prefix for these values.

## Import existing Supabase posts

Export the `posts` table as a JSON array containing `id`, `title`, `content`, `author`, `slug`, `tags`, `created_at`, `views`, and `likes`. Keep exports outside Git.

```sh
npm run migrate:posts -- /absolute/path/posts.json
npm run migrate:posts -- /absolute/path/posts.json --apply
# Only when targeting production:
npm run migrate:posts -- /absolute/path/posts.json --apply --prod
```

The first command validates without writing. Imports preserve slugs, dates, tags, counters, and original IDs (`legacyId`), sanitize HTML, and skip existing slugs, so retries do not duplicate or overwrite posts. Keep the source export until row counts and representative posts have been compared. The old `supabase/` directory contains starter framework data, not a backup of blog posts.

## Deployment

The production Convex backend is deployed. `.env.production` holds separate production secrets and passwords; it is ignored by Git. The local Supabase backup is `.env.posts-backup.json` (also ignored). The public Netlify site has not been switched by these code changes.

1. Run `npx convex deploy` to deploy the schema/functions to production. This is required before deploying this version of the site: pages call the new `posts.setVisibility` function and pass `isPublic` / `reader` arguments that older production functions reject.
2. Set `CONVEX_SERVER_SECRET` in production Convex and configure the matching production `CONVEX_URL` plus other variables above in Netlify.
3. Import and verify existing posts before switching the live site.
4. Deploy the Astro site with Netlify (build: `npm run build`, output: `dist`, Node 24).

The Supabase Netlify extension is no longer required. Leave the old database intact until migration verification is complete. Do not point the live site at a development deployment.

## Verification

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit
```

Backend tests exercise authorization, private content, duplicate URLs, concurrent/deduplicated counters, import preservation, pagination, and rate limits. Browser tests cover mobile/desktop accessibility, overflow, first-render stability, keyboard access, and failed forms.

## Rendering and access

- Each post is public or private (`isPublic`). Posts saved before this setting existed have no flag and stay private. Private content requires a signed, HTTP-only reader/admin session; listings and the RSS feed never include private text. Public entries show an excerpt and appear in `/rss.xml`.
- Page layout, navigation, and post text render on the server; there are no client-generated password overlays. Windows have a short transform-only opening animation (disabled for reduced motion) that cannot shift layout.
- Only the Astro server holds the Convex gateway secret; Convex functions reject direct unauthorized access.
- Likes/views are atomic and deduplicated per browser cookie. Clearing cookies creates a new visitor; this is not a unique-person analytics system.
- Login/contact rate limits use hashed IP keys in Convex. Forms validate server-side; HTML is sanitized on write and render.

## Aqua interface

The look is [Aqua UI](https://github.com/willmeyers/aqua-ui) by Will Meyers (MIT, notice in `public/aqua/LICENSE.txt`). `public/aqua/aqua.css` is the upstream stylesheet, unmodified, and is served as a cached file rather than inlined. Site-specific styling lives in `src/styles/globals.css`.

- Aqua UI's notes say its embedded Apple artwork (widget bitmaps, Lucida Grande, the icons in `public/aqua/icons`) is not redistributable. This site ships it anyway, by the owner's choice; replace those assets if that becomes a concern.
- The Lucida Grande embedded in `aqua.css` lacks an `OS/2` table, so Chrome rejects it. `public/aqua/fonts/*.woff2` are the same faces with that table added. They are preloaded and declared after `aqua.css` in `Layout.astro`, which keeps first render free of font swaps.
- Links that look like buttons use `a.push`, which reuses the gel artwork variables from `aqua.css`.

## Remaining upstream dependency advisories

After upgrading Astro, Netlify, Tailwind, Nodemailer and patched transitive dependencies, npm still reports advisories through Netlify’s development/build tooling (`braces` and `node-forge`). Their latest published versions have no patched release in the audit database. Do not apply `npm audit fix --force`: its suggested adapter downgrade reintroduces older framework issues. Recheck upstream updates before deployment.
