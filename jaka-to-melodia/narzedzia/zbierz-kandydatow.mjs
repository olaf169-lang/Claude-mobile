#!/usr/bin/env node
/* ==========================================================================
   Zbiera nowe utwory do katalogu ze sklepu iTunes, wykonawca po wykonawcy.
   --------------------------------------------------------------------------
       node narzedzia/zbierz-kandydatow.mjs --plik kandydaci.json
       node narzedzia/zbierz-kandydatow.mjs --kategorie rock,rap --limit 5
       node narzedzia/zbierz-kandydatow.mjs --czesc 0 --z 5        # w CI

   Czego ten skrypt NIE robi: nie wymyśla tytułów ani lat. Dostaje listę
   wykonawców (dane/wykonawcy.js) i dla każdego pyta sklep, co ma w katalogu —
   tytuł, rok wydania i adres 30-sekundowego podglądu biorą się stamtąd. Dzięki
   temu rok jest taki, jaki wpisał wydawca, a nie zapamiętany z grubsza, i każdy
   dopisany utwór od razu ma czym zagrać.

   ROK, CZYLI NAJTRUDNIEJSZA CZĘŚĆ. Sklep podaje datę TEGO wydania, a nie
   premiery utworu: piosenka z 1967 trafiona na składance z 2015 ma w danych
   2015. Dekada jest w tej grze mechaniką (temat rundy to m.in. „lata 80.”),
   więc pomyłka o trzydzieści lat psuje rozgrywkę. Stąd dwa zabezpieczenia:
     1. dla każdego tytułu bierzemy NAJWCZEŚNIEJSZE wydanie, jakie sklep zna —
        oryginalny album zwykle też tam leży;
     2. odrzucamy utwory odstające od mediany lat danego wykonawcy — jeśli
        dwadzieścia kawałków The Supremes wychodzi z lat 60., a jeden z 2015,
        to ten jeden jest wznowieniem, nie premierą.
   Czego się nie da wyłapać: wykonawcy, którego CAŁY dorobek leży w sklepie
   tylko jako wznowienia. Dlatego raport pokazuje rozrzut lat na wykonawcę —
   to się przegląda OCZAMI przed wpisaniem do katalogu (narzedzia/wpisz-kandydatow.mjs).

   Zbieramy tylko do niedoborów z planu (narzedzia/plan-katalogu.mjs): koszyk
   dekada × kategoria, który ma już tyle, ile ma mieć, przestaje przyjmować.
   Dzięki temu proporcje katalogu zostają takie, jakie są dziś.
   ========================================================================== */

import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  przygotujKatalog, idUtworu, normalizuj, glownyWykonawca, dekada,
  zdradzaFilm, daSieSpytacOFilm,
} from '../js/katalog.js';
import { PODEJRZANE, zITunes } from '../js/dopasowanie.js';
import { wykonawcyKategorii, KATEGORIE_ZBIERANE } from '../dane/wykonawcy.js';
import { FILMY } from '../dane/filmy.js';
import { planKoszykow, CEL_DOMYSLNY } from './plan-katalogu.mjs';

const KATALOG_APLIKACJI = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Te same ograniczenia tempa co przy pobieraniu podglądów — ten sam sklep.
const ODSTEP_ITUNES_MS = 3300;
// Jeden wykonawca nie ma zdominować kategorii: silnik i tak nie stawia dwóch
// kawałków tego samego artysty obok siebie, a katalog ma być różnorodny.
const MAKS_NA_WYKONAWCE = 8;
// Utwór krótszy to zwykle skit albo intro, dłuższy — suita albo cały koncert.
const MIN_DLUGOSC_MS = 90_000;
const MAKS_DLUGOSC_MS = 600_000;
// Odstęp od mediany lat wykonawcy, po którym uznajemy wydanie za wznowienie.
const MAKS_ODSTAJACE_LATA = 15;
const ROK_MIN = 1958;

const spij = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/* --- czyszczenie tytułu ----------------------------------------------------
   Sklep dopisuje do tytułów rzeczy, których w katalogu nie chcemy
   („Remastered 2011”, „Single Version”). Część da się odciąć, a przy części
   lepiej odpuścić cały wpis, niż zgadywać — bo „Live” w tytule może być
   częścią nazwy, a może znaczyć, że to koncertówka. */

