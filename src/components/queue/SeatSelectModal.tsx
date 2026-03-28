"use client";
import { useState } from "react";
import { findBestSeat } from "@/lib/algorithms/seatAssignment";
import type { Seat, QueueEntry } from "@/lib/types";

interface SeatSelectModalProps {
  entry: QueueEntry;
  availableSeats: Seat[];
  waitingQueue: QueueEntry[];
  onConfirm: (seatIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function SeatSelectModal({
  entry,
  availableSeats,
  waitingQueue,
  onConfirm,
  onClose,
}: SeatSelectModalProps) {
  const suggested = findBestSeat(entry.partySize, availableSeats, waitingQueue);

  // 単一選択モード
  const [selectedId, setSelectedId] = useState<string>(suggested?.seatId ?? "");
  // 複数席結合モード
  const [combineMode, setCombineMode] = useState(false);
  const [combinedIds, setCombinedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 結合モード切り替え
  function toggleCombineMode() {
    setCombineMode((v) => !v);
    setCombinedIds([]);
  }

  // 結合モードで席をトグル
  function toggleCombineSeat(id: string) {
    setCombinedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // 結合後の合計定員
  const combinedCapacity = combinedIds.reduce((sum, id) => {
    const s = availableSeats.find((x) => x.id === id);
    return sum + (s?.capacity ?? 0);
  }, 0);

  async function handleConfirm() {
    const ids = combineMode ? combinedIds : selectedId ? [selectedId] : [];
    if (ids.length === 0) return;
    setLoading(true);
    try {
      await onConfirm(ids);
    } finally {
      setLoading(false);
    }
  }

  const canConfirm = combineMode ? combinedIds.length >= 2 : !!selectedId;

  // 席を人数適合でグループ分け
  const fitsSeats = availableSeats.filter(
    (s) => s.capacity >= entry.partySize && s.minCapacity <= entry.partySize
  );
  const tooSmallSeats = availableSeats.filter(
    (s) => s.capacity < entry.partySize || s.minCapacity > entry.partySize
  );

  return (
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

          {/* おすすめ（通常モードのみ） */}
          {!combineMode && suggested && (
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-indigo-500">✨</span>
              <span className="text-indigo-700">
                おすすめ: <strong>{availableSeats.find(s => s.id === suggested.seatId)?.label}</strong>
                （スコア {suggested.score}点）
              </span>
            </div>
          )}

          {/* 結合モードバナー */}
          {combineMode && (
            <div className="mt-3 bg-orange-50 rounded-lg px-3 py-2 text-sm">
              <p className="text-orange-700 font-medium">🔗 席を組み合わせ中</p>
              {combinedIds.length === 0 ? (
                <p className="text-xs text-orange-500 mt-0.5">結合したい席を2つ以上選んでください</p>
              ) : (
                <p className="text-xs text-orange-600 mt-0.5">
                  {combinedIds.length}席選択中 / 合計 {combinedCapacity}名収容
                </p>
              )}
            </div>
          )}

          {/* 結合モード切り替えボタン */}
          <button
            onClick={toggleCombineMode}
            className={`mt-3 w-full text-xs py-1.5 rounded-lg border transition-colors ${
              combineMode
                ? "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {combineMode ? "✕ 結合モードをやめる" : "🔗 席を組み合わせる（バー・テーブル連結）"}
          </button>
        </div>

        {/* 席一覧 */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {availableSeats.length === 0 ? (
            <p className="text-center text-gray-400 py-8">空席がありません</p>
          ) : (
            <>
              {fitsSeats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {entry.partySize}名に適した席
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {fitsSeats.map((seat) => {
                      const isSelected = combineMode
                        ? combinedIds.includes(seat.id)
                        : seat.id === selectedId;
                      const isSuggested = !combineMode && seat.id === suggested?.seatId;
                      const waste = seat.capacity - entry.partySize;
                      const combineIndex = combinedIds.indexOf(seat.id);
                      return (
                        <button
                          key={seat.id}
                          onClick={() =>
                            combineMode
                              ? toggleCombineSeat(seat.id)
                              : setSelectedId(seat.id)
                          }
                          className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? combineMode
                                ? "border-orange-500 bg-orange-50"
                                : "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 bg-white hover:border-indigo-300"
                          }`}
                        >
                          {isSuggested && (
                            <span className="absolute top-1.5 right-1.5 text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                              おすすめ
                            </span>
                          )}
                          {combineMode && isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {combineIndex + 1}
                            </span>
                          )}
                          <p className="font-semibold text-sm mt-1">{seat.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            最大 {seat.capacity}名
                            {!combineMode && (waste === 0 ? " · ぴったり" : ` · 余裕 ${waste}名`)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{seat.type}</p>
                          {!combineMode && isSelected && (
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

              {tooSmallSeats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    人数が合わない席{combineMode ? "（結合して使用可）" : "（参考）"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {tooSmallSeats.map((seat) => {
                      const isSelected = combineMode
                        ? combinedIds.includes(seat.id)
                        : seat.id === selectedId;
                      const combineIndex = combinedIds.indexOf(seat.id);
                      return (
                        <button
                          key={seat.id}
                          onClick={() =>
                            combineMode
                              ? toggleCombineSeat(seat.id)
                              : setSelectedId(seat.id)
                          }
                          className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? combineMode
                                ? "border-orange-500 bg-orange-50 opacity-100"
                                : "border-orange-400 bg-orange-50 opacity-100"
                              : "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80"
                          }`}
                        >
                          {combineMode && isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {combineIndex + 1}
                            </span>
                          )}
                          <p className="font-semibold text-sm">{seat.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">最大 {seat.capacity}名</p>
                          <p className="text-xs text-orange-500 mt-0.5">
                            {combineMode ? `${seat.capacity}名席` : "人数不一致"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          {combineMode && combinedIds.length >= 2 && (
            <div className="text-xs text-center text-orange-700 bg-orange-50 rounded-lg py-1.5">
              {combinedIds.map(id => availableSeats.find(s => s.id === id)?.label).join(" + ")}
              　合計 {combinedCapacity}名席
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors ${
                combineMode
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "案内中..."
                : combineMode
                  ? `${combinedIds.length}席を結合して案内`
                  : "この席に案内する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
