self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("vouchedge-static-v1")
      .then((cache) =>
        cache.addAll([
          "/offline.html",
          "/manifest.json",
          "/vouchedge-icon.svg",
          "/icons/vouchedge-192.png",
          "/icons/vouchedge-512.png",
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const currentCaches = new Set(["vouchedge-static-v1", "vouchedge-assets-v1", "vouchedge-pages-v1"]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("vouchedge-") && !currentCaches.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open("vouchedge-pages-v1");
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put("/", response.clone());
    return response;
  } catch {
    return (await cache.match("/")) || (await caches.match("/offline.html"));
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open("vouchedge-assets-v1");
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open("vouchedge-static-v1");
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || update;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (
    url.pathname === "/manifest.json" ||
    url.pathname === "/vouchedge-icon.svg" ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "VouchEdge", message: event.data ? event.data.text() : "New notification" };
  }

  const title = payload.title || "VouchEdge";
  const options = {
    body: payload.message || payload.body || "New notification",
    icon: "/vouchedge-icon.svg",
    badge: "/vouchedge-icon.svg",
    data: {
      url: payload.url || "/",
      metadata: payload.metadata || {},
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
