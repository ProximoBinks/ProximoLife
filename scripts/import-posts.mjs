import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import sanitize from "sanitize-html";
const args = process.argv.slice(2);
const file = args.find(arg => !arg.startsWith("--"));
if (!file) throw new Error("Usage: npm run migrate:posts -- posts.json [--apply] [--prod]");
const source = JSON.parse(await readFile(file, "utf8"));
if (!Array.isArray(source)) throw new Error("Export must be a JSON array of Supabase posts.");
const seen = new Set();
const posts = source.map((row, i) => {
  const tags = row.tags ?? [];
  if (![row.title, row.content, row.author, row.slug].every(v => typeof v === "string" && v.trim()) || row.title.length > 200 || row.author.length > 100 || row.content.length > 100000 || row.slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || !Array.isArray(tags) || tags.length > 20 || tags.some(t => typeof t !== "string" || !t.trim() || t.length > 40) || !Number.isFinite(Date.parse(row.created_at))) throw new Error(`Invalid post at row ${i + 1}`);
  if (seen.has(row.slug)) throw new Error(`Duplicate slug at row ${i + 1}`);
  seen.add(row.slug);
  const likes = row.likes ?? 0, views = row.views ?? 0;
  if (![likes, views].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error(`Invalid counts at row ${i + 1}`);
  return { title: row.title, content: sanitize(row.content), author: row.author, slug: row.slug, tags, created_at: new Date(row.created_at).toISOString(), likes, views, ...(row.id ? { legacyId: String(row.id) } : {}) };
});
console.log(`Validated ${posts.length} posts. Existing slugs will be skipped, never overwritten.`);
if (!args.includes("--apply")) { console.log("Dry run only. Add --apply to import into the configured Convex deployment."); process.exit(0); }
// Keep each transaction and command below size limits; resumable by slug.
let batch = [], size = 0;
function flush() {
  if (!batch.length) return;
  const result = spawnSync("npx", ["convex", "run", ...(args.includes("--prod") ? ["--prod"] : []), "posts:importPosts", JSON.stringify({ posts: batch })], { encoding: "utf8", maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error("Import stopped. Check deployment access, then rerun safely. " + result.stderr);
  console.log(result.stdout.trim()); batch = []; size = 0;
}
for (const post of posts) {
  const bytes = Buffer.byteLength(JSON.stringify(post));
  if (size + bytes > 150000 || batch.length >= 50) flush();
  batch.push(post); size += bytes;
}
flush();
