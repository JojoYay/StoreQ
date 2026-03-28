/**
 * ユニットテスト: 席割り当てアルゴリズム (findBestSeat)
 *
 * テスト観点:
 *   - 適切な席が選ばれるか
 *   - 人数に対して容量不足/過剰な席の除外
 *   - 大人数待ちがある場合の大テーブル保護
 *   - 席が0件のとき null を返すか
 */

import { findBestSeat, estimateWaitMinutes } from "@/lib/algorithms/seatAssignment";
import { Timestamp } from "@/lib/../__mocks__/firebase/firestore";
import type { Seat, QueueEntry } from "@/lib/types";

// ── テスト用ヘルパー ──────────────────────────────

function makeSeat(override: Partial<Seat> & { id: string }): Seat {
  return {
    label: override.id,
    type: "table",
    capacity: 4,
    minCapacity: 1,
    zoneId: null,
    position: { x: 0, y: 0 },
    size: { width: 60, height: 60 },
    status: "available",
    currentQueueId: null,
    occupiedSince: null,
    estimatedFreeAt: null,
    createdAt: Timestamp.now(),
    ...override,
  };
}

function makeQueueEntry(override: Partial<QueueEntry> & { id: string }): QueueEntry {
  return {
    storeId: "store-1",
    customerName: "テスト",
    partySize: 2,
    fcmToken: null,
    status: "waiting",
    assignedSeatId: null,
    assignedSeatLabel: null,
    position: 1,
    notifiedAt: null,
    seatedAt: null,
    cancelledAt: null,
    joinedAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000),
    ...override,
  };
}

// ── findBestSeat ─────────────────────────────────

describe("findBestSeat", () => {
  test("利用可能な席が1つだけの場合、その席を返す", () => {
    const seats = [makeSeat({ id: "A1", capacity: 4, minCapacity: 1 })];
    const result = findBestSeat(2, seats, []);
    expect(result).not.toBeNull();
    expect(result?.seatId).toBe("A1");
  });

  test("利用可能な席が0件のとき null を返す", () => {
    expect(findBestSeat(2, [], [])).toBeNull();
  });

  test("人数より容量が小さい席は除外される", () => {
    const seats = [
      makeSeat({ id: "small", capacity: 1, minCapacity: 1 }),
      makeSeat({ id: "large", capacity: 4, minCapacity: 1 }),
    ];
    const result = findBestSeat(2, seats, []);
    expect(result?.seatId).toBe("large");
  });

  test("minCapacity より少ない人数には割り当てられない", () => {
    const seats = [makeSeat({ id: "booth", capacity: 6, minCapacity: 4 })];
    // 2名では minCapacity:4 を満たさない
    expect(findBestSeat(2, seats, [])).toBeNull();
  });

  test("status が available 以外の席は除外される", () => {
    const seats = [
      makeSeat({ id: "occupied", capacity: 4, minCapacity: 1, status: "occupied" }),
      makeSeat({ id: "free", capacity: 4, minCapacity: 1, status: "available" }),
    ];
    const result = findBestSeat(2, seats, []);
    expect(result?.seatId).toBe("free");
  });

  test("ぴったりサイズの席がより大きな席より優先される (スコア)", () => {
    const seats = [
      makeSeat({ id: "tight", capacity: 2, minCapacity: 1 }), // waste=0
      makeSeat({ id: "large", capacity: 8, minCapacity: 1 }), // waste=6
    ];
    const result = findBestSeat(2, seats, []);
    expect(result?.seatId).toBe("tight");
  });

  test("大人数待ちがいる場合、その人数が収まる席のスコアが下がる", () => {
    // アルゴリズムの条件: q.partySize >= seat.capacity && q.partySize > currentPartySize
    // → 待機中の人数(5名) >= mid4の容量(4) なので mid4 にペナルティ
    // → 待機中の人数(5名) < large6の容量(6) なので large6 はペナルティなし
    // 結果: large6 の方が高スコアになる
    const seats = [
      makeSeat({ id: "mid4", capacity: 4, minCapacity: 1 }),
      makeSeat({ id: "large6", capacity: 6, minCapacity: 1 }),
    ];
    const queueAhead = [makeQueueEntry({ id: "q1", partySize: 5 })];
    const result = findBestSeat(2, seats, queueAhead);
    // mid4 がペナルティを受けるため large6 が選ばれる
    expect(result?.seatId).toBe("large6");
  });

  test("ちょうど収まる席(waste=0)は大きい席より優先される", () => {
    // 待ち客なし・シンプルなスコア比較
    const seats = [
      makeSeat({ id: "exact2", capacity: 2, minCapacity: 1 }), // waste=0 → +40pt
      makeSeat({ id: "big8", capacity: 8, minCapacity: 1 }),   // waste=6 → +0pt
    ];
    const result = findBestSeat(2, seats, []);
    expect(result?.seatId).toBe("exact2");
  });

  test("複数の同容量席から1つを返す (nullにならない)", () => {
    const seats = [
      makeSeat({ id: "T1", capacity: 4, minCapacity: 1 }),
      makeSeat({ id: "T2", capacity: 4, minCapacity: 1 }),
    ];
    expect(findBestSeat(3, seats, [])).not.toBeNull();
  });
});

// ── estimateWaitMinutes ───────────────────────────

describe("estimateWaitMinutes", () => {
  test("空席数 >= 待ち位置 → 0 分", () => {
    expect(estimateWaitMinutes(1, 60, 3, 10)).toBe(0);
    expect(estimateWaitMinutes(3, 60, 3, 10)).toBe(0);
  });

  test("空席なし・全席埋まり → 待ち時間が正の値", () => {
    // queuePosition=1, duration=60, available=0, total=10
    // turnoverRate = 10/60 ≈ 0.167, wait = ceil(1/0.167) = 6
    const wait = estimateWaitMinutes(1, 60, 0, 10);
    expect(wait).toBeGreaterThan(0);
  });

  test("待ち位置が増えると待ち時間も増える", () => {
    const w1 = estimateWaitMinutes(1, 60, 0, 5);
    const w5 = estimateWaitMinutes(5, 60, 0, 5);
    expect(w5).toBeGreaterThan(w1);
  });

  test("席数が多いほど待ち時間は短い", () => {
    const wFew = estimateWaitMinutes(3, 60, 0, 2);
    const wMany = estimateWaitMinutes(3, 60, 0, 20);
    expect(wMany).toBeLessThan(wFew);
  });
});
