// ============================================================
//  Service Worker — Absensi QR PWA
//  Cache file statis agar load lebih cepat
// ============================================================

const CACHE_NAME = "absensi-qr-v1";

const ASSETS_TO_CACHE = [
  "/pwaAbsen/",
  "/pwaAbsen/index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js",
];

// Install — cache semua asset
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch — cache first untuk asset statis, network first untuk Apps Script
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request ke Apps Script — harus selalu online
  if (
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("script.googleusercontent.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache first untuk asset lainnya
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            // Cache response baru
            if (response.status === 200) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
        );
      })
      .catch(() => {
        // Offline fallback — kembalikan index.html
        return caches.match("/pwaAbsen/index.html");
      }),
  );
});
