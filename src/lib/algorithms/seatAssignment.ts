import type { Seat, QueueEntry, SeatAssignmentResult } from "../types";

interface Candidate {
  seat: Seat;
  score: number;
}

export function findBestSeat(
  partySize: number,
  availableSeats: Seat[],
  queueAhead: QueueEntry[]
): SeatAssignmentResult | null {
  const candidates: Candidate[] = availableSeats
    .filter(
      (s) =>
        s.status === "available" &&
        s.capacity >= partySize &&
        s.minCapacity <= partySize
    )
    .map((seat) => ({ seat, score: scoreSeat(seat, partySize, queueAhead) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates[0]) return null;
  const { seat, score } = candidates[0];
  return { seatId: seat.id, label: seat.label, score };
}

function scoreSeat(
  seat: Seat,
  partySize: number,
  queueAhead: QueueEntry[]
): number {
  let score = 100;

  // Minimize wasted capacity (tight fit preferred, 40 pts max)
  const waste = seat.capacity - partySize;
  score += Math.max(0, 40 - waste * 10);

  // Penalize using large tables when large parties are waiting
  const largePartiesWaiting = queueAhead.filter(
    (q) => q.partySize >= seat.capacity && q.partySize > partySize
  );
  if (largePartiesWaiting.length > 0) {
    score -= 30;
  }

  // Prefer seats that have been available longer (up to 20 pts)
  if (seat.estimatedFreeAt) {
    const availableMs = Date.now() - seat.estimatedFreeAt.toMillis();
    score += Math.min(20, availableMs / (60 * 1000));
  }

  return score;
}

export function estimateWaitMinutes(
  queuePosition: number,
  averageSeatingDuration: number,
  availableSeatCount: number,
  totalSeatCount: number
): number {
  if (queuePosition <= availableSeatCount) return 0;
  const turnoverRate =
    Math.max(1, totalSeatCount) / Math.max(1, averageSeatingDuration);
  return Math.ceil((queuePosition - availableSeatCount) / turnoverRate);
}
