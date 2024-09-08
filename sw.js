const cacheName = 'portfolio-v2'; // Adicionado versionamento

// Evento de instalação do service worker
self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(cacheName).then(function (cache){
            return cache.addAll([
                './',
                'dados_jp.txt',
                './manifest.json',
                './index.js',
                './nossoChat.html'
            ]);
        })
    );
    return self.skipWaiting();
});

// Evento de ativação do service worker
self.addEventListener('activate', async e => {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cache => {
            if (cache !== cacheName) {
                return caches.delete(cache);
            }
        })
    );
    self.clients.claim();
});

// Evento de busca (fetch) para interceptar requisições de rede
self.addEventListener('fetch', async e => {
    const req = e.request;
    const url = new URL(req.url);

    if (url.origin === location.origin) {
        e.respondWith(cacheFirst(req));
    } else {
        e.respondWith(networkAndCache(req));
    }
});

// Função que tenta servir a resposta a partir do cache antes de buscar na rede
async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;
    const networkResponse = await fetch(req);
    cache.put(req, networkResponse.clone());
    return networkResponse;
}

// Função que tenta buscar a resposta na rede e a armazena no cache, com fallback para o cache
async function networkAndCache(req) {
    const cache = await caches.open(cacheName);
    try {
        const networkResponse = await fetch(req);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
    } catch {
        const cachedResponse = await cache.match(req);
        return cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}





self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Opcional: abrir uma página específica ou realizar outra ação
});

self.addEventListener('push', (event) => {
  const options = {
    body: 'Você recebeu uma nova mensagem!',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png'
  };
  event.waitUntil(
    self.registration.showNotification('Nova Notificação!', options)
  );
});
