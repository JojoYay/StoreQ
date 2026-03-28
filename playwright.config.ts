import { defineConfig, devices } from "@playwright/test";

/**
 * 文字崩れ・レイアウト確認用 E2E テスト設定
 *
 * 実行方法:
 *   npx playwright test              # 全テスト
 *   npx playwright test --ui         # インタラクティブUI
 *   npx playwright test layout       # レイアウトテストのみ
 *
 * ターゲットURL は環境変数 PLAYWRIGHT_BASE_URL で切り替え可能
 *   デフォルト: ローカル開発サーバー (http://localhost:3000)
 *   本番: PLAYWRIGHT_BASE_URL=https://storeq-9f4ba.web.app npx playwright test
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  reporter: [["html", { open: "never" }], ["line"]],
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
  },
  projects: [
    // ── タブレット（iPad 縦）
    {
      name: "tablet-portrait",
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    // ── タブレット（iPad 横）
    {
      name: "tablet-landscape",
      use: {
        viewport: { width: 1024, height: 768 },
        userAgent: devices["iPad (gen 7)"].userAgent,
      },
    },
    // ── モバイル（iPhone SE）
    {
      name: "mobile",
      use: { ...devices["iPhone SE"] },
    },
    // ── デスクトップ
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  // ローカルで開発サーバーを自動起動する場合のみ有効化
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: true,
  // },
});
