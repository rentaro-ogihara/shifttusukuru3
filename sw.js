// EBL シフト便 Service Worker
// バージョンを変えると、次回アクセス時に新しいファイルへ更新されます
const CACHE = 'ebl-shift-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

// インストール時：必要なファイルを全部キャッシュ（=オフラインで動く）
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// 有効化時：古いバージョンのキャッシュを掃除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 取得時：まずネットを試し、ダメならキャッシュ（更新を取り込みつつオフラインでも動く）
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 外部ドメイン（フォント等）はキャッシュしない（オフラインでも待たされないように）
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
