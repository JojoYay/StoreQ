import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Please configure your environment variables."
    );
  }

  const serviceAccount = JSON.parse(
    Buffer.from(key, "base64").toString("utf8")
  );

  return initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}

// Convenience getters (evaluated lazily on first use)
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminMessaging = new Proxy({} as Messaging, {
  get(_target, prop) {
    return (getAdminMessaging() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
