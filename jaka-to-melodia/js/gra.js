/* ==========================================================================
   Silnik gry — czysta logika, bez DOM-u i bez sieci.
   Prowadzący trzyma tu cały stan rozgrywki; telefony graczy dostają tylko
   tyle, ile trzeba, żeby pokazać pytanie (poprawna odpowiedź jedzie do nich
   dopiero po upływie czasu — inaczej dałoby się ją podejrzeć w telefonie).

   Trzy słowa, które warto rozróżniać:
     pytanie — jeden utwór z czterema odpowiedziami,
     seria   — ciąg pytań lecących jedno po drugim (np. dziesięć utworów),
     runda   — jedna seria plus temat, który ktoś dla niej wybrał
               (np. „rock i rap, lata 80. i 90.”). Gra to kilka rund.
   ========================================================================== */

import { przygotujKatalog, DEKADY, KATEGORIE, istnieje } from './katalog.js';

export const MAKS_PUNKTOW = 100;
// Ile puli zostaje temu, kto trafi w ostatniej chwili. Im niżej, tym mocniej
// liczy się refleks: przy 0,3 zwłoka do końca czasu kosztuje siedemdziesiąt
// procent stawki.
export const MIN_UDZIAL_PUNKTOW = 0.3;
export const MAKS_GRACZY = 20;         // wygodnie gra się do 14, ale miejsca jest więcej
export const CZASY_ODPOWIEDZI = [5, 7, 10, 15, 20];
export const LICZBY_RUND = [1, 3, 5, 8, 10];
export const DLUGOSCI_SERII = [5, 8, 10, 12, 15, 20, 25];
export const TYPY_PYTAN = {
  tytul: { pytanie: 'Co to za piosenka?', pole: 'tytul' },
  wykonawca: { pytanie: 'Kto to śpiewa?', pole: 'wykonawca' },
};

export const USTAWIENIA_DOMYSLNE = {
  kategorie: KATEGORIE.map((k) => k.id),
  dekady: DEKADY.map((d) => d.id),
  liczbaRund: 3,                // ile rund w grze
  dlugoscSerii: 10,             // ile utworów w jednej rundzie
  czasOdpowiedzi: 15,           // sekundy
  typyPytan: 'mix',             // 'tytul' | 'wykonawca' | 'mix'
  bonusSerii: false,            // +10 pkt za każde kolejne trafienie z rzędu (maks. +50)
  ktoWybiera: 'losowy',         // 'losowy' | 'prowadzacy' — kto ustala temat rundy
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
 * Seria pytań na jedną rundę. Losujemy ją w całości z góry, żeby dało się od
 * razu pobrać pierwsze nagrania i żeby prowadzący wiedział, ile pytań realnie
 * wyjdzie z wybranego tematu.
 *
 * `pomin` to utwory, które padły we wcześniejszych rundach tej gry — dwa razy
 * ta sama piosenka w jeden wieczór psuje zabawę nawet przy zmianie tematu.
 */
export function ulozSerie(ustawienia, {
  katalog = przygotujKatalog(), maPodglad = null, ziarno, pomin = new Set(), ile,
} = {}) {
  const losuj = losowanie(ziarno ?? Math.floor(Math.random() * 2 ** 31));
  const pula = pulaUtworow(ustawienia, { katalog, maPodglad }).filter((u) => !pomin.has(u.id));
  const kolejka = przetasuj(pula, losuj);
  const ileChcemy = ile ?? ustawienia.dlugoscSerii;

  const rundy = [];
  let poprzedniWykonawca = null;
  const odlozone = [];

  while (kolejka.length && rundy.length < ileChcemy) {
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
 * Trafienie od razu to cała stawka, trafienie w ostatniej sekundzie —
 * trzydzieści punktów. Czas liczy telefon gracza od momentu pokazania
 * pytania, więc wolniejszy internet nie zabiera punktów.
 */
export function punktyZaOdpowiedz({ poprawna, czasMs, limitMs, seria = 0, bonusSerii = false }) {
  if (!poprawna) return 0;
  const udzial = Math.min(1, Math.max(0, czasMs / limitMs));
  let punkty = Math.round(MAKS_PUNKTOW * (1 - (1 - MIN_UDZIAL_PUNKTOW) * udzial));
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

/**
 * Kto ustala temat następnej rundy. Losujemy spośród grających, ale omijamy
 * tego, kto wybierał ostatnio — przy dwóch osobach daje to naprzemienność,
 * przy większej gromadzie nikt nie wybiera dwa razy z rzędu.
 */
export function wylosujWybierajacego(idGraczy, poprzedni = null, losuj = Math.random) {
  const wszyscy = [...idGraczy];
  if (!wszyscy.length) return null;
  const kandydaci = wszyscy.length > 1 ? wszyscy.filter((id) => id !== poprzedni) : wszyscy;
  return kandydaci[Math.floor(losuj() * kandydaci.length)];
}

/** Krótki opis tematu rundy — „rock i rap · lata 80. i 90.”, „wszystko”. */
export function opiszTemat({ kategorie, dekady }) {
  const wszystkieKategorie = kategorie.length === KATEGORIE.length;
  const wszystkieDekady = dekady.length === DEKADY.length;
  if (wszystkieKategorie && wszystkieDekady) return 'wszystko, co jest';

  const zlacz = (lista) => (lista.length <= 1 ? lista.join('')
    : `${lista.slice(0, -1).join(', ')} i ${lista[lista.length - 1]}`);
  const czesci = [];
  if (!wszystkieKategorie) {
    czesci.push(zlacz(kategorie.map((id) => KATEGORIE.find((k) => k.id === id)?.nazwa || id)));
  }
  if (!wszystkieDekady) {
    // „lata 80. i 90.”, a nie „lata 80. i lata 90.” — słowo „lata” raz wystarczy.
    const nazwy = dekady.map((id, i) => {
      const dekada = DEKADY.find((d) => d.id === id);
      if (!dekada) return String(id);
      return i === 0 ? dekada.nazwa : (dekada.krotka || dekada.nazwa);
    });
    czesci.push(zlacz(nazwy));
  }
  return czesci.join(' · ');
}
