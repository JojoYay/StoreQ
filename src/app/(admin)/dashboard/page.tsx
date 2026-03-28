"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAdminStores } from "@/lib/firebase/firestore";
import { OccupancyMeter } from "@/components/admin/OccupancyMeter";
import type { Store } from "@/lib/types";

export default function DashboardPage() {
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

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link
          href="/stores/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 店舗を追加
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🏪</p>
          <p className="text-lg font-medium">まだ店舗がありません</p>
          <p className="text-sm mt-2">まず店舗を登録してください</p>
          <Link
            href="/stores/new"
            className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            店舗を作成
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{store.name}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    store.isAcceptingQueue
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {store.isAcceptingQueue ? "受付中" : "停止中"}
                </span>
              </div>
              <OccupancyMeter
                current={store.currentOccupancy}
                total={store.totalCapacity}
              />
              <div className="flex gap-2 mt-5">
                <Link
                  href={`/stores/${store.id}`}
                  className="flex-1 text-center text-sm bg-indigo-50 text-indigo-700 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  フロア管理
                </Link>
                <Link
                  href={`/queue/${store.id}`}
                  className="flex-1 text-center text-sm bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  キュー管理
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
