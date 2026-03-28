import type { SeatTool } from "@/lib/types";

interface SeatToolbarProps {
  activeTool: SeatTool;
  onToolChange: (tool: SeatTool) => void;
  onSave: () => void;
  saving: boolean;
}

const tools: { id: SeatTool; label: string; icon: string }[] = [
  { id: "select", label: "選択", icon: "↖" },
  { id: "addTable", label: "テーブル追加", icon: "⬜" },
  { id: "addBar", label: "バー席追加", icon: "▬" },
  { id: "addBooth", label: "ボックス席追加", icon: "⬛" },
];

export function SeatToolbar({
  activeTool,
  onToolChange,
  onSave,
  saving,
}: SeatToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
      <span className="text-sm font-medium text-gray-500 mr-2">ツール:</span>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTool === t.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
      <div className="flex-1" />
      <p className="text-xs text-gray-400">
        クリックで席を配置 ／ ドラッグで移動 ／ ダブルクリックで編集
      </p>
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "保存中..." : "保存"}
      </button>
    </div>
  );
}
