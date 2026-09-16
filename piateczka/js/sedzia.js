/* ==========================================================================
   Tryb sędziego — zliczanie pojedynczych zagrań.

   Dwa wejścia, ten sam wynik:
   • klikanie na żywo (ekran-sedzia.js),
   • wklejona albo podyktowana transkrypcja, którą parsuje `parsujTranskrypcje`.

   Zdarzenia siedzą w samym meczu (`mecz.zagrania`), więc nie ruszają kształtu
   dokumentu wieczoru i nie wymagają zmiany reguł Firestore.

   ŚWIADOMIE nie wchodzą do tabeli ani do ELO (decyzja użytkownika
   2026-09-16). Powód jest praktyczny: nie każdy mecz będzie sędziowany,
   więc porównywanie tych liczb między graczami byłoby nieuczciwe. To są
   ciekawostki, nie waluta.
   ========================================================================== */

import { GRACZE, imieW } from './dane.js';
import { mecze, trybMeczu, wynikMeczu } from './liczenie.js';

export const ZDARZENIA = [
  { id: 'winner', nazwa: 'Winner',       krotko: 'W',   ikona: '🎯', dobre: true,
    opis: 'Zagranie, które kończy wymianę — rywal nawet nie dotknął.' },
  { id: 'as',     nazwa: 'As',           krotko: 'AS',  ikona: '⚡', dobre: true,
    opis: 'Serwis nie do odebrania.' },
  { id: 'aut',    nazwa: 'Aut',          krotko: 'AUT', ikona: '↗️', dobre: false,
    opis: 'Wybita lotka poza kort.' },
  { id: 'siatka', nazwa: 'Siatka',       krotko: 'SIA', ikona: '🥅', dobre: false,
    opis: 'Lotka w siatkę.' },
  { id: 'serwis', nazwa: 'Błąd serwisu', krotko: 'BS',  ikona: '🚫', dobre: false,
    opis: 'Zepsuty własny serwis — w aut, w siatkę, nieprawidłowy.' },
  { id: 'blad',   nazwa: 'Błąd',         krotko: 'B',   ikona: '✖', dobre: false,
    opis: 'Inna pomyłka, która oddała punkt.' },
];

export const zdarzenie = (id) => ZDARZENIA.find((z) => z.id === id) ?? null;

export const zagrania = (mecz) => (Array.isArray(mecz?.zagrania) ? mecz.zagrania : []);

/** Czy w meczu jest cokolwiek zsędziowanego. */
export const meczSedziowany = (mecz) => zagrania(mecz).length > 0;

/* ------------------------------------------------------------ statystyki */

function pustyBilans(id) {
  const b = { id, razem: 0, dobre: 0, zle: 0 };
  ZDARZENIA.forEach((z) => { b[z.id] = 0; });
  return b;
}

/** Zlicza zagrania z podanych meczów. Zwraca mapę id → bilans. */
export function bilansZagran(listaMeczow) {
  const mapa = new Map();
  const daj = (id) => {
    if (!mapa.has(id)) mapa.set(id, pustyBilans(id));
    return mapa.get(id);
  };
  for (const mecz of listaMeczow) {
    for (const z of zagrania(mecz)) {
      const def = zdarzenie(z.k);
      if (!def || !z.kto) continue;
      const b = daj(z.kto);
      b[z.k] += 1;
      b.razem += 1;
      if (def.dobre) b.dobre += 1; else b.zle += 1;
    }
  }
  return mapa;
}

/** Statystyki zagrań z całego sezonu; `tryb` zawęża do singla albo debla. */
export function statystykiSezonu(wieczory, { tryb = null, pomijajTowarzyskie = true } = {}) {
  const lista = [];
  for (const w of wieczory) {
    if (pomijajTowarzyskie && w.towarzyski) continue;
    for (const m of mecze(w)) {
      if (tryb && trybMeczu(m) !== tryb) continue;
      lista.push(m);
    }
  }
  return bilansZagran(lista);
}

/** Ile meczów w ogóle było sędziowanych — bez tego liczby nie mają skali. */
export function ileSedziowanych(wieczory, { tryb = null } = {}) {
  let ile = 0;
  for (const w of wieczory) {
    for (const m of mecze(w)) {
      if (tryb && trybMeczu(m) !== tryb) continue;
      if (meczSedziowany(m)) ile += 1;
    }
  }
  return ile;
}

/** Stosunek winnerów do błędów — jedyna liczba, którą warto pokazać jako
    „skuteczność”. Zwraca null, gdy nie ma z czego liczyć. */
export function skutecznosc(bilans) {
  if (!bilans || bilans.razem === 0) return null;
  return { dobre: bilans.dobre, zle: bilans.zle, procent: Math.round((bilans.dobre / bilans.razem) * 100) };
}

/* ------------------------------------------------------- parser polskiego */

/* Do dopasowania nazwisk i słów kluczowych sprowadzamy tekst do prostej
   postaci: małe litery, bez ogonków. Dzięki temu „Piąteczki”, „piateczki”
   i „PIATECZKI” to jedno i to samo. */
