import { beforeEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
const secret = "test-only-server-secret";
const post = { title: "A thought", author: "Elliot", content: "<p>Private words</p>", slug: "a-thought", tags: ["life"] };
beforeEach(() => { vi.stubEnv("CONVEX_SERVER_SECRET", secret); });
test("all public functions reject an invalid gateway secret", async () => {
  const t = convexTest(schema, modules);
  await expect(t.query(api.posts.list, { secret: "wrong", paginationOpts: { numItems: 30, cursor: null } })).rejects.toThrow("Unauthorized");
  await expect(t.query(api.posts.get, { secret: "wrong", slug: post.slug })).rejects.toThrow("Unauthorized");
  await expect(t.mutation(api.posts.create, { secret: "wrong", ...post, isPublic: false })).rejects.toThrow("Unauthorized");
});
test("create validates posts, prevents duplicate slugs, and keeps private content out of lists", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.posts.create, { secret, ...post, isPublic: false });
  await expect(t.mutation(api.posts.create, { secret, ...post, isPublic: false })).rejects.toThrow("already in use");
  await expect(t.mutation(api.posts.create, { secret, ...post, isPublic: false, slug: "bad/slug" })).rejects.toThrow("Invalid post");
  const list = await t.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: null } });
  expect(list.posts).toHaveLength(1); expect(list.posts[0]).not.toHaveProperty("content");
  expect((await t.query(api.posts.get, { secret, slug: post.slug }))?.content).toBe(post.content);
});
test("concurrent likes and views count each visitor only once", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.posts.create, { secret, ...post, isPublic: false });
  const visitor = "11111111-1111-1111-1111-111111111111";
  await Promise.all(Array.from({ length: 5 }, () => t.mutation(api.posts.interact, { secret, slug: post.slug, visitor, kind: "like", reader: true })));
  await t.mutation(api.posts.interact, { secret, slug: post.slug, visitor, kind: "view", reader: true });
  await t.mutation(api.posts.interact, { secret, slug: post.slug, visitor, kind: "view", reader: true });
  const saved = await t.query(api.posts.get, { secret, slug: post.slug });
  expect(saved?.likes).toBe(1); expect(saved?.views).toBe(1);
});
test("import is repeatable and preserves dates, legacy IDs, counters and tags", async () => {
  const t = convexTest(schema, modules);
  const source = { ...post, created_at: "2024-01-02T00:00:00.000Z", likes: 12, views: 29, legacyId: "original-uuid" };
  expect(await t.mutation(internal.posts.importPosts, { posts: [source] })).toEqual({ imported: 1, skipped: 0 });
  expect(await t.mutation(internal.posts.importPosts, { posts: [source] })).toEqual({ imported: 0, skipped: 1 });
  expect(await t.query(api.posts.get, { secret, slug: post.slug })).toMatchObject(source);
});
test("pagination does not skip entries with identical timestamps", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.posts.importPosts, { posts: Array.from({ length: 35 }, (_, i) => ({ ...post, slug: `entry-${i}`, created_at: "2024-01-02T00:00:00.000Z", likes: 0, views: 0 })) });
  const first = await t.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: null } });
  const second = await t.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: first.next } });
  expect(new Set([...first.posts, ...second.posts].map(p => p.slug)).size).toBe(35);
});
test("rate limits persist and reset after their window", async () => {
  vi.useFakeTimers();
  try {
    const t = convexTest(schema, modules);
    const args = { secret, key: "test", maximum: 1, windowMs: 1000 };
    expect(await t.mutation(api.posts.rateLimit, args)).toBe(true);
    expect(await t.mutation(api.posts.rateLimit, args)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(await t.mutation(api.posts.rateLimit, args)).toBe(true);
  } finally { vi.useRealTimers(); }
});

test("editorial rewrites change only title and content and reject stale text atomically", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.posts.importPosts, { posts: [{ ...post, created_at: "2024-01-02T00:00:00.000Z", likes: 12, views: 29, legacyId: "original-uuid" }, { ...post, slug: "second-post", created_at: "2024-01-03T00:00:00.000Z", likes: 3, views: 8 }] });
  const before = (await t.query(api.posts.get, { secret, slug: post.slug }))!;
  const update = { slug: post.slug, expectedTitle: post.title, expectedContent: post.content, title: "A revised title", content: "<p>Revised words</p>" };
  await t.mutation(internal.posts.rewriteContent, { updates: [update] });
  const after = (await t.query(api.posts.get, { secret, slug: post.slug }))!;
  expect(after).toEqual({ ...before, title: update.title, content: update.content });
  await expect(t.mutation(internal.posts.rewriteContent, { updates: [{ ...update, slug: "second-post" }, update] })).rejects.toThrow("Post changed since review");
  expect((await t.query(api.posts.get, { secret, slug: "second-post" }))?.title).toBe(post.title);
});

