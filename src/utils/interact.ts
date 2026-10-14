import type { APIRoute } from "astro";
import { ConvexError } from "convex/values";
import { api, database } from "./database";
import { authenticated } from "./auth";
import { allowRequest, json, readBody, sameOrigin, visitor } from "./http";
export function interaction(kind: "like" | "view"): APIRoute {
  return async (context) => {
    if (!sameOrigin(context.request)) return json({ error: "Forbidden" }, 403);
    try {
      const { slug } = await readBody(context.request);
      if (typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/.test(slug)) return json({ error: "Invalid post URL." }, 400);
      if (!await allowRequest(context, "interact", 120)) return json({ error: "Please try again later." }, 429);
      const { client, secret } = database();
      const count = await client.mutation(api.posts.interact, { secret, slug, visitor: visitor(context), kind, reader: authenticated(context.cookies, "reader") });
      return json({ success: true, [kind === "like" ? "newLikes" : "newViews"]: count });
    } catch (error) {
      // Private posts answer like missing ones so anonymous visitors learn nothing about them.
      if (error instanceof ConvexError) return json({ error: "Please sign in again." }, 401);
      return json({ error: "Unable to update this post. Please try again." }, 503);
    }
  };
}
