"use client";
import { useEffect, useState } from "react";
import { subscribeToQueue } from "../firebase/firestore";
import type { QueueEntry } from "../types";

export function useQueue(storeId: string | null) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    const unsub = subscribeToQueue(
      storeId,
      ["waiting", "notified"],
      (entries) => {
        setQueue(entries);
        setLoading(false);
      }
    );
    return unsub;
  }, [storeId]);

  return { queue, loading };
}
