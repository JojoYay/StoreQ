"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueue } from "@/lib/hooks/useQueue";
import { useSeats } from "@/lib/hooks/useSeats";
import { QueueEntryRow } from "@/components/queue/QueueEntry";
import { SeatSelectModal } from "@/components/queue/SeatSelectModal";
import { updateQueueEntry, updateSeat } from "@/lib/firebase/firestore";
import { estimateWaitTime } from "@/lib/utils/time";
import type { QueueEntry } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

export default function QueueManagePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { queue, loading } = useQueue(storeId);
  const { seats, available } = useSeats(storeId);

  // モーダル用 state
  const [modalEntry, setModalEntry] = useState<QueueEntry | null>(null);

  // 「席を案内」ボタン → モーダルを開く
  function handleAssign(entry: QueueEntry) {
    setModalEntry(entry);
  }

  // モーダルで席を確定 → API呼び出し（FCM通知含む）
  async function handleAssignConfirm(seatIds: string[]) {
    if (!modalEntry) return;
    try {
      const res = await fetch("/api/seats/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, queueId: modalEntry.id, seatIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "席の割り当てに失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setModalEntry(null);
    }
  }

  // 案内済 → 着席確認（管理者がお客様の着席を目視確認後）
  async function handleConfirmSeated(entry: QueueEntry) {
    try {
      const now = Timestamp.now();
      await updateQueueEntry(entry.id, { status: "seated", seatedAt: now });
      // 複数席に対応: assignedSeatIds があればそちらを優先
      const seatIds = entry.assignedSeatIds ?? (entry.assignedSeatId ? [entry.assignedSeatId] : []);
      await Promise.all(
        seatIds.map((id) =>
          updateSeat(storeId, id, { status: "occupied", occupiedSince: now, currentQueueId: entry.id })
        )
      );
    } catch {
      alert("着席確認の更新に失敗しました");
    }
  }

  // キャンセル
  async function handleCancel(entry: QueueEntry) {
    if (!confirm(`${entry.customerName} さんをキャンセルしますか？`)) return;
    await updateQueueEntry(entry.id, { status: "cancelled", cancelledAt: Timestamp.now() });
    const seatIds = entry.assignedSeatIds ?? (entry.assignedSeatId ? [entry.assignedSeatId] : []);
    await Promise.all(
      seatIds.map((id) => updateSeat(storeId, id, { status: "available", currentQueueId: null }))
    );
  }

  const activeQueue = queue.filter((q) => q.status === "waiting" || q.status === "notified");
  const waitingCount = queue.filter((q) => q.status === "waiting").length;
  const notifiedCount = queue.filter((q) => q.status === "notified").length;
  const waitingQueue = queue.filter((q) => q.status === "waiting");

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* ヘッダー */}
        <div className="mb-5">
          <Link href={`/stores/${storeId}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← フロア管理
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
            <h1 className="text-xl font-bold">キュー管理</h1>
            <div className="flex gap-2 text-sm flex-wrap">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                空席 {available.length}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                待機 {waitingCount} 組
              </span>
              {notifiedCount > 0 && (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  案内済 {notifiedCount} 組
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-400">
          <span>🟣 待機中 → 「席を案内」で席を選択・案内</span>
          <span>🟡 案内済 → お客様着席確認後に「着席確認」</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
          </div>
        ) : activeQueue.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-4">✅</p>
            <p>現在の待ちはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeQueue.map((entry, index) => {
              const waitMinutes = estimateWaitTime(
                index + 1,
                60,
                available.length,
                seats.length
              );
              return (
                <QueueEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  waitMinutes={waitMinutes}
                  onAssign={handleAssign}
                  onConfirmSeated={handleConfirmSeated}
                  onCancel={handleCancel}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 席選択モーダル */}
      {modalEntry && (
        <SeatSelectModal
          entry={modalEntry}
          availableSeats={available}
          waitingQueue={waitingQueue}
          onConfirm={handleAssignConfirm}
          onClose={() => setModalEntry(null)}
        />
      )}
    </>
  );
}
