/* ==========================================================================
   Powiadomienia push (Firebase Cloud Messaging) — głównie dla Turnieju
   Piąteczki: "Twoja kolej", "pojedynek zakończony", cotygodniowe
   podsumowanie. Sam telefon tylko prosi o zgodę i zapisuje swój token
   w Firestore — kto i kiedy faktycznie wysyła powiadomienie, decyduje
   Cloud Function po stronie serwera (funkcje/index.js w repo), bo appka
   sama, bez działającej karty w tle, nie umie nic wysłać o stałej porze.

   Serwisant (sw.js) obsługuje same zdarzenia `push`/`notificationclick`
   zwykłym Web Push API — nie trzeba tam ładować SDK Firebase, bo FCM na
   webie i tak dowozi wiadomość jako zwykłe powiadomienie push.
   ========================================================================== */

import { baza } from './firebase.js';
import { idUrzadzenia } from './siec.js';

// Klucz VAPID (publiczny) z konsoli Firebase: Ustawienia projektu →
// Cloud Messaging → Certyfikaty push w internecie → wygeneruj parę kluczy.
// Bez niego getToken() się nie uda — patrz README, sekcja o powiadomieniach.
const KLUCZ_VAPID = 'BEfJmOADnE8DtaRAQnHGy97JYp8qFrhYTUzLP36ocnAXVypEyuLnZiSz4bAoF880G_fTgL__R52g4hme4hK64b4';

const WERSJA_SDK = '10.14.1';

export function wspierane() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function powiadomieniaWlaczone() {
  return wspierane() && Notification.permission === 'granted' && localStorage.getItem('jtm:powiadomieniaToken') != null;
}

/** Prosi o zgodę (jeśli jeszcze nie ma odpowiedzi) i zapisuje token FCM
    w Firestore pod daną ksywką — tam Cloud Function będzie go szukać, gdy
    przyjdzie pora komuś coś wysłać. Zwraca true, jeśli udało się włączyć. */
export async function wlaczPowiadomienia(ksywka) {
  if (!wspierane()) return false;
  if (KLUCZ_VAPID.startsWith('WKLEJ_TU')) return false; // jeszcze nie skonfigurowane w konsoli

  let zgoda = Notification.permission;
  if (zgoda === 'default') zgoda = await Notification.requestPermission();
  if (zgoda !== 'granted') return false;

  const rejestracja = await navigator.serviceWorker.ready;
  const { app } = await baza();
  const { getMessaging, getToken } = await import(`https://www.gstatic.com/firebasejs/${WERSJA_SDK}/firebase-messaging.js`);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: KLUCZ_VAPID, serviceWorkerRegistration: rejestracja });
  if (!token) return false;

  const { db, f } = await baza();
  await f.setDoc(f.doc(db, 'tokenyPush', token), {
    token, ksywka, urzadzenie: idUrzadzenia(), zapisano: f.serverTimestamp(),
  });
  localStorage.setItem('jtm:powiadomieniaToken', token);
  return true;
}