export function uprosc(tekst) {
  return String(tekst ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l');
}

/* Odmiana przez przypadki załatwiona rdzeniem: „Tomek/Tomka/Tomkowi” mają
   wspólny początek. Rdzeń liczymy jako najkrótszy prefiks, który jednoznacznie
   wskazuje jedną osobę w tym składzie — minimum trzy znaki. */
function rdzenie(sklad, wieczor) {
  const imiona = sklad.map((id) => [id, uprosc(imieW(wieczor, id))]);
  return imiona.map(([id, imie]) => {
    for (let dl = 3; dl <= imie.length; dl += 1) {
      const p = imie.slice(0, dl);
      if (imiona.every(([innyId, inne]) => innyId === id || !inne.startsWith(p))) {
        return { id, rdzen: p };
      }
    }
    return { id, rdzen: imie };
  });
}

const JA_SLOWA = ['moim', 'mojim', 'moj', 'moja', 'moje', 'mnie', 'mi ', ' ja ', 'jа'];

/* Kolejność MA ZNACZENIE: „serwis w aut” to błąd serwisowy, nie zwykły aut,
   więc reguły złożone muszą być sprawdzane pierwsze. */
const REGULY = [
  { k: 'serwis', test: (t) => /serw/.test(t) && /(aut|siatk|blad|zepsu|psu|nie trafi|pomyl)/.test(t) },
  { k: 'as',     test: (t) => /(^|[^a-z])as(a|em|y)?([^a-z]|$)/.test(t) || /as serwisow/.test(t) },
  { k: 'winner', test: (t) => /(winner|winer|koncz|wygrywajac|zabojcz|nie do odebrania)/.test(t) },
  { k: 'siatka', test: (t) => /siat[kc]/.test(t) },
  { k: 'aut',    test: (t) => /(^|[^a-z])(aut|auta|autem|poza kort|na aut)([^a-z]|$)/.test(t) },
  { k: 'blad',   test: (t) => /(blad|bledz|bledem|pomylk|zepsu|psuje|spudlow|przegral punkt)/.test(t) },
];

function rozpoznajRodzaj(t) {
  return REGULY.find((r) => r.test(t))?.k ?? null;
}

/** Pozycja słowa kluczowego rodzaju — potrzebna, żeby przypisać zdarzenie
    osobie stojącej NAJBLIŻEJ niego. Bez tego „Tomek wygrał po błędzie Jacka”
    przypisałoby błąd Tomkowi, bo pada pierwszy. */
function pozycjaKluczowa(t, k) {
  const wzory = {
    serwis: /serw/, as: /(^|[^a-z])as/, winner: /(winner|winer|koncz|wygrywajac|zabojcz)/,
    siatka: /siat[kc]/, aut: /(^|[^a-z])aut/, blad: /(blad|bledz|bledem|pomylk|zepsu|psuje|spudlow)/,
  };
  const m = wzory[k] ? t.match(wzory[k]) : null;
  return m ? m.index : Math.floor(t.length / 2);
}

/** Dzieli transkrypcję na kawałki. Kropka i nowa linia zawsze; przecinek
    tylko wtedy, gdy w kawałku siedzą dwa różne zdarzenia — inaczej rozerwałby
    „przy moim serwisie, winner” na dwa nieczytelne strzępy. */
function nakawalki(tekst) {
  const grube = String(tekst ?? '').split(/[.;!?\n\r]+/).map((x) => x.trim()).filter(Boolean);
  const wynik = [];
  for (const kawalek of grube) {
    const czesci = kawalek.split(',').map((x) => x.trim()).filter(Boolean);
    const ileZdarzen = czesci.filter((c) => rozpoznajRodzaj(uprosc(c))).length;
    if (czesci.length > 1 && ileZdarzen > 1) wynik.push(...czesci);
    else wynik.push(kawalek);
  }
  return wynik;
}

/** Zamienia tekst na listę zdarzeń. NIC nie zapisuje — zwraca też kawałki,
    których nie zrozumiał, żeby dało się je pokazać i poprawić ręcznie. */
export function parsujTranskrypcje(tekst, { sklad = [], wieczor = null, ja = null } = {}) {
  const osoby = rdzenie(sklad, wieczor);
  const zdarzenia = [];
  const nierozumiane = [];

  for (const kawalek of nakawalki(tekst)) {
    const t = uprosc(kawalek);
    const k = rozpoznajRodzaj(t);
    if (!k) { nierozumiane.push({ tekst: kawalek, czemu: 'nie widzę zdarzenia' }); continue; }

    const poz = pozycjaKluczowa(t, k);
    let kto = null, najblizej = Infinity;
    for (const { id, rdzen } of osoby) {
      let i = t.indexOf(rdzen);
      while (i !== -1) {
        const d = Math.abs(i - poz);
        if (d < najblizej) { najblizej = d; kto = id; }
        i = t.indexOf(rdzen, i + 1);
      }
    }
    if (!kto && ja && sklad.includes(ja) && JA_SLOWA.some((s) => ` ${t} `.includes(s))) kto = ja;
    if (!kto) { nierozumiane.push({ tekst: kawalek, czemu: 'nie widzę, czyje to zagranie' }); continue; }

    zdarzenia.push({ k, kto, tekst: kawalek });
  }
  return { zdarzenia, nierozumiane };
}

/** Krótkie podsumowanie meczu do pokazania na jego karcie. */
export function podsumowanieMeczu(mecz, wieczor) {
  const lista = zagrania(mecz);
  if (!lista.length) return null;
  const bil = bilansZagran([mecz]);
  const strony = [...mecz.a, ...mecz.b];
  return {
    ile: lista.length,
    gracze: strony.map((id) => ({
      id,
      imie: imieW(wieczor, id),
      bilans: bil.get(id) ?? pustyBilans(id),
    })),
  };
}

/** Wszyscy, którzy w ogóle mają jakieś zsędziowane zagranie — do list. */
export function graczeZeStatystykami(mapa) {
  return GRACZE.map((g) => g.id).filter((id) => (mapa.get(id)?.razem ?? 0) > 0);
}

export { wynikMeczu };
