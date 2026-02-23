const CACHE_NAME = 'ld-qa-v7.2.1';
const OFFLINE_URL = './offline.html'; // 🌟 新增：專屬斷線備援頁面

const ASSETS = [
  './',
  './index.html',
  './offline.html', // 🌟 必須將離線頁面加入預先快取清單
  './manifest.json',
  './deer_db.js',
  './quiz_db.js',
  './images/basic/icon.png',
  './images/basic/AI.png'
];

// 1. 安裝階段：預先快取核心檔案
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. 啟動階段：清除舊快取並立刻接管頁面
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  // 🌟 新增：讓 SW 啟動後立刻接管所有的網頁控制權
  self.clients.claim(); 
});

// 3. 攔截請求階段：實作智慧快取策略
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // 🌟 新增策略 A：針對「網頁切換 (Navigation)」採用「網路優先 (Network First)」
  // 好處：確保有網路時一定能抓到最新題庫，斷線時才用快取或顯示離線頁面。
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match(e.request).then((cachedRes) => {
          return cachedRes || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // 🌟 新增策略 B：針對「靜態資源與圖片」維持「快取優先 (Cache First)」
  e.respondWith(
    caches.match(e.request).then((cachedRes) => {
      if (cachedRes) return cachedRes;

      return fetch(e.request).then((networkRes) => {
        // 放寬原本對 networkRes.type === 'basic' 的限制，確保外部 CDN 的資源也能正常顯示
        if (!networkRes || networkRes.status !== 200) {
          return networkRes;
        }

        // 動態快取：將新載入的圖片、音檔等媒體資源存入快取 (加入了 svg 支援)
        if (e.request.url.match(/\.(jpg|jpeg|png|gif|webp|mp3|svg)$/i)) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }

        return networkRes;
      }).catch(() => {
        // 如果連圖片也抓不到且沒快取，就默默略過不處理
      });
    })
  );
});