"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAdminStores } from "@/lib/firebase/firestore";
import type { Store } from "@/lib/types";

const STORAGE_KEY = "queuemaker_selected_store";

interface SelectedStoreContextValue {
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStoreId: (id: string) => void;
  loading: boolean;
}

const SelectedStoreContext = createContext<SelectedStoreContextValue>({
  stores: [],
  selectedStore: null,
  setSelectedStoreId: () => {},
  loading: true,
});

export function SelectedStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAdminStores(user.uid).then((list) => {
      setStores(list);
      // localStorage に保存された選択を復元。なければ先頭を選択
      const saved = localStorage.getItem(STORAGE_KEY);
      const initial = list.find((s) => s.id === saved) ?? list[0];
      if (initial) setSelectedId(initial.id);
      setLoading(false);
    });
  }, [user]);

  function setSelectedStoreId(id: string) {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const selectedStore = stores.find((s) => s.id === selectedId) ?? null;

  return (
    <SelectedStoreContext.Provider
      value={{ stores, selectedStore, setSelectedStoreId, loading }}
    >
      {children}
    </SelectedStoreContext.Provider>
  );
}

export function useSelectedStore() {
  return useContext(SelectedStoreContext);
}
