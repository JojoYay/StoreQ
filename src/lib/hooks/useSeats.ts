"use client";
import { useEffect, useState } from "react";
import { subscribeToSeats } from "../firebase/firestore";
import type { Seat } from "../types";

export function useSeats(storeId: string | null) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    const unsub = subscribeToSeats(storeId, (s) => {
      setSeats(s);
      setLoading(false);
    });
    return unsub;
  }, [storeId]);

  const available = seats.filter((s) => s.status === "available");
  const occupied = seats.filter((s) => s.status === "occupied");
  const reserved = seats.filter((s) => s.status === "reserved");

  return { seats, available, occupied, reserved, loading };
}
