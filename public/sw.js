const CACHE_NAME = 'smart-study-cache-v3';

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - clean up ALL old caches to fix stale module issues
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Bypass Vite dev modules & API routes
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Skip cross-origin requests, API requests, and Vite source/module requests
  if (
    !url.startsWith(self.location.origin) ||
    url.includes('/api/') ||
    url.includes('/src/') ||
    url.includes('/@vite/') ||
    url.includes('/@react-refresh') ||
    url.includes('/node_modules/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async (error) => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate') {
          const indexCache = await caches.match('/index.html');
          if (indexCache) return indexCache;
        }
        throw error;
      })
  );
});
