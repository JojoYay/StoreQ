"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStore, createQueueEntry, subscribeToQueue } from "@/lib/firebase/firestore";
import { JoinForm } from "@/components/customer/JoinForm";
import type { Store } from "@/lib/types";
import type { JoinFormData } from "@/lib/utils/validation";

export default function JoinPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStore(storeId).then((s) => {
      setStore(s);
      setLoading(false);
    });

    const unsub = subscribeToQueue(storeId, ["waiting", "notified"], (entries) => {
      setQueueLength(entries.filter((e) => e.status === "waiting").length);
    });
    return unsub;
  }, [storeId]);

  async function handleJoin(data: JoinFormData) {
    if (!store) return;

    const queueId = await createQueueEntry({
      storeId,
      customerName: data.customerName,
      partySize: data.partySize,
      fcmToken: null,
      status: "waiting",
      assignedSeatId: null,
      assignedSeatLabel: null,
      position: queueLength + 1,
      notifiedAt: null,
      seatedAt: null,
      cancelledAt: null,
    });

    router.push(`/status/${queueId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p>店舗が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  if (!store.isAcceptingQueue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 p-8">
          <p className="text-4xl mb-4">⏸️</p>
          <p className="text-lg font-medium">{store.name}</p>
          <p className="text-sm mt-2">現在、順番待ちの受付を停止しています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600">{store.name}</h1>
          <p className="text-gray-500 text-sm mt-1">順番待ち登録</p>
          {queueLength > 0 && (
            <div className="mt-3 bg-orange-50 rounded-lg p-3">
              <p className="text-orange-700 text-sm font-medium">
                現在 {queueLength} 組 待ち
              </p>
              <p className="text-orange-500 text-xs mt-0.5">
                目安: 約{Math.ceil(queueLength * store.averageSeatingDuration / Math.max(1, store.totalCapacity))}分
              </p>
            </div>
          )}
          {queueLength === 0 && (
            <div className="mt-3 bg-green-50 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">席にすぐご案内できます</p>
            </div>
          )}
        </div>

        <JoinForm onSubmit={handleJoin} maxCapacity={8} />
      </div>
    </div>
  );
}
