import { formatWaitTime } from "@/lib/utils/time";

interface WaitTimeBadgeProps {
  minutes: number;
}

export function WaitTimeBadge({ minutes }: WaitTimeBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
      ⏱ {formatWaitTime(minutes)}
    </span>
  );
}
