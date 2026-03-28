"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { createStore, updateStore } from "@/lib/firebase/firestore";
import { buildJoinUrl } from "@/lib/utils/qr";
import { storeFormSchema, type StoreFormData } from "@/lib/utils/validation";

export default function NewStorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: { averageSeatingDuration: 60 },
  });

  async function onSubmit(data: StoreFormData) {
    if (!user) return;
    setError("");
    try {
      const storeId = await createStore(user.uid, data);
      // Set QR URL after we have the storeId
      await updateStore(storeId, { qrCodeUrl: buildJoinUrl(storeId) });
      router.replace(`/stores/${storeId}/map`);
    } catch {
      setError("店舗の作成に失敗しました。もう一度お試しください。");
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-8">新しい店舗を作成</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            店舗名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("name")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="例: カフェ○○"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平均滞在時間（分）<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register("averageSeatingDuration", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="60"
          />
          <p className="text-xs text-gray-400 mt-1">
            待ち時間の目安計算に使用します
          </p>
          {errors.averageSeatingDuration && (
            <p className="text-red-500 text-xs mt-1">
              {errors.averageSeatingDuration.message}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "作成中..." : "作成してマップを設定"}
          </button>
        </div>
      </form>
    </div>
  );
}