const DO_ODCIECIA = /\s*[([](?:[^()[\]]*\b(?:remaster(?:ed)?|single version|album version|radio edit|mono|stereo|re-?recorded|bonus track|deluxe|expanded|anniversary|edit(?:ed)?)\b[^()[\]]*)[)\]]\s*/gi;
const PO_PAUZIE = /\s+-\s+(?:.*\b(?:remaster(?:ed)?|single version|album version|radio edit|mono|stereo|bonus track|deluxe|edit)\b.*)$/i;
/* Tylko „feat.” i „ft.” — jednoznaczne. Samego „with” tu NIE MA, bo „(with My
   Heart)” w „Quit Playing Games (with My Heart)” to część prawdziwego tytułu,
   a nie dopisek o gościu. */
const FEAT_W_TYTULE = /\s*[([]\s*(?:feat|ft)\.?\s[^()[\]]*[)\]]\s*/gi;
/* Skąd pochodzi wydanie: „(From »Pretty In Pink« Soundtrack)”, „(From »Coco«)”,
   „(from Waiting to Exhale - Original Soundtrack)”. Na ekranie to śmieć, a przy
   muzyce filmowej dodatkowo wykłada nazwę filmu wprost w tytule. */
const SKAD_WYDANIE = /\s*[([][^()[\]]*\bfrom\b[^()[\]]*[)\]]\s*/gi;
/* Płyty świąteczne. Sklep stawia je wysoko (sezonowa popularność), a do tej gry
   nadają się najgorzej: kolędę zna każdy, tylko nikt nie zgadnie, KTO ją
   śpiewa, bo nagrał ją każdy. */
const SWIATECZNE = /\b(?:christmas|xmas|santa|noel|jingle bells?|silent night|cicha noc|kol[ęe]d|wigilij|miko[łl]aj|m[ęe]drcy|auld lang syne)\b/i;
/* Nagranie inne niż studyjny oryginał. Słowo musi stać w DOPISKU — po pauzie
   albo w nawiasie — bo w samym tytule bywa zupełnie niewinne: „Live and Let
   Die” to piosenka Wingsów, a nie koncertówka. */
