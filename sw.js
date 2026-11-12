// Offline support: students use this on patchy mobile data or a cyber cafe line, and come back to
// the checklist later. Rules, dates and documents all run in the browser. Network first, so online
// users always get the current NSP dates; the cache only answers when the network does not, and
// every deadline shows the day the lists were last read.
const CACHE = 'cs-v1';
const FILES = ['/', '/styles.css', '/app.js', '/i18n.js', '/rules.js', '/nsp-data.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && FILES.includes(url.pathname)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(url.pathname, copy));
      }
      return res;
    }).catch(() => caches.match(url.pathname, { ignoreSearch: true }).then((hit) => hit || Response.error())),
  );
});
