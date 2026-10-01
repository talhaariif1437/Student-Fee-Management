// Service Worker for EduFee Android App
const CACHE_NAME = 'edufee-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/data.js',
  '/js/storage.js',
  '/js/icons.js',
  '/js/utils.js',
  '/js/components/header.js',
  '/js/components/bottomNav.js',
  '/js/components/fab.js',
  '/js/components/dashboardView.js',
  '/js/components/batchesView.js',
  '/js/components/studentsView.js',
  '/js/components/feeLedgerView.js',
  '/js/components/defaultersView.js',
  '/js/components/settingsView.js',
  '/js/components/modals.js',
  '/public/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some assets could not be cached immediately:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
