"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSeats } from "@/lib/hooks/useSeats";
import { useQueue } from "@/lib/hooks/useQueue";
import { useStore } from "@/lib/hooks/useStore";
import { updateSeat, updateQueueEntry } from "@/lib/firebase/firestore";
import { OccupancyMeter } from "@/components/admin/OccupancyMeter";
import { Timestamp } from "firebase/firestore";
import type { Seat } from "@/lib/types";

// ── 経過時間フック（30秒ごとに再計算） ──────────────
function useElapsed(since: Timestamp | null): string {
  const calc = () => {
    if (!since) return "";
    const mins = Math.floor((Date.now() - since.toMillis()) / 60000);
    if (mins < 1) return "1分未満";
    if (mins < 60) return `${mins}分`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  };

  const [text, setText] = useState(calc);

  useEffect(() => {
    if (!since) return;
    setText(calc());
    const id = setInterval(() => setText(calc()), 30_000);
    return () => clearInterval(id);
  }, [since?.toMillis()]);

  return text;
}

// ── 席カードコンポーネント ────────────────────────────
function SeatCard({
  seat,
  storeId,
  avgDuration,
  onRelease,
  onOccupy,
}: {
  seat: Seat;
  storeId: string;
  avgDuration: number; // 店舗の平均滞在時間（分）
  onRelease: (seat: Seat) => void;
  onOccupy: (seat: Seat) => void;
}) {
  const elapsed = useElapsed(seat.occupiedSince ?? null);

  const elapsedMins = seat.occupiedSince
    ? Math.floor((Date.now() - seat.occupiedSince.toMillis()) / 60000)
    : 0;

  // 平均滞在時間の 1.5倍 → 黄色、2倍超 → 赤
  const threshold1 = avgDuration * 1.5;
  const threshold2 = avgDuration * 2;
  const elapsedColor =
    elapsedMins >= threshold2 ? "text-red-600" :
    elapsedMins >= threshold1 ? "text-orange-500" :
    "text-gray-500";
  const isLong = elapsedMins >= threshold1;

  if (seat.status === "occupied") {
    return (
      <div className="bg-white rounded-xl border-2 border-red-200 p-3 sm:p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <p className="font-semibold text-sm">{seat.label}</p>
            </div>
            <p className="text-xs text-gray-400">{seat.capacity}名席</p>
          </div>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium shrink-0">
            使用中
          </span>
        </div>

        {/* 経過時間 */}
        {elapsed && (
          <div className={`rounded-lg px-3 py-2 ${isLong ? "bg-orange-50" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400">着席から</p>
            <p className={`text-base font-bold tabular-nums ${elapsedColor}`}>
              {elapsed}
              {elapsedMins >= threshold2 && (
                <span className="text-xs font-normal ml-1">⚠️ 超過</span>
              )}
              {elapsedMins >= threshold1 && elapsedMins < threshold2 && (
                <span className="text-xs font-normal ml-1">もうすぐ</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              平均 {avgDuration}分 / 上限目安 {Math.round(threshold2)}分
            </p>
          </div>
        )}

        {/* 空席にするボタン */}
        <button
          onClick={() => onRelease(seat)}
          className="w-full text-xs bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium mt-1"
        >
          空席にする
        </button>
      </div>
    );
  }

  if (seat.status === "reserved") {
    return (
      <div className="bg-white rounded-xl border-2 border-yellow-300 p-3 sm:p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
              <p className="font-semibold text-sm">{seat.label}</p>
            </div>
            <p className="text-xs text-gray-400">{seat.capacity}名席</p>
          </div>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            案内済
          </span>
        </div>
        {/* 案内からの経過時間 */}
        {elapsed ? (
          <div className="rounded-lg px-3 py-2 bg-yellow-50">
            <p className="text-xs text-yellow-600">案内から</p>
            <p className="text-base font-bold tabular-nums text-yellow-700">{elapsed}</p>
            <p className="text-xs text-yellow-500 mt-0.5">
              着席されない場合はキャンセルしてください
            </p>
          </div>
        ) : (
          <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            お客様がまもなく着席されます
          </p>
        )}

        {/* 使用中にする（着席確認） */}
        <button
          onClick={() => onOccupy(seat)}
          className="w-full text-xs bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          使用中にする
        </button>
        {/* キャンセル等で空席に戻す場合 */}
        <button
          onClick={() => onRelease(seat)}
          className="w-full text-xs border border-gray-200 text-gray-500 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          空席に戻す
        </button>
      </div>
    );
  }

  if (seat.status === "available") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <p className="font-semibold text-sm">{seat.label}</p>
            </div>
            <p className="text-xs text-gray-400">{seat.capacity}名席</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            空席
          </span>
        </div>
        {/* 手動で使用中にする（清掃中など） */}
        <button
          onClick={() => onOccupy(seat)}
          className="w-full text-xs border border-gray-200 text-gray-400 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          使用中にする
        </button>
      </div>
    );
  }

  // unavailable
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-4 opacity-60">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <p className="font-semibold text-sm text-gray-500">{seat.label}</p>
      </div>
      <p className="text-xs text-gray-400">{seat.capacity}名席</p>
      <p className="text-xs text-gray-400 mt-1">利用不可</p>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────
export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { seats, available, occupied, loading: seatsLoading } = useSeats(storeId);
  const { queue } = useQueue(storeId);
  const { store } = useStore(storeId);
  const avgDuration = store?.averageSeatingDuration ?? 60;

  // 同じキューIDに紐づく全席を取得（複数席結合に対応）
  function linkedSeats(seat: Seat): Seat[] {
    if (!seat.currentQueueId) return [seat];
    return seats.filter((s) => s.currentQueueId === seat.currentQueueId);
  }

  // 席を空席に解放（複数席結合時は全席まとめて解放）
  async function handleRelease(seat: Seat) {
    const targets = linkedSeats(seat);
    await Promise.all(
      targets.map((s) =>
        updateSeat(storeId, s.id, {
          status: "available",
          currentQueueId: null,
          occupiedSince: null,
          estimatedFreeAt: null,
        })
      )
    );
    // 案内済み席を空席に戻す場合はキューエントリをキャンセル
    if (seat.status === "reserved" && seat.currentQueueId) {
      await updateQueueEntry(seat.currentQueueId, {
        status: "cancelled",
        cancelledAt: Timestamp.now(),
      });
    }
  }

  // 使用中に設定（案内済み席 → 着席確認 / 空席 → 清掃中等）
  async function handleOccupy(seat: Seat) {
    const now = Timestamp.now();
    const targets = linkedSeats(seat);
    await Promise.all(
      targets.map((s) =>
        updateSeat(storeId, s.id, { status: "occupied", occupiedSince: now })
      )
    );
    // 案内済み席の場合はキューエントリも着席済みに更新
    if (seat.currentQueueId) {
      await updateQueueEntry(seat.currentQueueId, {
        status: "seated",
        seatedAt: now,
      });
    }
  }

  if (seatsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  // 平均の1.5倍を超えている席数
  const longStayCount = seats.filter(
    (s) =>
      s.status === "occupied" &&
      s.occupiedSince &&
      Date.now() - s.occupiedSince.toMillis() > avgDuration * 1.5 * 60 * 1000
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="mb-5">
        <Link href="/stores" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 店舗一覧
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <h1 className="text-xl font-bold">フロア管理</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/stores/${storeId}/map`}
              className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              マップ編集
            </Link>
            <Link
              href={`/queue/${storeId}`}
              className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              キュー管理
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* サマリー */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
          <h2 className="font-semibold text-sm text-gray-700">状況</h2>
          <OccupancyMeter current={occupied.length} total={seats.length} />
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{available.length}</p>
              <p className="text-xs text-gray-500">空席</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-600">{queue.length}</p>
              <p className="text-xs text-gray-500">待ち組数</p>
            </div>
          </div>

          {/* 長時間アラート */}
          {longStayCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
              <p className="font-semibold">⚠️ 長時間着席</p>
              <p className="mt-0.5">
                {longStayCount}席が平均の1.5倍（{Math.round(avgDuration * 1.5)}分）を超えています
              </p>
            </div>
          )}

          {/* 凡例 */}
          <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3">
            <p className="font-medium text-gray-600 mb-2">席の解放について</p>
            <p>お客様が退店したら<br />「<span className="text-green-600 font-medium">空席にする</span>」を押してください</p>
            <p className="text-gray-400 mt-2">
              ※ 自動解放はされません。スタッフが目視で確認して操作してください。
            </p>
          </div>
        </div>

        {/* 席グリッド */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-gray-700">席一覧</h2>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />空席
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />案内済
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />使用中
              </span>
            </div>
          </div>

          {seats.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              <p>まだ席が登録されていません</p>
              <Link
                href={`/stores/${storeId}/map`}
                className="inline-block mt-4 text-indigo-600 hover:underline text-sm"
              >
                マップエディターで席を追加
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {seats
                // 使用中 → 案内済 → 空席 → 利用不可 の順に表示
                .slice()
                .sort((a, b) => {
                  const order = { occupied: 0, reserved: 1, available: 2, unavailable: 3 };
                  return order[a.status] - order[b.status];
                })
                .map((seat) => (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    storeId={storeId}
                    avgDuration={avgDuration}
                    onRelease={handleRelease}
                    onOccupy={handleOccupy}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
