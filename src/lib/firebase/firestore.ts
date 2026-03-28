import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./client";
import type { Store, Seat, QueueEntry, Admin } from "../types";

// ---- Stores ----

export function storeRef(storeId: string) {
  return doc(db, "stores", storeId);
}

export function seatsRef(storeId: string) {
  return collection(db, "stores", storeId, "seats");
}

export async function getStore(storeId: string): Promise<Store | null> {
  const snap = await getDoc(storeRef(storeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Store;
}

export async function getAdminStores(adminUid: string): Promise<Store[]> {
  const q = query(collection(db, "stores"), where("adminUid", "==", adminUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store));
}

export async function createStore(
  adminUid: string,
  data: { name: string; averageSeatingDuration: number }
): Promise<string> {
  const ref = doc(collection(db, "stores"));
  const store: Omit<Store, "id"> = {
    name: data.name,
    adminUid,
    totalCapacity: 0,
    currentOccupancy: 0,
    isAcceptingQueue: true,
    averageSeatingDuration: data.averageSeatingDuration,
    qrCodeUrl: "",
    mapConfig: { width: 800, height: 600, zones: [] },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };
  await setDoc(ref, store);

  const adminRef = doc(db, "admins", adminUid);
  const adminSnap = await getDoc(adminRef);
  if (adminSnap.exists()) {
    const current = (adminSnap.data() as Admin).storeIds ?? [];
    await updateDoc(adminRef, { storeIds: [...current, ref.id] });
  }

  return ref.id;
}

export async function updateStore(
  storeId: string,
  data: Partial<Omit<Store, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(storeRef(storeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ---- Seats ----

export async function saveSeats(
  storeId: string,
  seats: Omit<Seat, "createdAt">[]
): Promise<void> {
  const batch = writeBatch(db);
  const ref = seatsRef(storeId);

  const existing = await getDocs(ref);
  existing.docs.forEach((d) => batch.delete(d.ref));

  seats.forEach((seat) => {
    const seatRef = doc(ref, seat.id);
    batch.set(seatRef, { ...seat, createdAt: serverTimestamp() });
  });

  const totalCapacity = seats.reduce((sum, s) => sum + s.capacity, 0);
  batch.update(storeRef(storeId), {
    totalCapacity,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateSeat(
  storeId: string,
  seatId: string,
  data: Partial<Seat>
): Promise<void> {
  await updateDoc(doc(seatsRef(storeId), seatId), data);
}

export function subscribeToSeats(
  storeId: string,
  callback: (seats: Seat[]) => void
): () => void {
  return onSnapshot(seatsRef(storeId), (snap) => {
    const seats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Seat));
    callback(seats);
  });
}

// ---- Queue ----

export function queueRef(queueId: string) {
  return doc(db, "queues", queueId);
}

export async function createQueueEntry(
  data: Omit<QueueEntry, "id" | "joinedAt" | "expiresAt">
): Promise<string> {
  const ref = doc(collection(db, "queues"));
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 2 * 60 * 60 * 1000);
  await setDoc(ref, {
    ...data,
    joinedAt: serverTimestamp(),
    expiresAt,
  });
  return ref.id;
}

export async function updateQueueEntry(
  queueId: string,
  data: Partial<QueueEntry>
): Promise<void> {
  await updateDoc(queueRef(queueId), data);
}

export function subscribeToQueue(
  storeId: string,
  statuses: QueueEntry["status"][],
  callback: (entries: QueueEntry[]) => void
): () => void {
  const constraints: QueryConstraint[] = [
    where("storeId", "==", storeId),
    where("status", "in", statuses),
    orderBy("joinedAt", "asc"),
  ];
  const q = query(collection(db, "queues"), ...constraints);
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as QueueEntry)
    );
    callback(entries);
  });
}

export function subscribeToQueueEntry(
  queueId: string,
  callback: (entry: QueueEntry | null) => void
): () => void {
  return onSnapshot(queueRef(queueId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as QueueEntry);
  });
}

// ---- Admin ----

export async function ensureAdminDoc(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      displayName,
      storeIds: [],
      createdAt: serverTimestamp(),
    });
  }
}
