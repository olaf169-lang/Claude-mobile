#!/usr/bin/env node
/* Test resolvera podglądów na podstawionym sklepie — bez ruszania sieci.
   Sprawdza to, co najłatwiej zepsuć: wybór właściwego nagrania spośród
   karaoke i wznowień, pomijanie już pobranych i raport braków. */

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

import { przygotujKatalog } from '../js/katalog.js';
import { uzupelnijPodglady } from './pobierz-podglady.mjs';

const plik = join(mkdtempSync(join(tmpdir(), 'jtm-')), 'podglady.json');

const sklep = {
  'Queen Radio Ga Ga': [
    { trackName: 'Radio Ga Ga (Karaoke Version)', artistName: 'Queen', previewUrl: 'zle-karaoke', releaseDate: '2015-01-01' },
    { trackName: 'Radio Ga Ga (Live at Wembley Stadium)', artistName: 'Queen', previewUrl: 'zle-koncert', releaseDate: '1992-01-01', trackTimeMillis: 400000 },
    { trackName: 'Radio Ga Ga', artistName: 'Queen', previewUrl: 'dobre', artworkUrl100: 'https://x/100x100bb.jpg', releaseDate: '1984-02-23', trackTimeMillis: 349000, trackId: 1 },
  ],
};

let zapytania = 0;
globalThis.fetch = async (adres) => {
  zapytania += 1;
  const url = new URL(adres);
  const fraza = url.searchParams.get('term') || url.searchParams.get('q');
  const trafienia = sklep[fraza] || [];
  return url.hostname.includes('itunes')
    ? { ok: true, status: 200, json: async () => ({ results: trafienia }) }
    : { ok: true, status: 200, json: async () => ({ data: [] }) };
};

const mikroKatalog = przygotujKatalog([
  { tytul: 'Radio Ga Ga', wykonawca: 'Queen', rok: 1984, gatunek: 'rock' },
  { tytul: 'Piosenka Widmo', wykonawca: 'Zespół Bez Nagrań', rok: 1999, gatunek: 'pop' },
]);
const opcje = { katalog: mikroKatalog, plikWyniku: plik, przerwaMs: 0, log: () => {} };

const pierwszy = await uzupelnijPodglady(opcje);
const queen = pierwszy.wynik.utwory['queen--radio-ga-ga'];
assert.ok(queen, 'nie znalazł Radio Ga Ga');
assert.equal(queen.podglad, 'dobre', `wybrał złe nagranie: ${queen.podglad}`);
assert.equal(queen.okladka, 'https://x/500x500bb.jpg', 'nie podmienił rozmiaru okładki');
console.log('✓ resolver wybiera oryginał, nie karaoke ani koncertówkę');

assert.deepEqual(pierwszy.braki, ['Zespół Bez Nagrań — Piosenka Widmo']);
console.log('✓ nieznalezione utwory trafiają na listę braków');

const przed = zapytania;
const drugi = await uzupelnijPodglady(opcje);
assert.equal(drugi.zPodgladem, 1, 'zgubił wcześniejszy wynik');
// Queen ma już nagranie, więc zostaje tylko utwór widmo: PL + US + Deezer.
assert.ok(zapytania - przed <= 3, `pytał ponownie o gotowe utwory (${zapytania - przed} zapytań)`);
console.log('✓ drugi przebieg pomija utwory, które już mają nagranie');

// Utwór wyrzucony z katalogu nie ma zostawać w pliku na zawsze.
const trzeci = await uzupelnijPodglady({ ...opcje, katalog: mikroKatalog.slice(1) });
assert.equal(trzeci.wynik.utwory['queen--radio-ga-ga'], undefined, 'nie sprzątnął po usuniętym utworze');
console.log('✓ wpisy po usuniętych utworach znikają');

console.log('\nNARZĘDZIA OK');
