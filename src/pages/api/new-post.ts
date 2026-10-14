import type { APIRoute } from "astro";
import sanitize from "sanitize-html";
import { ConvexError } from "convex/values";
import { api, database } from "../../utils/database";
import { authenticated } from "../../utils/auth";
import { json, readBody, sameOrigin } from "../../utils/http";
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!authenticated(cookies, "admin")) return json({ error: "Please sign in as an administrator." }, 401);
  try {
    const body = await readBody(request);
    if (![body.title, body.content, body.author, body.slug].every(v => typeof v === "string" && v.trim()) || !Array.isArray(body.tags) || !body.tags.every((v: unknown) => typeof v === "string")) return json({ error: "Complete all required fields." }, 400);
    const { client, secret } = database();
    await client.mutation(api.posts.create, { secret, title: body.title.trim(), content: sanitize(body.content), author: body.author.trim(), slug: body.slug.trim(), tags: [...new Set<string>(body.tags.map((t: string) => t.trim()).filter(Boolean))], isPublic: body.isPublic === true });
    return json({ success: true, slug: body.slug });
  } catch (error) { return json({ error: error instanceof ConvexError ? String(error.data) : "Unable to publish. Please try again." }, error instanceof ConvexError || error instanceof SyntaxError ? 400 : 503); }
};
