import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { findBestSeat } from "@/lib/algorithms/seatAssignment";
import { Timestamp } from "firebase-admin/firestore";
import type { Seat, QueueEntry } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    // seatId が指定されている場合はその席を直接使用（管理者が手動選択）
    // seatId が未指定の場合はアルゴリズムで最適席を自動選択
    const { storeId, queueId, seatId: requestedSeatId } = await req.json();

    if (!storeId || !queueId) {
      return NextResponse.json({ error: "storeId と queueId は必須です" }, { status: 400 });
    }

    // キューエントリ取得
    const queueRef = adminDb.collection("queues").doc(queueId);
    const queueSnap = await queueRef.get();
    if (!queueSnap.exists) {
      return NextResponse.json({ error: "キューエントリが見つかりません" }, { status: 404 });
    }
    const queueEntry = { id: queueSnap.id, ...queueSnap.data() } as QueueEntry;

    // 空席一覧取得
    const seatsSnap = await adminDb
      .collection("stores")
      .doc(storeId)
      .collection("seats")
      .where("status", "==", "available")
      .get();
    const availableSeats = seatsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Seat)
    );

    // 割り当て席の決定
    let result: { seatId: string; label: string; score: number } | null = null;

    if (requestedSeatId) {
      // 管理者が指定した席を使用
      const requestedSeat = availableSeats.find((s) => s.id === requestedSeatId);
      if (!requestedSeat) {
        return NextResponse.json(
          { error: "指定された席が見つからないか、すでに使用中です" },
          { status: 409 }
        );
      }
      result = { seatId: requestedSeat.id, label: requestedSeat.label, score: 100 };
    } else {
      // アルゴリズムで最適席を自動選択
      const queueAheadSnap = await adminDb
        .collection("queues")
        .where("storeId", "==", storeId)
        .where("status", "==", "waiting")
        .orderBy("joinedAt", "asc")
        .get();
      const queueAhead = queueAheadSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as QueueEntry)
      );
      result = findBestSeat(queueEntry.partySize, availableSeats, queueAhead);
    }

    if (!result) {
      return NextResponse.json(
        { error: "適切な席が見つかりませんでした。席が空くまでお待ちください。" },
        { status: 409 }
      );
    }

    // バッチ書き込み: キュー更新 + 席を reserved に
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
      occupiedSince: now,   // 案内送信時刻を記録（経過時間表示に使用）
    });

    await batch.commit();

    // FCM プッシュ通知（トークンがある場合のみ）
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
          webpush: { fcmOptions: { link: statusUrl } },
        });
      } catch (fcmError) {
        console.error("FCM send failed:", fcmError);
      }
    }

    return NextResponse.json({ success: true, seatLabel: result.label });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
  }
}
