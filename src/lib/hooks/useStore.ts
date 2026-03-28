import { useEffect, useState } from "react";
import { getStore } from "@/lib/firebase/firestore";
import type { Store } from "@/lib/types";

export function useStore(storeId: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    getStore(storeId).then((s) => {
      setStore(s);
      setLoading(false);
    });
  }, [storeId]);

  return { store, loading };
}
