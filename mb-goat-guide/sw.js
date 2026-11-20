/* Service worker M&B Goat Guide.
   Szkielet aplikacji: najpierw sieć, bez zasięgu z półki, więc nowa wersja
   wczytuje się sama, a w terenie aplikacja nadal się otwiera.
   Czcionki Google: najpierw półka, bo się nie zmieniają.
   Zapytania czatu do api.anthropic.com idą zawsze prosto do sieci.
   Przy każdej zmianie plików podbij numer w POLKA. */

const POLKA = 'mb-goat-guide-v1';
const SZKIELET = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './dane/jednostki.js', './dane/drzewka.js', './dane/kodeks.js', './dane/biblia.js',
  './js/app.js', './js/doradca.js', './js/czat.js', './js/start.js',
  './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
const CZCIONKI = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(POLKA).then((c) => c.addAll(SZKIELET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((klucze) => Promise.all(klucze.filter((k) => k.startsWith('mb-goat-guide-') && k !== POLKA).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (CZCIONKI.includes(url.hostname)) {
    e.respondWith(caches.match(e.request).then((z) => z || fetch(e.request).then((odp) => {
      const kopia = odp.clone();
      caches.open(POLKA).then((c) => c.put(e.request, kopia)).catch(() => {});
      return odp;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((odp) => {
        if (odp.ok) { const kopia = odp.clone(); caches.open(POLKA).then((c) => c.put(e.request, kopia)).catch(() => {}); }
        return odp;
      })
      .catch(() => caches.match(e.request).then((z) => z || caches.match('./index.html'))),
  );
});
