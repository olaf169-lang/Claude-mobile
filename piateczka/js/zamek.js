/* ==========================================================================
   Zamek na wieczory.

   Zasada, o którą prosił właściciel ligi: RAZ ZAPISANY WIECZÓR ZOSTAJE.
   Kto chce poprawić stary wynik, musi poprosić o kod — i dopiero wtedy
   wieczór wraca do edycji.

   Czym to NIE jest: sejfem. Kod sprawdza się po stronie przeglądarki, a jego
   skrót (SHA-256) siedzi i tutaj, i w regułach Firestore. Ktoś, kto zna się
   na konsoli deweloperskiej i chce się uprzeć, obejdzie to — tak samo jak
   panel administratora w „Jakiej to Melodii”. To zapora przed pomyłką
   i przed cichym „poprawieniem” wyniku po fakcie, nie przed włamywaczem.

   Zmiana kodu = podmiana skrótu w DWÓCH miejscach: tutaj i w sekcji
   `piateczkaWieczory` w jaka-to-melodia/firestore.rules. Sam kod (jawny
   tekst) nigdy nie trafia do repozytorium.
   ========================================================================== */

export const HASH_KODU = 'd53091710a15a2c668ab497907078c174b5d3afbfafd0e5bcfbc2ad27b628b1f';

export async function skrot(tekst) {
  const bajty = new TextEncoder().encode(tekst);
  const bufor = await crypto.subtle.digest('SHA-256', bajty);
  return [...new Uint8Array(bufor)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Czy podany kod pasuje. Wielkość liter i spacje wokół nie mają znaczenia. */
export async function kodPasuje(kod) {
  try {
    return await skrot(String(kod ?? '').trim().toUpperCase()) === HASH_KODU;
  } catch {
    return false;   // brak crypto.subtle (http bez TLS) — lepiej nie wpuszczać
  }
}

/** Czy wieczór jest zamknięty na klucz. */
export const zamkniety = (wieczor) => wieczor?.zamkniety === true;
