import { Timestamp } from "firebase/firestore";

export interface Zone {
  id: string;
  label: string;
  color: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface MapConfig {
  width: number;
  height: number;
  backgroundImageUrl?: string;
  zones: Zone[];
}

export interface Store {
  id: string;
  name: string;
  adminUid: string;
  totalCapacity: number;
  currentOccupancy: number;
  isAcceptingQueue: boolean;
  averageSeatingDuration: number;
  qrCodeUrl: string;
  mapConfig: MapConfig;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Seat {
  id: string;
  label: string;
  type: "table" | "bar" | "booth";
  capacity: number;
  minCapacity: number;
  zoneId: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  status: "available" | "occupied" | "reserved" | "unavailable";
  currentQueueId: string | null;
  occupiedSince: Timestamp | null;
  estimatedFreeAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface QueueEntry {
  id: string;
  storeId: string;
  customerName: string;
  partySize: number;
  fcmToken: string | null;
  status: "waiting" | "notified" | "seated" | "cancelled" | "expired";
  assignedSeatId: string | null;
  assignedSeatLabel: string | null;
  position: number;
  notifiedAt: Timestamp | null;
  seatedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  expiresAt: Timestamp;
  joinedAt: Timestamp;
}

export interface Admin {
  email: string;
  displayName: string;
  storeIds: string[];
  createdAt: Timestamp;
}

export interface SeatAssignmentResult {
  seatId: string;
  label: string;
  score: number;
}

export type SeatTool = "select" | "addTable" | "addBar" | "addBooth" | "merge";
