// Minimal service worker for the foundation phase: caches the app shell
// (offline fallback + manifest + icon) so a lost connection shows a
// branded message instead of a blank white screen. It does not precache
// dynamic dashboard data — that always needs a live connection, per the
// brief ("data can require a connection, but the app shouldn't show a
// blank white screen offline").
const CACHE_NAME = "group-bi-shell-v1";
const SHELL_URLS = ["/offline.html", "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline.html")),
  );
});
