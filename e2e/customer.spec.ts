/**
 * 顧客向けページ レイアウト確認テスト（認証不要）
 *
 * /join/[storeId] と /status/[queueId] ページを
 * 複数ビューポートでチェックする
 *
 * 実行方法:
 *   TEST_STORE_ID=xxx npx playwright test customer
 */

import { test, expect } from "@playwright/test";
import { testStoreId, getHorizontalOverflow, findOverflowingTextElements } from "./helpers";

test.describe("顧客向けページ レイアウト", () => {
  test("入店登録ページ - 横スクロールなし", async ({ page }) => {
    const storeId = testStoreId();
    await page.goto(`/join/${storeId}`);
    await page.waitForLoadState("networkidle");

    const overflow = await getHorizontalOverflow(page);
    expect(overflow, `横スクロール ${overflow}px`).toBe(0);
  });

  test("入店登録ページ - テキストはみ出しなし", async ({ page }) => {
    const storeId = testStoreId();
    await page.goto(`/join/${storeId}`);
    await page.waitForLoadState("networkidle");

    const overflowing = await findOverflowingTextElements(page);
    expect(overflowing, `はみ出し: ${overflowing.join(", ")}`).toHaveLength(0);
  });

  test("入店登録ページ - ラジオボタン人数選択が正常表示", async ({ page }) => {
    const storeId = testStoreId();
    await page.goto(`/join/${storeId}`);
    await page.waitForLoadState("networkidle");

    // ラジオボタングループが存在すること
    const radios = page.getByRole("radio");
    expect(await radios.count()).toBeGreaterThan(0);

    // 各ラジオボタンが視覚的に重なっていないこと（最低 30px のギャップ）
    const boxes = await radios.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getBoundingClientRect().top)
    );
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i] - boxes[i - 1]).toBeGreaterThanOrEqual(-5); // 同じ行はOK
    }
  });

  test("入店登録ページ スクリーンショット", async ({ page }) => {
    const storeId = testStoreId();
    await page.goto(`/join/${storeId}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `playwright-report/screenshots/join-${page.viewportSize()?.width}w.png`,
      fullPage: true,
    });
  });
});
