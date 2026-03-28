"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onMessage, MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/client";

interface NotificationContextValue {
  foregroundMessage: MessagePayload | null;
}

const NotificationContext = createContext<NotificationContextValue>({
  foregroundMessage: null,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [foregroundMessage, setForegroundMessage] =
    useState<MessagePayload | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      // Register service worker and send Firebase config to it
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
          const config = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId:
              process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };
          const sw = reg.installing ?? reg.waiting ?? reg.active;
          if (sw) {
            sw.postMessage({ type: "FIREBASE_CONFIG", config });
          }
        } catch {
          // SW registration failure is non-fatal
        }
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      cleanup = onMessage(messaging, (payload) => {
        setForegroundMessage(payload);
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
