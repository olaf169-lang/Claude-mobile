/* ==========================================================================
   Cienka warstwa nad Firestore — jedyna rzecz, jakiej potrzebuje tryb
   wyzwań (asynchroniczna gra solo + wysyłanie linku). Reszta aplikacji
   (granie na żywo przez MQTT) o tym nie wie i niczego stąd nie ściąga —
   SDK ładuje się z CDN dopiero, gdy ktoś naprawdę wejdzie w ten tryb.

   Klucze poniżej to publiczna konfiguracja klienta Firebase — nie są
   tajne (bezpieczeństwo pilnują reguły Firestore, nie ukrywanie tego
   obiektu), więc mogą bezpiecznie siedzieć w kodzie źródłowym.
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

let bazaPromise = null;

/** Zwraca { app, db, f } — f to cały moduł firebase-firestore (funkcje typu
    doc, setDoc, getDoc...), żeby nie trzeba było ich osobno eksportować stąd.
    `app` samo w sobie przydaje się tylko poza Firestore (np. powiadomienia.js
    woła nim getMessaging(app)). */
export function baza() {
  bazaPromise ??= (async () => {
    const [{ initializeApp }, f] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${WERSJA_SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${WERSJA_SDK}/firebase-firestore.js`),
    ]);
    const app = initializeApp(KONFIGURACJA);
    return { app, db: f.getFirestore(app), f };
  })();
  return bazaPromise;
}
