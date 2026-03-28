/**
 * 統合テスト: POST /api/seats/assign
 *
 * テスト観点:
 *   - 正常系: 席が割り当てられ { success: true, seatLabel } が返る
 *   - storeId / queueId 未指定 → 400
 *   - キューエントリが存在しない → 404
 *   - 適切な席が見つからない → 409
 *   - FCM トークンがあれば send が呼ばれる
 *   - FCM 失敗しても 200 で返る (ノンブロッキング)
 */

import { NextRequest } from "next/server";

// ── Firebase Admin をモック ──────────────────────
const mockQueueGet = jest.fn();
const mockSeatsWhere = jest.fn();
const mockQueueAheadGet = jest.fn();
const mockBatch = {
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};
const mockSend = jest.fn().mockResolvedValue("msg-id");

// adminDb の collection チェーンをモック
const mockAdminDb = {
  collection: jest.fn((name: string) => {
    if (name === "queues") {
      return {
        doc: jest.fn(() => ({ get: mockQueueGet })),
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({ get: mockQueueAheadGet })),
          })),
        })),
      };
    }
    if (name === "stores") {
      return {
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            where: jest.fn(() => ({ get: mockSeatsWhere })),
            doc: jest.fn(() => ({})),
          })),
        })),
      };
    }
    return {};
  }),
  batch: jest.fn(() => mockBatch),
};

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: mockAdminDb,
  adminMessaging: { send: mockSend },
}));

// ── テスト用 Timestamp (Admin SDK 形式) ──────────
const fakeTimestamp = {
  toMillis: () => Date.now(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  now: () => fakeTimestamp,
  fromMillis: (ms: number) => ({ ...fakeTimestamp, seconds: Math.floor(ms / 1000) }),
};
jest.mock("firebase-admin/firestore", () => ({
  Timestamp: fakeTimestamp,
  FieldValue: { serverTimestamp: jest.fn() },
}));

// ── 実装をインポート (モック後に) ────────────────
import { POST } from "@/app/api/seats/assign/route";

// ── ヘルパー ─────────────────────────────────────
function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/seats/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeQueueSnap(data: object | null) {
  if (!data) return { exists: false, id: "", data: () => ({}) };
  return { exists: true, id: "q-001", data: () => data };
}

function makeSeatSnap(seats: object[]) {
  return {
    docs: seats.map((s: any) => ({ id: s.id, data: () => s })),
  };
}

// ── テスト ───────────────────────────────────────

describe("POST /api/seats/assign 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.commit.mockResolvedValue(undefined);
    mockSend.mockResolvedValue("msg-id");
  });

  // ── パラメーターバリデーション ──────────────────
  test("storeId が未指定 → 400", async () => {
    const res = await POST(makeRequest({ queueId: "q-001" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/storeId/);
  });

  test("queueId が未指定 → 400", async () => {
    const res = await POST(makeRequest({ storeId: "s-001" }));
    expect(res.status).toBe(400);
  });

  // ── キューエントリが存在しない ────────────────
  test("キューエントリが見つからない → 404", async () => {
    mockQueueGet.mockResolvedValue(makeQueueSnap(null));
    const res = await POST(makeRequest({ storeId: "s-001", queueId: "q-999" }));
    expect(res.status).toBe(404);
  });

  // ── 席が見つからない ──────────────────────────
  test("適切な席がない → 409", async () => {
    mockQueueGet.mockResolvedValue(
      makeQueueSnap({ storeId: "s-001", partySize: 6, fcmToken: null })
    );
    // 空席なし
    mockSeatsWhere.mockResolvedValue(makeSeatSnap([]));
    mockQueueAheadGet.mockResolvedValue(makeSeatSnap([]));

    const res = await POST(makeRequest({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(409);
  });

  // ── 正常系 ───────────────────────────────────
  test("正常系: 席が割り当てられ success:true が返る", async () => {
    mockQueueGet.mockResolvedValue(
      makeQueueSnap({ storeId: "s-001", partySize: 2, fcmToken: null })
    );
    mockSeatsWhere.mockResolvedValue(
      makeSeatSnap([
        {
          id: "seat-A",
          label: "A席",
          capacity: 4,
          minCapacity: 1,
          status: "available",
          estimatedFreeAt: null,
        },
      ])
    );
    mockQueueAheadGet.mockResolvedValue(makeSeatSnap([]));

    const res = await POST(makeRequest({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.seatLabel).toBe("A席");

    // Firestore のバッチ書き込みが実行された
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  // ── FCM 通知 ─────────────────────────────────
  test("FCM トークンがある場合 adminMessaging.send が呼ばれる", async () => {
    mockQueueGet.mockResolvedValue(
      makeQueueSnap({ storeId: "s-001", partySize: 2, fcmToken: "fcm-token-xyz" })
    );
    mockSeatsWhere.mockResolvedValue(
      makeSeatSnap([{ id: "seat-B", label: "B席", capacity: 4, minCapacity: 1, status: "available", estimatedFreeAt: null }])
    );
    mockQueueAheadGet.mockResolvedValue(makeSeatSnap([]));

    const res = await POST(makeRequest({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const sendArg = mockSend.mock.calls[0][0];
    expect(sendArg.token).toBe("fcm-token-xyz");
    expect(sendArg.notification.title).toBe("席の準備ができました！");
  });

  test("FCM 送信が失敗しても 200 で返る (ノンブロッキング)", async () => {
    mockSend.mockRejectedValue(new Error("FCM error"));
    mockQueueGet.mockResolvedValue(
      makeQueueSnap({ storeId: "s-001", partySize: 2, fcmToken: "bad-token" })
    );
    mockSeatsWhere.mockResolvedValue(
      makeSeatSnap([{ id: "seat-C", label: "C席", capacity: 4, minCapacity: 1, status: "available", estimatedFreeAt: null }])
    );
    mockQueueAheadGet.mockResolvedValue(makeSeatSnap([]));

    const res = await POST(makeRequest({ storeId: "s-001", queueId: "q-001" }));
    // FCM 失敗でも 200
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
