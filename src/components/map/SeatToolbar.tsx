import type { SeatTool } from "@/lib/types";

interface SeatToolbarProps {
  activeTool: SeatTool;
  onToolChange: (tool: SeatTool) => void;
  onSave: () => void;
  saving: boolean;
}

const tools: { id: SeatTool; label: string; labelShort: string; icon: string }[] = [
  { id: "select",   label: "選択",       labelShort: "選択", icon: "↖" },
  { id: "addTable", label: "テーブル追加", labelShort: "テーブル", icon: "⬜" },
  { id: "addBar",   label: "バー席追加",  labelShort: "バー",    icon: "▬" },
  { id: "addBooth", label: "ボックス追加", labelShort: "ボックス", icon: "⬛" },
];

export function SeatToolbar({
  activeTool,
  onToolChange,
  onSave,
  saving,
}: SeatToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white border-b border-gray-200 flex-wrap">
      <span className="text-xs font-medium text-gray-400 mr-1 hidden sm:inline">ツール:</span>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeTool === t.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="text-sm sm:text-base leading-none">{t.icon}</span>
          <span className="sm:hidden">{t.labelShort}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "保存中..." : "保存"}
      </button>
    </div>
  );
}
