const CACHE_VERSION = 3;
const STATIC_CACHE = `qfc-explorer-static-v${CACHE_VERSION}`;
const API_CACHE = `qfc-explorer-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `qfc-explorer-images-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Max entries per cache to prevent unbounded growth
const MAX_API_ENTRIES = 100;
const MAX_IMAGE_ENTRIES = 200;

// API cache max age: 5 minutes
const API_MAX_AGE_MS = 5 * 60 * 1000;

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/**
 * Trim a cache to a max number of entries (FIFO).
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
    );
  }
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except images
  if (url.origin !== self.location.origin) {
    // Cache cross-origin images (NFT images from IPFS gateways etc.)
    if (request.destination === 'image') {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, clone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
              });
            }
            return response;
          }).catch(() => cached || new Response('', { status: 408 }));
        })
      );
      return;
    }
    return;
  }

  // Network-first for API calls with stale fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(API_CACHE, MAX_API_ENTRIES);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot|webp|avif)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for pages, with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline fallback
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QFC Explorer - Offline</title><style>body{background:#0a1628;color:#e0f7fa;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#94a3b8;font-size:0.875rem}</style></head><body><div><h1>You are offline</h1><p>QFC Explorer requires a network connection. Please check your connection and try again.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
      )
  );
});
