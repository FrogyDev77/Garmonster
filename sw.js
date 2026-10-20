/* Service worker de Monster Garden.
   - La página (index.html) se pide primero a la red, para que las actualizaciones lleguen
     enseguida; si no hay conexión, se usa la copia guardada.
   - Iconos y manifest: primero la caché.
   Cambia CACHE en cada versión para limpiar las copias antiguas. */
const CACHE = 'monster-garden-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  const isPage = e.request.mode === 'navigate' || (sameOrigin && (url.pathname.endsWith('/') || url.pathname.endsWith('.html')));
  if (isPage) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && sameOrigin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }))
  );
});
