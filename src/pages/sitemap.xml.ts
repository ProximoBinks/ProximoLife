import type { APIRoute } from "astro";
import type { FunctionReturnType } from "convex/server";
import { api, database } from "../utils/database";
// Lists the public pages and every public entry; private entries stay out of search.
export const GET: APIRoute = async ({ url }) => {
  try {
    const { client, secret } = database();
    const entries: { slug: string; created_at: string }[] = [];
    let cursor: string | null = null;
    do {
      const page: FunctionReturnType<typeof api.posts.list> = await client.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor } });
      entries.push(...page.posts.filter(post => post.isPublic));
      cursor = page.next;
    } while (cursor);
    const urls = [
      { loc: "/", lastmod: entries[0]?.created_at },
      { loc: "/blog", lastmod: entries[0]?.created_at },
      { loc: "/contact" },
      ...entries.map(post => ({ loc: `/blog/${post.slug}`, lastmod: post.created_at })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${url.origin}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`).join("")}</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  } catch { return new Response("The sitemap is temporarily unavailable.", { status: 503 }); }
};
