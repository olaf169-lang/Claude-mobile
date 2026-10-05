#!/usr/bin/env node
/* ==========================================================================
   Wpisuje do dane/utwory.js utwory zebrane przez zbierz-kandydatow.mjs.
   --------------------------------------------------------------------------
       node narzedzia/wpisz-kandydatow.mjs kandydaci.json
       node narzedzia/wpisz-kandydatow.mjs czesci/*.json --maks 500
       node narzedzia/wpisz-kandydatow.mjs kandydaci.json --na-probe

   Osobny krok od zbierania, bo zbieranie potrzebuje sieci i dzieli się na
   równoległe części, a wpisywanie musi zobaczyć wszystkie części razem — inaczej
   dwie części dopisałyby ten sam utwór.

   TU JEST BRAMKA NA DUBLE. przebuduj-katalog.mjs rozwiązuje duble po cichu,
   zostawiając wpis późniejszy — czyli świeżo zebrany nadpisałby istniejący,
   ręcznie przypisany do kategorii. Raz już tak zniknął „See You Again” z rapu,
   bo doszedł pod „Szybcy i wściekli”. Dlatego kandydat, którego identyfikator
   już jest w katalogu, jest tutaj ODRZUCANY i wypisany w raporcie, a nie
   przepuszczany dalej.
   ========================================================================== */

import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { UTWORY } from '../dane/utwory.js';
import { KATEGORIE, DEKADY, idUtworu, dekada, daSieSpytacOFilm } from '../js/katalog.js';
import { przebuduj, raportPrzebudowy } from './przebuduj-katalog.mjs';

const ROK_MIN = 1958;
const ROK_MAX = new Date().getFullYear() + 1;
const DOZWOLONE_KATEGORIE = new Set(KATEGORIE.map((k) => k.id));
const DOZWOLONE_DEKADY = new Set(DEKADY.map((d) => d.id));

/**
 * Przesiewa kandydatów. Zwraca to, co wolno wpisać, i powód odrzucenia dla
 * reszty — nic nie wchodzi do katalogu „na wiarę”.
 */
export function przesiej(kandydaci, { katalog = UTWORY, maks = Infinity } = {}) {
  const zajete = new Map(katalog.map((u) => [idUtworu(u), u]));
  const przyjete = [];
  const odrzucone = [];
  const odrzuc = (utwor, powod) => odrzucone.push({ utwor, powod });

  for (const utwor of kandydaci) {
    if (przyjete.length >= maks) { odrzuc(utwor, 'limit tego przebiegu'); continue; }
    if (!utwor?.tytul?.trim() || !utwor?.wykonawca?.trim()) { odrzuc(utwor, 'pusty tytuł albo wykonawca'); continue; }
    if (!DOZWOLONE_KATEGORIE.has(utwor.gatunek)) { odrzuc(utwor, `nieznana kategoria „${utwor.gatunek}”`); continue; }
    if (!Number.isInteger(utwor.rok) || utwor.rok < ROK_MIN || utwor.rok > ROK_MAX) {
      odrzuc(utwor, `rok poza zakresem (${utwor.rok})`); continue;
    }
    if (!DOZWOLONE_DEKADY.has(dekada(utwor))) { odrzuc(utwor, `dekada ${dekada(utwor)} nie ma filtra`); continue; }
    // Muzyka filmowa bez filmu nie wejdzie do puli pytań, a taka, w której film
    // zdradzają i tytuł, i wykonawca, dałaby pytanie z odpowiedzią w treści.
    if (utwor.gatunek === 'filmowa' && !daSieSpytacOFilm(utwor)) {
      odrzuc(utwor, 'filmowa bez filmu albo z filmem zdradzonym w tytule i u wykonawcy'); continue;
    }
    const id = idUtworu(utwor);
    const kolizja = zajete.get(id);
    if (kolizja) {
      odrzuc(utwor, `już jest w katalogu jako „${kolizja.gatunek}” (${kolizja.rok})`); continue;
    }
    zajete.set(id, utwor);
    przyjete.push(utwor);
  }
  return { przyjete, odrzucone };
}

export function raportWpisywania({ przyjete, odrzucone }) {
  const powody = new Map();
  for (const { powod } of odrzucone) powody.set(powod, (powody.get(powod) || 0) + 1);
  const wiersze = [
    '',
    `## Wpisane do katalogu: ${przyjete.length}`,
    '',
    `Odrzucone: ${odrzucone.length}.`,
  ];
  if (powody.size) {
    wiersze.push('', '| powód odrzucenia | ile |', '|---|---:|',
      ...[...powody].sort((a, b) => b[1] - a[1]).map(([p, n]) => `| ${p} | ${n} |`));
  }
  const duble = odrzucone.filter((o) => o.powod.startsWith('już jest w katalogu'));
  if (duble.length) {
    wiersze.push('', `### Duble — zostaje wpis z katalogu (${duble.length})`, '',
      ...duble.slice(0, 30).map((o) => `- ${o.utwor.wykonawca} — ${o.utwor.tytul}: ${o.powod}`));
  }
  return `${wiersze.join('\n')}\n`;
}

/* --- wiersz poleceń --- */

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const argumenty = process.argv.slice(2);
  const naProbe = argumenty.includes('--na-probe');
  const i = argumenty.indexOf('--maks');
  const maks = i >= 0 ? Number(argumenty[i + 1]) : Infinity;
  const pliki = argumenty.filter((a) => !a.startsWith('--') && a !== String(maks));

  if (!pliki.length) {
    console.error('Podaj przynajmniej jeden plik z kandydatami.');
    process.exit(1);
  }

  const kandydaci = [];
  for (const plik of pliki) {
    const dane = JSON.parse(readFileSync(resolve(plik), 'utf8'));
    kandydaci.push(...(dane.utwory || []));
  }
  console.log(`Wczytano ${kandydaci.length} kandydatów z ${pliki.length} ${pliki.length === 1 ? 'pliku' : 'plików'}.`);

  const wynik = przesiej(kandydaci, { maks });
  const tekst = raportWpisywania(wynik);
  console.log(tekst);

  if (naProbe) {
    console.log('--na-probe: nic nie zapisuję.');
  } else if (wynik.przyjete.length) {
    console.log(raportPrzebudowy(przebuduj(wynik.przyjete)));
  } else {
    console.log('Nic do wpisania.');
  }

  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
  // Zero przyjętych przy niepustym wejściu to sygnał, że coś jest nie tak —
  // workflow ma to pokazać jako problem, a nie „zrobione”.
  if (kandydaci.length && !wynik.przyjete.length && !naProbe) process.exit(2);
}
