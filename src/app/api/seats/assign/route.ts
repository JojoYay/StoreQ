import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { findBestSeat } from "@/lib/algorithms/seatAssignment";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { Seat, QueueEntry } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { storeId, queueId } = await req.json();

    if (!storeId || !queueId) {
      return NextResponse.json({ error: "storeId と queueId は必須です" }, { status: 400 });
    }

    // Fetch queue entry
    const queueRef = adminDb.collection("queues").doc(queueId);
    const queueSnap = await queueRef.get();
    if (!queueSnap.exists) {
      return NextResponse.json({ error: "キューエントリが見つかりません" }, { status: 404 });
    }
    const queueEntry = { id: queueSnap.id, ...queueSnap.data() } as QueueEntry;

    // Fetch available seats
    const seatsSnap = await adminDb
      .collection("stores")
      .doc(storeId)
      .collection("seats")
      .where("status", "==", "available")
      .get();
    const availableSeats = seatsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Seat)
    );

    // Fetch queue ahead for algorithm context
    const queueAheadSnap = await adminDb
      .collection("queues")
      .where("storeId", "==", storeId)
      .where("status", "==", "waiting")
      .orderBy("joinedAt", "asc")
      .get();
    const queueAhead = queueAheadSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as QueueEntry
    ));

    // Run algorithm
    const result = findBestSeat(queueEntry.partySize, availableSeats, queueAhead);
    if (!result) {
      return NextResponse.json(
        { error: "適切な席が見つかりませんでした。席が空くまでお待ちください。" },
        { status: 409 }
      );
    }

    // Atomic write: update queue entry + seat status
    const batch = adminDb.batch();
    const now = Timestamp.now();

    batch.update(queueRef, {
      status: "notified",
      assignedSeatId: result.seatId,
      assignedSeatLabel: result.label,
      notifiedAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + 15 * 60 * 1000),
    });

    const seatRef = adminDb
      .collection("stores")
      .doc(storeId)
      .collection("seats")
      .doc(result.seatId);
    batch.update(seatRef, {
      status: "reserved",
      currentQueueId: queueId,
    });

    await batch.commit();

    // Send FCM notification if token exists
    if (queueEntry.fcmToken) {
      const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/status/${queueId}`;
      try {
        await adminMessaging.send({
          token: queueEntry.fcmToken,
          notification: {
            title: "席の準備ができました！",
            body: `${result.label} にお進みください`,
          },
          data: { statusUrl },
          webpush: {
            fcmOptions: { link: statusUrl },
          },
        });
      } catch (fcmError) {
        // FCM failure should not fail the whole request
        console.error("FCM send failed:", fcmError);
      }
    }

    return NextResponse.json({ success: true, seatLabel: result.label });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
  }
}
