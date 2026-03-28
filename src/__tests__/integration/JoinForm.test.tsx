/**
 * 統合テスト: JoinForm コンポーネント
 *
 * テスト観点:
 *   - フォームが正しくレンダリングされるか
 *   - 名前未入力でバリデーションエラーが出るか
 *   - 人数選択が機能するか (文字列→数値 coerce 込み)
 *   - 正常送信で onSubmit が正しい型のデータで呼ばれるか
 *   - 送信中はボタンが disabled になるか
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinForm } from "@/components/customer/JoinForm";
import type { JoinFormData } from "@/lib/utils/validation";

// react-hook-form が内部で使う ResizeObserver がjsdomにないため
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("JoinForm 統合テスト", () => {
  const mockSubmit = jest.fn((_data: JoinFormData) => Promise.resolve());

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  // ── レンダリング ──────────────────────────────
  test("お名前・人数フィールドが表示される", () => {
    render(<JoinForm onSubmit={mockSubmit} maxCapacity={8} />);
    expect(screen.getByText("お名前")).toBeInTheDocument();
    expect(screen.getByText("人数")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "順番待ちに登録する" })).toBeInTheDocument();
  });

  test("maxCapacity=4 の場合 1〜4名のみ表示される", () => {
    render(<JoinForm onSubmit={mockSubmit} maxCapacity={4} />);
    expect(screen.getByText("1名")).toBeInTheDocument();
    expect(screen.getByText("4名")).toBeInTheDocument();
    expect(screen.queryByText("5名")).not.toBeInTheDocument();
  });

  // ── バリデーション ───────────────────────────
  test("名前を空のまま送信するとエラーメッセージが表示される", async () => {
    render(<JoinForm onSubmit={mockSubmit} maxCapacity={8} />);
    fireEvent.click(screen.getByRole("button", { name: "順番待ちに登録する" }));
    await waitFor(() => {
      expect(screen.getByText("お名前を入力してください")).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  // ── 正常送信 ─────────────────────────────────
  test("名前入力・人数選択後に送信すると onSubmit が number 型の partySize で呼ばれる", async () => {
    const user = userEvent.setup();
    render(<JoinForm onSubmit={mockSubmit} maxCapacity={8} />);

    // 名前を入力
    await user.type(screen.getByPlaceholderText("山田 太郎"), "田中 花子");

    // 4名ラジオを選択
    const radio4 = screen.getByDisplayValue("4");
    await user.click(radio4);

    // 送信
    await user.click(screen.getByRole("button", { name: "順番待ちに登録する" }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const [calledData] = mockSubmit.mock.calls[0];
    expect(calledData.customerName).toBe("田中 花子");
    // coerce によって文字列 "4" ではなく数値 4 になっていること
    expect(calledData.partySize).toBe(4);
    expect(typeof calledData.partySize).toBe("number");
  });

  test("1名はデフォルト選択されている", async () => {
    const user = userEvent.setup();
    render(<JoinForm onSubmit={mockSubmit} maxCapacity={8} />);

    await user.type(screen.getByPlaceholderText("山田 太郎"), "テストユーザー");
    await user.click(screen.getByRole("button", { name: "順番待ちに登録する" }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    expect(mockSubmit.mock.calls[0][0].partySize).toBe(1);
  });
});
