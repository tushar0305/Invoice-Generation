// Service Worker with aggressive cache-busting for pages
// Bump this version when deploying new versions
const CACHE_VERSION = 'v2';
const CACHE_NAME = `sv-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `sv-static-${CACHE_VERSION}`;

// Static assets that rarely change
const STATIC_ASSETS = [
  '/favicon.ico',
  '/manifest.webmanifest',
  '/logo/swarnavyapar.webp',
  '/fonts/Inter-Variable.woff2',
  '/fonts/PlayfairDisplay-Regular.woff2',
  '/fonts/PlayfairDisplay-Italic.woff2',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate - clear old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.includes(CACHE_VERSION))
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      ),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Helper functions
const isFont = (url) => /\.(?:woff2?|ttf|otf)$/i.test(url);
const isImage = (url) => /\.(?:png|jpg|jpeg|gif|webp|svg|avif)$/i.test(url);
const isStaticAsset = (url) => /\/_next\/static\//i.test(url);
const isApiCall = (url) => /\/api\//i.test(url);
const isHtmlPage = (request) => request.headers.get('Accept')?.includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // API calls - always network, never cache
  if (isApiCall(url)) {
    return; // Let browser handle it
  }

  // HTML pages - Network first with timeout fallback
  // This ensures users always get fresh content
  if (isHtmlPage(request)) {
    event.respondWith(
      fetchWithTimeout(request, 3000)
        .then((response) => {
          // Don't cache HTML to ensure fresh content
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return offline page if available
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Next.js static assets (JS/CSS with hash) - Cache first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Fonts - Cache first (long-term)
  if (isFont(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Images - Cache first with network fallback
  if (isImage(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }
});

// Helper: Fetch with timeout
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => {
      console.log('[SW] All caches cleared');
      // Notify all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage('cacheCleared'));
      });
    });
  }
});

// Notify clients when a new version is available
self.addEventListener('message', (event) => {
  if (event.data === 'checkForUpdate') {
    self.registration.update();
  }
});
