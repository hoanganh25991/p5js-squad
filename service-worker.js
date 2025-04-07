self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("static-cache").then(function (cache) {
      return cache.addAll([
        "index.html",
        "squad.js",
        "sound.js",
        "assets/logo.png",
        "assets/logo-192x192.png",
        "assets/favicon.ico",
        "sounds/*.mp3",
      ]);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
