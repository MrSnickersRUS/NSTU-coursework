// Service Worker для PWA
const CACHE_NAME = 'netiwash-v1';
const urlsToCache = [
    '/main.html',
    '/index.html',
    '/bookings.html',
    '/profile.html',
    '/js/api.js',
    '/js/dashboard.js',
    '/js/ui_utils.js',
    '/css/loading.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('[SW] Cache failed:', err))
    );
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch - Network First, падбэк на кеш
self.addEventListener('fetch', (event) => {
    // Игнорируем не-GET запросы
    if (event.request.method !== 'GET') return;

    // Для API запросов - всегда network
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Для остального - Network First
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Клонируем ответ для кеша
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Если сеть недоступна - берем из кеша
                return caches.match(event.request);
            })
    );
});


self.addEventListener('push', function (event) {
    if (event.data) {
        let payload = {};
        try {
            payload = event.data.json();
        } catch (e) {
            // Фоллбэк для текста
            payload = { title: 'NETI WASH', body: event.data.text() };
        }

        console.log('[SW] Push Received:', payload);

        const options = {
            body: payload.body || 'Новое уведомление',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                url: payload.url || 'bookings.html'
            }
        };

        const title = payload.title || 'NETI WASH';

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click Received.');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('bookings.html')
    );
});
