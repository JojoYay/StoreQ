"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getFirebaseMessaging } from "@/lib/firebase/client";

interface NotificationContextValue {
  foregroundMessage: unknown;
}

const NotificationContext = createContext<NotificationContextValue>({
  foregroundMessage: null,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [foregroundMessage, setForegroundMessage] = useState<unknown>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      // フォアグラウンドメッセージ受信リスナー
      // （アプリが前面にある状態でプッシュを受信したとき）
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const { onMessage } = await import("firebase/messaging");
      cleanup = onMessage(messaging, (payload) => {
        setForegroundMessage(payload);

        // フォアグラウンドでは SW が通知を出さないため手動で表示
        if (Notification.permission === "granted") {
          const { title, body } = payload.notification ?? {};
          const statusUrl = (payload.data as Record<string, string>)?.statusUrl ?? "/";
          new Notification(title ?? "QueueMaker", {
            body: body ?? "",
            icon: "/icons/icon-192.png",
            data: { url: statusUrl },
          });
        }
      });
    }

    setup();
    return () => cleanup?.();
  }, []);

  return (
    <NotificationContext.Provider value={{ foregroundMessage }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
