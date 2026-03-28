"use client";
import { useRef, useEffect, useCallback } from "react";
import type { Seat, SeatTool } from "@/lib/types";

const GRID = 20;
const SEAT_W = 80;
const SEAT_H = 60;
const RESIZE_HIT = 24; // リサイズハンドルのヒット領域 (px) ─ モバイルでも押しやすい大きさ
const MIN_SIZE = 40;
const MAX_W = 400;
const MAX_H = 300;

const STATUS_COLORS: Record<Seat["status"], string> = {
  available: "#22c55e",
  occupied: "#ef4444",
  reserved: "#f59e0b",
  unavailable: "#9ca3af",
};

interface MapCanvasProps {
  seats: Seat[];
  activeTool: SeatTool;
  selectedSeatId: string | null;
  onSeatAdd: (seat: Omit<Seat, "createdAt" | "occupiedSince" | "estimatedFreeAt">) => void;
  onSeatMove: (id: string, position: { x: number; y: number }) => void;
  onSeatResize: (id: string, size: { width: number; height: number }) => void;
  onSeatSelect: (id: string | null) => void;
  onSeatDoubleClick: (id: string) => void;
}

type DragMode = "move" | "resize";

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** 右下コーナーのリサイズ判定 */
function isInResizeHandle(seat: Seat, x: number, y: number): boolean {
  const rx = seat.position.x + seat.size.width - RESIZE_HIT;
  const ry = seat.position.y + seat.size.height - RESIZE_HIT;
  return x >= rx && y >= ry &&
    x <= seat.position.x + seat.size.width &&
    y <= seat.position.y + seat.size.height;
}

