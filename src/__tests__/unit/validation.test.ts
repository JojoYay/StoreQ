/**
 * ユニットテスト: バリデーションスキーマ
 *
 * テスト対象:
 *   - joinFormSchema  (顧客の順番待ち登録フォーム)
 *   - storeFormSchema (管理者の店舗作成フォーム)
 *   - loginFormSchema (管理者ログインフォーム)
 */

import {
  joinFormSchema,
  storeFormSchema,
  loginFormSchema,
} from "@/lib/utils/validation";

// ─────────────────────────────────────────────
// joinFormSchema
// ─────────────────────────────────────────────
describe("joinFormSchema", () => {
  const valid = { customerName: "山田 太郎", partySize: 2 };

  test("正常なデータは通過する", () => {
    expect(joinFormSchema.safeParse(valid).success).toBe(true);
  });

  test("ラジオボタン由来の文字列 '4' は数値 4 に変換される (coerce)", () => {
    const result = joinFormSchema.safeParse({ customerName: "田中", partySize: "4" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partySize).toBe(4);
      expect(typeof result.data.partySize).toBe("number");
    }
  });

  test("名前が空文字はエラー", () => {
    const result = joinFormSchema.safeParse({ ...valid, customerName: "" });
    expect(result.success).toBe(false);
  });

  test("名前が51文字以上はエラー", () => {
    const result = joinFormSchema.safeParse({ ...valid, customerName: "あ".repeat(51) });
    expect(result.success).toBe(false);
  });

  test("人数 0 はエラー (min:1)", () => {
    const result = joinFormSchema.safeParse({ ...valid, partySize: 0 });
    expect(result.success).toBe(false);
  });

  test("人数 21 はエラー (max:20)", () => {
    const result = joinFormSchema.safeParse({ ...valid, partySize: 21 });
    expect(result.success).toBe(false);
  });

  test("人数が小数はエラー (int)", () => {
    const result = joinFormSchema.safeParse({ ...valid, partySize: 1.5 });
    expect(result.success).toBe(false);
  });

  test("人数 1 〜 8 は全て有効", () => {
    for (let n = 1; n <= 8; n++) {
      expect(joinFormSchema.safeParse({ ...valid, partySize: n }).success).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────
// storeFormSchema
// ─────────────────────────────────────────────
describe("storeFormSchema", () => {
  const valid = { name: "テスト食堂", averageSeatingDuration: 60 };

  test("正常なデータは通過する", () => {
    expect(storeFormSchema.safeParse(valid).success).toBe(true);
  });

  test("店舗名が空文字はエラー", () => {
    expect(storeFormSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  test("店舗名が101文字以上はエラー", () => {
    expect(
      storeFormSchema.safeParse({ ...valid, name: "あ".repeat(101) }).success
    ).toBe(false);
  });

  test("平均滞在4分はエラー (min:5)", () => {
    expect(
      storeFormSchema.safeParse({ ...valid, averageSeatingDuration: 4 }).success
    ).toBe(false);
  });

  test("平均滞在301分はエラー (max:300)", () => {
    expect(
      storeFormSchema.safeParse({ ...valid, averageSeatingDuration: 301 }).success
    ).toBe(false);
  });

  test("平均滞在 5・60・300 は有効", () => {
    for (const d of [5, 60, 300]) {
      expect(
        storeFormSchema.safeParse({ ...valid, averageSeatingDuration: d }).success
      ).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────
// loginFormSchema
// ─────────────────────────────────────────────
describe("loginFormSchema", () => {
  const valid = { email: "admin@example.com", password: "secret123" };

  test("正常なデータは通過する", () => {
    expect(loginFormSchema.safeParse(valid).success).toBe(true);
  });

  test("メールアドレス形式が不正はエラー", () => {
    expect(loginFormSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  test("パスワードが5文字はエラー (min:6)", () => {
    expect(loginFormSchema.safeParse({ ...valid, password: "12345" }).success).toBe(false);
  });

  test("パスワード6文字は有効", () => {
    expect(loginFormSchema.safeParse({ ...valid, password: "123456" }).success).toBe(true);
  });
});
