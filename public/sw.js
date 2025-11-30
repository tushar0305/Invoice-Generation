const CACHE_NAME = 'sv-cache-v1';
const ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/logo/swarnavyapar.webp',
  '/fonts/Inter-Variable.woff2',
  '/fonts/PlayfairDisplay-Regular.woff2',
  '/fonts/PlayfairDisplay-Italic.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key);
    })))
  );
});

// Runtime caching strategies
const isFont = (url) => /\.(?:woff2?|ttf|otf)$/i.test(url);
const isImage = (url) => /\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(url);
const isPage = (url) => url.startsWith(self.location.origin);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = request.url;

  // Cache-first for fonts and images
  if (isFont(url) || isImage(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(()=>{});
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Stale-while-revalidate for same-origin pages and JSON
  if (isPage(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
});
