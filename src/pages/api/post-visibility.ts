import type { APIRoute } from "astro";
import { ConvexError } from "convex/values";
import { api, database } from "../../utils/database";
import { authenticated } from "../../utils/auth";
import { json, readBody, sameOrigin } from "../../utils/http";
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!authenticated(cookies, "admin")) return json({ error: "Please sign in as an administrator." }, 401);
  try {
    const { slug, isPublic } = await readBody(request);
    if (typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/.test(slug) || typeof isPublic !== "boolean") return json({ error: "Invalid request." }, 400);
    const { client, secret } = database();
    return json({ success: true, isPublic: await client.mutation(api.posts.setVisibility, { secret, slug, isPublic }) });
  } catch (error) { return json({ error: error instanceof ConvexError ? String(error.data) : "Unable to update this post. Please try again." }, error instanceof ConvexError || error instanceof SyntaxError ? 400 : 503); }
};
