// EBL シフト便 Service Worker
// キャッシュ名は index.html が登録するときの「?v=バージョン」から自動で決まります。
// アプリのバージョン（画面右上の vX.Y.Z）が変われば自動で更新されるので、このファイルを手で直す必要はありません。
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'ebl-shift-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ebl-shift-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ネット優先（つながれば常に最新）、つながらなければキャッシュ
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
