/* Prosty cache „najpierw sieć, w razie czego z półki”. Aplikacja i tak trzyma
   wyniki w localStorage, więc service worker odpowiada wyłącznie za to, żeby
   w hali bez zasięgu w ogóle dało się ją otworzyć. */

const POLKA = 'piateczka-v28';
const SZKIELET = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/dane.js', './js/liczenie.js', './js/elo.js', './js/tytuly.js',
  './js/pomoc.js', './js/ui.js', './js/baza.js', './js/wykresy.js', './js/zamek.js',
  './js/wybor-przydomka.js',
  './js/ekran-start.js', './js/ekran-wieczor.js', './js/ekran-tabela.js',
  './js/ekran-elo.js', './js/ekran-tytuly.js', './js/ekran-kalendarz.js', './js/ekran-zasady.js',
  './js/ekran-podsumowanie.js', './js/pochwal.js', './js/sedzia.js', './js/ekran-sedzia.js',
  './js/ekran-sezon.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(POLKA).then((c) => c.addAll(SZKIELET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((klucze) => Promise.all(klucze.filter((k) => k !== POLKA).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((odp) => {
        const kopia = odp.clone();
        caches.open(POLKA).then((c) => c.put(e.request, kopia)).catch(() => {});
        return odp;
      })
      .catch(() => caches.match(e.request).then((z) => z || caches.match('./index.html'))),
  );
});
