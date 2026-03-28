"use client";
import { useState } from "react";
import { findBestSeat } from "@/lib/algorithms/seatAssignment";
import type { Seat, QueueEntry } from "@/lib/types";

interface SeatSelectModalProps {
  entry: QueueEntry;
  availableSeats: Seat[];
  waitingQueue: QueueEntry[];
  onConfirm: (seatId: string) => Promise<void>;
  onClose: () => void;
}

export function SeatSelectModal({
  entry,
  availableSeats,
  waitingQueue,
  onConfirm,
  onClose,
}: SeatSelectModalProps) {
  // アルゴリズムで最適席を算出
  const suggested = findBestSeat(entry.partySize, availableSeats, waitingQueue);
  const [selectedId, setSelectedId] = useState<string>(suggested?.seatId ?? "");
  const [loading, setLoading] = useState(false);

  // 席を人数適合でグループ分け
  const fitsSeats = availableSeats.filter(
    (s) => s.capacity >= entry.partySize && s.minCapacity <= entry.partySize
  );
  const tooSmallSeats = availableSeats.filter(
    (s) => s.capacity < entry.partySize || s.minCapacity > entry.partySize
  );

  async function handleConfirm() {
    if (!selectedId) return;
    setLoading(true);
    try {
      await onConfirm(selectedId);
    } finally {
      setLoading(false);
    }
  }

  return (
    // オーバーレイ
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-lg">席を選択</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {entry.customerName} さん（{entry.partySize}名）
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* おすすめ表示 */}
          {suggested && (
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-indigo-500">✨</span>
              <span className="text-indigo-700">
                おすすめ: <strong>{availableSeats.find(s => s.id === suggested.seatId)?.label}</strong>
                （スコア {suggested.score}点）
              </span>
            </div>
          )}
        </div>

        {/* 席一覧 */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {availableSeats.length === 0 ? (
            <p className="text-center text-gray-400 py-8">空席がありません</p>
          ) : (
            <>
              {/* 人数に合う席 */}
              {fitsSeats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {entry.partySize}名に適した席
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {fitsSeats.map((seat) => {
                      const isSelected = seat.id === selectedId;
                      const isSuggested = seat.id === suggested?.seatId;
                      const waste = seat.capacity - entry.partySize;
                      return (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedId(seat.id)}
                          className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 bg-white hover:border-indigo-300"
                          }`}
                        >
                          {isSuggested && (
                            <span className="absolute top-1.5 right-1.5 text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                              おすすめ
                            </span>
                          )}
                          <p className="font-semibold text-sm mt-1">{seat.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            最大 {seat.capacity}名
                            {waste === 0
                              ? " · ぴったり"
                              : ` · 余裕 ${waste}名`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{seat.type}</p>
                          {isSelected && (
                            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 容量が小さい席（参考表示） */}
              {tooSmallSeats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    人数が合わない席（参考）
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {tooSmallSeats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => setSelectedId(seat.id)}
                        className={`text-left p-3 rounded-xl border-2 opacity-60 transition-all ${
                          seat.id === selectedId
                            ? "border-orange-400 bg-orange-50 opacity-100"
                            : "border-gray-200 bg-gray-50 hover:opacity-80"
                        }`}
                      >
                        <p className="font-semibold text-sm">{seat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">最大 {seat.capacity}名</p>
                        <p className="text-xs text-orange-500 mt-0.5">人数不一致</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || loading}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "案内中..." : "この席に案内する"}
          </button>
        </div>
      </div>
    </div>
  );
}
