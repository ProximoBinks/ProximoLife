import { query, mutation, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v, ConvexError } from "convex/values";
function authorize(secret: string) {
  if (!process.env.CONVEX_SERVER_SECRET || secret !== process.env.CONVEX_SERVER_SECRET) throw new ConvexError("Unauthorized");
}
const fields = { title: v.string(), content: v.string(), author: v.string(), slug: v.string(), tags: v.array(v.string()) };
function validate(post: { title: string; content: string; author: string; slug: string; tags: string[] }) {
  if (!post.title.trim() || post.title.length > 200 || !post.author.trim() || post.author.length > 100 || !post.content.trim() || post.content.length > 100000 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || post.slug.length > 200 || post.tags.length > 20 || post.tags.some(t => !t.trim() || t.length > 40)) throw new ConvexError("Invalid post");
}
// Posts saved before visibility existed have no flag and stay private.
function excerpt(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 220).replace(/\s+\S*$/, "")}…` : text;
}
export const list = query({
  args: { secret: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { secret, paginationOpts }) => {
    authorize(secret);
    const result = await ctx.db.query("posts").withIndex("by_date").order("desc").paginate({ ...paginationOpts, numItems: Math.min(paginationOpts.numItems, 30) });
    return { posts: result.page.map(({ content, ...post }) => ({ ...post, excerpt: post.isPublic ? excerpt(content) : null })), next: result.isDone ? null : result.continueCursor };
  },
});
export const get = query({ args: { secret: v.string(), slug: v.string() }, handler: async (ctx, { secret, slug }) => {
  authorize(secret);
  return await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", slug)).unique();
}});
export const create = mutation({ args: { secret: v.string(), ...fields, isPublic: v.boolean() }, handler: async (ctx, { secret, ...post }) => {
  authorize(secret); validate(post);
  if (await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", post.slug)).unique()) throw new ConvexError("This URL is already in use. Choose another slug.");
  return await ctx.db.insert("posts", { ...post, created_at: new Date().toISOString(), likes: 0, views: 0 });
}});
export const interact = mutation({ args: { secret: v.string(), slug: v.string(), visitor: v.string(), kind: v.union(v.literal("like"), v.literal("view")), reader: v.boolean() }, handler: async (ctx, { secret, slug, visitor, kind, reader }) => {
  authorize(secret);
  if (!/^[a-f0-9-]{36}$/.test(visitor)) throw new ConvexError("Invalid visitor");
  const post = await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", slug)).unique();
  if (!post || (!post.isPublic && !reader)) throw new ConvexError("Post not found");
  const existing = await ctx.db.query("interactions").withIndex("by_visitor", q => q.eq("postId", post._id).eq("visitor", visitor).eq("kind", kind)).unique();
  const field = kind === "like" ? "likes" : "views";
  if (existing) return post[field];
  await ctx.db.insert("interactions", { postId: post._id, visitor, kind });
  await ctx.db.patch(post._id, { [field]: post[field] + 1 });
  return post[field] + 1;
}});
export const setVisibility = mutation({ args: { secret: v.string(), slug: v.string(), isPublic: v.boolean() }, handler: async (ctx, { secret, slug, isPublic }) => {
  authorize(secret);
  const post = await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", slug)).unique();
  if (!post) throw new ConvexError("Post not found");
  await ctx.db.patch(post._id, { isPublic });
  return isPublic;
}});
export const rateLimit = mutation({ args: { secret: v.string(), key: v.string(), maximum: v.number(), windowMs: v.number() }, handler: async (ctx, { secret, key, maximum, windowMs }) => {
  authorize(secret);
  const now = Date.now();
  const entry = await ctx.db.query("limits").withIndex("by_key", q => q.eq("key", key)).unique();
  if (!entry) { await ctx.db.insert("limits", { key, count: 1, resetAt: now + windowMs }); return true; }
  if (entry.resetAt <= now) { await ctx.db.patch(entry._id, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= maximum) return false;
  await ctx.db.patch(entry._id, { count: entry.count + 1 }); return true;
}});
// Only callable through the authenticated Convex CLI, never from a browser.
export const importPosts = internalMutation({ args: { posts: v.array(v.object({ ...fields, created_at: v.string(), likes: v.number(), views: v.number(), legacyId: v.optional(v.string()), isPublic: v.optional(v.boolean()) })) }, handler: async (ctx, { posts }) => {
  let imported = 0;
  for (const post of posts) {
    validate(post);
    if (!Number.isFinite(Date.parse(post.created_at)) || !Number.isSafeInteger(post.likes) || !Number.isSafeInteger(post.views) || post.likes < 0 || post.views < 0) throw new ConvexError("Invalid imported metadata");
    if (await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", post.slug)).unique()) continue;
    await ctx.db.insert("posts", post); imported++;
  }
  return { imported, skipped: posts.length - imported };
}});

// Editorial updates are CLI-only and can change only title/content.
// Comparing the original text prevents overwriting edits made after review.
export const rewriteContent = internalMutation({
  args: { updates: v.array(v.object({ slug: v.string(), expectedTitle: v.string(), expectedContent: v.string(), title: v.string(), content: v.string() })) },
  handler: async (ctx, { updates }) => {
    if (updates.length > 50 || new Set(updates.map(p => p.slug)).size !== updates.length) throw new ConvexError("Invalid rewrite batch");
    for (const update of updates) {
      const post = await ctx.db.query("posts").withIndex("by_slug", q => q.eq("slug", update.slug)).unique();
      if (!post) throw new ConvexError("Post not found");
      if (post.title !== update.expectedTitle || post.content !== update.expectedContent) throw new ConvexError("Post changed since review; fetch the latest text before rewriting");
      validate({ ...post, title: update.title, content: update.content });
      await ctx.db.patch(post._id, { title: update.title, content: update.content });
    }
    return { updated: updates.length };
  },
});
