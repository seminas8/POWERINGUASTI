const CACHE_NAME = 'powering-guasti-v1.2';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installa il service worker e mette in cache i file statici
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installazione in corso...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cache creata, adding files...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installato con successo');
        self.skipWaiting(); // Forza l'attivazione immediata
      })
      .catch((error) => {
        console.error('❌ Service Worker: Errore installazione:', error);
      })
  );
});

// Attiva il service worker e pulisce le cache vecchie
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Attivazione in corso...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando cache vecchia:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Attivato con successo');
        return self.clients.claim(); // Prende controllo di tutti i client
      })
  );
});

// Gestisce le richieste di rete con strategia Cache First per file statici
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategia diversa per API vs file statici
  if (url.pathname.startsWith('/api/')) {
    // Per le API: Network First (dati sempre aggiornati)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo per GET, metti in cache le risposte API
          if (request.method === 'GET' && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se la rete fallisce, prova dalla cache
          return caches.match(request);
        })
    );
  } else {
    // Per file statici: Cache First (velocità)
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response; // Ritorna dalla cache se disponibile
          }
          
          // Se non in cache, scarica dalla rete
          return fetch(request)
            .then((response) => {
              // Non mettere in cache se non è una risposta valida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clona la risposta per metterla in cache
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            });
        })
        .catch(() => {
          // Fallback per pagine HTML quando offline
          if (request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});

// Gestisce messaggi dal client (per aggiornamenti manuali)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Service Worker: Aggiornamento forzato dal client');
    self.skipWaiting();
  }
});

// Notifica quando una nuova versione è disponibile
self.addEventListener('updatefound', () => {
  console.log('🆕 Service Worker: Nuova versione trovata');
});