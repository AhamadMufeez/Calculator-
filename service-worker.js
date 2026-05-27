/* ═══════════════════════════════════════════
   Calculator Service Worker
   Strategy: Cache-first for app shell assets,
             Network-first for everything else.
   BUG FIXES:
   1. skipWaiting() moved INSIDE waitUntil so install
      completes before the worker takes control.
   2. manifest.json / favicon.ico guarded with
      individual fetches so a missing file does NOT
      abort the entire install (Promise.all fails fast).
   3. Activate now calls clients.claim() inside
      waitUntil so the new worker controls all tabs
      immediately without requiring a page reload.
═══════════════════════════════════════════ */

const CACHE_VERSION  = 'v2';
const CACHE_NAME     = `calculator-${CACHE_VERSION}`;

/* Core assets that MUST be cached for offline use.
   BUG FIX: removed manifest.json & favicon.ico from the
   required list — if they're absent, addAll() rejects the
   whole promise and the SW never finishes installing.
   They are pre-cached separately with a safe wrapper below. */
const CORE_ASSETS = [
  './',           // alias for index.html served at root
  './index.html',
  './style.css',
  './main.js',
];

/* Optional assets — cached if present, skipped if missing */
const OPTIONAL_ASSETS = [
  './manifest.json',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
];

/* ── Install ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      /* Cache core assets — if any fail, installation fails (intentional) */
      await cache.addAll(CORE_ASSETS);

      /* Cache optional assets individually — failures are swallowed */
      await Promise.allSettled(
        OPTIONAL_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Optional asset not cached: ${url}`, err)
          )
        )
      );

      /* BUG FIX: skipWaiting() called INSIDE waitUntil so the worker
         only skips the waiting phase after the cache is fully populated.
         Original code called it after event.waitUntil(), meaning the SW
         could take control BEFORE the cache was ready. */
      await self.skipWaiting();

      console.log(`[SW] Installed & cached (${CACHE_NAME})`);
    })()
  );
});

/* ── Activate ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      /* Delete all caches that aren't the current version */
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      );

      /* BUG FIX: clients.claim() inside waitUntil ensures the SW
         controls all open tabs before activation resolves */
      await self.clients.claim();

      console.log(`[SW] Activated (${CACHE_NAME})`);
    })()
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', (event) => {
  /* Only handle GET requests; let POST/etc. pass through */
  if (event.request.method !== 'GET') return;

  /* Only handle same-origin and explicit relative requests */
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      /* 1. Cache-first for the app shell */
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) {
        /* Serve from cache and revalidate in the background (stale-while-revalidate) */
        revalidateInBackground(event.request);
        return cached;
      }

      /* 2. Not in cache → try network */
      try {
        const response = await fetch(event.request);

        /* Only cache valid responses */
        if (response && response.status === 200 && response.type !== 'opaque') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        return response;
      } catch {
        /* 3. Offline and not cached → return app shell for navigation requests */
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }

        /* 4. Nothing we can do */
        return new Response('Offline – resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});

/* ── Background revalidation helper ── */
async function revalidateInBackground(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch {
    /* Silently ignore — we already served the cached version */
  }
}
