const CACHE_NAME = "shift-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/i18n.js",
  "./src/profile.js",
  "./src/leaderboard.js",
  "./src/game.js",
  "./src/levels.js",
  "./src/audio.js",
  "./assets/boss_colossus.png",
  "./assets/comic_1.jpg",
  "./assets/comic_2.jpg",
  "./assets/comic_3.jpg",
  "./assets/comic_4.jpg",
  "./assets/comic_5.jpg",
  "./assets/bg_day_forest.jpg",
  "./assets/bg_night_forest.jpg",
  "./assets/bg_day_ruins.jpg",
  "./assets/bg_night_ruins.jpg",
  "./assets/favicon.svg",
  "./assets/og-image.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

// Network-First for dynamic updates, falling back to cache when offline
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
