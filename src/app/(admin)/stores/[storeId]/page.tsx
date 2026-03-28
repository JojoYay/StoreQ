"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSeats } from "@/lib/hooks/useSeats";
import { useQueue } from "@/lib/hooks/useQueue";
import { updateSeat } from "@/lib/firebase/firestore";
import { OccupancyMeter } from "@/components/admin/OccupancyMeter";
import { Timestamp } from "firebase/firestore";
import type { Seat } from "@/lib/types";

const STATUS_COLORS: Record<Seat["status"], string> = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-yellow-400",
  unavailable: "bg-gray-300",
};

const STATUS_LABELS: Record<Seat["status"], string> = {
  available: "空席",
  occupied: "使用中",
  reserved: "予約済",
  unavailable: "利用不可",
};

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { seats, available, occupied, loading: seatsLoading } = useSeats(storeId);
  const { queue } = useQueue(storeId);

  async function toggleSeatStatus(seat: Seat) {
    if (seat.status === "occupied") {
      await updateSeat(storeId, seat.id, {
        status: "available",
        currentQueueId: null,
        occupiedSince: null,
        estimatedFreeAt: null,
      });
    } else if (seat.status === "available") {
      const now = Timestamp.now();
      await updateSeat(storeId, seat.id, {
        status: "occupied",
        occupiedSince: now,
      });
    }
  }

  if (seatsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/stores" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 店舗一覧
          </Link>
          <h1 className="text-xl font-bold">フロア管理</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/stores/${storeId}/map`}
            className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            マップ編集
          </Link>
          <Link
            href={`/queue/${storeId}`}
            className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            キュー管理
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-sm text-gray-700">状況</h2>
          <OccupancyMeter
            current={occupied.length}
            total={seats.length}
          />
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{available.length}</p>
              <p className="text-xs text-gray-500">空席</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-600">{queue.length}</p>
              <p className="text-xs text-gray-500">待ち組数</p>
            </div>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="lg:col-span-3">
          <h2 className="font-semibold text-sm text-gray-700 mb-3">席一覧</h2>
          {seats.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              <p>まだ席が登録されていません</p>
              <Link
                href={`/stores/${storeId}/map`}
                className="inline-block mt-4 text-indigo-600 hover:underline text-sm"
              >
                マップエディターで席を追加
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => toggleSeatStatus(seat)}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-3 h-3 rounded-full mb-2 ${STATUS_COLORS[seat.status]}`}
                  />
                  <p className="font-medium text-sm">{seat.label}</p>
                  <p className="text-xs text-gray-400">{seat.capacity}名</p>
                  <p className={`text-xs mt-1 font-medium ${
                    seat.status === "available" ? "text-green-600" :
                    seat.status === "occupied" ? "text-red-600" :
                    seat.status === "reserved" ? "text-yellow-600" : "text-gray-400"
                  }`}>
                    {STATUS_LABELS[seat.status]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
