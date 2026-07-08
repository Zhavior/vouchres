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

