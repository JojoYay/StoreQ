/**
 * 文字崩れ・レイアウト確認テスト
 *
 * 各ページをモバイル / タブレット / デスクトップ の3ビューポートで確認し
 *  - 横スクロールが発生していないか
 *  - テキスト要素がコンテナからはみ出していないか
 * をチェックする。
 *
 * 実行方法:
 *   # ローカル (dev サーバーを先に起動: npm run dev)
 *   npx playwright test layout
 *
 *   # 本番サイト
 *   PLAYWRIGHT_BASE_URL=https://storeq-9f4ba.web.app npx playwright test layout
 *
 * 管理者ページのテストには以下の環境変数が必要:
 *   TEST_ADMIN_EMAIL=xxx@example.com
 *   TEST_ADMIN_PASSWORD=yourpassword
 *   TEST_STORE_ID=your-store-id
 */

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  testStoreId,
  getHorizontalOverflow,
  findOverflowingTextElements,
} from "./helpers";

// ─────────────────────────────────────────────
// 公開ページ（認証不要）
// ─────────────────────────────────────────────
test.describe("公開ページ レイアウト", () => {
  test("ログインページ - 横スクロールなし", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const overflow = await getHorizontalOverflow(page);
    expect(overflow, "横スクロールが発生しています").toBe(0);
  });

  test("ログインページ - テキストはみ出しなし", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const overflowing = await findOverflowingTextElements(page);
    expect(overflowing, `はみ出しテキスト: ${overflowing.join(", ")}`).toHaveLength(0);
  });

  test("トップページ - 横スクロールなし", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const overflow = await getHorizontalOverflow(page);
    expect(overflow).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 管理者ページ（要ログイン）
// ─────────────────────────────────────────────

const adminPages = [
  { name: "フロア管理", path: () => `/stores/${testStoreId()}` },
  { name: "キュー管理", path: () => `/queue/${testStoreId()}` },
  { name: "QRコード", path: () => `/stores/${testStoreId()}/qr` },
  { name: "店舗設定", path: () => `/stores/${testStoreId()}/settings` },
  { name: "マップエディター", path: () => `/stores/${testStoreId()}/map` },
  { name: "店舗一覧", path: () => "/stores" },
];

test.describe("管理者ページ レイアウト", () => {
  // 各テスト前にログイン
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { name, path } of adminPages) {
    test(`${name} - 横スクロールなし`, async ({ page }) => {
      await page.goto(path());
      await page.waitForLoadState("networkidle");
      // ローディングスピナーが消えるまで待つ
      await page.waitForFunction(
        () => !document.querySelector(".animate-spin"),
        { timeout: 8000 }
      ).catch(() => {}); // スピナーがなければ無視

      const overflow = await getHorizontalOverflow(page);
      expect(
        overflow,
        `${name} でページ幅を超えるコンテンツが ${overflow}px はみ出しています`
      ).toBe(0);
    });

    test(`${name} - テキストはみ出しなし`, async ({ page }) => {
      await page.goto(path());
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(
        () => !document.querySelector(".animate-spin"),
        { timeout: 8000 }
      ).catch(() => {});

      const overflowing = await findOverflowingTextElements(page);
      expect(
        overflowing,
        `${name} でテキストがコンテナからはみ出しています: ${overflowing.join(" / ")}`
      ).toHaveLength(0);
    });
  }
});

// ─────────────────────────────────────────────
// 席カード個別テスト（フロア管理）
// ─────────────────────────────────────────────
test.describe("フロア管理 席カード", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("席カードのラベルが縦に崩れていない（各カードの行数 ≤ 2）", async ({ page }) => {
    await page.goto(`/stores/${testStoreId()}`);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 8000 }
    ).catch(() => {});

    // 席ラベル要素の高さをチェック（1行=約20px、2行まで許容）
    const tallLabels = await page.evaluate(() => {
      const labels = document.querySelectorAll<HTMLElement>("p.truncate");
      const results: string[] = [];
      labels.forEach((el) => {
        if (el.offsetHeight > 40) {
          // 40px = 約2行分
          results.push(el.textContent?.trim() ?? "");
        }
      });
      return results;
    });

    expect(
      tallLabels,
      `縦に崩れている席ラベル: ${tallLabels.join(", ")}`
    ).toHaveLength(0);
  });

  test("使用中カードの経過時間が1行に収まっている", async ({ page }) => {
    await page.goto(`/stores/${testStoreId()}`);
    await page.waitForLoadState("networkidle");

    const overflowingElapsed = await page.evaluate(() => {
      const els = document.querySelectorAll<HTMLElement>("p.whitespace-nowrap");
      const results: string[] = [];
      els.forEach((el) => {
        if (el.scrollWidth > el.offsetWidth + 4) {
          results.push(el.textContent?.trim() ?? "");
        }
      });
      return results;
    });

    expect(
      overflowingElapsed,
      `経過時間が折り返しています: ${overflowingElapsed.join(", ")}`
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// スクリーンショット（目視確認用）
// ─────────────────────────────────────────────
test.describe("スクリーンショット（目視確認）", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("フロア管理 スクリーンショット", async ({ page }) => {
    await page.goto(`/stores/${testStoreId()}`);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 8000 }
    ).catch(() => {});
    await page.screenshot({
      path: `playwright-report/screenshots/floor-${page.viewportSize()?.width}w.png`,
      fullPage: true,
    });
  });

  test("キュー管理 スクリーンショット", async ({ page }) => {
    await page.goto(`/queue/${testStoreId()}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `playwright-report/screenshots/queue-${page.viewportSize()?.width}w.png`,
      fullPage: true,
    });
  });
});
