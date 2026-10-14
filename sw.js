/* キラペン service worker: アプリをオフラインでも開けるようにする。
   画像やファイルを更新したら VERSION の数字を1つ上げてください。 */
var VERSION = 'kirapen-10';
var CORE = [
  './', 'index.html', 'css/app.css', 'js/cloud.js', 'js/app.js', 'manifest.webmanifest', 'assets/parts.json',
  'assets/char/base.webp', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* ページ・JS・CSS・parts.json はネット優先（新しいパーツをすぐ反映）、画像などはキャッシュ優先 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  var fresh = req.mode === 'navigate' || /(parts\.json|\.js|\.css)(\?|$)/.test(req.url);
  if (fresh) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    });
  }));
});
