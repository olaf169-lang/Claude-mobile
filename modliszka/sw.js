/* MANTIS, service worker. Trzyma pliki gry na telefonie, żeby działała
   offline po pierwszym otwarciu. Numer wersji zmieniamy przy zmianie
   plików, żeby telefon pobrał nowe. */
const WERSJA = 'mantis-v1';
const PLIKI = [
  '.', 'index.html', 'manifest.webmanifest',
  'silnik/modliszka.js', 'silnik/swiat.js', 'silnik/owad.js',
  'silnik/zapis.js', 'silnik/dzwiek.js', 'silnik/album.js',
  'silnik/gra.js', 'silnik/menu.js',
  'ikony/icon-192.png', 'ikony/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(WERSJA).then(c => c.addAll(PLIKI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(klucze => Promise.all(klucze.filter(k => k !== WERSJA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(traf => traf || fetch(e.request).then(odp => {
      const kopia = odp.clone();
      caches.open(WERSJA).then(c => c.put(e.request, kopia)).catch(() => {});
      return odp;
    }).catch(() => caches.match('index.html')))
  );
});
