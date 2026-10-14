import type { APIContext } from "astro";
import { createHmac, randomUUID } from "node:crypto";
import { api, database } from "./database";
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export function sameOrigin(request: Request) { return request.headers.get("origin") === new URL(request.url).origin; }
export async function readBody(request: Request) {
  const text = await request.text();
  if (text.length > 120000) throw new Error("Request too large");
  if (request.headers.get("content-type")?.includes("application/json")) return JSON.parse(text);
  return Object.fromEntries(new URLSearchParams(text));
}
export async function allowRequest(context: APIContext, action: string, maximum: number) {
  const { client, secret } = database();
  const key = createHmac("sha256", secret).update(`${action}:${context.clientAddress}`).digest("hex");
  return client.mutation(api.posts.rateLimit, { secret, key, maximum, windowMs: 900000 });
}
export function visitor(context: APIContext) {
  let id = context.cookies.get("proximo_visitor")?.value;
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    id = randomUUID();
    context.cookies.set("proximo_visitor", id, { path: "/", httpOnly: true, secure: context.url.protocol === "https:", sameSite: "lax", maxAge: 31536000 });
  }
  return id;
}
