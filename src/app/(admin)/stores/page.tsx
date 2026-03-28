"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAdminStores } from "@/lib/firebase/firestore";
import type { Store } from "@/lib/types";

export default function StoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAdminStores(user.uid).then((s) => {
      setStores(s);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">店舗一覧</h1>
        <Link
          href="/stores/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 新しい店舗
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
        </div>
      ) : stores.length === 0 ? (
        <p className="text-center text-gray-500 py-20">店舗がありません</p>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between"
            >
              <div>
                <h2 className="font-semibold">{store.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  総席数: {store.totalCapacity} 席 ／ 平均滞在:{" "}
                  {store.averageSeatingDuration} 分
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/stores/${store.id}/map`}
                  className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  マップ編集
                </Link>
                <Link
                  href={`/stores/${store.id}/qr`}
                  className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  QRコード
                </Link>
                <Link
                  href={`/stores/${store.id}`}
                  className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  管理
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
