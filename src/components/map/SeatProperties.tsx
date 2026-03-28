import type { Seat } from "@/lib/types";

interface SeatPropertiesProps {
  seat: Partial<Seat> & { id: string };
  onChange: (id: string, updates: Partial<Seat>) => void;
  onDelete: (id: string) => void;
}

export function SeatProperties({ seat, onChange, onDelete }: SeatPropertiesProps) {
  return (
    <div className="w-60 bg-white border-l border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">席のプロパティ</h3>

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
          onChange={(e) =>
            onChange(seat.id, { type: e.target.value as Seat["type"] })
          }
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="table">テーブル</option>
          <option value="bar">バー席</option>
          <option value="booth">ボックス席</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">最大人数</label>
        <input
          type="number"
          min={1}
          max={20}
          value={seat.capacity ?? 4}
          onChange={(e) =>
            onChange(seat.id, { capacity: parseInt(e.target.value) || 1 })
          }
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">最小人数</label>
        <input
          type="number"
          min={1}
          max={seat.capacity ?? 4}
          value={seat.minCapacity ?? 1}
          onChange={(e) =>
            onChange(seat.id, { minCapacity: parseInt(e.target.value) || 1 })
          }
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
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
