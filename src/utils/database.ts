import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
export { api };
export function database() {
  const url = import.meta.env.CONVEX_URL;
  const secret = import.meta.env.CONVEX_SERVER_SECRET;
  if (!url || !secret) throw new Error("Database is not configured");
  return { client: new ConvexHttpClient(url), secret };
}
