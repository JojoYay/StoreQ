"use client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import { MapCanvas } from "./MapCanvas";
import { SeatToolbar } from "./SeatToolbar";
import { SeatProperties } from "./SeatProperties";
import { saveSeats } from "@/lib/firebase/firestore";
import type { Seat, SeatTool } from "@/lib/types";

interface MapEditorProps {
  storeId: string;
  initialSeats: Seat[];
}

export function MapEditor({ storeId, initialSeats }: MapEditorProps) {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [activeTool, setActiveTool] = useState<SeatTool>("select");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSeats(initialSeats); }, [initialSeats]);

  // 選択中の席オブジェクト
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const singleSelectedSeat = selectedSeats.length === 1 ? selectedSeats[0] : null;

  // ツール切り替え時は選択をリセット
  function handleToolChange(tool: SeatTool) {
    setActiveTool(tool);
    setSelectedSeatIds([]);
  }

  // 席クリック: addToSelection=true → トグル、false → 単独選択
  function handleSeatClick(id: string | null, addToSelection: boolean) {
    if (id === null) {
      setSelectedSeatIds([]);
      return;
    }
    if (addToSelection) {
      setSelectedSeatIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedSeatIds([id]);
    }
  }

  function handleSeatAdd(seatData: Omit<Seat, "createdAt" | "occupiedSince" | "estimatedFreeAt">) {
    const now = Timestamp.now();
    const newSeat: Seat = {
      ...seatData,
      id: uuidv4(),
      createdAt: now,
      occupiedSince: null,
      estimatedFreeAt: null,
    };
    setSeats((prev) => [...prev, newSeat]);
    setSelectedSeatIds([newSeat.id]);
    setActiveTool("select");
  }

  function handleSeatMove(id: string, position: { x: number; y: number }) {
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, position } : s)));
  }

  function handleSeatResize(id: string, size: { width: number; height: number }) {
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, size } : s)));
  }

  function handleSeatUpdate(id: string, updates: Partial<Seat>) {
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function handleSeatDelete(id: string) {
    setSeats((prev) => prev.filter((s) => s.id !== id));
    setSelectedSeatIds((prev) => prev.filter((x) => x !== id));
  }

  // ── 席の結合 ──────────────────────────────────────────────
  function handleMergeSeats() {
    if (selectedSeats.length < 2) return;

    // 選択席のバウンディングボックスを計算
    const minX = Math.min(...selectedSeats.map((s) => s.position.x));
    const minY = Math.min(...selectedSeats.map((s) => s.position.y));
    const maxX = Math.max(...selectedSeats.map((s) => s.position.x + s.size.width));
    const maxY = Math.max(...selectedSeats.map((s) => s.position.y + s.size.height));

    // 定員を合算
    const totalCapacity = selectedSeats.reduce((sum, s) => sum + s.capacity, 0);
    const minCapacity = Math.min(...selectedSeats.map((s) => s.minCapacity));

    // ラベル: 先頭と末尾の席名で「〜」でつなぐ
    const first = selectedSeats[0].label;
    const last = selectedSeats[selectedSeats.length - 1].label;
    const label = first === last ? first : `${first}・${last}`;

    const now = Timestamp.now();
    const mergedSeat: Seat = {
      id: uuidv4(),
      label,
      type: selectedSeats[0].type,
      capacity: totalCapacity,
      minCapacity,
      zoneId: selectedSeats[0].zoneId,
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      status: "available",
      currentQueueId: null,
      createdAt: now,
      occupiedSince: null,
      estimatedFreeAt: null,
    };

    setSeats((prev) => [
      ...prev.filter((s) => !selectedSeatIds.includes(s.id)),
      mergedSeat,
    ]);
    setSelectedSeatIds([mergedSeat.id]);
    setActiveTool("select");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSeats(storeId, seats);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // 結合モード用の右パネル
  const mergePanel = activeTool === "merge" && (
    <div className="w-full lg:w-64 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 space-y-4 overflow-y-auto max-h-80 lg:max-h-none">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
        🔗 席を結合
      </h3>
      <p className="text-xs text-gray-500">
        結合したい席を順番にタップ / クリックしてください。
        <br />
        PCでは Shift+クリックでも複数選択できます。
      </p>

      {selectedSeats.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">席が選択されていません</p>
      ) : (
        <>
          <div className="space-y-1">
            {selectedSeats.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                  {i + 1}
                </span>
                <span className="text-sm flex-1 truncate">{s.label}</span>
                <span className="text-xs text-gray-400">{s.capacity}名</span>
              </div>
            ))}
          </div>

          {selectedSeats.length >= 2 && (
            <div className="bg-orange-50 rounded-lg px-3 py-2 text-sm">
              <p className="text-xs text-gray-500 mb-0.5">結合後の収容人数</p>
              <p className="font-bold text-orange-700">
                {selectedSeats.reduce((sum, s) => sum + s.capacity, 0)}名
              </p>
            </div>
          )}

          <button
            onClick={() => setSelectedSeatIds([])}
            className="w-full text-xs border border-gray-200 text-gray-500 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            選択をクリア
          </button>

          {selectedSeats.length >= 2 && (
            <button
              onClick={handleMergeSeats}
              className="w-full text-sm bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              🔗 {selectedSeats.length}席を結合する
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <SeatToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onSave={handleSave}
        saving={saving}
      />

      {saved && (
        <div className="bg-green-100 text-green-700 text-sm text-center py-1.5">
          保存しました ✓
        </div>
      )}

      {/* メインエリア: モバイルは縦積み、PC は横並び */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* キャンバス */}
        <div className="flex-1 p-3 sm:p-4 overflow-auto bg-gray-100 min-h-0">
          <div className="overflow-x-auto">
            <MapCanvas
              seats={seats}
              activeTool={activeTool}
              selectedSeatIds={selectedSeatIds}
              onSeatAdd={handleSeatAdd}
              onSeatMove={handleSeatMove}
              onSeatResize={handleSeatResize}
              onSeatClick={handleSeatClick}
              onSeatDoubleClick={(id) => {
                setSelectedSeatIds([id]);
                setActiveTool("select");
              }}
            />
          </div>

          {/* 凡例 */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            {[
              { color: "#22c55e", label: "空席" },
              { color: "#ef4444", label: "使用中" },
              { color: "#f59e0b", label: "予約済" },
              { color: "#9ca3af", label: "利用不可" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>

          {/* 操作ヒント */}
          <p className="mt-2 text-xs text-gray-400">
            {activeTool === "merge"
              ? "💡 結合モード: 席をタップして選択 → 右の「結合する」ボタンで確定"
              : "💡 PC: ドラッグで移動 / 右下■でリサイズ　モバイル: タップで選択 → 下のパネルでサイズ調整　Shift+クリックで複数選択"}
          </p>
        </div>

        {/* 右パネル: 結合モード or 単独選択プロパティ */}
        {mergePanel}
        {!mergePanel && singleSelectedSeat && (
          <SeatProperties
            seat={singleSelectedSeat}
            onChange={handleSeatUpdate}
            onDelete={handleSeatDelete}
          />
        )}
      </div>
    </div>
  );
}
