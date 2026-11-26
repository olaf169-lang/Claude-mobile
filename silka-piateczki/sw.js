/* Tryb offline. Na siłowni w piwnicy zasięg bywa żaden, więc cała apka,
   razem ze zdjęciami ćwiczeń, leży w pamięci telefonu od pierwszego otwarcia.
   Pliki aplikacji: najpierw sieć (żeby poprawki docierały), w razie czego półka.
   Zdjęcia i czcionki: najpierw półka, bo się nie zmieniają.
   Po każdej zmianie plików podbij POLKA. */

const POLKA = 'silka-v15';
const SZKIELET = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/dane.js', './js/logika.js', './js/magazyn.js', './js/ui.js',
  './js/koks.js', './js/swieto.js', './js/wykres.js', './js/arkusze.js', './js/technika.js', './js/odpoczynek.js',
  './js/przypomnienia.js', './js/ekran-start.js', './js/ekran-trening.js', './js/ekran-rozciaganie.js', './js/ekran-postepy.js',
  './fonts/barlow-400.woff', './fonts/barlow-600.woff',
  './fonts/barlow-condensed-700.woff', './fonts/barlow-condensed-800.woff',
  './icons/favicon.svg', './icons/icon-192.png', './icons/odznaka-96.png',
];
// Lista zgodna z narzedzia/zdjecia.txt (pilnuje tego narzedzia/sprawdz.mjs).
const ZDJECIA = [
  './img/cw/Front_Two-Dumbbell_Raise-0.webp',
  './img/cw/Front_Two-Dumbbell_Raise-1.webp',
  './img/cw/Standing_Low-Pulley_Deltoid_Raise-0.webp',
  './img/cw/Standing_Low-Pulley_Deltoid_Raise-1.webp',
  './img/cw/Dumbbell_Bench_Press-0.webp',
  './img/cw/Dumbbell_Bench_Press-1.webp',
  './img/cw/Dips_-_Chest_Version-0.webp',
  './img/cw/Dips_-_Chest_Version-1.webp',
  './img/cw/Butterfly-0.webp',
  './img/cw/Butterfly-1.webp',
  './img/cw/Cable_Crossover-0.webp',
  './img/cw/Cable_Crossover-1.webp',
  './img/cw/Decline_Dumbbell_Bench_Press-0.webp',
  './img/cw/Decline_Dumbbell_Bench_Press-1.webp',
  './img/cw/Leverage_Chest_Press-0.webp',
  './img/cw/Leverage_Chest_Press-1.webp',
  './img/cw/Leverage_Decline_Chest_Press-0.webp',
  './img/cw/Leverage_Decline_Chest_Press-1.webp',
  './img/cw/Dumbbell_Flyes-0.webp',
  './img/cw/Dumbbell_Flyes-1.webp',
  './img/cw/Pushups-0.webp',
  './img/cw/Pushups-1.webp',
  './img/cw/Dumbbell_Bench_Press_with_Neutral_Grip-0.webp',
  './img/cw/Dumbbell_Bench_Press_with_Neutral_Grip-1.webp',
  './img/cw/Smith_Machine_Decline_Press-0.webp',
  './img/cw/Smith_Machine_Decline_Press-1.webp',
  './img/cw/Flat_Bench_Cable_Flyes-0.webp',
  './img/cw/Flat_Bench_Cable_Flyes-1.webp',
  './img/cw/Wide-Grip_Lat_Pulldown-0.webp',
  './img/cw/Wide-Grip_Lat_Pulldown-1.webp',
  './img/cw/One-Arm_Dumbbell_Row-0.webp',
  './img/cw/One-Arm_Dumbbell_Row-1.webp',
  './img/cw/Seated_Cable_Rows-0.webp',
  './img/cw/Seated_Cable_Rows-1.webp',
  './img/cw/Band_Assisted_Pull-Up-0.webp',
  './img/cw/Band_Assisted_Pull-Up-1.webp',
  './img/cw/Close-Grip_Front_Lat_Pulldown-0.webp',
  './img/cw/Close-Grip_Front_Lat_Pulldown-1.webp',
  './img/cw/Leverage_Iso_Row-0.webp',
  './img/cw/Leverage_Iso_Row-1.webp',
  './img/cw/Leverage_High_Row-0.webp',
  './img/cw/Leverage_High_Row-1.webp',
  './img/cw/Dumbbell_Incline_Row-0.webp',
  './img/cw/Dumbbell_Incline_Row-1.webp',
  './img/cw/Straight-Arm_Pulldown-0.webp',
  './img/cw/Straight-Arm_Pulldown-1.webp',
  './img/cw/One_Arm_Lat_Pulldown-0.webp',
  './img/cw/One_Arm_Lat_Pulldown-1.webp',
  './img/cw/Side_Lateral_Raise-0.webp',
  './img/cw/Side_Lateral_Raise-1.webp',
  './img/cw/Cable_Seated_Lateral_Raise-0.webp',
  './img/cw/Cable_Seated_Lateral_Raise-1.webp',
  './img/cw/Seated_Side_Lateral_Raise-0.webp',
  './img/cw/Seated_Side_Lateral_Raise-1.webp',
  './img/cw/Seated_Dumbbell_Press-0.webp',
  './img/cw/Seated_Dumbbell_Press-1.webp',
  './img/cw/Leverage_Shoulder_Press-0.webp',
  './img/cw/Leverage_Shoulder_Press-1.webp',
  './img/cw/Arnold_Dumbbell_Press-0.webp',
  './img/cw/Arnold_Dumbbell_Press-1.webp',
  './img/cw/Reverse_Machine_Flyes-0.webp',
  './img/cw/Reverse_Machine_Flyes-1.webp',
  './img/cw/Face_Pull-0.webp',
  './img/cw/Face_Pull-1.webp',
  './img/cw/Reverse_Flyes-0.webp',
  './img/cw/Reverse_Flyes-1.webp',
  './img/cw/Cable_Rear_Delt_Fly-0.webp',
  './img/cw/Cable_Rear_Delt_Fly-1.webp',
  './img/cw/Barbell_Hip_Thrust-0.webp',
  './img/cw/Barbell_Hip_Thrust-1.webp',
  './img/cw/Barbell_Glute_Bridge-0.webp',
  './img/cw/Barbell_Glute_Bridge-1.webp',
  './img/cw/Single_Leg_Glute_Bridge-0.webp',
  './img/cw/Single_Leg_Glute_Bridge-1.webp',
  './img/cw/Lying_Leg_Curls-0.webp',
  './img/cw/Lying_Leg_Curls-1.webp',
  './img/cw/Seated_Leg_Curl-0.webp',
  './img/cw/Seated_Leg_Curl-1.webp',
  './img/cw/Standing_Leg_Curl-0.webp',
  './img/cw/Standing_Leg_Curl-1.webp',
  './img/cw/Ball_Leg_Curl-0.webp',
  './img/cw/Ball_Leg_Curl-1.webp',
  './img/cw/Hyperextensions_Back_Extensions-0.webp',
  './img/cw/Hyperextensions_Back_Extensions-1.webp',
  './img/cw/One-Legged_Cable_Kickback-0.webp',
  './img/cw/One-Legged_Cable_Kickback-1.webp',
  './img/cw/Pull_Through-0.webp',
  './img/cw/Pull_Through-1.webp',
  './img/cw/Reverse_Hyperextension-0.webp',
  './img/cw/Reverse_Hyperextension-1.webp',
  './img/cw/Incline_Dumbbell_Curl-0.webp',
  './img/cw/Incline_Dumbbell_Curl-1.webp',
  './img/cw/Hammer_Curls-0.webp',
  './img/cw/Hammer_Curls-1.webp',
  './img/cw/Dumbbell_Bicep_Curl-0.webp',
  './img/cw/Dumbbell_Bicep_Curl-1.webp',
  './img/cw/Machine_Preacher_Curls-0.webp',
  './img/cw/Machine_Preacher_Curls-1.webp',
  './img/cw/Standing_Biceps_Cable_Curl-0.webp',
  './img/cw/Standing_Biceps_Cable_Curl-1.webp',
  './img/cw/Concentration_Curls-0.webp',
  './img/cw/Concentration_Curls-1.webp',
  './img/cw/Cable_Hammer_Curls_-_Rope_Attachment-0.webp',
  './img/cw/Cable_Hammer_Curls_-_Rope_Attachment-1.webp',
  './img/cw/Cable_Rope_Overhead_Triceps_Extension-0.webp',
  './img/cw/Cable_Rope_Overhead_Triceps_Extension-1.webp',
  './img/cw/Triceps_Pushdown_-_Rope_Attachment-0.webp',
  './img/cw/Triceps_Pushdown_-_Rope_Attachment-1.webp',
  './img/cw/Standing_Dumbbell_Triceps_Extension-0.webp',
  './img/cw/Standing_Dumbbell_Triceps_Extension-1.webp',
  './img/cw/Triceps_Pushdown-0.webp',
  './img/cw/Triceps_Pushdown-1.webp',
  './img/cw/Tricep_Dumbbell_Kickback-0.webp',
  './img/cw/Tricep_Dumbbell_Kickback-1.webp',
  './img/cw/Machine_Triceps_Extension-0.webp',
  './img/cw/Machine_Triceps_Extension-1.webp',
  './img/cw/Reverse_Crunch-0.webp',
  './img/cw/Reverse_Crunch-1.webp',
  './img/cw/Dead_Bug-0.webp',
  './img/cw/Dead_Bug-1.webp',
  './img/cw/Plank-0.webp',
  './img/cw/Plank-1.webp',
  './img/cw/Hanging_Leg_Raise-0.webp',
  './img/cw/Hanging_Leg_Raise-1.webp',
  './img/cw/Cable_Crunch-0.webp',
  './img/cw/Cable_Crunch-1.webp',
  './img/cw/Flat_Bench_Lying_Leg_Raise-0.webp',
  './img/cw/Flat_Bench_Lying_Leg_Raise-1.webp',
  './img/cw/Kneeling_Hip_Flexor-0.webp',
  './img/cw/Kneeling_Hip_Flexor-1.webp',
  './img/cw/Lying_Glute-0.webp',
  './img/cw/Lying_Glute-1.webp',
  './img/cw/Lying_Hamstring-0.webp',
  './img/cw/Lying_Hamstring-1.webp',
  './img/cw/Calf_Stretch_Hands_Against_Wall-0.webp',
  './img/cw/Calf_Stretch_Hands_Against_Wall-1.webp',
  './img/cw/Seated_Glute-0.webp',
  './img/cw/Seated_Glute-1.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(POLKA);
    await c.addAll(SZKIELET);
    // Zdjęcia osobno i bez wywracania instalacji, gdy któreś się nie pobierze.
    await Promise.allSettled(ZDJECIA.map((z) => c.add(z)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((klucze) => Promise.all(klucze.filter((k) => k !== POLKA).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const stale = /\/(img|fonts|icons)\//.test(url.pathname);
  if (stale) {
    e.respondWith(caches.match(e.request).then((z) => z || fetch(e.request).then((odp) => {
      const kopia = odp.clone();
      caches.open(POLKA).then((c) => c.put(e.request, kopia)).catch(() => {});
      return odp;
    })));
    return;
  }
  // no-cache: GitHub Pages każe przeglądarce trzymać pliki 10 minut, a bez
  // tego poprawka docierała do telefonu z opóźnieniem.
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((odp) => {
        const kopia = odp.clone();
        caches.open(POLKA).then((c) => c.put(e.request, kopia)).catch(() => {});
        return odp;
      })
      .catch(() => caches.match(e.request).then((z) => z || caches.match('./index.html'))),
  );
});

/* Przypomnienie o przerwie. FCM dowozi je jako zwykły Web Push z czystym
   JSON-em (tytul, tresc, url), wysyła Cloud Function silkaPrzypomnienie. */
self.addEventListener('push', (e) => {
  let dane = {};
  try { dane = e.data ? e.data.json() : {}; } catch { /* puste powiadomienie */ }
  if (dane.data) dane = dane.data;
  e.waitUntil(self.registration.showNotification(dane.tytul || 'Siłka Piąteczki', {
    body: dane.tresc || 'Czas na trening.',
    icon: 'icons/icon-192.png',
    badge: 'icons/odznaka-96.png',
    tag: 'silka-przerwa',
    renotify: true,
    vibrate: [120, 60, 120],
    data: { url: dane.url || './#/start' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  // Pełna ścieżka z zakresu serwisanta, bo apka nie siedzi w katalogu głównym domeny.
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
    for (const k of lista) if ('focus' in k) { k.navigate(url); return k.focus(); }
    return self.clients.openWindow(url);
  }));
});
