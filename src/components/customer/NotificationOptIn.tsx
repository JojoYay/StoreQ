"use client";
import { useState } from "react";
import { useFCMToken } from "@/lib/hooks/useFCMToken";

interface NotificationOptInProps {
  queueId: string;
  onEnabled: () => void;
}

export function NotificationOptIn({ queueId, onEnabled }: NotificationOptInProps) {
  const { requestAndSave, loading, error, token } = useFCMToken();
  const [declined, setDeclined] = useState(false);

  if (token) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-700 font-medium text-sm">
          通知が有効になっています
        </p>
        <p className="text-green-600 text-xs mt-1">
          席が空き次第お知らせします
        </p>
      </div>
    );
  }

  if (declined) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <p className="font-medium text-sm text-indigo-900">
            席が空いたら通知を受け取りますか？
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            待ち時間中に外出しても大丈夫です。席の準備ができたらお知らせします。
          </p>

          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                await requestAndSave(queueId);
                onEnabled();
              }}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "設定中..." : "通知を受け取る"}
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="text-sm text-indigo-500 px-3"
            >
              後で
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
