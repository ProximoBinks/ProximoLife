import type { APIRoute } from "astro";
// Served from the request origin so the sitemap URL is right on any domain.
export const GET: APIRoute = ({ url }) => new Response(
  `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /login\nDisallow: /secret\n\nSitemap: ${url.origin}/sitemap.xml\n`,
  { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
);
