// Service worker: lets the game be installed as an app and keep working offline, while always
// serving the newest version when online (network first, cached copy only as a fallback).
// Map imagery and other sites' files go straight to the network.
const CACHE = "ww3-app";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.endsWith("version.json")) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match(req, { ignoreSearch: true })))
  );
});
