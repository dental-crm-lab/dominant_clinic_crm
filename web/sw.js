/* Dominant CRM — service worker
   Caches the static app shell for fast loads and installability.
   Never touches /api/ or /socket.io/ — those always go straight to the network,
   since this app is only useful against live, role-filtered clinic data. */

var CACHE_NAME = 'dominant-shell-v2';
var SHELL_FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(SHELL_FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/');
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return; // never intercept writes
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return; // always live, never cached

  if (req.mode === 'navigate') {
    // Network-first for the app shell page, so a redeploy is picked up immediately;
    // fall back to the cached shell when offline.
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put('/index.html', copy); });
        return res;
      }).catch(function () { return caches.match('/index.html'); })
    );
    return;
  }

  // Static assets: cache-first, refresh in the background.
  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