test("dated editorial updates preserve metadata and reject stale dates", async () => {
  const t = convexTest(schema, modules);
  const source = { ...post, created_at: "2026-09-23T00:00:00.000Z", likes: 12, views: 29, isPublic: true };
  await t.mutation(internal.posts.importPosts, { posts: [source] });
  const before = (await t.query(api.posts.get, { secret, slug: post.slug }))!;
  const update = { slug: post.slug, expectedTitle: post.title, expectedContent: post.content, expectedDate: source.created_at, title: "Diary", content: "<p>Today</p>", created_at: "2026-09-25T00:00:00.000Z" };
  await t.mutation(internal.posts.editDatedEntries, { updates: [update] });
  expect(await t.query(api.posts.get, { secret, slug: post.slug })).toEqual({ ...before, title: update.title, content: update.content, created_at: update.created_at });
  await expect(t.mutation(internal.posts.editDatedEntries, { updates: [{ ...update, expectedTitle: update.title, expectedContent: update.content }] })).rejects.toThrow("Post changed since review");
  await expect(t.mutation(internal.posts.editDatedEntries, { updates: [{ ...update, expectedTitle: update.title, expectedContent: update.content, expectedDate: update.created_at, created_at: "invalid" }] })).rejects.toThrow("Invalid date");
});

test("private posts hide excerpts and reject anonymous interactions until made public", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.posts.create, { secret, ...post, isPublic: false });
  await t.mutation(internal.posts.importPosts, { posts: [{ ...post, slug: "legacy-post", created_at: "2024-01-02T00:00:00.000Z", likes: 0, views: 0 }] });
  const visitor = "22222222-2222-2222-2222-222222222222";
  const list = async () => (await t.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: null } })).posts;
  expect((await list()).map(p => p.excerpt)).toEqual([null, null]);
  await expect(t.mutation(api.posts.interact, { secret, slug: "legacy-post", visitor, kind: "view", reader: false })).rejects.toThrow("Post not found");
  await expect(t.mutation(api.posts.interact, { secret, slug: post.slug, visitor, kind: "view", reader: false })).rejects.toThrow("Post not found");
  await expect(t.mutation(api.posts.setVisibility, { secret: "wrong", slug: post.slug, isPublic: true })).rejects.toThrow("Unauthorized");
  expect(await t.mutation(api.posts.setVisibility, { secret, slug: post.slug, isPublic: true })).toBe(true);
  expect((await list()).find(p => p.slug === post.slug)?.excerpt).toBe("Private words");
  expect(await t.mutation(api.posts.interact, { secret, slug: post.slug, visitor, kind: "view", reader: false })).toBe(1);
});

test("pinned entries come back most recently pinned first, capped, while list stays chronological", async () => {
  vi.useFakeTimers();
  try {
    const t = convexTest(schema, modules);
    await t.mutation(internal.posts.importPosts, { posts: Array.from({ length: 12 }, (_, i) => ({ ...post, slug: `entry-${i}`, created_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`, likes: 0, views: 0, isPublic: true })) });
    await expect(t.mutation(api.posts.setPinned, { secret: "wrong", slug: "entry-0", pinned: true })).rejects.toThrow("Unauthorized");
    await t.mutation(api.posts.setPinned, { secret, slug: "entry-0", pinned: true });
    vi.advanceTimersByTime(1000);
    await t.mutation(api.posts.setPinned, { secret, slug: "entry-5", pinned: true });
    expect((await t.query(api.posts.pinned, { secret })).map(p => p.slug)).toEqual(["entry-5", "entry-0"]);
    const list = await t.query(api.posts.list, { secret, paginationOpts: { numItems: 30, cursor: null } });
    expect(list.posts.map(p => p.slug)).toEqual(Array.from({ length: 12 }, (_, i) => `entry-${11 - i}`));
    await t.mutation(api.posts.setPinned, { secret, slug: "entry-5", pinned: false });
    expect((await t.query(api.posts.pinned, { secret })).map(p => p.slug)).toEqual(["entry-0"]);
    for (let i = 1; i < 10; i++) { vi.advanceTimersByTime(1000); await t.mutation(api.posts.setPinned, { secret, slug: `entry-${i}`, pinned: true }); }
    await expect(t.mutation(api.posts.setPinned, { secret, slug: "entry-11", pinned: true })).rejects.toThrow("up to 10");
    // Re-pinning an already pinned entry is not blocked by the cap.
    await t.mutation(api.posts.setPinned, { secret, slug: "entry-0", pinned: true });
  } finally { vi.useRealTimers(); }
});