const NIE_ORYGINAL_W_DOPISKU = /(?:\s+-\s+|[([])[^()[\]]*\b(?:live|remix|acoustic|demo|karaoke|tribute|instrumental|re-?recorded|cover|unplugged|session|rehearsal|mix|take|alternate)\b/i;
// Jeśli po czyszczeniu tytuł nadal to zdradza, utwór nie jest oryginałem.
const NADAL_PODEJRZANY = /\b(?:remaster|remastered|re-?recorded|version|rerecord|karaoke|tribute|instrumental|demo|remix|live at|live in|live from)\b/i;

export function wyczyscTytul(surowy) {
  const surowyTekst = String(surowy || '');
  if (NIE_ORYGINAL_W_DOPISKU.test(surowyTekst)) return null;
  const tytul = surowyTekst
    .replace(DO_ODCIECIA, ' ')
    .replace(SKAD_WYDANIE, ' ')
    .replace(FEAT_W_TYTULE, ' ')
    .replace(PO_PAUZIE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!tytul || NADAL_PODEJRZANY.test(tytul)) return null;
  return tytul;
}

/**
 * Klucz do rozpoznania, że to ten sam utwór w innym wydaniu. Sklep dopisuje do
 * tytułów skąd pochodzi wydanie („… [Greatest Hits]”, „… (Deluxe Edition)”),
 * a każda taka wersja ma swoją datę. Gdybyśmy grupowali po pełnym tytule, ta
 * sama piosenka weszłaby kilka razy — raz z prawdziwym rokiem, raz z rokiem
 * składanki. Dopisywanie kolejnych słów do listy wyjątków to walka z wiatrakami,
 * więc do porównania ucinamy WSZYSTKO w nawiasach.
 */
export const kluczUtworu = (tytul) =>
  normalizuj(String(tytul).replace(/[([][^()[\]]*[)\]]/g, ' ')) || normalizuj(tytul);

/* --- ocena pojedynczego nagrania ze sklepu --- */

const zawiera = (tekst, fraza) => ` ${tekst} `.includes(` ${fraza} `);

/** Czy to w ogóle oryginalne nagranie tego wykonawcy, nadające się do gry. */
export function nadajeSie(nagranie, wykonawca) {
  if (!nagranie.podglad) return false;
  const dlugosc = Number(nagranie.dlugoscMs) || 0;
  if (dlugosc < MIN_DLUGOSC_MS || dlugosc > MAKS_DLUGOSC_MS) return false;
  if (SWIATECZNE.test(`${nagranie.tytul} ${nagranie.album || ''}`)) return false;
  // „daigoro789” i podobne to konta wrzucające cudze piosenki, nie wykonawcy.
  // Prawdziwe nazwy z cyframi („2 Chainz”, „Eiffel 65”, „blink-182”) mają je
  // oddzielone albo na początku, więc ten wzór ich nie rusza.
  if (/^[a-z]+\d{3,}$/i.test(String(nagranie.wykonawca || '').trim())) return false;

  const opis = `${normalizuj(nagranie.tytul)} ${normalizuj(nagranie.album || '')}`;
  if (PODEJRZANE.some((slowo) => zawiera(opis, slowo))) return false;

  // Wyszukiwanie po wykonawcy zwraca też składanki, na których ktoś tylko
  // gościnnie wystąpił — bierzemy tylko to, gdzie on jest głównym nazwiskiem.
  const szukany = normalizuj(wykonawca);
  const znaleziony = normalizuj(glownyWykonawca(nagranie.wykonawca));
  return znaleziony === szukany || zawiera(znaleziony, szukany) || zawiera(szukany, znaleziony);
}

/**
 * Z wielu wydań tego samego tytułu robi jeden wpis z najwcześniejszym rokiem.
 * Wydzielone z pobierania, żeby test mógł to sprawdzić bez sieci.
 */
export function najwczesniejszeWydania(nagrania, wykonawca) {
  const wedlugTytulu = new Map();
  for (const nagranie of nagrania) {
    if (!nadajeSie(nagranie, wykonawca)) continue;
    const tytul = wyczyscTytul(nagranie.tytul);
    if (!tytul) continue;
    const rok = Number(String(nagranie.data || '').slice(0, 4));
    if (!rok || rok < ROK_MIN) continue;
    const klucz = kluczUtworu(tytul);
    const dotychczas = wedlugTytulu.get(klucz);
    if (!dotychczas || rok < dotychczas.rok) {
      wedlugTytulu.set(klucz, { tytul, rok, podglad: nagranie.podglad });
    }
  }
  return [...wedlugTytulu.values()];
}

/** Mediana lat — kotwica, względem której poznajemy wznowienia. */
export function mediana(liczby) {
  if (!liczby.length) return null;
  const posortowane = [...liczby].sort((a, b) => a - b);
  const srodek = Math.floor(posortowane.length / 2);
  return posortowane.length % 2
    ? posortowane[srodek]
    : Math.round((posortowane[srodek - 1] + posortowane[srodek]) / 2);
}

/**
 * Odsiewa wydania odstające od dorobku wykonawcy. Przy jednym czy dwóch
 * trafieniach nie ma od czego liczyć mediany, więc puszczamy je dalej — i tak
 * przejdą przez przegląd raportu.
 */
export function bezWznowien(wydania) {
  if (wydania.length < 4) return wydania;
  const srodek = mediana(wydania.map((w) => w.rok));
  return wydania.filter((w) => Math.abs(w.rok - srodek) <= MAKS_ODSTAJACE_LATA);
}

/* --- pobieranie ze sklepu --- */

class Bramka {
  constructor(odstepMs) {
    this.odstepBazowy = odstepMs;
    this.odstepMs = odstepMs;
    this.wolneOd = 0;
  }

  async przepusc() {
    const teraz = Date.now();
    const czekanie = Math.max(0, this.wolneOd - teraz);
    this.wolneOd = Math.max(teraz, this.wolneOd) + this.odstepMs;
    await spij(czekanie);
  }

  odmowa() {
    this.odstepMs = Math.min(this.odstepMs * 1.6, Math.max(this.odstepBazowy * 6, 20_000));
  }
}

async function pobierzJson(adres, bramka, log) {
  for (let proba = 1; proba <= 3; proba += 1) {
    await bramka.przepusc();
    try {
      const odpowiedz = await fetch(adres, {
        headers: { 'user-agent': 'jaka-to-melodia/1.0 (katalog gry towarzyskiej)' },
        signal: AbortSignal.timeout(20_000),
      });
      if (odpowiedz.status === 403 || odpowiedz.status === 429) {
        bramka.odmowa();
        log?.(`    (sklep przycina — zwalniam do ${(bramka.odstepMs / 1000).toFixed(1)} s)`);
        continue;
      }
      if (!odpowiedz.ok) return null;
      return await odpowiedz.json();
    } catch (blad) {
      if (proba === 3) {
        log?.(`    (nie udało się: ${blad.message})`);
        return null;
      }
      await spij(2000);
    }
  }
  return null;
}

async function dorobekWykonawcy(nazwa, kraj, bramka, log) {
  const adres = new URL('https://itunes.apple.com/search');
  adres.searchParams.set('term', nazwa);
  adres.searchParams.set('entity', 'song');
  // Bez tego „Queen” zwraca też „Queens of the Stone Age” i „Dancing Queen”.
  adres.searchParams.set('attribute', 'artistTerm');
  adres.searchParams.set('limit', '200');
  adres.searchParams.set('country', kraj);
  const dane = await pobierzJson(adres.toString(), bramka, log);
  return (dane?.results || []).map(zITunes);
}

/* --- ścieżki dźwiękowe -----------------------------------------------------
   Kategoria „filmowa” nie zbiera się po wykonawcach, bo odpowiedzią w pytaniu
   jest FILM — utwór bez przypisanego filmu nie wchodzi do puli. Więc tu pytamy
   sklep o albumy, a nie o artystów, i film bierzemy z własnej listy. */

const ZNACZNIK_SCIEZKI = /\b(?:soundtrack|motion picture|original score|music from|cast recording|musical)\b/i;
// Ścieżka wychodzi razem z filmem. Wydanie oddalone bardziej to wznowienie
// albo zupełnie inny album o podobnej nazwie.
const MAKS_ODSTEP_OD_PREMIERY = 2;

/**
 * Czy ten album to na pewno ścieżka z TEGO filmu. Sama nazwa filmu w tytule
 * albumu nie wystarcza: film „Up” pasowałby do połowy sklepu, więc wymagamy
 * jeszcze znacznika ścieżki dźwiękowej albo dokładnej zgodności nazwy.
 */
export function toSciezkaZFilmu(album, film) {
  const nazwaAlbumu = normalizuj(album || '');
  const nazwaFilmu = normalizuj(film);
  if (!nazwaAlbumu || !nazwaFilmu) return false;
  const slowaFilmu = nazwaFilmu.split(' ').filter((s) => s.length >= 3);
  const wAlbumie = new Set(nazwaAlbumu.split(' '));
  const maNazweFilmu = slowaFilmu.length
    ? slowaFilmu.every((s) => wAlbumie.has(s))
    : nazwaAlbumu.includes(nazwaFilmu);
  if (!maNazweFilmu) return false;
  return nazwaAlbumu === nazwaFilmu || ZNACZNIK_SCIEZKI.test(album);
}

async function sciezkaFilmu(nazwa, _kraj, bramka, log) {
  const adres = new URL('https://itunes.apple.com/search');
  adres.searchParams.set('term', `${nazwa} soundtrack`);
  adres.searchParams.set('entity', 'song');
  adres.searchParams.set('limit', '100');
  adres.searchParams.set('country', 'US');
  const dane = await pobierzJson(adres.toString(), bramka, log);
  return (dane?.results || []).map(zITunes);
}

/** Utwory z jednej ścieżki dźwiękowej, już sprawdzone i opisane filmem. */
export function utworyZeSciezki(nagrania, film, { maksNaFilm = 3 } = {}) {
  const wedlugTytulu = new Map();
  for (const nagranie of nagrania) {
    if (!nagranie.podglad) continue;
    const dlugosc = Number(nagranie.dlugoscMs) || 0;
    if (dlugosc < MIN_DLUGOSC_MS || dlugosc > MAKS_DLUGOSC_MS) continue;
    if (!toSciezkaZFilmu(nagranie.album, film.nazwa)) continue;
    if (SWIATECZNE.test(`${nagranie.tytul} ${nagranie.album || ''}`)) continue;
    if (/^[a-z]+\d{3,}$/i.test(String(nagranie.wykonawca || '').trim())) continue;
    const opis = `${normalizuj(nagranie.tytul)} ${normalizuj(nagranie.album || '')}`;
    if (PODEJRZANE.some((slowo) => zawiera(opis, slowo))) continue;
    const tytul = wyczyscTytul(nagranie.tytul);
    if (!tytul) continue;
    const rok = Number(String(nagranie.data || '').slice(0, 4));
    if (!rok || Math.abs(rok - film.rok) > MAKS_ODSTEP_OD_PREMIERY) continue;

    const utwor = {
      tytul,
      wykonawca: nagranie.wykonawca,
      rok: film.rok,
      gatunek: 'filmowa',
      film: film.nazwa,
    };
    // Utwór, w którym film zdradza i tytuł, i wykonawca, dałby pytanie
    // z odpowiedzią w treści — takiego nie bierzemy wcale.
    if (!daSieSpytacOFilm(utwor)) continue;
    const klucz = kluczUtworu(tytul);
    if (!wedlugTytulu.has(klucz)) wedlugTytulu.set(klucz, utwor);
  }
  // Najpierw te, których tytuł nie zdradza filmu — z nich wychodzą
  // najlepsze pytania. Wewnątrz grupy zostaje kolejność ze sklepu.
  const wszystkie = [...wedlugTytulu.values()];
  return [
    ...wszystkie.filter((u) => !zdradzaFilm(u.tytul, u.film)),
    ...wszystkie.filter((u) => zdradzaFilm(u.tytul, u.film)),
  ].slice(0, maksNaFilm);
}

export async function zbierzFilmowe({
  katalog = przygotujKatalog(),
  cel = CEL_DOMYSLNY,
  filmy = FILMY,
  maksNaFilm = 3,
  limitFilmow = Infinity,
  czesc = null,
  zIlu = 1,
  odstepMs = ODSTEP_ITUNES_MS,
  pobierz = sciezkaFilmu,
  log = console.log,
} = {}) {
  const plan = planKoszykow(katalog, { cel });
  const miejsce = new Map();
  for (const koszyk of plan.koszyki) {
    if (koszyk.kategoria === 'filmowa') miejsce.set(koszyk.dekada, koszyk.brak);
  }

  const zajeteId = new Set(katalog.map((u) => u.id));
  const bramka = new Bramka(odstepMs);
  const przyjete = [];
  const raport = [];

  const mojeFilmy = (czesc === null
    ? filmy
    : filmy.slice(
      Math.floor((czesc * filmy.length) / zIlu),
      Math.floor(((czesc + 1) * filmy.length) / zIlu),
    )).slice(0, limitFilmow);

  log(`Filmów do przejścia: ${mojeFilmy.length} z ${filmy.length}.`);

  for (const [nr, film] of mojeFilmy.entries()) {
    const nagrania = await pobierz(film.nazwa, 'US', bramka, log);
    const kandydaci = utworyZeSciezki(nagrania, film, { maksNaFilm });
    const zTegoFilmu = [];
    for (const utwor of kandydaci) {
      const dek = dekada(utwor);
      if (!miejsce.has(dek) || miejsce.get(dek) <= 0) continue;
      const id = idUtworu(utwor);
      if (zajeteId.has(id)) continue;
      zajeteId.add(id);
      miejsce.set(dek, miejsce.get(dek) - 1);
      zTegoFilmu.push(utwor);
      przyjete.push(utwor);
    }
    raport.push({
      nazwa: film.nazwa, kategoria: 'filmowa',
      wSklepie: kandydaci.length, przyjete: zTegoFilmu.length,
      lata: String(film.rok),
    });
    log(`  [${nr + 1}/${mojeFilmy.length}] ${film.nazwa} (${film.rok}): ${zTegoFilmu.length} utworów`);
  }

  return { przyjete, wykonawcy: raport, plan };
}

/* --- zbieranie --- */

export async function zbierzKandydatow({
  katalog = przygotujKatalog(),
  cel = CEL_DOMYSLNY,
  kategorie = KATEGORIE_ZBIERANE,
  maksNaWykonawce = MAKS_NA_WYKONAWCE,
  limitWykonawcow = Infinity,
  czesc = null,
  zIlu = 1,
  odstepMs = ODSTEP_ITUNES_MS,
  pobierz = dorobekWykonawcy,
  log = console.log,
} = {}) {
  const plan = planKoszykow(katalog, { cel });
  // Ile jeszcze wolno dołożyć do każdego koszyka.
  const miejsce = new Map();
  for (const koszyk of plan.koszyki) {
    if (!koszyk.specjalna) miejsce.set(`${koszyk.dekada}/${koszyk.kategoria}`, koszyk.brak);
  }

  const zajeteId = new Set(katalog.map((u) => u.id));
  const bramka = new Bramka(odstepMs);
  const przyjete = [];
  const wykonawcyRaport = [];

  // Lista zadań na płasko, żeby podział na części w CI był równy niezależnie
  // od tego, która kategoria ma więcej wykonawców.
  const zadania = [];
  for (const kategoria of kategorie) {
    for (const wykonawca of wykonawcyKategorii(kategoria)) {
      zadania.push({ kategoria, ...wykonawca });
    }
  }
  const mojeZadania = czesc === null
    ? zadania.slice(0, limitWykonawcow)
    : zadania
      .slice(
        Math.floor((czesc * zadania.length) / zIlu),
        Math.floor(((czesc + 1) * zadania.length) / zIlu),
      )
      .slice(0, limitWykonawcow);

  log(`Plan: ${plan.teraz} → ${plan.cel}. Do dołożenia ${plan.brakZwykle} w kategoriach gatunkowych.`);
  log(`Wykonawców do przejścia: ${mojeZadania.length} z ${zadania.length}.`);

  for (const [nr, zadanie] of mojeZadania.entries()) {
    const kraj = zadanie.kategoria === 'polskie' ? 'PL' : 'US';
    const nagrania = await pobierz(zadanie.nazwa, kraj, bramka, log);
    // KOLEJNOŚCI ZE SKLEPU NIE WOLNO RUSZAĆ. Sklep oddaje nagrania od
    // najpopularniejszych, a w tej grze trzeba utwór ROZPOZNAĆ — nieznany
    // kawałek z trzeciej płyty jest bezużyteczny, choćby rok był idealny.
    // Pierwszy przebieg sortował te wydania po roku rosnąco i brał osiem
    // najstarszych, czyli systematycznie nagrania sprzed popularności artysty:
    // Tomowi Jonesowi wyszło „The Vaults of Heaven”, a Kool & The Gang
    // „Kools Back Again”. Bierzemy więc po kolei to, co sklep podaje najwyżej.
    const wydania = bezWznowien(najwczesniejszeWydania(nagrania, zadanie.nazwa));

    const zTegoWykonawcy = [];
    for (const wydanie of wydania) {
      if (zTegoWykonawcy.length >= maksNaWykonawce) break;
      const dek = dekada(wydanie);
      const klucz = `${dek}/${zadanie.kategoria}`;
      if (!miejsce.has(klucz) || miejsce.get(klucz) <= 0) continue;

      const utwor = {
        tytul: wydanie.tytul,
        wykonawca: zadanie.nazwa,
        rok: wydanie.rok,
        gatunek: zadanie.kategoria,
        ...(zadanie.styl ? { styl: zadanie.styl } : {}),
      };
      const id = idUtworu(utwor);
      // Dubel nie ma trafić do pliku: przebuduj-katalog.mjs rozwiązuje duble po
      // cichu, zostawiając wpis późniejszy — czyli nadpisałby istniejący,
      // ręcznie przypisany utwór tym świeżym. Tego nie chcemy nigdy.
      if (zajeteId.has(id)) continue;
      zajeteId.add(id);
      miejsce.set(klucz, miejsce.get(klucz) - 1);
      zTegoWykonawcy.push(utwor);
      przyjete.push(utwor);
    }

    const lata = zTegoWykonawcy.map((u) => u.rok);
    wykonawcyRaport.push({
      nazwa: zadanie.nazwa,
      kategoria: zadanie.kategoria,
      wSklepie: wydania.length,
      przyjete: zTegoWykonawcy.length,
      lata: lata.length ? `${Math.min(...lata)}–${Math.max(...lata)}` : '—',
    });
    log(`  [${nr + 1}/${mojeZadania.length}] ${zadanie.nazwa} (${zadanie.kategoria}): `
      + `${zTegoWykonawcy.length} z ${wydania.length} dostępnych${lata.length ? `, lata ${wykonawcyRaport.at(-1).lata}` : ''}`);
  }

  return { przyjete, wykonawcy: wykonawcyRaport, plan };
}

/**
 * Najważniejsze liczby w jednej linijce, razem z próbką utworów. Próbka jest
 * tu celowo: po samej liczbie nie widać, czy lata się zgadzają, a to jedyna
 * rzecz, której maszyna za nas nie sprawdzi.
 */
export function podsumowanieJednymZdaniem({ przyjete, wykonawcy }) {
  const wgKategorii = new Map();
  const wgDekady = new Map();
  for (const u of przyjete) {
    wgKategorii.set(u.gatunek, (wgKategorii.get(u.gatunek) || 0) + 1);
    wgDekady.set(dekada(u), (wgDekady.get(dekada(u)) || 0) + 1);
  }
  const bezNiczego = wykonawcy.filter((w) => w.wSklepie === 0).length;
  const probka = przyjete
    .filter((_, i) => i % Math.max(1, Math.floor(przyjete.length / 8)) === 0)
    .slice(0, 8)
    .map((u) => `${u.rok} ${u.wykonawca} — ${u.tytul}`)
    .join(' // ');
  return [
    `${przyjete.length} utworów z ${wykonawcy.length} wykonawców`,
    `(sklep nie znał ${bezNiczego}).`,
    `Kategorie: ${[...wgKategorii].map(([k, n]) => `${k} ${n}`).join(', ') || '—'}.`,
    `Dekady: ${[...wgDekady].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d} ${n}`).join(', ') || '—'}.`,
    probka ? `Próbka: ${probka}` : '',
  ].join(' ');
}

export function raportZbierania({ przyjete, wykonawcy }) {
  const wgKategorii = new Map();
  const wgDekady = new Map();
  for (const u of przyjete) {
    wgKategorii.set(u.gatunek, (wgKategorii.get(u.gatunek) || 0) + 1);
    const d = dekada(u);
    wgDekady.set(d, (wgDekady.get(d) || 0) + 1);
  }

  const wiersze = [
    '',
    `## Zebrane utwory: ${przyjete.length}`,
    '',
    `Przeszliśmy ${wykonawcy.length} wykonawców.`,
    '',
    '| kategoria | utworów |', '|---|---:|',
    ...[...wgKategorii].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`),
    '',
    '| dekada | utworów |', '|---|---:|',
    ...[...wgDekady].sort((a, b) => a[0] - b[0]).map(([d, n]) => `| ${d} | ${n} |`),
  ];

  // Rozrzut lat na wykonawcę — to się przegląda oczami. Wykonawca z lat 60.,
  // któremu wyszły lata 2010., leży w sklepie tylko jako wznowienie.
  const podejrzani = wykonawcy.filter((w) => w.przyjete === 0 && w.wSklepie > 0);
  if (podejrzani.length) {
    wiersze.push('', `### Nic nie weszło, choć sklep coś ma (${podejrzani.length})`, '',
      'Koszyki tych dekad są już pełne albo wszystko było dublem.', '',
      ...podejrzani.slice(0, 40).map((w) => `- ${w.nazwa} (${w.kategoria}): ${w.wSklepie} w sklepie`));
  }
  const pusci = wykonawcy.filter((w) => w.wSklepie === 0);
  if (pusci.length) {
    wiersze.push('', `### Sklep nic nie zwrócił (${pusci.length}) — sprawdź pisownię nazwy`, '',
      ...pusci.map((w) => `- ${w.nazwa} (${w.kategoria})`));
  }
  wiersze.push('', '### Rozrzut lat na wykonawcę (do przejrzenia oczami)', '',
    '| wykonawca | kategoria | przyjęte | lata |', '|---|---|---:|---|',
    ...wykonawcy.filter((w) => w.przyjete > 0).map((w) => `| ${w.nazwa} | ${w.kategoria} | ${w.przyjete} | ${w.lata} |`));

  return `${wiersze.join('\n')}\n`;
}

