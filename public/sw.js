// OUTSTAND service worker
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "OUTSTAND", body: event.data.text() };
  }

  const url = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/";
  const options = {
    body: data.body || "You have a new OUTSTAND notification.",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    tag: data.tag || "outstand-notification",
    renotify: Boolean(data.renotify),
    requireInteraction: false,
    vibrate: [80, 40, 80],
    data: { url },
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
  };

  event.waitUntil(self.registration.showNotification(data.title || "OUTSTAND", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client && client.url !== `${self.location.origin}${target}`) {
            client.navigate(target);
          }
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(target) : undefined;
    })
  );
});
