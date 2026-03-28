import { NextRequest, NextResponse } from "next/server";
import { adminMessaging } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, title, body, url } = await req.json();

    if (!token || !title) {
      return NextResponse.json({ error: "token と title は必須です" }, { status: 400 });
    }

    await adminMessaging.send({
      token,
      notification: { title, body: body ?? "" },
      data: url ? { url } : {},
      webpush: url ? { fcmOptions: { link: url } } : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM send error:", error);
    return NextResponse.json({ error: "通知の送信に失敗しました" }, { status: 500 });
  }
}
