"use client";
import { useRef, useEffect, useCallback } from "react";
import type { Seat, SeatTool } from "@/lib/types";

const GRID = 20;
const SEAT_W = 80;
const SEAT_H = 60;

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
  onSeatSelect: (id: string | null) => void;
  onSeatDoubleClick: (id: string) => void;
}

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

export function MapCanvas({
  seats,
  activeTool,
  selectedSeatId,
  onSeatAdd,
  onSeatMove,
  onSeatSelect,
  onSeatDoubleClick,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Seats
    seats.forEach((seat) => {
      const { x, y } = seat.position;
      const w = seat.size.width;
      const h = seat.size.height;
      const isSelected = seat.id === selectedSeatId;

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = isSelected ? 8 : 3;

      // Fill
      ctx.fillStyle = STATUS_COLORS[seat.status];
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSelected ? "#4f46e5" : "rgba(0,0,0,0.15)";
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seat.label, x + w / 2, y + h / 2 - 8);

      // Capacity
      ctx.font = "10px sans-serif";
      ctx.fillText(`${seat.capacity}名`, x + w / 2, y + h / 2 + 8);
    });
  }, [seats, selectedSeatId]);

  useEffect(() => {
    draw();
  }, [draw]);

  function getSeatAt(x: number, y: number): Seat | null {
    // Iterate in reverse to pick topmost
    for (let i = seats.length - 1; i >= 0; i--) {
      const s = seats[i];
      if (
        x >= s.position.x &&
        x <= s.position.x + s.size.width &&
        y >= s.position.y &&
        y <= s.position.y + s.size.height
      ) {
        return s;
      }
    }
    return null;
  }

  function canvasXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);
    const seat = getSeatAt(x, y);

    if (activeTool === "select") {
      if (seat) {
        onSeatSelect(seat.id);
        dragging.current = {
          id: seat.id,
          startX: x,
          startY: y,
          origX: seat.position.x,
          origY: seat.position.y,
        };
      } else {
        onSeatSelect(null);
      }
    } else {
      // Add new seat
      const typeMap: Record<string, Seat["type"]> = {
        addTable: "table",
        addBar: "bar",
        addBooth: "booth",
      };
      const capacityMap: Record<string, number> = {
        addTable: 4,
        addBar: 2,
        addBooth: 6,
      };
      const type = typeMap[activeTool] ?? "table";
      const capacity = capacityMap[activeTool] ?? 4;
      const seatX = snap(x - SEAT_W / 2);
      const seatY = snap(y - SEAT_H / 2);
      const count = seats.filter((s) => s.type === type).length + 1;
      const labelMap: Record<string, string> = {
        table: "テーブル",
        bar: "バー",
        booth: "ボックス",
      };
      onSeatAdd({
        id: `seat-${Date.now()}`,
        label: `${labelMap[type]}${count}`,
        type,
        capacity,
        minCapacity: 1,
        zoneId: null,
        position: { x: seatX, y: seatY },
        size: { width: SEAT_W, height: SEAT_H },
        status: "available",
        currentQueueId: null,
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging.current) return;
    const { x, y } = canvasXY(e);
    const dx = x - dragging.current.startX;
    const dy = y - dragging.current.startY;
    onSeatMove(dragging.current.id, {
      x: snap(dragging.current.origX + dx),
      y: snap(dragging.current.origY + dy),
    });
  }

  function handleMouseUp() {
    dragging.current = null;
  }

  function handleDblClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);
    const seat = getSeatAt(x, y);
    if (seat) onSeatDoubleClick(seat.id);
  }

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      className="bg-white rounded-lg cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDblClick}
    />
  );
}
