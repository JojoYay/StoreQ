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
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSeats(initialSeats); }, [initialSeats]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId) ?? null;

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
    setSelectedSeatId(newSeat.id);
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
    setSelectedSeatId(null);
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

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <SeatToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
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
              selectedSeatId={selectedSeatId}
              onSeatAdd={handleSeatAdd}
              onSeatMove={handleSeatMove}
              onSeatResize={handleSeatResize}
              onSeatSelect={setSelectedSeatId}
              onSeatDoubleClick={(id) => {
                setSelectedSeatId(id);
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
            💡 PC: ドラッグで移動 / 右下■でリサイズ　モバイル: タップで選択 → 下のパネルでサイズ調整
          </p>
        </div>

        {/* プロパティパネル: 選択中のみ表示 */}
        {selectedSeat && (
          <SeatProperties
            seat={selectedSeat}
            onChange={handleSeatUpdate}
            onDelete={handleSeatDelete}
          />
        )}
      </div>
    </div>
  );
}
