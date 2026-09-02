#!/usr/bin/env node
/* ==========================================================================
   Dociąga 30-sekundowe podglądy do katalogu i zapisuje dane/podglady.json.
   --------------------------------------------------------------------------
   Uruchamiany na runnerze GitHuba (workflow „Jaka to Melodia”) albo ręcznie:

       node narzedzia/pobierz-podglady.mjs            # tylko brakujące
       node narzedzia/pobierz-podglady.mjs --odswiez  # wszystko od nowa
       node narzedzia/pobierz-podglady.mjs --limit 20 # kawałek, na próbę

   Dzięki temu w trakcie gry telefon nie musi o nic pytać sklepu — adresy
   nagrań leżą gotowe w repozytorium i grają od razu. Wyszukiwanie w locie
   zostaje w aplikacji tylko jako zapas dla utworów dopisanych po ostatnim
   przebiegu.

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
const spij = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/** Pobranie JSON-a z ponawianiem — sklepy lubią przyciąć zbyt gęste pytania. */
async function pobierzJson(adres, { proby = 4, log } = {}) {
  for (let proba = 1; proba <= proby; proba += 1) {
    try {
      const odpowiedz = await fetch(adres, {
        headers: { 'user-agent': 'jaka-to-melodia/1.0 (katalog gry towarzyskiej)' },
        signal: AbortSignal.timeout(20_000),
      });
      if (odpowiedz.status === 403 || odpowiedz.status === 429) {
        const czekaj = 5000 * proba;
        log?.(`  (limit zapytań, czekam ${czekaj / 1000}s)`);
        await spij(czekaj);
        continue;
      }
      if (!odpowiedz.ok) return null;
      return await odpowiedz.json();
    } catch (blad) {
      if (proba === proby) {
        log?.(`  (nie udało się: ${blad.message})`);
        return null;
      }
      await spij(1500 * proba);
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

async function znajdz(utwor, przerwaMs, opcje) {
  // Polskie wydania są w sklepie PL, reszta świata i tak tam jest — więc dla
  // polskich najpierw PL, dla pozostałych najpierw US.
  const kraje = utwor.gatunek === 'polskie' ? ['PL', 'US'] : ['US', 'PL'];
  for (const kraj of kraje) {
    const trafienie = wybierzNajlepszy(utwor, await szukajWITunes(utwor, kraj, opcje));
    if (trafienie) return trafienie;
    await spij(przerwaMs);
  }
  return wybierzNajlepszy(utwor, await szukajWDeezerze(utwor, opcje));
}

/**
 * Uzupełnia plik z podglądami. Zwraca podsumowanie przebiegu.
 * Wydzielone z części wywoływanej z wiersza poleceń, żeby test mógł podać
 * własny katalog i własny `fetch`.
 */
export async function uzupelnijPodglady({
  katalog = przygotujKatalog(),
  plikWyniku = resolve(KATALOG_APLIKACJI, 'dane/podglady.json'),
  odswiez = false,
  limit = Infinity,
  przerwaMs = 300,
  log = console.log,
} = {}) {
  let wynik = { wersja: 1, wygenerowano: null, utwory: {} };
  if (!odswiez) {
    try {
      wynik = JSON.parse(readFileSync(plikWyniku, 'utf8'));
      wynik.utwory ||= {};
    } catch { /* pierwszy przebieg — plik jeszcze nie istnieje */ }
  }

  // Wpisy dla utworów usuniętych z katalogu tylko puchłyby w nieskończoność.
  const znaneId = new Set(katalog.map((u) => u.id));
  for (const id of Object.keys(wynik.utwory)) if (!znaneId.has(id)) delete wynik.utwory[id];

  const doZrobienia = katalog.filter((u) => !wynik.utwory[u.id]?.podglad).slice(0, limit);
  log(`Katalog: ${katalog.length} utworów. Do sprawdzenia: ${doZrobienia.length}.`);

  const braki = [];
  let znalezione = 0;
  for (const [nr, utwor] of doZrobienia.entries()) {
    const etykieta = `${utwor.wykonawca} — ${utwor.tytul}`;
    const trafienie = await znajdz(utwor, przerwaMs, { log });
    if (trafienie) {
      wynik.utwory[utwor.id] = {
        podglad: trafienie.podglad,
        okladka: trafienie.okladka,
        zrodlo: trafienie.zrodlo,
        zrodloId: trafienie.zrodloId,
        tytulZrodla: trafienie.tytul,
        wykonawcaZrodla: trafienie.wykonawca,
      };
      znalezione += 1;
      log(`  ✓ ${etykieta}`);
    } else {
      braki.push(etykieta);
      log(`  ✗ ${etykieta}`);
    }
    if (nr % 25 === 24) log(`  … ${nr + 1}/${doZrobienia.length}`);
    await spij(przerwaMs);
  }

  wynik.wygenerowano = new Date().toISOString();
  wynik.braki = braki;
  mkdirSync(dirname(plikWyniku), { recursive: true });
  writeFileSync(plikWyniku, `${JSON.stringify(wynik, null, 1)}\n`);

  return { wynik, znalezione, braki, zPodgladem: Object.keys(wynik.utwory).length, wKatalogu: katalog.length };
}

/* --- wiersz poleceń --- */

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const argumenty = process.argv.slice(2);
  const wartosc = (nazwa, domyslna) => {
    const i = argumenty.indexOf(nazwa);
    return i >= 0 && argumenty[i + 1] ? argumenty[i + 1] : domyslna;
  };

  const raport = await uzupelnijPodglady({
    odswiez: argumenty.includes('--odswiez'),
    limit: Number(wartosc('--limit', 0)) || Infinity,
    przerwaMs: Number(wartosc('--przerwa', 300)),
    plikWyniku: process.env.JTM_PLIK_PODGLADOW
      ? resolve(process.env.JTM_PLIK_PODGLADOW)
      : resolve(KATALOG_APLIKACJI, 'dane/podglady.json'),
  });

  const wiersze = [
    '',
    `## Podglądy: ${raport.zPodgladem}/${raport.wKatalogu} utworów`,
    '',
    `W tym przebiegu znaleziono: **${raport.znalezione}**, nie znaleziono: **${raport.braki.length}**.`,
  ];
  if (raport.braki.length) {
    wiersze.push('', '### Bez nagrania (sprawdź pisownię tytułu i wykonawcy)', '');
    wiersze.push(...raport.braki.map((b) => `- ${b}`));
  }
  const tekst = `${wiersze.join('\n')}\n`;
  console.log(tekst);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
}
