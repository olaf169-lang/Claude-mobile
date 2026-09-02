#!/usr/bin/env node
/* Scala cząstkowe wyniki pobierania w jeden dane/podglady.json.

       node narzedzia/scal-podglady.mjs czesc-*.json --plik dane/podglady.json

   Workflow dzieli katalog na kilka części i puszcza je równolegle na osobnych
   maszynach — inaczej limit zapytań iTunes rozciągnąłby całość na godzinę.
   Tutaj części wracają do jednego pliku. Wpisy dla utworów, których nie ma
   już w katalogu, wypadają przy okazji. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';

import { przygotujKatalog } from '../js/katalog.js';

export function scal(czesci, katalog = przygotujKatalog()) {
  const znaneId = new Set(katalog.map((u) => u.id));
  const utwory = {};
  const braki = new Set();

  for (const czesc of czesci) {
    for (const [id, wpis] of Object.entries(czesc.utwory || {})) {
      if (wpis?.podglad && znaneId.has(id)) utwory[id] = wpis;
    }
    for (const brak of czesc.braki || []) braki.add(brak);
  }

  // Utwór znaleziony w jednej części nie jest brakiem tylko dlatego, że inna
  // część go u siebie nie miała.
  const zNagraniem = new Set(
    katalog.filter((u) => utwory[u.id]).map((u) => `${u.wykonawca} — ${u.tytul}`),
  );

  return {
    wersja: 1,
    wygenerowano: new Date().toISOString(),
    utwory,
    braki: [...braki].filter((b) => !zNagraniem.has(b)).sort((a, b) => a.localeCompare(b, 'pl')),
  };
}

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const argumenty = process.argv.slice(2);
  const indeksPliku = argumenty.indexOf('--plik');
  const plikWyniku = resolve(indeksPliku >= 0 ? argumenty[indeksPliku + 1] : 'dane/podglady.json');
  const zrodla = argumenty.filter((a, i) => !a.startsWith('--') && i !== indeksPliku + 1);
  assert.ok(zrodla.length, 'podaj przynajmniej jeden plik cząstkowy');

  const katalog = przygotujKatalog();
  const czesci = zrodla.map((sciezka) => JSON.parse(readFileSync(resolve(sciezka), 'utf8')));
  const wynik = scal(czesci, katalog);

  mkdirSync(dirname(plikWyniku), { recursive: true });
  writeFileSync(plikWyniku, `${JSON.stringify(wynik, null, 1)}\n`);

  const ile = Object.keys(wynik.utwory).length;
  const tekst = [
    '',
    `## Podglądy: ${ile}/${katalog.length} utworów`,
    '',
    `Scalono ${zrodla.length} ${zrodla.length === 1 ? 'część' : 'części'}.`,
    wynik.braki.length ? `Bez nagrania: **${wynik.braki.length}**.` : 'Każdy utwór ma nagranie.',
    ...(wynik.braki.length ? ['', '### Bez nagrania', '', ...wynik.braki.map((b) => `- ${b}`)] : []),
    '',
  ].join('\n');
  console.log(tekst);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
  }
}
