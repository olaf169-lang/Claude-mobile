/* Service worker: aplikacja ma się otwierać także wtedy, gdy telefon ledwo
   łapie zasięg. Sama gra i tak potrzebuje internetu (telefony rozmawiają przez
   broker, nagrania lecą ze sklepu), ale ekran startowy, katalog i style mają
   być na miejscu od razu. WERSJA idzie w górę przy każdej zmianie plików. */

const WERSJA = 'jtm-v1';

const POWLOKA = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/ui.js',
  'js/katalog.js',
  'js/gra.js',
  'js/siec.js',
  'js/mqtt.js',
  'js/qr.js',
  'js/podglady.js',
  'js/dopasowanie.js',
  'js/odtwarzacz.js',
  'js/prowadzacy.js',
  'js/gracz.js',
  'dane/utwory.js',
  'dane/podglady.json',
  'vendor/qrcode.mjs',
  'icons/favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.open(WERSJA)
      // addAll wykłada się w całości, gdy brakuje jednego pliku (np. podglądów
      // przed pierwszym przebiegiem workflowu) — stąd pojedynczo.
      .then((magazyn) => Promise.all(POWLOKA.map((plik) => magazyn.add(plik).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.keys()
      .then((klucze) => Promise.all(klucze.filter((k) => k !== WERSJA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (zdarzenie) => {
  const zadanie = zdarzenie.request;
  if (zadanie.method !== 'GET') return;
  if (new URL(zadanie.url).origin !== location.origin) return;   // nagrania i sklepy zostawiamy sieci

  // Sieć najpierw, pamięć jako zapas: poprawki wchodzą od razu, brak zasięgu
  // niczego nie psuje.
  zdarzenie.respondWith(
    fetch(zadanie)
      .then((odpowiedz) => {
        if (odpowiedz.ok) {
          const kopia = odpowiedz.clone();
          caches.open(WERSJA).then((magazyn) => magazyn.put(zadanie, kopia));
        }
        return odpowiedz;
      })
      .catch(() => caches.match(zadanie).then((z) => z || caches.match('./'))),
  );
});
