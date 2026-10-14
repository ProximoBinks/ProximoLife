// Renders public/og-image.jpg (1200x630) from the site's own Aqua stylesheet.
// Run with the dev server up: `npm run dev`, then `node scripts/og-image.mjs`.
import { chromium } from "@playwright/test";

const origin = process.env.OG_ORIGIN ?? "http://127.0.0.1:4321";
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/aqua/aqua.css">
<style>
  @font-face { font-family: "Lucida Grande"; font-weight: 400; src: url("/aqua/fonts/lucida-grande-400.woff2") format("woff2"); }
  @font-face { font-family: "Lucida Grande"; font-weight: 700; src: url("/aqua/fonts/lucida-grande-700.woff2") format("woff2"); }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { background: #3a5a9a url("/aqua/aqua-blue.jpg") center / cover; position: relative; }
  .menubar { position: absolute; inset: 0 0 auto; height: 30px; font-size: 17px; padding: 0 14px; gap: 6px; }
  .menubar .app-name, .menubar .menu-title { line-height: 30px; padding: 0 11px; }
  .menubar img { width: 20px; height: 20px; margin: 0 6px 0 2px; }
  .menubar .clock-text { font-size: 16px; }
  .card { position: absolute; left: 50%; top: 62px; width: 960px; transform: translateX(-50%); border-radius: 10px 10px 8px 8px; box-shadow: 0 30px 70px rgb(0 0 0 / .45), 0 6px 18px rgb(0 0 0 / .3); }
  .card .title-bar-text { font-size: 15px; }
  .card .title-bar-text img { width: 18px; height: 18px; vertical-align: -3px; margin-right: 6px; }
  .card .window-body { display: grid; grid-template-columns: 300px 1fr; align-items: center; gap: 36px; padding: 40px 56px 46px 44px; }
  .mascot { width: 300px; height: 300px; filter: drop-shadow(0 10px 14px rgb(0 0 0 / .28)); }
  h1 { margin: 0 0 6px; font-size: 96px; line-height: 1; letter-spacing: -2px; color: #111; }
  .tagline { margin: 0 0 22px; font-size: 30px; color: #333; }
  .about { margin: 0 0 28px; font-size: 22px; line-height: 1.5; color: #333; max-width: 560px; }
  .tags { display: flex; gap: 10px; flex-wrap: wrap; }
  .tags span { font-size: 17px; height: 28px; padding: 0 14px; border-radius: 5px; }
  .status-bar { font-size: 15px; padding: 6px 14px; }
</style></head><body class="aqua">
<div class="menubar"><img src="/favicon-32.png" alt=""><span class="app-name">proximo</span><span class="menu-title">Diary</span><span class="menu-title">Contact</span><span class="menu-title">RSS</span><span class="spacer"></span><span class="clock-text">Adelaide</span></div>
<section class="window card">
  <div class="title-bar"><div class="title-bar-controls"><button aria-label="Close"></button><button aria-label="Minimize"></button><button aria-label="Zoom"></button></div><div class="title-bar-text"><img src="/aqua/icons/documentsfolder.png" alt="">About proximo</div><div style="width:49px"></div></div>
  <div class="window-body">
    <img class="mascot" src="/images/gengar.webp" alt="">
    <div>
      <h1>proximo</h1>
      <p class="tagline">a little corner of the internet</p>
      <p class="about">An online diary from Adelaide about the things I’m building, money, health and everyday life.</p>
      <div class="tags"><span class="placard">coding</span><span class="placard">money</span><span class="placard">health</span><span class="placard">life</span></div>
    </div>
  </div>
  <div class="status-bar"><span>Digital Diary</span></div>
</section>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Serve the card from the site's own origin so its root-relative asset paths resolve.
await page.route(`${origin}/__og-card`, route => route.fulfill({ body: html, contentType: "text/html; charset=utf-8" }));
await page.goto(`${origin}/__og-card`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og-image.jpg", type: "jpeg", quality: 90 });
await browser.close();
console.log("wrote public/og-image.jpg");
