import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [375, 1280]) {
  test(`public pages are accessible and fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/contact", "/blog", "/login", "/secret", "/missing-page"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    }
  });
}
test("first render uses no remote fonts and has no layout shifts", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).layoutShifts = [];
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!(entry as any).hadRecentInput) (window as any).layoutShifts.push((entry as any).value); }).observe({ type: "layout-shift", buffered: true });
  });
  const fonts: string[] = [];
  page.on("request", request => { if (request.resourceType() === "font" && !request.url().startsWith("http://127.0.0.1:4321/")) fonts.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
  expect(fonts).toEqual([]);
  expect(await page.evaluate(() => (window as any).layoutShifts.reduce((a: number, b: number) => a + b, 0))).toBe(0);
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
test("contact preserves input and announces server failure", async ({ page }) => {
  await page.route("**/api/contact", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Email is temporarily unavailable." }) }));
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Test reader");
  await page.getByLabel("Email address").fill("reader@example.com");
  await page.getByLabel("Message", { exact: true }).fill("A test message.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText("Email is temporarily unavailable.");
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("A test message.");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});
test("protected routes and endpoints enforce authorization", async ({ page, request }) => {
  await page.goto("/admin/new-post");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  const unauthenticated = await request.post("/api/new-post", { headers: { Origin: "http://127.0.0.1:4321" }, data: {} });
  expect(unauthenticated.status()).toBe(401);
  const crossOrigin = await request.post("/api/new-post", { headers: { Origin: "https://example.com" }, data: {} });
  expect(crossOrigin.status()).toBe(403);
});

test("reader and administrator sign-in render protected pages without content flashes", async ({ page }) => {
  const env = parseEnv(readFileSync(".env.local", "utf8"));
  test.skip(!env.BLOG_PASSWORD || !env.ADMIN_PASSWORD, "Local passwords are not configured");
  await page.goto("/blog");
  const entry = page.locator(".list tr:has(.badge) .title").first();
  test.skip(await entry.count() === 0, "No imported posts");
  await entry.click();
  await expect(page).toHaveURL(/\/login\?/);
  await page.getByLabel("Password", { exact: true }).fill(env.BLOG_PASSWORD);
  await page.route("**/api/view-post", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, newViews: 10 }) }));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator(".post-content")).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.goto("/admin/new-post");
  await expect(page).toHaveURL(/\/login\?/);
  await page.getByLabel("Password", { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Post content")).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("A new thought");
  await expect(page.getByLabel("URL slug")).toHaveValue("a-new-thought");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/admin/new-post");
  await expect(page).toHaveURL(/\/login\?/);
});
