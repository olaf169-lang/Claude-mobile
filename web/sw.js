/* Service worker Przeglądu News: tryb offline i sygnał o nowym wydaniu. */

const VERSION = 'pn-v2';
const SHELL = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-dane`;

const SHELL_FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isData(url) {
  return url.pathname.includes('/data/') && url.pathname.endsWith('.json');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isData(url)) {
    // Dane: najpierw sieć (świeżość), kopia do cache, offline z cache.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Powłoka aplikacji: najpierw cache, w tle odświeżenie.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});

/* ---------------- powiadomienia o nowym wydaniu ---------------- */

const SEEN_KEY = new Request('pn-internal://ostatnie-wydanie');

async function readSeen() {
  const cache = await caches.open(DATA_CACHE);
  const hit = await cache.match(SEEN_KEY);
  return hit ? (await hit.text()) : null;
}

async function writeSeen(edition) {
  const cache = await caches.open(DATA_CACHE);
  await cache.put(SEEN_KEY, new Response(edition));
}

async function checkForNewEdition() {
  let edition;
  try {
    const response = await fetch(new URL('data/latest.json', self.registration.scope), { cache: 'no-store' });
    if (!response.ok) return;
    const cache = await caches.open(DATA_CACHE);
    await cache.put(new URL('data/latest.json', self.registration.scope).toString(), response.clone());
    edition = await response.json();
  } catch {
    return;
  }

  const seen = await readSeen();
  if (!edition || !edition['wydanie'] || edition['wydanie'] === seen) return;

  const items = edition['pozycje'] || [];
  const headline = items.length ? items[0]['nagłówek'] : 'Świeże wydanie jest gotowe.';
  const segments = items.map((i) => (i['dział'] || {}).nazwa).filter(Boolean).slice(0, 4).join(', ');

  await self.registration.showNotification('Przegląd News — nowe wydanie', {
    body: `${headline}\n${items.length} tematów: ${segments}…`,
    icon: 'icons/icon-192.png',
    badge: 'icons/notification.png',
    tag: `przeglad-${edition['wydanie']}`,
    lang: 'pl',
    data: { url: './' },
    requireInteraction: false,
  });
  await writeSeen(edition['wydanie']);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'przeglad-news') event.waitUntil(checkForNewEdition());
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'przeglad-news') event.waitUntil(checkForNewEdition());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'edycja-obejrzana' && data.wydanie) {
    event.waitUntil(writeSeen(data.wydanie));
  }
  if (data.type === 'sprawdz-teraz') {
    event.waitUntil(checkForNewEdition());
  }
});

/* Powiadomienie wysyłane z serwera push (jeśli kiedyś dojdzie backend). */
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* zwykły tekst */ }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Przegląd News', {
      body: payload.body || 'Nowe wydanie jest gotowe.',
      icon: 'icons/icon-192.png',
      badge: 'icons/notification.png',
      lang: 'pl',
      data: { url: payload.url || './' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
