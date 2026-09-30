/* Push notification handlers, loaded into the PWA service worker via
   workbox.importScripts (see vite.config.js). */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "ShikshaSetu AI", body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "ShikshaSetu AI",
      {
        body: data.body || "",
        icon: "/favicon-192.png",
        badge: "/favicon-32.png",
        tag: data.tag,
        data: { url: data.url || "/" },
      }
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      })
  );
});
