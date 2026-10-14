import { createHash } from "node:crypto";
// Fingerprint of the fields an edit could clobber. The editor submits the one it loaded,
// so a save is refused if the entry changed in the meantime (e.g. a CLI rewrite).
export function entryVersion(post: { title: string; content: string; created_at: string }) {
  return createHash("sha256").update(`${post.title}\u0000${post.content}\u0000${post.created_at}`).digest("hex");
}
