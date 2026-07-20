/**
 * service-worker.js — cache app-shell agar bisa dibuka offline.
 * Stream video (.m3u8/.ts) TIDAK di-cache karena bersifat live.
 */

const CACHE_NAME = "296live-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./player.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/config.js",
  "./assets/js/utils.js",
  "./assets/js/storage.js",
  "./assets/js/store.js",
  "./assets/js/main.js",
  "./assets/js/player-page.js",
  "./components/sidebar.js",
  "./components/header.js",
  "./components/card.js",
  "./components/player.js",
  "./components/modal.js",
  "./components/skeleton.js",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan pernah cache stream video atau permintaan lintas origin (CDN font/hls.js tetap network-first)
  if (event.request.method !== "GET") return;
  if (url.pathname.endsWith(".m3u8") || url.pathname.endsWith(".ts")) return;

  // Data JSON: network-first agar katalog selalu up-to-date, fallback ke cache saat offline
  if (url.pathname.startsWith("/data/") || url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
