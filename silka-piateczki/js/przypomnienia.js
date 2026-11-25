// Przypomnienia push o przerwie w treningach. Telefon tylko prosi o zgodę
// i zapisuje w Firestore swój token oraz datę ostatniego treningu. Codziennie
// o 17:00 Cloud Function `silkaPrzypomnienie` (jaka-to-melodia/functions)
// sprawdza, ile dni minęło, i wysyła push, gdy mijają 4, 5 albo 7 dni.
// Projekt Firebase jest ten sam co w Jaka to Melodia i Piąteczce.
// Sama apka działa bez tego: to dodatek, a błędy sieci są tu ciche.

const KONFIGURACJA = {
  apiKey: 'AIzaSyAi5qeqVfRlNhEzgGAxS5bQ5T5T55cViGY',
  authDomain: 'jaka-to-piosenka-8ca81.firebaseapp.com',
  projectId: 'jaka-to-piosenka-8ca81',
  storageBucket: 'jaka-to-piosenka-8ca81.firebasestorage.app',
  messagingSenderId: '1002531904130',
  appId: '1:1002531904130:web:79cf379250586c2177329b',
};
// Publiczny klucz VAPID z konsoli Firebase (ten sam co w jaka-to-melodia).
const KLUCZ_VAPID = 'BEfJmOADnE8DtaRAQnHGy97JYp8qFrhYTUzLP36ocnAXVypEyuLnZiSz4bAoF880G_fTgL__R52g4hme4hK64b4';
const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const KLUCZ_TOKENU = 'silka:token';
const KOLEKCJA = 'silkaPrzypomnienia';

let firebase = null;
function zaladuj() {
  firebase ??= (async () => {
    const [{ initializeApp }, f] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    const app = initializeApp(KONFIGURACJA, 'silka');
    return { app, db: f.getFirestore(app), f };
  })();
  firebase.catch(() => { firebase = null; });
  return firebase;
}

export function wspierane() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function wlaczone() {
  return wspierane() && Notification.permission === 'granted' && !!localStorage.getItem(KLUCZ_TOKENU);
}

export function zablokowane() {
  return wspierane() && Notification.permission === 'denied';
}

async function zapiszDokument(token, ostatniTrening) {
  const { db, f } = await zaladuj();
  await f.setDoc(f.doc(db, KOLEKCJA, token), {
    token,
    ostatniTrening: ostatniTrening || null,
    zaktualizowano: f.serverTimestamp(),
  }, { merge: true });
}

// Zwraca true, gdy zgoda jest i token zapisany w bazie.
export async function wlacz(ostatniTrening) {
  if (!wspierane()) throw new Error('Ta przeglądarka nie obsługuje powiadomień push.');
  let zgoda = Notification.permission;
  if (zgoda === 'default') zgoda = await Notification.requestPermission();
  if (zgoda !== 'granted') throw new Error('Bez zgody na powiadomienia nie da się wysłać przypomnienia. Zmienisz to w ustawieniach strony w Chrome.');
  const rejestracja = await navigator.serviceWorker.ready;
  const { app } = await zaladuj();
  const { getMessaging, getToken } = await import(`${SDK}/firebase-messaging.js`);
  const token = await getToken(getMessaging(app), { vapidKey: KLUCZ_VAPID, serviceWorkerRegistration: rejestracja });
  if (!token) throw new Error('Nie udało się zarejestrować telefonu do powiadomień.');
  await zapiszDokument(token, ostatniTrening);
  localStorage.setItem(KLUCZ_TOKENU, token);
  return true;
}

export async function wylacz() {
  const token = localStorage.getItem(KLUCZ_TOKENU);
  localStorage.removeItem(KLUCZ_TOKENU);
  if (!token) return;
  try {
    const { db, f } = await zaladuj();
    await f.deleteDoc(f.doc(db, KOLEKCJA, token));
  } catch { /* wpis zostanie, ale bez tokenu w telefonie nikt go nie odświeży */ }
}

// Po każdym treningu (i przy starcie apki) serwer dostaje świeżą datę,
// żeby liczył dni od właściwego treningu.
export async function zglosTrening(ostatniTrening) {
  const token = localStorage.getItem(KLUCZ_TOKENU);
  if (!token || !ostatniTrening) return;
  const klucz = 'silka:zgloszono';
  if (localStorage.getItem(klucz) === `${token}|${ostatniTrening}`) return;
  try {
    await zapiszDokument(token, ostatniTrening);
    localStorage.setItem(klucz, `${token}|${ostatniTrening}`);
  } catch { /* spróbujemy przy następnym otwarciu apki */ }
}
