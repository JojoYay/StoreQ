import { WaitTimeBadge } from "./WaitTimeBadge";
import type { QueueEntry as QueueEntryType } from "@/lib/types";

interface QueueEntryProps {
  entry: QueueEntryType;
  index: number;
  waitMinutes: number;
  onAssign: (entry: QueueEntryType) => void;
  onConfirmSeated: (entry: QueueEntryType) => void;
  onCancel: (entry: QueueEntryType) => void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  waiting:  { label: "待機中", cls: "bg-gray-100 text-gray-600" },
  notified: { label: "案内済", cls: "bg-yellow-100 text-yellow-700" },
};

export function QueueEntryRow({
  entry,
  index,
  waitMinutes,
  onAssign,
  onConfirmSeated,
  onCancel,
}: QueueEntryProps) {
  const badge = STATUS_BADGE[entry.status];

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      entry.status === "notified" ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"
    }`}>
      <div className="flex items-start gap-3">
        {/* 番号バッジ */}
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{entry.customerName}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
              {entry.partySize}名
            </span>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {entry.status === "waiting" && <WaitTimeBadge minutes={waitMinutes} />}
            {entry.status === "notified" && entry.assignedSeatLabel && (
              <span className="text-xs text-yellow-700 font-medium">
                → {entry.assignedSeatLabel}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {entry.joinedAt
                ? new Date(entry.joinedAt.toMillis()).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}{" "}
              登録
            </span>
          </div>
        </div>
      </div>

      {/* ボタン行 */}
      <div className="flex gap-2 mt-3 justify-end">
        {/* 待機中 → 席を案内 */}
        {entry.status === "waiting" && (
          <button
            onClick={() => onAssign(entry)}
            className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            席を案内
          </button>
        )}

        {/* 案内済 → 着席確認（管理者が実施） */}
        {entry.status === "notified" && (
          <button
            onClick={() => onConfirmSeated(entry)}
            className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ✓ 着席確認
          </button>
        )}

        <button
          onClick={() => onCancel(entry)}
          className="text-xs border border-gray-200 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
