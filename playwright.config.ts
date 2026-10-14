import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "tests/browser", use: { baseURL: "http://127.0.0.1:4321", browserName: "chromium" }, workers: 1, webServer: { command: "npm run dev -- --host 127.0.0.1", url: "http://127.0.0.1:4321", reuseExistingServer: true }, reporter: "list" });
