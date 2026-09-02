#!/usr/bin/env node
/* ==========================================================================
   Dociąga 30-sekundowe podglądy do katalogu i zapisuje dane/podglady.json.
   --------------------------------------------------------------------------
   Uruchamiany przez workflow „Jaka to Melodia” albo ręcznie:

       node narzedzia/pobierz-podglady.mjs            # tylko brakujące
       node narzedzia/pobierz-podglady.mjs --odswiez  # wszystko od nowa
       node narzedzia/pobierz-podglady.mjs --limit 20 # kawałek, na próbę

   Dzięki temu w trakcie gry telefon nie musi o nic pytać sklepu — adresy
   nagrań leżą gotowe w repozytorium i grają od razu. Wyszukiwanie w locie
   zostaje w aplikacji tylko jako zapas dla utworów dopisanych po ostatnim
   przebiegu.

   TEMPO. Wyszukiwarka iTunes przepuszcza około dwudziestu zapytań na minutę
   z jednego adresu, a potem zaczyna odpowiadać odmową. Nie da się tego obejść
   ponawianiem — trzeba po prostu pytać wolniej. Stąd bramka, która pilnuje
   stałego odstępu między zapytaniami, i podział katalogu na części (`--od`,
   `--do`): workflow puszcza je równolegle na osobnych maszynach, a każda ma
   własny adres i własny limit. Deezer jest znacznie łaskawszy, więc jego
   bramka przepuszcza dziesięć razy szybciej.

   Utwór, którego nie da się znaleźć, ląduje na liście „braki” w podsumowaniu —
   to najprościej wyłapuje literówki i piosenki, których po prostu nie ma
   w sklepie.
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { przygotujKatalog } from '../js/katalog.js';
import { wybierzNajlepszy, zITunes, zDeezera, zapytanie } from '../js/dopasowanie.js';

const KATALOG_APLIKACJI = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLIK_DOMYSLNY = resolve(KATALOG_APLIKACJI, 'dane/podglady.json');

// Około osiemnastu zapytań na minutę — z zapasem pod limitem iTunes.
const ODSTEP_ITUNES_MS = 3300;
const ODSTEP_DEEZERA_MS = 300;

const spij = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * Przepustnica z własnym rozumem. Wpuszcza zapytania nie częściej niż co
 * `odstepMs`, ale sama koryguje tempo: po odmowie zwalnia, po serii trafień
 * wraca do bazowego odstępu.
 *
 * Potrzebne, bo prawdziwego limitu nie da się z góry policzyć. Maszyny
 * GitHuba potrafią wychodzić do sieci wspólnym adresem, więc pięć równoległych
 * części bywa liczone przez sklep jako jeden pytający — i wtedy nasze
 * „osiemnaście na minutę” robi się dziewięćdziesiąt.
 */
class Bramka {
  constructor(odstepMs) {
    this.odstepBazowy = odstepMs;
    this.odstepMs = odstepMs;
    this.wolneOd = 0;
    this.podRzad = 0;
  }

  async przepusc() {
    const teraz = Date.now();
    const czekanie = Math.max(0, this.wolneOd - teraz);
    this.wolneOd = Math.max(teraz, this.wolneOd) + this.odstepMs;
    await spij(czekanie);
  }

  odmowa() {
    this.podRzad = 0;
    this.odstepMs = Math.min(this.odstepMs * 1.6, Math.max(this.odstepBazowy * 6, 20_000));
  }

  trafienie() {
    this.podRzad += 1;
    if (this.podRzad >= 15 && this.odstepMs > this.odstepBazowy) {
      this.podRzad = 0;
      this.odstepMs = Math.max(this.odstepBazowy, this.odstepMs * 0.8);
    }
  }
}

/**
 * Pobranie JSON-a. Odmowa z powodu limitu (403/429) oznacza, że mimo bramki
 * pytamy za szybko — wtedy jedna dłuższa przerwa, a nie seria ponowień.
 */
