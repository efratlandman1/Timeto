/* eslint-disable no-restricted-globals */
const SW_VERSION = 'v1.0.1';
const PRECACHE = `precache-${SW_VERSION}`;
const RUNTIME = `runtime-${SW_VERSION}`;
const IS_LOCALHOST = self.location.hostname === 'localhost';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/locales/he/translation.json',
  '/locales/en/translation.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Helper to determine navigation requests
const isNavigationRequest = (request) => request.mode === 'navigate';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  // In development (localhost), avoid caching to prevent stale HMR bundles
  if (IS_LOCALHOST) {
    return;
  }

  // Network-first for navigation (app shell)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // API network-first strategy for same-origin `/api` calls
  if (isSameOrigin && url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first strategy
  if (isSameOrigin) {
    // Ignore hot-update files and dev websockets
    if (url.pathname.includes('hot-update') || url.pathname.includes('sockjs-node')) {
      return;
    }
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});


