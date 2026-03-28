import { Timestamp } from "firebase/firestore";

export function estimateWaitTime(
  queuePosition: number,
  averageSeatingDuration: number,
  availableSeatCount: number,
  totalSeatCount: number
): number {
  if (queuePosition <= availableSeatCount) return 0;
  const turnoverRate = Math.max(1, totalSeatCount) / Math.max(1, averageSeatingDuration);
  const minutesPerPosition = 1 / turnoverRate;
  return Math.ceil((queuePosition - availableSeatCount) * minutesPerPosition);
}

export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return "まもなく";
  if (minutes < 60) return `約${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `約${h}時間${m}分` : `約${h}時間`;
}

export function secondsUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toMillis() - Date.now()) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
