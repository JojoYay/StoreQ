import { defineConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// .env.test.local を手動でパース（dotenvx の干渉を避けるため）
function loadEnvFile(file: string) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(".env.test.local");
loadEnvFile(".env.local");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 1,
  reporter: [["html", { open: "never" }], ["line"]],
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
    // Chromium のみ使用（インストール済みブラウザ）
    browserName: "chromium",
  },
  projects: [
    {
      name: "tablet-portrait",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "tablet-landscape",
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
