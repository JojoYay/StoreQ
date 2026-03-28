/**
 * 統合テスト: POST /api/seats/assign (APIルート)
 *
 * テスト観点:
 *   - storeId / queueId 未指定 → 400
 *   - キューエントリが存在しない → 404
 *   - 適切な席が見つからない → 409
 *   - 正常系: 席割り当て & Firestoreバッチ書き込み → 200
 *   - FCM トークンがあれば send が呼ばれる
 *   - FCM 失敗しても 200 で返る (ノンブロッキング)
 */

// ── NextRequest / NextResponse のモック ──────────
class MockNextRequest {
  private _body: string;
  readonly method: string;
  readonly url: string;
  constructor(url: string, init?: { method?: string; body?: string }) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this._body = init?.body ?? "{}";
  }
  async json() { return JSON.parse(this._body); }
}

class MockNextResponse {
  readonly status: number;
  private _body: string;
  constructor(body: string, init?: { status?: number }) {
    this._body = body;
    this.status = init?.status ?? 200;
  }
  async json() { return JSON.parse(this._body); }
  static json(data: unknown, init?: { status?: number }) {
    return new MockNextResponse(JSON.stringify(data), init);
  }
}

jest.mock("next/server", () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
}));

// ── Firebase Admin のモック ───────────────────────
const mockQueueGet = jest.fn();
const mockBatch = {
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};
const mockSend = jest.fn().mockResolvedValue("msg-id");

jest.mock("@/lib/firebase/admin", () => ({
  get adminDb() {
    return {
      collection: (name: string) => {
        if (name === "queues") {
          return {
            doc: () => ({ get: mockQueueGet }),
            where: () => ({
              where: () => ({
                orderBy: () => ({ get: mockQueueAheadGet }),
              }),
            }),
          };
        }
        if (name === "stores") {
          return {
            doc: () => ({
              collection: () => ({
                where: () => ({ get: mockSeatsGet }),
                doc: () => ({}),
              }),
            }),
          };
        }
        return {};
      },
      batch: () => mockBatch,
    };
  },
  get adminMessaging() {
    return { send: mockSend };
  },
}));

const mockSeatsGet = jest.fn();
const mockQueueAheadGet = jest.fn();

jest.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: () => ({ toMillis: () => Date.now(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
    fromMillis: (ms: number) => ({ toMillis: () => ms, seconds: Math.floor(ms / 1000), nanoseconds: 0 }),
  },
  FieldValue: { serverTimestamp: jest.fn() },
}));

// ── テスト対象インポート ──────────────────────────
import { POST } from "@/app/api/seats/assign/route";

// ── ヘルパー ─────────────────────────────────────
function makeReq(body: object) {
  return new MockNextRequest("http://localhost/api/seats/assign", {
    method: "POST",
    body: JSON.stringify(body),
  }) as any;
}

function queueSnap(data: object | null) {
  if (!data) return { exists: false, id: "", data: () => ({}) };
  return { exists: true, id: "q-001", data: () => data };
}

function seatsSnap(seats: object[]) {
  return { docs: seats.map((s: any) => ({ id: s.id, data: () => s })) };
}

// ── テスト ───────────────────────────────────────
describe("POST /api/seats/assign 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.commit.mockResolvedValue(undefined);
    mockSend.mockResolvedValue("msg-id");
  });

  test("storeId が未指定 → 400", async () => {
    const res = await POST(makeReq({ queueId: "q-001" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/storeId/);
  });

  test("queueId が未指定 → 400", async () => {
    const res = await POST(makeReq({ storeId: "s-001" }));
    expect(res.status).toBe(400);
  });

  test("キューエントリが見つからない → 404", async () => {
    mockQueueGet.mockResolvedValue(queueSnap(null));
    const res = await POST(makeReq({ storeId: "s-001", queueId: "q-999" }));
    expect(res.status).toBe(404);
  });

  test("適切な席がない → 409", async () => {
    mockQueueGet.mockResolvedValue(queueSnap({ storeId: "s-001", partySize: 6, fcmToken: null }));
    mockSeatsGet.mockResolvedValue(seatsSnap([]));
    mockQueueAheadGet.mockResolvedValue(seatsSnap([]));
    const res = await POST(makeReq({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(409);
  });

  test("正常系: 席が割り当てられ success:true が返る", async () => {
    mockQueueGet.mockResolvedValue(
      queueSnap({ storeId: "s-001", partySize: 2, fcmToken: null })
    );
    mockSeatsGet.mockResolvedValue(seatsSnap([
      { id: "seat-A", label: "A席", capacity: 4, minCapacity: 1, status: "available", estimatedFreeAt: null },
    ]));
    mockQueueAheadGet.mockResolvedValue(seatsSnap([]));

    const res = await POST(makeReq({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.seatLabel).toBe("A席");
    // Firestoreバッチ書き込みが2回(queue + seat)実行された
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  test("FCMトークンがある場合 adminMessaging.send が呼ばれる", async () => {
    mockQueueGet.mockResolvedValue(
      queueSnap({ storeId: "s-001", partySize: 2, fcmToken: "fcm-token-xyz" })
    );
    mockSeatsGet.mockResolvedValue(seatsSnap([
      { id: "seat-B", label: "B席", capacity: 4, minCapacity: 1, status: "available", estimatedFreeAt: null },
    ]));
    mockQueueAheadGet.mockResolvedValue(seatsSnap([]));

    const res = await POST(makeReq({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].token).toBe("fcm-token-xyz");
    expect(mockSend.mock.calls[0][0].notification.title).toBe("席の準備ができました！");
  });

  test("FCM送信が失敗しても 200 で返る (ノンブロッキング)", async () => {
    mockSend.mockRejectedValue(new Error("FCM error"));
    mockQueueGet.mockResolvedValue(
      queueSnap({ storeId: "s-001", partySize: 2, fcmToken: "bad-token" })
    );
    mockSeatsGet.mockResolvedValue(seatsSnap([
      { id: "seat-C", label: "C席", capacity: 4, minCapacity: 1, status: "available", estimatedFreeAt: null },
    ]));
    mockQueueAheadGet.mockResolvedValue(seatsSnap([]));

    const res = await POST(makeReq({ storeId: "s-001", queueId: "q-001" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
