const CACHE_NAME = 'pick-me-a-game-v1.7.0'; // <-- bump this on each release

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        'index.html',
        'src/html/about.html',

        // JS
        'src/js/index.js',
        'src/js/addyourgame_toggle.js',
        'src/js/achievements.js',
        'src/js/about.js',

        // CSS
        'src/css/index.css',
        'src/css/achievements.css',
        'src/css/header.css',
        'src/css/footer.css',
        'src/css/about.css',
        'src/css/game-cards.css',
        'favicon_io/android-chrome-192x192.png',
        'favicon_io/android-chrome-512x512.png',

        // Images
        'src/img/background-elden.jpg',
        'src/img/background_footer.jpg',
        'src/img/placeholder_cover.png',
        'src/img/trophae.png',
        'src/img/chime.mp3',

        // Favicon/manifest
        'favicon_io/favicon.ico',
        'manifest.json'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});