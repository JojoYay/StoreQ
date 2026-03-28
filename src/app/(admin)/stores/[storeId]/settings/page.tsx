"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getStore, updateStore } from "@/lib/firebase/firestore";
import { storeFormSchema, type StoreFormData } from "@/lib/utils/validation";
import type { Store } from "@/lib/types";

export default function StoreSettingsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormData>({ resolver: zodResolver(storeFormSchema) });

  useEffect(() => {
    getStore(storeId).then((s) => {
      setStore(s);
      if (s) {
        reset({
          name: s.name,
          averageSeatingDuration: s.averageSeatingDuration,
        });
      }
    });
  }, [storeId, reset]);

  async function onSubmit(data: StoreFormData) {
    await updateStore(storeId, data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleQueue() {
    if (!store) return;
    await updateStore(storeId, { isAcceptingQueue: !store.isAcceptingQueue });
    setStore({ ...store, isAcceptingQueue: !store.isAcceptingQueue });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-8">店舗設定</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">店舗名</label>
          <input
            type="text"
            {...register("name")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平均滞在時間（分）
          </label>
          <input
            type="number"
            {...register("averageSeatingDuration", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.averageSeatingDuration && (
            <p className="text-red-500 text-xs mt-1">
              {errors.averageSeatingDuration.message}
            </p>
          )}
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            保存しました
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "保存中..." : "変更を保存"}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="font-semibold mb-3">キュー受付</h2>
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
          <div>
            <p className="font-medium text-sm">
              {store?.isAcceptingQueue ? "受付中" : "受付停止中"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              停止中はQRコードからの新規登録ができなくなります
            </p>
          </div>
          <button
            onClick={toggleQueue}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              store?.isAcceptingQueue
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {store?.isAcceptingQueue ? "停止する" : "再開する"}
          </button>
        </div>
      </div>
    </div>
  );
}
