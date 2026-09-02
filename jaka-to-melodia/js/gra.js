/* ==========================================================================
   Silnik gry — czysta logika, bez DOM-u i bez sieci.
   Prowadzący trzyma tu cały stan rozgrywki; telefony graczy dostają tylko
   tyle, ile trzeba, żeby pokazać pytanie (poprawna odpowiedź jedzie do nich
   dopiero po upływie czasu — inaczej dałoby się ją podejrzeć w telefonie).
   ========================================================================== */

import { przygotujKatalog, DEKADY, KATEGORIE } from './katalog.js';

export const MAKS_PUNKTOW = 100;
export const MAKS_GRACZY = 20;         // wygodnie gra się do 14, ale miejsca jest więcej
export const CZASY_ODPOWIEDZI = [5, 7, 10, 15, 20];
export const TYPY_PYTAN = {
  tytul: { pytanie: 'Co to za piosenka?', pole: 'tytul' },
  wykonawca: { pytanie: 'Kto to śpiewa?', pole: 'wykonawca' },
};

export const USTAWIENIA_DOMYSLNE = {
  kategorie: KATEGORIE.map((k) => k.id),
  dekady: DEKADY.map((d) => d.id),
  liczbaRund: 12,
  czasOdpowiedzi: 15,           // sekundy
  typyPytan: 'mix',             // 'tytul' | 'wykonawca' | 'mix'
  bonusSerii: false,            // +10 pkt za każdą kolejną trafioną rundę (maks. +50)
  losowyFragment: false,        // zaczynaj podgląd w losowym miejscu — trudniej
  dzwiekWAplikacji: true,       // false = muzykę puszcza prowadzący z zewnątrz
  prowadzacyGra: true,          // prowadzący odpowiada na swoim telefonie jak reszta
  ksywkaProwadzacego: '',
};

