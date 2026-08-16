/* 환자 카운터 - offline service worker */
var CACHE = "pcounter-v2";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(
        ASSETS.map(function (u) {
          return c.add(new Request(u, { cache: "reload" })).catch(function () {});
        })
      );
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) { return k === CACHE ? null : caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* cache-first: 오프라인에서 항상 즉시 열리도록 */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // 백그라운드로 최신본 갱신
        fetch(req).then(function (res) {
          if (res && res.ok) caches.open(CACHE).then(function (c) { c.put(req, res.clone()); });
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
