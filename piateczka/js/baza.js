/* ==========================================================================
   Wspólna baza wyników (Firestore).

   Ten sam projekt Firebase co „Jaka to Melodia” — darmowy plan spokojnie to
   udźwignie, bo cały sezon to kilkadziesiąt dokumentów. Dzięki temu KAŻDY
   z czwórki wpisuje wynik ze swojego telefonu i wszyscy widzą go od razu.

   Dwie rzeczy warte uwagi:

   1. Jeden dokument na wieczór, a mecze siedzą w nim jako mapa (`mecze.1`,
      `mecze.2`...). Zapis idzie ścieżką pola, więc gdy Tomek wpisuje mecz 1,
      a Kafaar w tej samej chwili mecz 3, nic się nie nadpisuje.
   2. Bez sieci appka nadal działa: czyta z kopii w localStorage, a zapisy
      Firestore kolejkuje i wyśle, gdy łącze wróci.
   ========================================================================== */

const KONFIGURACJA = {
  apiKey: 'AIzaSyAi5qeqVfRlNhEzgGAxS5bQ5T5T55cViGY',
  authDomain: 'jaka-to-piosenka-8ca81.firebaseapp.com',
  projectId: 'jaka-to-piosenka-8ca81',
  storageBucket: 'jaka-to-piosenka-8ca81.firebasestorage.app',
  messagingSenderId: '1002531904130',
  appId: '1:1002531904130:web:79cf379250586c2177329b',
};
const WERSJA_SDK = '10.14.1';
const KOLEKCJA = 'piateczkaWieczory';
const KOPIA = 'pp:wieczory';

let bazaPromise = null;
const sluchacze = new Set();
let ostatnie = wczytajKopie();
let stanLacza = 'laczenie';   // laczenie | online | lokalnie

export function wieczory() { return ostatnie; }
export function stan() { return stanLacza; }

function wczytajKopie() {
  try {
    const s = localStorage.getItem(KOPIA);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function zapiszKopie(lista) {
  try { localStorage.setItem(KOPIA, JSON.stringify(lista)); } catch { /* prywatne okno */ }
}

function rozeslij() {
  for (const cb of sluchacze) { try { cb(ostatnie, stanLacza); } catch (e) { console.error(e); } }
}

async function baza() {
  bazaPromise ??= (async () => {
    const [{ initializeApp }, f] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${WERSJA_SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${WERSJA_SDK}/firebase-firestore.js`),
    ]);
    const app = initializeApp(KONFIGURACJA);
    return { db: f.getFirestore(app), f };
  })();
  return bazaPromise;
}

/** Podpina się pod zmiany. Callback dostaje (wieczory, stanLacza) i odpala
    się od razu z tym, co jest w kopii lokalnej — ekran nigdy nie mruga pustką. */
export function nasluchuj(cb) {
  sluchacze.add(cb);
  cb(ostatnie, stanLacza);
  start();
  return () => sluchacze.delete(cb);
}

let wystartowano = false;
async function start() {
  if (wystartowano) return;
  wystartowano = true;
  try {
    const { db, f } = await baza();
    f.onSnapshot(
      f.query(f.collection(db, KOLEKCJA), f.orderBy('data', 'desc'), f.limit(120)),
      (migawka) => {
        ostatnie = migawka.docs.map((d) => ({ ...d.data(), data: d.id }));
        stanLacza = migawka.metadata.fromCache ? 'lokalnie' : 'online';
        zapiszKopie(ostatnie);
        rozeslij();
      },
      (blad) => {
        console.warn('Firestore nie odpowiada — jedziemy na kopii lokalnej.', blad);
        stanLacza = 'lokalnie';
        rozeslij();
      },
    );
  } catch (blad) {
    console.warn('Nie udało się wczytać Firebase — tryb lokalny.', blad);
    stanLacza = 'lokalnie';
    rozeslij();
  }
}

/* Zapisy aktualizują od razu kopię lokalną (żeby ekran zareagował natychmiast),
   a potem lecą do Firestore. Gdy nie ma sieci, SDK je zakolejkuje. */

function podmienLokalnie(data, zmiana) {
  const i = ostatnie.findIndex((w) => w.data === data);
  const stary = i >= 0 ? ostatnie[i] : { data, mecze: {} };
  const nowy = zmiana(structuredClone(stary));
  ostatnie = i >= 0
    ? ostatnie.map((w, k) => (k === i ? nowy : w))
    : [nowy, ...ostatnie].sort((a, b) => b.data.localeCompare(a.data));
  zapiszKopie(ostatnie);
  rozeslij();
  return nowy;
}

export async function zapiszWieczor(data, pola) {
  podmienLokalnie(data, (w) => ({ ...w, ...pola, data }));
  try {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, KOLEKCJA, data),
      { ...pola, data, zaktualizowano: f.serverTimestamp() }, { merge: true });
  } catch (blad) { console.warn('Zapis wieczoru poszedł do kolejki:', blad); }
}

export async function zapiszMecz(data, nr, mecz) {
  podmienLokalnie(data, (w) => ({ ...w, mecze: { ...(w.mecze ?? {}), [nr]: mecz } }));
  try {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, KOLEKCJA, data),
      { data, mecze: { [nr]: mecz }, zaktualizowano: f.serverTimestamp() }, { merge: true });
  } catch (blad) { console.warn('Zapis meczu poszedł do kolejki:', blad); }
}

export async function usunMecz(data, nr) {
  podmienLokalnie(data, (w) => {
    const m = { ...(w.mecze ?? {}) };
    delete m[nr];
    return { ...w, mecze: m };
  });
  try {
    const { db, f } = await baza();
    await f.updateDoc(f.doc(db, KOLEKCJA, data), { [`mecze.${nr}`]: f.deleteField() });
  } catch (blad) { console.warn('Kasowanie meczu poszło do kolejki:', blad); }
}

/* Zamek — patrz zamek.js. Zamknięcie to zwykły zapis pola; odblokowanie musi
   dodatkowo nieść skrót kodu, bo tego wymagają reguły Firestore. */

export async function zamknijWieczor(data) {
  podmienLokalnie(data, (w) => ({ ...w, zamkniety: true }));
  try {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, KOLEKCJA, data),
      { data, zamkniety: true, kod: f.deleteField(), zaktualizowano: f.serverTimestamp() },
      { merge: true });
  } catch (blad) { console.warn('Zamknięcie wieczoru poszło do kolejki:', blad); }
}

export async function odblokujWieczor(data, hashKodu) {
  podmienLokalnie(data, (w) => ({ ...w, zamkniety: false }));
  try {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, KOLEKCJA, data),
      { data, zamkniety: false, kod: hashKodu, zaktualizowano: f.serverTimestamp() },
      { merge: true });
  } catch (blad) { console.warn('Odblokowanie wieczoru poszło do kolejki:', blad); }
}

export async function usunWieczor(data) {
  ostatnie = ostatnie.filter((w) => w.data !== data);
  zapiszKopie(ostatnie);
  rozeslij();
  try {
    const { db, f } = await baza();
    await f.deleteDoc(f.doc(db, KOLEKCJA, data));
  } catch (blad) { console.warn('Kasowanie wieczoru poszło do kolejki:', blad); }
}
