importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected via a fetch to avoid hardcoding in SW
// The SW fetches config from a meta endpoint on install
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase when first message arrives (lazy init with config from client)
let messaging = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
    }
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      const statusUrl = payload.data?.statusUrl ?? payload.data?.url ?? "/";

      self.registration.showNotification(title ?? "QueueMaker", {
        body: body ?? "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: statusUrl },
        requireInteraction: true,
      });
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === url);
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});
