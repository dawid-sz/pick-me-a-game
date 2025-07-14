self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pick-me-a-game-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './src/js/index.js',
        './src/css/index.css',
        './src/css/achievements.css',
        './src/css/header.css',
        './src/css/footer.css',
        './src/js/addyourgame_toggle.js',
        './src/js/achievements.js',
        './src/img/background-elden.jpg',
        './src/img/background_footer.jpg',
        // add other assets as needed
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});