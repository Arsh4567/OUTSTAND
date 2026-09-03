// OUTSTAND service worker — resilient app shell + Web Push
const CACHE_VERSION = "outstand-v2";
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_ICON = "/outstand-logo.png";
const APP_BADGE = "/outstand-logo.png";
const APP_SHELL = ["/", "/manifest.json", APP_ICON];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const exact = await caches.match(request);
          return exact || caches.match("/");
        })
    );
    return;
  }

  if (url.pathname === "/manifest.json" || url.pathname === "/outstand-logo.png") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});

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
