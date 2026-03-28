import { Page } from "@playwright/test";

/** Firebase Hosting の本番URL（未設定時は localhost） */
export const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** 管理者ログイン（テスト用アカウント） */
export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD 環境変数が設定されていません"
    );
  }
  await page.goto("/login");
  await page.getByLabel(/メールアドレス|email/i).fill(email);
  await page.getByLabel(/パスワード|password/i).fill(password);
  await page.getByRole("button", { name: /ログイン|sign in/i }).click();
  // ログイン完了を待つ（ダッシュボード or フロア管理へリダイレクト）
  await page.waitForURL(/\/(dashboard|stores)/, { timeout: 10_000 });
}

/** テスト用店舗ID（環境変数から取得） */
export function testStoreId(): string {
  const id = process.env.TEST_STORE_ID;
  if (!id) throw new Error("TEST_STORE_ID 環境変数が設定されていません");
  return id;
}

/**
 * ページ全体の横スクロールを検出する
 * scrollWidth > clientWidth の場合は横はみ出しあり
 */
export async function getHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
}

/**
 * 指定セレクター内のテキストが視覚的にクリップされているか確認する
 * overflow: hidden + 実際の scrollWidth > offsetWidth の要素を返す
 */
export async function findOverflowingTextElements(
  page: Page,
  selector: string = "p, span, h1, h2, h3, button"
): Promise<string[]> {
  return page.evaluate((sel) => {
    const elements = document.querySelectorAll<HTMLElement>(sel);
    const overflowing: string[] = [];
    elements.forEach((el) => {
      if (el.scrollWidth > el.offsetWidth + 2) {
        // 2px の許容範囲
        const text = el.textContent?.trim().slice(0, 30) ?? "";
        if (text) overflowing.push(text);
      }
    });
    return overflowing;
  }, selector);
}
