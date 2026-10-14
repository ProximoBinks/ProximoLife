import type { APIRoute } from "astro";
import sanitize from "sanitize-html";
import { ConvexError } from "convex/values";
import { api, database } from "../../utils/database";
import { authenticated } from "../../utils/auth";
import { json, readBody, sameOrigin } from "../../utils/http";
import { entryVersion } from "../../utils/entry";
const adelaideDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Australia/Adelaide" });
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!authenticated(cookies, "admin")) return json({ error: "Please sign in as an administrator." }, 401);
  try {
    const body = await readBody(request);
    if (![body.slug, body.title, body.content, body.author, body.date, body.version].every(v => typeof v === "string" && v.trim()) || !Array.isArray(body.tags) || !body.tags.every((v: unknown) => typeof v === "string") || typeof body.isPublic !== "boolean") return json({ error: "Complete all required fields." }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return json({ error: "Enter a valid date." }, 400);
    const { client, secret } = database();
    const current = await client.query(api.posts.get, { secret, slug: body.slug });
    if (!current) return json({ error: "This entry no longer exists." }, 404);
    if (entryVersion(current) !== body.version) return json({ error: "This entry changed after you opened it. Reload the page to see the latest version, then make your edits again." }, 409);
    const expected = { title: current.title, content: current.content, created_at: current.created_at };
    // An unchanged date keeps its original time. A new date lands at about midday in Adelaide, which stays on that calendar day through daylight saving.
    const created_at = body.date === adelaideDate(expected.created_at) ? expected.created_at : `${body.date}T02:00:00.000Z`;
    const slug = await client.mutation(api.posts.update, { secret, slug: body.slug, expected, title: body.title.trim(), content: sanitize(body.content), author: body.author.trim(), tags: [...new Set<string>(body.tags.map((t: string) => t.trim()).filter(Boolean))], created_at, isPublic: body.isPublic });
    return json({ success: true, slug });
  } catch (error) { return json({ error: error instanceof ConvexError ? String(error.data) : "Unable to save. Please try again." }, error instanceof ConvexError || error instanceof SyntaxError ? 400 : 503); }
};
