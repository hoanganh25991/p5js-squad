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
        "sounds/music/main_theme.mp3",
        "sounds/music/battle.mp3",
        "sounds/music/boss_battle.mp3",
        "sounds/music/victory.mp3",
        "sounds/ui/click.mp3",
        "sounds/ui/hover.mp3",
        "sounds/ui/upgrade.mp3",
        "sounds/ui/error.mp3",
        "sounds/ui/level_up.mp3",
        "sounds/combat/shoot.mp3",
        "sounds/combat/hit.mp3",
        "sounds/combat/explosion.mp3",
        "sounds/combat/death.mp3",
        "sounds/combat/critical_hit.mp3",
        "sounds/skills/rapid_fire.mp3",
        "sounds/skills/scatter_shot.mp3",
        "sounds/skills/orbital_strike.mp3",
        "sounds/skills/cryo_freeze.mp3",
        "sounds/skills/rejuvenation.mp3",
        "sounds/skills/infernal_rage.mp3",
        "sounds/skills/quantum_acceleration.mp3",
        "sounds/skills/apocalypse.mp3",
        "sounds/environment/wind.mp3",
        "sounds/environment/ambient.mp3",
        "sounds/powerups/collect.mp3",
        "sounds/powerups/spawn.mp3",
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
