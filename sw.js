const CACHE_NAME = '老王-v12';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './zcsn_qa.js',
  './zcsn_quiz.js',
  './avatar-main.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});