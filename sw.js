const CACHE_NAME = '老王-v20.0.1'; // 每次大更新，這裡的版本號一定要改！
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './zcsn_qa.js',
  './zcsn_quiz.js',
  './avatar-main.jpg'
];

// 安裝階段：強制等待中的 Service Worker 立即啟動
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 啟動階段：清除不是當前版本 (CACHE_NAME) 的所有舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得控制權
  );
});

// 抓取階段：靜態資源 Cache First，API與動態請求 Network First
self.addEventListener('fetch', event => {
  // 【關鍵防呆】：排除非 HTTP 請求 (如 chrome-extension://) 與非 GET 請求 (如 POST 傳送 AI 訊息)
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return; // 直接放行，不進行快取攔截
  }

  const url = new URL(event.request.url);
  
  // 判斷是否為靜態資源
  const isStatic = urlsToCache.includes('./' + url.pathname.split('/').pop()) || 
                   url.pathname.match(/\.(jpg|jpeg|png|gif|css|js)$/);
  
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});