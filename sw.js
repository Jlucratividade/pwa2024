const cacheName = 'portfolio-v1'; // Adicionado versionamento

// Evento de instalação do service worker
self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(cacheName).then(function (cache){
            return cache.addAll([
                './',
                './sobre.html',
                './manifest.webmanifest',
                './index.js'
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
