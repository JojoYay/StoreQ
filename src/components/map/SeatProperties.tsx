import type { Seat } from "@/lib/types";

const GRID = 20;
const MIN_SIZE = 40;
const MAX_W = 400;
const MAX_H = 300;

interface SeatPropertiesProps {
  seat: Partial<Seat> & { id: string };
  onChange: (id: string, updates: Partial<Seat>) => void;
  onDelete: (id: string) => void;
}

/** スライダー + 数値入力の複合コンポーネント */
function SizeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-xs font-medium text-indigo-600 tabular-nums w-12 text-right">
          {value}px
        </span>
      </div>
      {/* スライダー ─ モバイルでも指で操作しやすい */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none bg-gray-200 accent-indigo-600 cursor-pointer"
      />
      {/* 数値入力 (キーボード派・精度が必要なとき) */}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Math.round(Number(e.target.value) / step) * step;
          onChange(Math.max(min, Math.min(max, v)));
        }}
        className="mt-1.5 w-full border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
      />
    </div>
  );
}

export function SeatProperties({ seat, onChange, onDelete }: SeatPropertiesProps) {
  const w = seat.size?.width ?? 80;
  const h = seat.size?.height ?? 60;

  return (
    <div className="w-full lg:w-64 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 space-y-4 overflow-y-auto max-h-80 lg:max-h-none">
      <h3 className="font-semibold text-sm text-gray-700">席のプロパティ</h3>

      {/* ── 基本情報 ── */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">席名</label>
        <input
          type="text"
          value={seat.label ?? ""}
          onChange={(e) => onChange(seat.id, { label: e.target.value })}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">種類</label>
        <select
          value={seat.type ?? "table"}
          onChange={(e) => onChange(seat.id, { type: e.target.value as Seat["type"] })}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="table">テーブル</option>
          <option value="bar">バー席</option>
          <option value="booth">ボックス席</option>
        </select>
      </div>

      {/* 人数設定を横並びに */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">最大人数</label>
          <input
            type="number"
            min={1} max={20}
            value={seat.capacity ?? 4}
            onChange={(e) => onChange(seat.id, { capacity: parseInt(e.target.value) || 1 })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">最小人数</label>
          <input
            type="number"
            min={1} max={seat.capacity ?? 4}
            value={seat.minCapacity ?? 1}
            onChange={(e) => onChange(seat.id, { minCapacity: parseInt(e.target.value) || 1 })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ── サイズ設定 ── */}
      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-medium text-gray-600">テーブルサイズ</p>

        <SizeField
          label="幅"
          value={w}
          min={MIN_SIZE}
          max={MAX_W}
          step={GRID}
          onChange={(v) => onChange(seat.id, { size: { width: v, height: h } })}
        />

        <SizeField
          label="高さ"
          value={h}
          min={MIN_SIZE}
          max={MAX_H}
          step={GRID}
          onChange={(v) => onChange(seat.id, { size: { width: w, height: v } })}
        />

        {/* プリセットボタン */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5">プリセット</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "S (60×40)", w: 60, h: 40 },
              { label: "M (80×60)", w: 80, h: 60 },
              { label: "L (120×80)", w: 120, h: 80 },
              { label: "XL (160×100)", w: 160, h: 100 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => onChange(seat.id, { size: { width: p.w, height: p.h } })}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  w === p.w && h === p.h
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(seat.id)}
        className="w-full text-sm text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        席を削除
      </button>
    </div>
  );
}
