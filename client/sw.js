const CACHE_NAME = 'notaty-cache-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'public-view.html',
  'css/style.css',
  'css/modal.css',
  'note-client.js',
  'note-handler.js',
  'modal-handler.js',
  'images/icon-512.png',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js',
  'https://cdn.quilljs.com/1.3.6/quill.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Handlee&family=Indie+Flower&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and avoid API calls for now (keep them live)
  if (event.request.method !== 'GET' || event.request.url.includes('/notes') || event.request.url.includes('/login') || event.request.url.includes('/register')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
          // If we want to cache on the fly, we can do it here
          return response;
      });
    })
  );
});