async function pobierzJson(adres, { bramka, proby = 2, log } = {}) {
  for (let proba = 1; proba <= proby; proba += 1) {
    await bramka.przepusc();
    try {
      const odpowiedz = await fetch(adres, {
        headers: { 'user-agent': 'jaka-to-melodia/1.0 (katalog gry towarzyskiej)' },
        signal: AbortSignal.timeout(20_000),
      });
      if (odpowiedz.status === 403 || odpowiedz.status === 429) {
        bramka.odmowa();
        if (proba === proby) return null;
        log?.(`  (sklep przycina — zwalniam do ${(bramka.odstepMs / 1000).toFixed(1)} s)`);
        continue;
      }
      if (!odpowiedz.ok) return null;
      bramka.trafienie();
      return await odpowiedz.json();
    } catch (blad) {
      if (proba === proby) {
        log?.(`  (nie udało się: ${blad.message})`);
        return null;
      }
      await spij(2000);
    }
  }
  return null;
}

async function szukajWITunes(utwor, kraj, opcje) {
  const adres = new URL('https://itunes.apple.com/search');
  adres.searchParams.set('term', zapytanie(utwor));
  adres.searchParams.set('entity', 'song');
  adres.searchParams.set('limit', '12');
  adres.searchParams.set('country', kraj);
  const dane = await pobierzJson(adres.toString(), opcje);
  return (dane?.results || []).map(zITunes);
}

async function szukajWDeezerze(utwor, opcje) {
  const adres = new URL('https://api.deezer.com/search');
  adres.searchParams.set('q', zapytanie(utwor));
  adres.searchParams.set('limit', '12');
  const dane = await pobierzJson(adres.toString(), opcje);
  return (dane?.data || []).map(zDeezera);
}

async function znajdz(utwor, bramki, log) {
  // Polskie wydania są w sklepie PL, reszta świata i tak tam jest — więc dla
  // polskich najpierw PL, dla pozostałych najpierw US. Drugi kraj tylko wtedy,
  // gdy pierwszy nic nie zwróci: każde zapytanie kosztuje kilka sekund tempa.
  const kraje = utwor.gatunek === 'polskie' ? ['PL', 'US'] : ['US', 'PL'];
  for (const kraj of kraje) {
    const trafienie = wybierzNajlepszy(utwor, await szukajWITunes(utwor, kraj, { bramka: bramki.itunes, log }));
    if (trafienie) return trafienie;
  }
  return wybierzNajlepszy(utwor, await szukajWDeezerze(utwor, { bramka: bramki.deezer, log }));
}

/**
 * Uzupełnia plik z podglądami. Zwraca podsumowanie przebiegu.
 * Wydzielone z części wywoływanej z wiersza poleceń, żeby test mógł podać
 * własny katalog i własny `fetch`.
 */
