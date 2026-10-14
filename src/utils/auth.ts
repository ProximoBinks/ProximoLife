import { createHmac, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";
export type Role = "reader" | "admin";
export function matches(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function sign(value: string) {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Session secret must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function authenticated(cookies: AstroCookies, role: Role) {
  try {
    const token = cookies.get("proximo_session")?.value ?? "";
    const [savedRole, expires, signature] = token.split(".");
    return (savedRole === role || savedRole === "admin") && Number(expires) > Date.now() && matches(signature ?? "", sign(`${savedRole}.${expires}`));
  } catch { return false; }
}
export function login(cookies: AstroCookies, role: Role, secure: boolean) {
  const value = `${role}.${Date.now() + 86400000}`;
  cookies.set("proximo_session", `${value}.${sign(value)}`, { path: "/", httpOnly: true, secure, sameSite: "lax", maxAge: 86400 });
}
export function safeReturn(value: string) {
  return /^\/(?:blog(?:\/[a-z0-9-]+)?|admin\/new-post|admin\/edit\/[a-z0-9-]+)$/.test(value) ? value : "/blog";
}
