"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueue } from "@/lib/hooks/useQueue";
import { useSeats } from "@/lib/hooks/useSeats";
import { QueueEntryRow } from "@/components/queue/QueueEntry";
import { updateQueueEntry } from "@/lib/firebase/firestore";
import { estimateWaitTime } from "@/lib/utils/time";
import type { QueueEntry } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

export default function QueueManagePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { queue, loading } = useQueue(storeId);
  const { seats, available } = useSeats(storeId);

  async function handleAssign(entry: QueueEntry) {
    try {
      const res = await fetch("/api/seats/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, queueId: entry.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "席の割り当てに失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    }
  }

  async function handleCancel(entry: QueueEntry) {
    if (!confirm(`${entry.customerName} さんをキャンセルしますか？`)) return;
    await updateQueueEntry(entry.id, {
      status: "cancelled",
      cancelledAt: Timestamp.now(),
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/stores/${storeId}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← フロア管理
        </Link>
        <h1 className="text-xl font-bold">キュー管理</h1>
        <div className="flex gap-3 ml-auto text-sm">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            空席 {available.length}
          </span>
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
            待ち {queue.filter((q) => q.status === "waiting").length} 組
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">✅</p>
          <p>現在の待ちはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((entry, index) => {
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
                onCancel={handleCancel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
