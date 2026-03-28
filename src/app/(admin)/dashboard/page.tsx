"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelectedStore } from "@/contexts/SelectedStoreContext";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedStore, loading } = useSelectedStore();

  // 店舗が選択されていればフロア管理へリダイレクト
  useEffect(() => {
    if (!loading && selectedStore) {
      router.replace(`/stores/${selectedStore.id}`);
    }
  }, [loading, selectedStore, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  // 店舗がまだ登録されていない場合
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
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
  );
}