export async function uzupelnijPodglady({
  katalog = przygotujKatalog(),
  plikWejscia = PLIK_DOMYSLNY,
  plikWyniku = PLIK_DOMYSLNY,
  odswiez = false,
  limit = Infinity,
  od = 0,
  do: doIndeksu = Infinity,
  czesc = null,
  zIlu = 1,
  odstepMs = ODSTEP_ITUNES_MS,
  log = console.log,
} = {}) {
  let znane = {};
  if (!odswiez) {
    try {
      znane = JSON.parse(readFileSync(plikWejscia, 'utf8')).utwory || {};
    } catch { /* pierwszy przebieg — pliku jeszcze nie ma */ }
  }

  // Wpisy dla utworów usuniętych z katalogu tylko puchłyby w nieskończoność.
  const znaneId = new Set(katalog.map((u) => u.id));
  for (const id of Object.keys(znane)) if (!znaneId.has(id)) delete znane[id];

  // Podział na równe części liczymy tutaj, a nie w workflow: katalog rośnie,
  // a granice mają się przesuwać razem z nim.
  let poczatek = od;
  let koniec = doIndeksu;
  if (czesc !== null) {
    poczatek = Math.floor((czesc * katalog.length) / zIlu);
    koniec = Math.floor(((czesc + 1) * katalog.length) / zIlu);
  }
  const mojaCzesc = katalog.slice(poczatek, koniec === Infinity ? undefined : koniec);
  const doZrobienia = mojaCzesc.filter((u) => !znane[u.id]?.podglad).slice(0, limit);
  log(`Katalog: ${katalog.length} utworów, moja część: ${mojaCzesc.length}. Do sprawdzenia: ${doZrobienia.length}.`);

  const bramki = { itunes: new Bramka(odstepMs), deezer: new Bramka(odstepMs ? ODSTEP_DEEZERA_MS : 0) };
  const znalezione = {};
  const braki = [];

  // Wynik zapisujemy co kilkanaście utworów, a nie dopiero na końcu. Gdy
  // zadanie zostanie ucięte limitem czasu, dorobek zostaje — następny przebieg
  // pominie to, co już mamy, i pójdzie dalej.
  const zapisz = () => {
    const wynik = {
      wersja: 1,
      wygenerowano: new Date().toISOString(),
      utwory: { ...znane, ...znalezione },
      braki,
      ukonczone: przerobione === doZrobienia.length,
    };
    mkdirSync(dirname(plikWyniku), { recursive: true });
    writeFileSync(plikWyniku, `${JSON.stringify(wynik, null, 1)}\n`);
    return wynik;
  };
  let przerobione = 0;

  for (const [nr, utwor] of doZrobienia.entries()) {
    const etykieta = `${utwor.wykonawca} — ${utwor.tytul}`;
    const trafienie = await znajdz(utwor, bramki, log);
    if (trafienie) {
      znalezione[utwor.id] = {
        podglad: trafienie.podglad,
        okladka: trafienie.okladka,
        zrodlo: trafienie.zrodlo,
        zrodloId: trafienie.zrodloId,
        tytulZrodla: trafienie.tytul,
        wykonawcaZrodla: trafienie.wykonawca,
      };
      log(`  ✓ ${etykieta}`);
    } else {
      braki.push(etykieta);
      log(`  ✗ ${etykieta}`);
    }
    przerobione = nr + 1;
    if (nr % 10 === 9) {
      zapisz();
      log(`  … ${przerobione}/${doZrobienia.length} (tempo ${(bramki.itunes.odstepMs / 1000).toFixed(1)} s)`);
    }
  }

  const wynik = zapisz();

  return {
    wynik,
    znalezione: Object.keys(znalezione).length,
    braki,
    zPodgladem: Object.keys(wynik.utwory).length,
    wKatalogu: katalog.length,
  };
}

export function raportTekstowy({ zPodgladem, wKatalogu, znalezione, braki }) {
  const wiersze = [
    '',
    `## Podglądy: ${zPodgladem}/${wKatalogu} utworów`,
    '',
    `W tym przebiegu znaleziono: **${znalezione}**, nie znaleziono: **${braki.length}**.`,
  ];
  if (braki.length) {
    wiersze.push('', '### Bez nagrania (sprawdź pisownię tytułu i wykonawcy)', '');
    wiersze.push(...braki.map((b) => `- ${b}`));
  }
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

  const raport = await uzupelnijPodglady({
    odswiez: argumenty.includes('--odswiez'),
    limit: liczba('--limit', Infinity),
    od: liczba('--od', 0),
    do: liczba('--do', Infinity),
    czesc: argumenty.includes('--czesc') ? liczba('--czesc', 0) : null,
    zIlu: liczba('--z', 1),
    odstepMs: liczba('--odstep', ODSTEP_ITUNES_MS),
    plikWejscia: resolve(wartosc('--wejscie', process.env.JTM_PLIK_PODGLADOW || PLIK_DOMYSLNY)),
    plikWyniku: resolve(wartosc('--plik', process.env.JTM_PLIK_PODGLADOW || PLIK_DOMYSLNY)),
  });

  const tekst = raportTekstowy(raport);
  console.log(tekst);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
}