/* --- losowanie z ziarnem: ta sama gra da się powtórzyć w testach --- */
export function losowanie(ziarno = Date.now()) {
  let stan = ziarno >>> 0;
  return function losuj() {
    stan = (stan + 0x6d2b79f5) >>> 0;
    let t = stan;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function przetasuj(tablica, losuj) {
  const wynik = tablica.slice();
  for (let i = wynik.length - 1; i > 0; i -= 1) {
    const j = Math.floor(losuj() * (i + 1));
    [wynik[i], wynik[j]] = [wynik[j], wynik[i]];
  }
  return wynik;
}

/* --- pula utworów --- */

/**
 * Utwory pasujące do ustawień. `maPodglad` pozwala odsiać te, do których nie
 * udało się znaleźć nagrania — przy grze z dźwiękiem nie ma z nich pożytku.
 */
export function pulaUtworow(ustawienia, { katalog = przygotujKatalog(), maPodglad = null } = {}) {
  const kategorie = new Set(ustawienia.kategorie);
  const dekady = new Set(ustawienia.dekady);
  return katalog.filter(
    (u) =>
      kategorie.has(u.gatunek) &&
      dekady.has(u.dekada) &&
      (!maPodglad || maPodglad(u)),
  );
}

/* --- dobór błędnych odpowiedzi ---------------------------------------------
   Zła odpowiedź ma być wiarygodna, a nie przypadkowa: najpierw inny kawałek
   tego samego wykonawcy, potem ten sam gatunek i ta sama dekada, dalej już
   luźniej. Punktacja niżej ustawia kandydatów w tej właśnie kolejności.     */

function podobienstwo(utwor, kandydat, typ) {
  let punkty = 0;
  if (typ === 'tytul' && kandydat.kluczWykonawcy === utwor.kluczWykonawcy) punkty += 5;
  if (kandydat.gatunek === utwor.gatunek) punkty += 2;
  if (kandydat.dekada === utwor.dekada) punkty += 2;
  if (kandydat.styl === utwor.styl) punkty += 1;
  if (Math.abs(kandydat.rok - utwor.rok) <= 3) punkty += 1;
  return punkty;
}

export function dobierzBledne(utwor, katalog, typ, losuj, ile = 3) {
  const pole = typ === 'wykonawca' ? 'kluczWykonawcy' : 'kluczTytulu';
  const zajete = new Set([utwor[pole]]);
  // Przy pytaniu o wykonawcę odpowiedzią jest nazwa artysty, więc blokujemy
  // wszystkich wymienionych w poprawnym wpisie — inaczej obok „Taco Hemingway”
  // mógłby stanąć „Dawid Podsiadło & Taco Hemingway”.
  const zajeciArtysci = new Set(typ === 'wykonawca' ? utwor.kluczeWykonawcow : []);

  const kandydaci = [];
  for (const k of katalog) {
    if (k.id === utwor.id) continue;
    if (typ === 'wykonawca' && k.kluczeWykonawcow.some((a) => zajeciArtysci.has(a))) continue;
    kandydaci.push({ utwor: k, waga: podobienstwo(utwor, k, typ) });
  }

  // Grupujemy po wadze i mieszamy wewnątrz grupy: kolejność rund bywa różna,
  // a i tak zawsze wybieramy z najbardziej pasujących.
  const grupy = new Map();
  for (const kandydat of kandydaci) {
    if (!grupy.has(kandydat.waga)) grupy.set(kandydat.waga, []);
    grupy.get(kandydat.waga).push(kandydat.utwor);
  }

  const wybrane = [];
  let tenSamWykonawca = 0;
  for (const waga of [...grupy.keys()].sort((a, b) => b - a)) {
    for (const kandydat of przetasuj(grupy.get(waga), losuj)) {
      if (wybrane.length >= ile) break;
      if (zajete.has(kandydat[pole])) continue;
      if (typ === 'wykonawca' && kandydat.kluczeWykonawcow.some((a) => zajeciArtysci.has(a))) continue;
      // Trzy kawałki tego samego wykonawcy w jednym pytaniu to już nie zagadka.
      if (typ === 'tytul' && kandydat.kluczWykonawcy === utwor.kluczWykonawcy) {
        if (tenSamWykonawca >= 2) continue;
        tenSamWykonawca += 1;
      }
      zajete.add(kandydat[pole]);
      if (typ === 'wykonawca') kandydat.kluczeWykonawcow.forEach((a) => zajeciArtysci.add(a));
      wybrane.push(kandydat);
    }
    if (wybrane.length >= ile) break;
  }
  return wybrane;
}

/** Tekst odpowiedzi widoczny na ekranie dla danego typu pytania. */
export const tekstOdpowiedzi = (utwor, typ) =>
  typ === 'wykonawca' ? utwor.wykonawca : utwor.tytul;

/* --- budowa rundy --- */

export function zbudujRunde(utwor, katalog, typ, losuj) {
  const bledne = dobierzBledne(utwor, katalog, typ, losuj);
  const wszystkie = przetasuj([utwor, ...bledne], losuj);
  return {
    utwor,
    typ,
    pytanie: TYPY_PYTAN[typ].pytanie,
    odpowiedzi: wszystkie.map((u) => tekstOdpowiedzi(u, typ)),
    poprawna: wszystkie.findIndex((u) => u.id === utwor.id),
  };
}

/**
 * Kolejność rund na całą grę. Losujemy z góry, żeby dało się od razu pobrać
 * pierwsze nagrania i żeby prowadzący wiedział, ile rund realnie wyjdzie.
 */
export function ulozRundy(ustawienia, { katalog = przygotujKatalog(), maPodglad = null, ziarno } = {}) {
  const losuj = losowanie(ziarno ?? Math.floor(Math.random() * 2 ** 31));
  const pula = pulaUtworow(ustawienia, { katalog, maPodglad });
  const kolejka = przetasuj(pula, losuj);

  const rundy = [];
  let poprzedniWykonawca = null;
  const odlozone = [];

  while (kolejka.length && rundy.length < ustawienia.liczbaRund) {
    let utwor = kolejka.shift();
    // Ten sam wykonawca dwa razy z rzędu psuje rytm — odkładamy na później.
    if (utwor.kluczWykonawcy === poprzedniWykonawca && kolejka.length) {
      odlozone.push(utwor);
      utwor = kolejka.shift();
    }
    const typ =
      ustawienia.typyPytan === 'mix'
        ? (losuj() < 0.65 ? 'tytul' : 'wykonawca')
        : ustawienia.typyPytan;
    rundy.push(zbudujRunde(utwor, katalog, typ, losuj));
    poprzedniWykonawca = utwor.kluczWykonawcy;
    if (odlozone.length) kolejka.push(...odlozone.splice(0));
  }
  return rundy;
}

/* --- punktacja --- */

/**
 * Kahootowy schemat: trafienie w ostatniej chwili to połowa puli, trafienie
 * od razu — całość. Czas liczy telefon gracza od momentu pokazania pytania,
 * więc wolniejszy internet nie zabiera punktów.
 */
export function punktyZaOdpowiedz({ poprawna, czasMs, limitMs, seria = 0, bonusSerii = false }) {
  if (!poprawna) return 0;
  const udzial = Math.min(1, Math.max(0, czasMs / limitMs));
  let punkty = Math.round(MAKS_PUNKTOW * (1 - 0.5 * udzial));
  if (bonusSerii && seria > 1) punkty += Math.min(seria - 1, 5) * 10;
  return punkty;
}

export function ranking(gracze) {
  return [...gracze.values()]
    .map((g) => ({ ...g }))
    .sort((a, b) => b.punkty - a.punkty || b.trafienia - a.trafienia || a.ksywka.localeCompare(b.ksywka, 'pl'))
    .map((g, i) => ({ ...g, miejsce: i + 1 }));
}

/** Ile pytań da się jeszcze ułożyć z wybranych ustawień (dla ekranu ustawień). */
export function ileDostepnych(ustawienia, opcje) {
  return pulaUtworow(ustawienia, opcje).length;
}