export function MapCanvas({
  seats,
  activeTool,
  selectedSeatId,
  onSeatAdd,
  onSeatMove,
  onSeatResize,
  onSeatSelect,
  onSeatDoubleClick,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<DragState | null>(null);
  // ダブルタップ検出用
  const lastTap = useRef<{ id: string; time: number } | null>(null);

  // ── 描画 ──────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // グリッド
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 席
    seats.forEach((seat) => {
      const { x, y } = seat.position;
      const w = seat.size.width;
      const h = seat.size.height;
      const isSelected = seat.id === selectedSeatId;

      // 影
      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = isSelected ? 10 : 3;

      // 塗り
      ctx.fillStyle = STATUS_COLORS[seat.status];
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // 枠
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSelected ? "#4f46e5" : "rgba(0,0,0,0.15)";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();

      // テキスト
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seat.label, x + w / 2, y + h / 2 - 8);
      ctx.font = "10px sans-serif";
      ctx.fillText(`${seat.capacity}名`, x + w / 2, y + h / 2 + 8);

      // ── リサイズハンドル (選択中のみ) ──────────────────
      if (isSelected) {
        const hx = x + w - 14;
        const hy = y + h - 14;

        // ハンドル背景
        ctx.fillStyle = "#4f46e5";
        ctx.beginPath();
        ctx.roundRect(hx, hy, 12, 12, 3);
        ctx.fill();

        // グリップ線 (斜め3本)
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const offset = 3 + i * 3;
          ctx.beginPath();
          ctx.moveTo(hx + offset, hy + 11);
          ctx.lineTo(hx + 11, hy + offset);
          ctx.stroke();
        }
      }
    });
  }, [seats, selectedSeatId]);

  useEffect(() => { draw(); }, [draw]);

  // ── 座標変換 ──────────────────────────────────────────────
  function canvasXY(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect();
    // canvas の CSS サイズと内部解像度が違う場合に対応
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function getSeatAt(x: number, y: number): Seat | null {
    for (let i = seats.length - 1; i >= 0; i--) {
      const s = seats[i];
      if (x >= s.position.x && x <= s.position.x + s.size.width &&
          y >= s.position.y && y <= s.position.y + s.size.height) {
        return s;
      }
    }
    return null;
  }

  // ── マウスイベント ────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e.clientX, e.clientY);
    const seat = getSeatAt(x, y);

    if (activeTool === "select") {
      if (seat) {
        onSeatSelect(seat.id);
        const mode: DragMode =
          (seat.id === selectedSeatId && isInResizeHandle(seat, x, y))
            ? "resize"
            : "move";
        drag.current = {
          id: seat.id, mode,
          startX: x, startY: y,
          origX: seat.position.x, origY: seat.position.y,
          origW: seat.size.width, origH: seat.size.height,
        };
      } else {
        onSeatSelect(null);
      }
    } else {
      addSeat(x, y);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const { x, y } = canvasXY(e.clientX, e.clientY);
    applyDrag(drag.current, x, y);
  }

  function handleMouseUp() { drag.current = null; }

  function handleDblClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e.clientX, e.clientY);
    const seat = getSeatAt(x, y);
    if (seat) onSeatDoubleClick(seat.id);
  }

  // ── タッチイベント ────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const { x, y } = canvasXY(t.clientX, t.clientY);
    const seat = getSeatAt(x, y);

    if (activeTool === "select") {
      if (seat) {
        onSeatSelect(seat.id);

        // ダブルタップ検出
        const now = Date.now();
        if (lastTap.current?.id === seat.id && now - lastTap.current.time < 350) {
          onSeatDoubleClick(seat.id);
          lastTap.current = null;
          return;
        }
        lastTap.current = { id: seat.id, time: now };

        const mode: DragMode =
          (seat.id === selectedSeatId && isInResizeHandle(seat, x, y))
            ? "resize"
            : "move";
        drag.current = {
          id: seat.id, mode,
          startX: x, startY: y,
          origX: seat.position.x, origY: seat.position.y,
          origW: seat.size.width, origH: seat.size.height,
        };
        e.preventDefault(); // スクロール防止
      } else {
        onSeatSelect(null);
      }
    } else {
      addSeat(x, y);
      e.preventDefault();
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!drag.current || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = canvasXY(t.clientX, t.clientY);
    applyDrag(drag.current, x, y);
  }

  function handleTouchEnd() { drag.current = null; }

  // ── 共通ロジック ──────────────────────────────────────────
  function applyDrag(d: DragState, x: number, y: number) {
    const dx = x - d.startX;
    const dy = y - d.startY;
    if (d.mode === "move") {
      onSeatMove(d.id, {
        x: snap(clamp(d.origX + dx, 0, 800)),
        y: snap(clamp(d.origY + dy, 0, 540)),
      });
    } else {
      onSeatResize(d.id, {
        width: snap(clamp(d.origW + dx, MIN_SIZE, MAX_W)),
        height: snap(clamp(d.origH + dy, MIN_SIZE, MAX_H)),
      });
    }
  }

  function addSeat(x: number, y: number) {
    const typeMap: Record<string, Seat["type"]> = {
      addTable: "table", addBar: "bar", addBooth: "booth",
    };
    const capacityMap: Record<string, number> = {
      addTable: 4, addBar: 2, addBooth: 6,
    };
    const type = typeMap[activeTool] ?? "table";
    const capacity = capacityMap[activeTool] ?? 4;
    const seatX = snap(x - SEAT_W / 2);
    const seatY = snap(y - SEAT_H / 2);
    const count = seats.filter((s) => s.type === type).length + 1;
    const labelMap: Record<string, string> = {
      table: "テーブル", bar: "バー", booth: "ボックス",
    };
    onSeatAdd({
      id: `seat-${Date.now()}`,
      label: `${labelMap[type]}${count}`,
      type, capacity, minCapacity: 1,
      zoneId: null,
      position: { x: seatX, y: seatY },
      size: { width: SEAT_W, height: SEAT_H },
      status: "available",
      currentQueueId: null,
    });
  }

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      className="bg-white rounded-lg cursor-crosshair touch-none"
      style={{ maxWidth: "100%" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDblClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
