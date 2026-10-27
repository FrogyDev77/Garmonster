// Service worker: guarda los archivos del juego para poder jugar sin conexión.
// Cambia la versión cuando publiques una actualización.
const CACHE = 'monster-garden-v2';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/palette.js', './js/pixel.js', './js/data.js', './js/sprites.js', './js/pet.js', './js/state.js',
  './js/needs.js', './js/audio.js', './js/rooms.js', './js/games/space.js', './js/games/tetris.js',
  './js/ui.js', './js/intro.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  })));
});
