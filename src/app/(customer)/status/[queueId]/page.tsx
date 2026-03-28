"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { subscribeToQueueEntry, subscribeToQueue, updateQueueEntry, getStore } from "@/lib/firebase/firestore";
import { CustomerStatusCard } from "@/components/queue/CustomerStatusCard";
import { estimateWaitTime } from "@/lib/utils/time";
import { Timestamp } from "firebase/firestore";
import type { QueueEntry, Store } from "@/lib/types";
import { useNotification } from "@/contexts/NotificationContext";

export default function StatusPage() {
  const { queueId } = useParams<{ queueId: string }>();
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [queuePosition, setQueuePosition] = useState(1);
  const [loading, setLoading] = useState(true);
  const { foregroundMessage } = useNotification();

  useEffect(() => {
    const unsub = subscribeToQueueEntry(queueId, (e) => {
      setEntry(e);
      if (e && !store) {
        getStore(e.storeId).then(setStore);
      }
      setLoading(false);
    });
    return unsub;
  }, [queueId]);

  useEffect(() => {
    if (!entry?.storeId) return;
    const unsub = subscribeToQueue(entry.storeId, ["waiting"], (queue) => {
      const pos = queue.findIndex((q) => q.id === queueId);
      setQueuePosition(pos >= 0 ? pos + 1 : queue.length + 1);
    });
    return unsub;
  }, [entry?.storeId, queueId]);

  // フォアグラウンド通知はステータスカードが Firestore リアルタイムで自動更新
  void foregroundMessage;

  async function handleCancel() {
    if (!confirm("順番待ちをキャンセルしますか？")) return;
    await updateQueueEntry(queueId, {
      status: "cancelled",
      cancelledAt: Timestamp.now(),
    });
  }

  const waitMinutes = estimateWaitTime(
    queuePosition,
    store?.averageSeatingDuration ?? 60,
    0,
    store?.totalCapacity ?? 1
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">順番待ち情報が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-700">{store?.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">順番待ち状況</p>
        </div>

        <CustomerStatusCard
          entry={entry}
          queuePosition={queuePosition}
          waitMinutes={waitMinutes}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
