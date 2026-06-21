// Lightweight offline cache. Hashed build assets are immutable, so a simple
// cache-first strategy is safe; the cache name is bumped on each deploy via the
// build (see the version token below).
const CACHE = 'fretwise-v1';
const SCOPE_URL = new URL(self.registration.scope);

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([SCOPE_URL.pathname]).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Navigations: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { cachePut(req, res.clone()); return res; })
        .catch(() => caches.match(SCOPE_URL.pathname).then((r) => r || caches.match(req)))
    );
    return;
  }

  // Everything else (hashed assets, fonts, icons): cache-first.
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => { cachePut(req, res.clone()); return res; })
    )
  );
});

function cachePut(req, res) {
  if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
}
