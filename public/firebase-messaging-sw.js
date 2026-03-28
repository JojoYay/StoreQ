// Firebase Cloud Messaging サービスワーカー
// ※ 設定値は公開情報（NEXT_PUBLIC）なのでここに直接記述して問題ありません

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDUkbj-_OoqFGmwOeh-jWuHUrsTI4Zurf0",
  authDomain: "storeq-9f4ba.firebaseapp.com",
  projectId: "storeq-9f4ba",
  storageBucket: "storeq-9f4ba.firebasestorage.app",
  messagingSenderId: "897527048931",
  appId: "1:897527048931:web:c3f2ef4e0a3d1ee00733d6",
});

const messaging = firebase.messaging();

// バックグラウンド受信（アプリが非アクティブなとき）
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const statusUrl = payload.data?.statusUrl ?? payload.data?.url ?? "/";

  self.registration.showNotification(title ?? "QueueMaker", {
    body: body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: statusUrl },
    requireInteraction: true,   // 手動で閉じるまで消えない
  });
});

// 通知クリック → 対応ページを開く
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
