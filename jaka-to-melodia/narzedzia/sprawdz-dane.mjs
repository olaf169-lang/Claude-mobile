#!/usr/bin/env node
/* Kontrola katalogu utworów. Wywoływana ręcznie po dopisaniu piosenek
   i przy każdym pushu przez workflow „Jaka to Melodia”.

       node narzedzia/sprawdz-dane.mjs

   Wyłapuje to, co da się sprawdzić bez internetu: duble, puste pola, dziwne
   lata, kategorie spoza listy i zbyt chude zestawy dekada × gatunek. Czy
   piosenka w ogóle istnieje, powie dopiero pobieranie podglądów. */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { przygotujKatalog, KATEGORIE, DEKADY, istnieje } from '../js/katalog.js';

const KATALOG_APLIKACJI = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROK_MIN = 1958;
const ROK_MAX = new Date().getFullYear() + 1;
const NAJMNIEJ_W_KOSZYKU = 8;      // poniżej tego pytania zaczynają się powtarzać

const utwory = przygotujKatalog();
const dozwoloneKategorie = new Set(KATEGORIE.map((k) => k.id));
const dozwoloneDekady = new Set(DEKADY.map((d) => d.id));

const bledy = [];
const uwagi = [];

/* --- pojedyncze wpisy --- */

const widzianeId = new Map();
for (const utwor of utwory) {
  const gdzie = `${utwor.wykonawca} — ${utwor.tytul}`;
  if (!utwor.tytul?.trim()) bledy.push(`Pusty tytuł przy „${utwor.wykonawca}”`);
  if (!utwor.wykonawca?.trim()) bledy.push(`Pusty wykonawca przy „${utwor.tytul}”`);
  if (!dozwoloneKategorie.has(utwor.gatunek)) bledy.push(`${gdzie}: nieznana kategoria „${utwor.gatunek}”`);
  if (!Number.isInteger(utwor.rok) || utwor.rok < ROK_MIN || utwor.rok > ROK_MAX) {
    bledy.push(`${gdzie}: rok poza zakresem (${utwor.rok})`);
  }
  if (!dozwoloneDekady.has(utwor.dekada)) bledy.push(`${gdzie}: dekada ${utwor.dekada} nie ma swojego filtra`);
  if (utwor.gatunek === 'polskie' && !utwor.styl) uwagi.push(`${gdzie}: brak pola „styl” — błędne odpowiedzi dobiorą się gorzej`);
  if (utwor.gatunek !== 'polskie' && utwor.styl && utwor.styl !== utwor.gatunek) {
    uwagi.push(`${gdzie}: „styl” ma sens tylko przy polskich`);
  }
  if (/\((remaster|remastered|live|radio edit)/i.test(utwor.tytul)) {
    uwagi.push(`${gdzie}: dopisek w tytule utrudni znalezienie nagrania`);
  }
  if (utwor.gatunek === 'filmowa' && !utwor.film) {
    uwagi.push(`${gdzie}: brak pola „film” — nie wejdzie do puli pytań o film`);
  }
  // Poza 'filmowa' (gdzie napędza mechanikę zgadywania filmu) pole „film” ma
  // sens jako sam znacznik na odsłonie — używa go dziś tylko 'furious'
  // (np. z jakiej części Szybkich i wściekłych jest kawałek).
  if (utwor.gatunek !== 'filmowa' && utwor.gatunek !== 'furious' && utwor.film) {
    uwagi.push(`${gdzie}: „film” ma sens tylko przy muzyce filmowej albo Szybkich i wściekłych`);
  }

  if (widzianeId.has(utwor.id)) bledy.push(`Dwa razy to samo: ${gdzie}`);
  else widzianeId.set(utwor.id, utwor);
}

/* --- kompletność koszyków --- */

const koszyki = new Map();
for (const utwor of utwory) {
  const klucz = `${utwor.dekada}/${utwor.gatunek}`;
  koszyki.set(klucz, (koszyki.get(klucz) || 0) + 1);
}
for (const dekada of DEKADY) {
  for (const kategoria of KATEGORIE) {
    // Kategorie specjalne (Disney, Fast & Furious, szanty...) to wąski,
    // konkretny temat, nie szeroki gatunek — naturalnie skupiają się w kilku
    // latach zamiast rozkładać się po wszystkich dekadach. Nierówny rozkład
    // to tu poprawny stan, nie brak.
    if (kategoria.specjalna) continue;
    // Kombinacje w NIEISTNIEJACE (np. rap w latach 60.) są wykluczone celowo —
    // filtry gry ich nie pokazują, więc pusty koszyk to tu poprawny stan.
    if (!istnieje(dekada.id, kategoria.id)) continue;
    const ile = koszyki.get(`${dekada.id}/${kategoria.id}`) || 0;
    if (ile === 0) bledy.push(`Pusty zestaw: ${dekada.nazwa} × ${kategoria.nazwa}`);
    else if (ile < NAJMNIEJ_W_KOSZYKU) uwagi.push(`Chudy zestaw: ${dekada.nazwa} × ${kategoria.nazwa} — ${ile}`);
  }
}

/* --- pokrycie nagraniami --- */

let podglady = { utwory: {}, braki: [] };
try {
  podglady = JSON.parse(readFileSync(resolve(KATALOG_APLIKACJI, 'dane/podglady.json'), 'utf8'));
} catch { /* przed pierwszym przebiegiem workflowu pliku nie ma */ }
const zNagraniem = utwory.filter((u) => podglady.utwory?.[u.id]?.podglad).length;

/* --- raport --- */

const wiersze = [];
wiersze.push(`## Katalog: ${utwory.length} utworów`);
wiersze.push('');
wiersze.push(`| dekada | ${KATEGORIE.map((k) => k.nazwa).join(' | ')} | razem |`);
wiersze.push(`|---|${KATEGORIE.map(() => '---:').join('|')}|---:|`);
for (const dekada of DEKADY) {
  const komorki = KATEGORIE.map((k) => koszyki.get(`${dekada.id}/${k.id}`) || 0);
  wiersze.push(`| ${dekada.nazwa} | ${komorki.join(' | ')} | ${komorki.reduce((a, b) => a + b, 0)} |`);
}
wiersze.push('');
wiersze.push(`Nagrania gotowe dla **${zNagraniem}** z ${utwory.length} utworów.`);
if (podglady.braki?.length) {
  wiersze.push(`Bez nagrania po ostatnim pobraniu: ${podglady.braki.length}.`);
}
if (uwagi.length) {
  wiersze.push('', '### Do zerknięcia', '', ...uwagi.map((u) => `- ${u}`));
}
if (bledy.length) {
  wiersze.push('', '### Błędy', '', ...bledy.map((b) => `- ${b}`));
}

const raport = `${wiersze.join('\n')}\n`;
console.log(raport);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, raport);
}
if (bledy.length) {
  console.error(`\n${bledy.length} ${bledy.length === 1 ? 'błąd' : 'błędów'} w katalogu.`);
  process.exit(1);
}
