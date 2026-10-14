import type { APIRoute } from "astro";
import { login, matches, safeReturn } from "../../utils/auth";
import { allowRequest, readBody, sameOrigin } from "../../utils/http";
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return new Response("Forbidden", { status: 403 });
  let destination = "/blog";
  try {
    const body = await readBody(context.request);
    destination = safeReturn(String(body.returnTo ?? ""));
    if (!await allowRequest(context, "login", 10)) return context.redirect(`/login?returnTo=${encodeURIComponent(destination)}&error=rate`, 303);
    const password = typeof body.password === "string" ? body.password : "";
    const admin = import.meta.env.ADMIN_PASSWORD;
    const reader = import.meta.env.BLOG_PASSWORD;
    const role = admin && matches(password, admin) ? "admin" : reader && matches(password, reader) ? "reader" : null;
    if (!role || (destination.startsWith("/admin") && role !== "admin")) return context.redirect(`/login?returnTo=${encodeURIComponent(destination)}&error=invalid`, 303);
    login(context.cookies, role, context.url.protocol === "https:");
    return context.redirect(destination, 303);
  } catch { return context.redirect(`/login?returnTo=${encodeURIComponent(destination)}&error=unavailable`, 303); }
};
