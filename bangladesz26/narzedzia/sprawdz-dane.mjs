#!/usr/bin/env node
/* Kontrola katalogu miast — puszczana lokalnie i w GitHub Actions:
     node narzedzia/sprawdz-dane.mjs
   Sprawdza to, co łatwo zepsuć przy dopisywaniu miast ręcznie. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const katalog = dirname(fileURLToPath(import.meta.url));
const kontekst = { module: { exports: {} } };
vm.createContext(kontekst);
vm.runInContext(readFileSync(join(katalog, '..', 'dane.js'), 'utf8'), kontekst);

// dane.js kończy się eksportem dla Node — stąd bierzemy tablice
// (deklaracje const zostają w zasięgu skryptu, nie w kontekście).
const { MIASTA, KONTYNENTY } = kontekst.module.exports;
const bledy = [];
const znane = new Set(KONTYNENTY.map((k) => k.id));
const nazwy = new Set();

const PROG_LUDNOSCI = 100;   // tysiące — dolna granica „miasta, w którym coś jest"

for (const [i, wiersz] of MIASTA.entries()) {
  const gdzie = `wiersz ${i + 1} (${wiersz[0] ?? '?'})`;
  if (wiersz.length !== 6) bledy.push(`${gdzie}: oczekiwano 6 kolumn, jest ${wiersz.length}`);

  const [nazwa, kraj, flaga, kontynent, ludnosc, opis] = wiersz;
  if (!nazwa || typeof nazwa !== 'string') bledy.push(`${gdzie}: pusta nazwa`);
  if (!kraj) bledy.push(`${gdzie}: brak kraju`);
  if (!flaga || [...flaga].length > 8) bledy.push(`${gdzie}: flaga wygląda podejrzanie`);
  if (!znane.has(kontynent)) bledy.push(`${gdzie}: nieznany kontynent „${kontynent}"`);
  if (!Number.isFinite(ludnosc) || ludnosc < PROG_LUDNOSCI) {
    bledy.push(`${gdzie}: ludność ${ludnosc} tys. poniżej progu ${PROG_LUDNOSCI} tys.`);
  }
  if (!opis || opis.length < 15) bledy.push(`${gdzie}: opis za krótki, żeby coś mówił`);
  if (opis && opis.length > 90) bledy.push(`${gdzie}: opis dłuższy niż 90 znaków — nie zmieści się na karcie`);
  // Kropka po literze to zdanie, kropka po cyfrze to skrót („lata 50.") — ta druga zostaje.
  if (opis && /[!?]$|\p{L}\.$/u.test(opis)) bledy.push(`${gdzie}: opis kończy się kropką — na karcie ich nie stawiamy`);
  if (nazwy.has(nazwa)) bledy.push(`${gdzie}: duplikat nazwy`);
  nazwy.add(nazwa);
}

// Każda litera alfabetu musi mieć co najmniej jedno miasto — inaczej przycisk
// w siatce byłby martwy.
const litera = (n) => n.replace(/^Ł/, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '')[0].toUpperCase();
const pokrycie = new Map();
for (const m of MIASTA) pokrycie.set(litera(m[0]), (pokrycie.get(litera(m[0])) ?? 0) + 1);
const puste = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((l) => !pokrycie.has(l));
if (puste.length) bledy.push(`litery bez ani jednego miasta: ${puste.join(', ')}`);

for (const k of KONTYNENTY) {
  const ile = MIASTA.filter((m) => m[3] === k.id).length;
  if (ile < 10) bledy.push(`kontynent ${k.nazwa}: tylko ${ile} miast — za mało na losowanie`);
}

if (bledy.length) {
  console.error(`✗ ${bledy.length} problemów w katalogu miast:\n` + bledy.map((b) => `  • ${b}`).join('\n'));
  process.exit(1);
}

const perKontynent = KONTYNENTY.map((k) => `${k.nazwa}: ${MIASTA.filter((m) => m[3] === k.id).length}`).join(' · ');
console.log(`✓ ${MIASTA.length} miast, wszystkie 26 liter obsadzone`);
console.log(`  ${perKontynent}`);
