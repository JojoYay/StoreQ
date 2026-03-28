import { WaitTimeBadge } from "./WaitTimeBadge";
import type { QueueEntry as QueueEntryType } from "@/lib/types";

interface QueueEntryProps {
  entry: QueueEntryType;
  index: number;
  waitMinutes: number;
  onAssign: (entry: QueueEntryType) => void;
  onCancel: (entry: QueueEntryType) => void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  waiting: { label: "待機中", cls: "bg-gray-100 text-gray-600" },
  notified: { label: "通知済", cls: "bg-yellow-100 text-yellow-700" },
};

export function QueueEntryRow({
  entry,
  index,
  waitMinutes,
  onAssign,
  onCancel,
}: QueueEntryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
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
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                STATUS_BADGE[entry.status]?.cls ?? ""
              }`}
            >
              {STATUS_BADGE[entry.status]?.label ?? entry.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <WaitTimeBadge minutes={waitMinutes} />
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

      {/* ボタン行（下段） */}
      <div className="flex gap-2 mt-3 justify-end">
        {entry.status === "waiting" && (
          <button
            onClick={() => onAssign(entry)}
            className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            席を案内
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
