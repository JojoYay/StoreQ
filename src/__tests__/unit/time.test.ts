/**
 * ユニットテスト: 時間ユーティリティ
 *
 * テスト対象:
 *   - estimateWaitTime   (待ち時間計算)
 *   - formatWaitTime     (表示テキスト整形)
 *   - formatCountdown    (カウントダウン MM:SS)
 *   - secondsUntil       (Timestamp まで残り秒数)
 */

import {
  estimateWaitTime,
  formatWaitTime,
  formatCountdown,
  secondsUntil,
} from "@/lib/utils/time";
import { Timestamp } from "@/lib/../__mocks__/firebase/firestore";

// estimateWaitTime は time.ts 内の独自実装を使う
describe("estimateWaitTime (time.ts)", () => {
  test("queuePosition <= availableSeatCount → 0 分", () => {
    expect(estimateWaitTime(1, 60, 5, 10)).toBe(0);
    expect(estimateWaitTime(5, 60, 5, 10)).toBe(0);
  });

  test("空席なし・1組目 → 正の待ち時間", () => {
    const wait = estimateWaitTime(1, 60, 0, 10);
    expect(wait).toBeGreaterThan(0);
  });

  test("同一条件で位置が後ろほど長い", () => {
    const w1 = estimateWaitTime(1, 60, 0, 5);
    const w3 = estimateWaitTime(3, 60, 0, 5);
    expect(w3).toBeGreaterThanOrEqual(w1);
  });
});

// ─────────────────────────────────────────────
describe("formatWaitTime", () => {
  test("0 分以下 → 'まもなく'", () => {
    expect(formatWaitTime(0)).toBe("まもなく");
    expect(formatWaitTime(-5)).toBe("まもなく");
  });

  test("59 分 → '約59分'", () => {
    expect(formatWaitTime(59)).toBe("約59分");
  });

  test("60 分 → '約1時間'", () => {
    expect(formatWaitTime(60)).toBe("約1時間");
  });

  test("90 分 → '約1時間30分'", () => {
    expect(formatWaitTime(90)).toBe("約1時間30分");
  });

  test("120 分 → '約2時間'", () => {
    expect(formatWaitTime(120)).toBe("約2時間");
  });

  test("1 分 → '約1分'", () => {
    expect(formatWaitTime(1)).toBe("約1分");
  });
});

// ─────────────────────────────────────────────
describe("formatCountdown", () => {
  test("0 秒 → '00:00'", () => {
    expect(formatCountdown(0)).toBe("00:00");
  });

  test("65 秒 → '01:05'", () => {
    expect(formatCountdown(65)).toBe("01:05");
  });

  test("600 秒 → '10:00'", () => {
    expect(formatCountdown(600)).toBe("10:00");
  });

  test("9 秒 → '00:09'", () => {
    expect(formatCountdown(9)).toBe("00:09");
  });
});

// ─────────────────────────────────────────────
describe("secondsUntil", () => {
  test("過去の Timestamp → 0", () => {
    const past = Timestamp.fromMillis(Date.now() - 5000);
    expect(secondsUntil(past as any)).toBe(0);
  });

  test("約30秒後の Timestamp → 約30", () => {
    const future = Timestamp.fromMillis(Date.now() + 30000);
    const secs = secondsUntil(future as any);
    expect(secs).toBeGreaterThanOrEqual(29);
    expect(secs).toBeLessThanOrEqual(31);
  });
});
