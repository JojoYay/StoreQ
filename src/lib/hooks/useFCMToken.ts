"use client";
import { useState } from "react";
import { requestFCMToken } from "../firebase/fcm";
import { updateQueueEntry } from "../firebase/firestore";

export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestAndSave(queueId: string) {
    setLoading(true);
    setError(null);
    try {
      const t = await requestFCMToken();
      if (t) {
        await updateQueueEntry(queueId, { fcmToken: t });
        setToken(t);
      } else {
        setError("通知の許可が得られませんでした");
      }
    } catch {
      setError("通知の設定に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return { token, loading, error, requestAndSave };
}
