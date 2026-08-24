/* Service worker BANGladesz26: aplikacja ma działać bez sieci.
   Cała zawartość jest statyczna, więc trzymamy prostą pamięć powłoki
   i podbijamy WERSJA przy każdej zmianie plików. */

const WERSJA = 'b26-v1';

const POWLOKA = [
  './',
  'index.html',
  'styles.css',
  'dane.js',
  'app.js',
  'manifest.webmanifest',
  'icons/favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.open(WERSJA)
      .then((magazyn) => magazyn.addAll(POWLOKA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.keys()
      .then((klucze) => Promise.all(klucze.filter((k) => k !== WERSJA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (zdarzenie) => {
  const zadanie = zdarzenie.request;
  if (zadanie.method !== 'GET') return;

  // Sieć na pierwszym miejscu, pamięć jako zapas — dzięki temu nowe wydanie
  // aplikacji pojawia się od razu, a brak zasięgu niczego nie psuje.
  zdarzenie.respondWith(
    fetch(zadanie)
      .then((odpowiedz) => {
        if (odpowiedz.ok && new URL(zadanie.url).origin === location.origin) {
          const kopia = odpowiedz.clone();
          caches.open(WERSJA).then((magazyn) => magazyn.put(zadanie, kopia));
        }
        return odpowiedz;
      })
      .catch(() => caches.match(zadanie).then((z) => z || caches.match('./')))
  );
});
