import type { APIRoute } from "astro";
import { api, database } from "../utils/database";
const escape = (value: string) => value.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
// Only public entries are syndicated; private ones never leave the site.
// Links use the address the feed was requested from, so they work before a custom domain exists.
export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  try {
    const { client, secret } = database();
    const { posts } = await client.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: null } });
    const items = posts.filter(post => post.isPublic).map(post => `<item><title>${escape(post.title)}</title><link>${origin}/blog/${post.slug}</link><guid>${origin}/blog/${post.slug}</guid><pubDate>${new Date(post.created_at).toUTCString()}</pubDate><description>${escape(post.excerpt ?? "")}</description>${post.tags.map(tag => `<category>${escape(tag)}</category>`).join("")}</item>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>proximo – digital diary</title><link>${origin}/blog</link><description>Notes on what I’m building, what’s been happening, and what I’m still figuring out.</description><language>en-au</language>${items}</channel></rss>`;
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
  } catch { return new Response("The feed is temporarily unavailable.", { status: 503 }); }
};
