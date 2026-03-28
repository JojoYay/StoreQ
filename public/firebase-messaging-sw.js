importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Config is sent from the client via postMessage
let messaging = null;

// Must be registered at top level
self.addEventListener("push", (event) => {
  if (!messaging) return;
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

self.addEventListener("pushsubscriptionchange", () => {});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  if (event.data?.type !== "FIREBASE_CONFIG") return;
  if (firebase.apps.length) return;

  firebase.initializeApp(event.data.config);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {};
    const statusUrl = payload.data?.statusUrl ?? payload.data?.url ?? "/";
    self.registration.showNotification(title ?? "QueueMaker", {
      body: body ?? "",
      icon: "/icons/icon-192.png",
      data: { url: statusUrl },
      requireInteraction: true,
    });
  });
});
