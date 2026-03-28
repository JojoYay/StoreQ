"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapEditor } from "@/components/map/MapEditor";
import { getStore } from "@/lib/firebase/firestore";
import { getDocs } from "firebase/firestore";
import { seatsRef } from "@/lib/firebase/firestore";
import type { Store, Seat } from "@/lib/types";

export default function MapPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, seatsSnap] = await Promise.all([
        getStore(storeId),
        getDocs(seatsRef(storeId)),
      ]);
      setStore(s);
      setSeats(
        seatsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Seat))
      );
      setLoading(false);
    }
    load();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Link href="/stores" className="text-gray-400 hover:text-gray-600">
          ← 店舗一覧
        </Link>
        <h1 className="font-semibold">{store?.name} - マップ編集</h1>
        <div className="flex-1" />
        <Link
          href={`/stores/${storeId}/qr`}
          className="text-sm text-indigo-600 hover:underline"
        >
          QRコードを表示 →
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapEditor storeId={storeId} initialSeats={seats} />
      </div>
    </div>
  );
}
