import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import sanitize from "sanitize-html";
const args = process.argv.slice(2);
const file = args.find(arg => !arg.startsWith("--"));
if (!file) throw new Error("Usage: node scripts/rewrite-posts.mjs changes.json [--apply] [--prod]");
const prod = args.includes("--prod");
const env = parseEnv(readFileSync(prod ? ".env.production" : ".env.local", "utf8"));
const client = new ConvexHttpClient(env.CONVEX_URL);
const payload = JSON.parse(readFileSync(file, "utf8"));
assert.ok(Array.isArray(payload.updates) && payload.updates.length > 0);
const before = [];
for (const update of payload.updates) {
  assert.equal(sanitize(update.content), update.content, "Rewrite must contain safe HTML only");
  const post = await client.query(makeFunctionReference("posts:get"), { secret: env.CONVEX_SERVER_SECRET, slug: update.slug });
  assert.ok(post, "Post not found");
  assert.equal(post.title, update.expectedTitle, "Title changed since review");
  assert.equal(post.content, update.expectedContent, "Content changed since review");
  before.push(post);
}
console.log(`Validated ${before.length} rewrites for ${prod ? "production" : "development"}.`);
if (!args.includes("--apply")) { console.log("Dry run only; use --apply to save."); process.exit(0); }
const backup = `.env.sepia-before-${prod ? "production" : "development"}-${Date.now()}.json`;
assert.ok(!existsSync(backup));
writeFileSync(backup, JSON.stringify(before, null, 2), { mode: 0o600, flag: "wx" });
const result = spawnSync("npx", ["convex", "run", ...(prod ? ["--prod"] : []), "posts:rewriteContent", JSON.stringify(payload)], { encoding: "utf8", maxBuffer: 1024 * 1024 });
if (result.status !== 0) throw new Error("Rewrite failed. Original posts were backed up; inspect the Convex deployment before retrying.");
for (const [i, original] of before.entries()) {
  const after = await client.query(makeFunctionReference("posts:get"), { secret: env.CONVEX_SERVER_SECRET, slug: original.slug });
  assert.deepEqual(after, { ...original, title: payload.updates[i].title, content: payload.updates[i].content }, "Post verification failed; inspect concurrent edits or counter activity");
}
console.log(`Updated ${before.length} posts. Verified all metadata unchanged. Backup: ${backup}`);
