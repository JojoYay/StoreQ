import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { findBestSeat } from "@/lib/algorithms/seatAssignment";
import { Timestamp } from "firebase-admin/firestore";
import type { Seat, QueueEntry } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    // seatIds: 複数席結合案内（管理者が手動選択）
    // seatId:  単一席指定（後方互換）
    // 未指定: アルゴリズムで最適席を自動選択
    const { storeId, queueId, seatId: requestedSeatId, seatIds: requestedSeatIds } =
      await req.json();

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
    const availableSeats = seatsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Seat));

    // 割り当て席リストの決定
    let assignedSeats: Seat[] = [];

    // 優先度: seatIds > seatId > アルゴリズム
    const requestedIds: string[] =
      Array.isArray(requestedSeatIds) && requestedSeatIds.length > 0
        ? requestedSeatIds
        : requestedSeatId
          ? [requestedSeatId]
          : [];

    if (requestedIds.length > 0) {
      // 管理者が指定した席（単一 or 複数結合）
      for (const id of requestedIds) {
        const seat = availableSeats.find((s) => s.id === id);
        if (!seat) {
          return NextResponse.json(
            { error: `席 ${id} が見つからないか、すでに使用中です` },
            { status: 409 }
          );
        }
        assignedSeats.push(seat);
      }
    } else {
      // アルゴリズムで最適席を自動選択（単一席）
      const queueAheadSnap = await adminDb
        .collection("queues")
        .where("storeId", "==", storeId)
        .where("status", "==", "waiting")
        .orderBy("joinedAt", "asc")
        .get();
      const queueAhead = queueAheadSnap.docs.map((d) => ({ id: d.id, ...d.data() } as QueueEntry));
      const result = findBestSeat(queueEntry.partySize, availableSeats, queueAhead);
      if (!result) {
        return NextResponse.json(
          { error: "適切な席が見つかりませんでした。席が空くまでお待ちください。" },
          { status: 409 }
        );
      }
      const seat = availableSeats.find((s) => s.id === result.seatId);
      if (seat) assignedSeats = [seat];
    }

    if (assignedSeats.length === 0) {
      return NextResponse.json(
        { error: "適切な席が見つかりませんでした。" },
        { status: 409 }
      );
    }

    // 案内ラベル: 複数の場合は「席A・席B」形式
    const assignedLabel = assignedSeats.map((s) => s.label).join("・");
    const allAssignedIds = assignedSeats.map((s) => s.id);

    // バッチ書き込み: キュー更新 + 全席を reserved に
    const batch = adminDb.batch();
    const now = Timestamp.now();

    batch.update(queueRef, {
      status: "notified",
      assignedSeatId: allAssignedIds[0],          // 後方互換のため先頭席を保持
      assignedSeatIds: allAssignedIds,             // 全席IDを保持
      assignedSeatLabel: assignedLabel,
      notifiedAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + 15 * 60 * 1000),
    });

    for (const seat of assignedSeats) {
      const seatRef = adminDb
        .collection("stores")
        .doc(storeId)
        .collection("seats")
        .doc(seat.id);
      batch.update(seatRef, {
        status: "reserved",
        currentQueueId: queueId,
        occupiedSince: now,
      });
    }

    await batch.commit();

    // FCM プッシュ通知
    if (queueEntry.fcmToken) {
      const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/status/${queueId}`;
      try {
        await adminMessaging.send({
          token: queueEntry.fcmToken,
          notification: {
            title: "席の準備ができました！",
            body: `${assignedLabel} にお進みください`,
          },
          data: { statusUrl },
          webpush: { fcmOptions: { link: statusUrl } },
        });
      } catch (fcmError) {
        console.error("FCM send failed:", fcmError);
      }
    }

    return NextResponse.json({ success: true, seatLabel: assignedLabel });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
  }
}
