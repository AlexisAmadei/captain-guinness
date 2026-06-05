const CACHE_NAME = "captain-v3";

// Only cache static assets — never navigation requests (HTML)
const STATIC_EXTENSIONS = /\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/;

// A freshly installed worker stays in the "waiting" state until the page
// tells it to activate (via the SKIP_WAITING message below). This lets the
// app show a "new version available" prompt instead of swapping code out
// from under a running session.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Navigation requests (HTML pages) — always network-first, no caching
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets from the same origin — cache-first
  if (url.origin === self.location.origin && STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network only
});
