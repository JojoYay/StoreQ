import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./client";

export async function requestFCMToken(): Promise<string | null> {
  try {
    // ブラウザ対応チェック
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 通知許可を要求
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // SW を登録して active になるまで待つ
    // navigator.serviceWorker.ready は active な SW が存在するまで resolve しない
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const registration = await navigator.serviceWorker.ready;

    // serviceWorkerRegistration を明示的に渡すことで
    // Firebase が正しい SW をプッシュ購読に使用する
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (err) {
    console.error("[FCM] トークン取得失敗:", err);
    return null;
  }
}
