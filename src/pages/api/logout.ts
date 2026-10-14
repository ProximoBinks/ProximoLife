import type { APIRoute } from "astro";
import { sameOrigin } from "../../utils/http";
export const POST: APIRoute = ({ request, cookies, redirect }) => {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  cookies.delete("proximo_session", { path: "/" });
  return redirect("/", 303);
};
