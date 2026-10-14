import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  posts: defineTable({ title: v.string(), content: v.string(), author: v.string(), slug: v.string(), tags: v.array(v.string()), created_at: v.string(), views: v.number(), likes: v.number(), legacyId: v.optional(v.string()), isPublic: v.optional(v.boolean()), pinnedAt: v.optional(v.number()) }).index("by_slug", ["slug"]).index("by_date", ["created_at"]).index("by_pinned", ["pinnedAt"]),
  interactions: defineTable({ postId: v.id("posts"), visitor: v.string(), kind: v.union(v.literal("like"), v.literal("view")) }).index("by_visitor", ["postId", "visitor", "kind"]),
  limits: defineTable({ key: v.string(), count: v.number(), resetAt: v.number() }).index("by_key", ["key"]),
});
