/**
 * サイドバー ナビゲーション アクティブ状態テスト
 *
 * 各ページを開いたとき、サイドバーで「正しい1項目だけ」がアクティブ（青く光る）
 * ことを確認する。複数項目が同時にアクティブになるバグを検出する。
 *
 * 実行方法:
 *   npx playwright test sidebar-nav
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, testStoreId } from "./helpers";

// ページと「期待されるアクティブ項目ラベル」のマッピング
const navCases = [
  {
    name: "フロア管理ページ",
    path: () => `/stores/${testStoreId()}`,
    expectedActive: "フロア管理",
    expectedInactive: ["キュー管理", "QRコード", "店舗設定", "店舗一覧"],
  },
  {
    name: "マップエディター（フロア管理配下）",
    path: () => `/stores/${testStoreId()}/map`,
    expectedActive: "フロア管理",
    expectedInactive: ["キュー管理", "QRコード", "店舗設定", "店舗一覧"],
  },
  {
    name: "キュー管理ページ",
    path: () => `/queue/${testStoreId()}`,
    expectedActive: "キュー管理",
    expectedInactive: ["フロア管理", "QRコード", "店舗設定", "店舗一覧"],
  },
  {
    name: "QRコードページ",
    path: () => `/stores/${testStoreId()}/qr`,
    expectedActive: "QRコード",
    expectedInactive: ["フロア管理", "キュー管理", "店舗設定", "店舗一覧"],
  },
  {
    name: "店舗設定ページ",
    path: () => `/stores/${testStoreId()}/settings`,
    expectedActive: "店舗設定",
    expectedInactive: ["フロア管理", "キュー管理", "QRコード", "店舗一覧"],
  },
  {
    name: "店舗一覧ページ",
    path: () => `/stores`,
    expectedActive: "店舗一覧",
    expectedInactive: ["フロア管理", "キュー管理", "QRコード", "店舗設定"],
  },
];

test.describe("サイドバー ナビゲーション アクティブ状態", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // SelectedStoreContext が localStorage から storeId を読むため、
    // goto の前に正しい storeId をセットしておく
    await page.evaluate((storeId) => {
      localStorage.setItem("selectedStoreId", storeId);
    }, testStoreId());
  });

  for (const { name, path, expectedActive, expectedInactive } of navCases) {
    test(`${name} - 「${expectedActive}」だけがアクティブ`, async ({ page }) => {
      await page.goto(path());
      await page.waitForLoadState("domcontentloaded");

      const sidebar = page.locator("aside.hidden.md\\:flex");
      // デスクトップサイドバーが表示されるまで待つ
      // （Firestoreはリアルタイム接続でnetworkidleにならないため domcontentloaded を使用）
      await sidebar.waitFor({ state: "visible", timeout: 15000 });

      // SelectedStoreContext が Firestore から店舗を取得するまで待つ
      // → サイドバーにフロア管理リンクが現れることで判定（店舗一覧ページは即表示なのでスキップ）
      if (expectedActive !== "店舗一覧") {
        await sidebar.locator(`a[href*="/stores/${testStoreId()}"], a[href*="/queue/${testStoreId()}"]`)
          .first()
          .waitFor({ state: "visible", timeout: 20000 });
      }

      // ── アクティブになっているリンクを全件取得 ──
      const activeLinks = sidebar.locator("a.bg-indigo-600");
      const activeCount = await activeLinks.count();
      const activeLabels: string[] = [];
      for (let i = 0; i < activeCount; i++) {
        const label = await activeLinks.nth(i).textContent();
        activeLabels.push(label?.trim() ?? "");
      }

      // アクティブ項目がちょうど1つであること
      expect(
        activeCount,
        `アクティブなナビ項目が ${activeCount} 個あります（期待: 1個）。アクティブ: [${activeLabels.join(", ")}]`
      ).toBe(1);

      // 期待するラベルがアクティブになっていること
      const activeText = await activeLinks.first().textContent();
      expect(
        activeText?.trim(),
        `「${expectedActive}」がアクティブになっていません。実際にアクティブ: 「${activeText?.trim()}」`
      ).toContain(expectedActive);

      // 非アクティブであるべき項目が光っていないこと
      for (const label of expectedInactive) {
        const link = sidebar.locator(`a:has-text("${label}")`);
        const count = await link.count();
        if (count === 0) continue; // そのページでは表示されない場合はスキップ

        const hasActive = await link.first().evaluate((el) =>
          el.classList.contains("bg-indigo-600")
        );
        expect(
          hasActive,
          `「${label}」が誤ってアクティブになっています（${name}）`
        ).toBe(false);
      }
    });
  }
});
