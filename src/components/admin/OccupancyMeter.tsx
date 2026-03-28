interface OccupancyMeterProps {
  current: number;
  total: number;
}

export function OccupancyMeter({ current, total }: OccupancyMeterProps) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">混雑度</span>
        <span className="font-medium">
          {current} / {total} 席
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{pct.toFixed(0)}%</p>
    </div>
  );
}
