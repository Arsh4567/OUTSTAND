// OUTSTAND service worker — Web Push delivery
const APP_ICON = "/outstand-logo.png";
const APP_BADGE = "/outstand-logo.png";

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
    icon: data.icon || APP_ICON,
    badge: data.badge || APP_BADGE,
    tag: data.tag || "outstand-notification",
    renotify: Boolean(data.renotify),
    requireInteraction: false,
    silent: false,
    vibrate: [80, 40, 80],
    dir: "auto",
    lang: "en",
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
