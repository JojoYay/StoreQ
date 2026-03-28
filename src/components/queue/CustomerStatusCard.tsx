"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationOptIn } from "@/components/customer/NotificationOptIn";
import { formatCountdown, secondsUntil } from "@/lib/utils/time";
import type { QueueEntry } from "@/lib/types";

interface CustomerStatusCardProps {
  entry: QueueEntry;
  queuePosition: number;
  waitMinutes: number;
  onConfirmSeated: () => void;
  onCancel: () => void;
}

export function CustomerStatusCard({
  entry,
  queuePosition,
  waitMinutes,
  onConfirmSeated,
  onCancel,
}: CustomerStatusCardProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (entry.status !== "notified" || !entry.expiresAt) return;
    const tick = () => setCountdown(secondsUntil(entry.expiresAt!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [entry.status, entry.expiresAt]);

  if (entry.status === "seated") {
    return (
      <div className="text-center space-y-4">
        <div className="text-7xl">✅</div>
        <h2 className="text-2xl font-bold text-green-600">着席完了</h2>
        <p className="text-gray-600">{entry.assignedSeatLabel} にご案内しました</p>
        <p className="text-sm text-gray-400">お食事をお楽しみください</p>
      </div>
    );
  }

  if (entry.status === "cancelled" || entry.status === "expired") {
    return (
      <div className="text-center space-y-4">
        <div className="text-7xl">{entry.status === "expired" ? "⏰" : "❌"}</div>
        <h2 className="text-xl font-bold text-gray-700">
          {entry.status === "expired" ? "時間切れ" : "キャンセル済み"}
        </h2>
        <p className="text-gray-500 text-sm">
          {entry.status === "expired"
            ? "案内時間内に確認されなかったため、キャンセルされました"
            : "順番待ちをキャンセルしました"}
        </p>
        <Link
          href={`/join/${entry.storeId}`}
          className="inline-block mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          もう一度登録する
        </Link>
      </div>
    );
  }

  if (entry.status === "notified") {
    return (
      <div className="text-center space-y-5">
        <div className="text-7xl animate-bounce">🔔</div>
        <h2 className="text-2xl font-bold text-indigo-600">席の準備ができました！</h2>
        <div className="bg-indigo-50 rounded-xl p-5">
          <p className="text-3xl font-bold text-indigo-700">{entry.assignedSeatLabel}</p>
          <p className="text-indigo-500 text-sm mt-1">にお進みください</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">案内の有効時間</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${countdown < 60 ? "text-red-500" : "text-gray-700"}`}>
            {formatCountdown(countdown)}
          </p>
        </div>

        <button
          onClick={onConfirmSeated}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-medium text-base hover:bg-green-700 transition-colors"
        >
          着席しました
        </button>
        <button
          onClick={onCancel}
          className="w-full text-sm text-gray-400 hover:text-gray-600"
        >
          キャンセルする
        </button>
      </div>
    );
  }

  // waiting
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-gray-500 text-sm">現在の順番</p>
        <p className="text-6xl font-bold text-indigo-600 mt-1">{queuePosition}</p>
        <p className="text-gray-400 text-sm mt-1">番目</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-gray-500 text-xs">目安の待ち時間</p>
        <p className="text-xl font-semibold text-gray-700 mt-1">
          {waitMinutes <= 0 ? "まもなくご案内" : `約${waitMinutes}分`}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">お名前</span>
          <span className="font-medium">{entry.customerName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">人数</span>
          <span className="font-medium">{entry.partySize}名</span>
        </div>
      </div>

      <NotificationOptIn queueId={entry.id} onEnabled={() => {}} />

      <button
        onClick={onCancel}
        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
      >
        順番待ちをキャンセルする
      </button>
    </div>
  );
}