/* --- wiersz poleceń --- */

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const argumenty = process.argv.slice(2);
  const wartosc = (nazwa, domyslna) => {
    const i = argumenty.indexOf(nazwa);
    return i >= 0 && argumenty[i + 1] !== undefined ? argumenty[i + 1] : domyslna;
  };
  const liczba = (nazwa, domyslna) => {
    const surowa = wartosc(nazwa, null);
    return surowa === null ? domyslna : Number(surowa);
  };

  const kategorieArg = wartosc('--kategorie', null);
  const wspolne = {
    cel: liczba('--cel', CEL_DOMYSLNY),
    czesc: argumenty.includes('--czesc') ? liczba('--czesc', 0) : null,
    zIlu: liczba('--z', 1),
    odstepMs: liczba('--odstep', ODSTEP_ITUNES_MS),
  };
  // „wykonawcy” zbiera kategorie gatunkowe, „filmy” kategorię filmową (tam
  // utwór musi mieć przypisany film), „oba” jedno po drugim.
  const tryb = wartosc('--tryb', 'wykonawcy');
  const wynik = { przyjete: [], wykonawcy: [] };
  if (tryb === 'wykonawcy' || tryb === 'oba') {
    const zWykonawcow = await zbierzKandydatow({
      ...wspolne,
      kategorie: kategorieArg ? kategorieArg.split(',') : KATEGORIE_ZBIERANE,
      maksNaWykonawce: liczba('--maks-na-wykonawce', MAKS_NA_WYKONAWCE),
      limitWykonawcow: liczba('--limit', Infinity),
    });
    wynik.przyjete.push(...zWykonawcow.przyjete);
    wynik.wykonawcy.push(...zWykonawcow.wykonawcy);
  }
  if (tryb === 'filmy' || tryb === 'oba') {
    const zeSciezek = await zbierzFilmowe({
      ...wspolne,
      maksNaFilm: liczba('--maks-na-film', 3),
      limitFilmow: liczba('--limit', Infinity),
    });
    wynik.przyjete.push(...zeSciezek.przyjete);
    wynik.wykonawcy.push(...zeSciezek.wykonawcy);
  }

  const plik = resolve(wartosc('--plik', 'kandydaci.json'));
  mkdirSync(dirname(plik), { recursive: true });
  writeFileSync(plik, `${JSON.stringify({
    wersja: 1,
    wygenerowano: new Date().toISOString(),
    utwory: wynik.przyjete,
    wykonawcy: wynik.wykonawcy,
  }, null, 1)}\n`);

  const tekst = raportZbierania(wynik);
  console.log(tekst);
  console.log(`Zapisano ${wynik.przyjete.length} utworów do ${plik}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
  // Adnotacja, bo logi i artefakty przebiegu bywają nieosiągalne z zewnątrz
  // (blokada sieci), a adnotacje da się odczytać przez API. To jedyny pewny
  // kanał, którym wynik przebiegu wraca do człowieka.
  if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Zebrane::${podsumowanieJednymZdaniem(wynik)}`);
}
