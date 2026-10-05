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
import { scal } from './scal-podglady.mjs';
import {
  wyczyscTytul, najwczesniejszeWydania, bezWznowien, toSciezkaZFilmu, utworyZeSciezki,
} from './zbierz-kandydatow.mjs';
import { przesiej } from './wpisz-kandydatow.mjs';

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
// odstepMs: 0 wyłącza bramkę tempa — w teście nie ma po co czekać.
const opcje = { katalog: mikroKatalog, plikWejscia: plik, plikWyniku: plik, odstepMs: 0, log: () => {} };

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

// Podział katalogu na części — tak workflow omija limit zapytań iTunes.
const pierwszaPolowa = await uzupelnijPodglady({
  ...opcje, odswiez: true, od: 0, do: 1, plikWyniku: `${plik}.a`,
});
const drugaPolowa = await uzupelnijPodglady({
  ...opcje, odswiez: true, od: 1, do: 2, plikWyniku: `${plik}.b`,
});
assert.deepEqual(Object.keys(pierwszaPolowa.wynik.utwory), ['queen--radio-ga-ga']);
assert.deepEqual(Object.keys(drugaPolowa.wynik.utwory), []);
assert.deepEqual(drugaPolowa.braki, ['Zespół Bez Nagrań — Piosenka Widmo']);
console.log('✓ każda część bierze tylko swój wycinek katalogu');

const scalone = scal([pierwszaPolowa.wynik, drugaPolowa.wynik], mikroKatalog);
assert.equal(scalone.utwory['queen--radio-ga-ga'].podglad, 'dobre');
assert.deepEqual(scalone.braki, ['Zespół Bez Nagrań — Piosenka Widmo']);
console.log('✓ scalanie składa części z powrotem w komplet');

// Utwór znaleziony przez jedną część nie może zostać brakiem przez drugą.
const zeSprzecznoscia = scal([
  { utwory: { 'queen--radio-ga-ga': { podglad: 'dobre' } }, braki: [] },
  { utwory: {}, braki: ['Queen — Radio Ga Ga'] },
], mikroKatalog);
assert.deepEqual(zeSprzecznoscia.braki, [], 'znaleziony utwór został zgłoszony jako brak');
console.log('✓ znaleziony w jednej części nie trafia na listę braków');

/* --- zbieranie nowych utworów ze sklepu --- */

for (const [surowy, oczekiwany] of [
  ['Bohemian Rhapsody (Remastered 2011)', 'Bohemian Rhapsody'],
  ['Billie Jean - Single Version', 'Billie Jean'],
  ['Sugar (feat. Francesco Yates)', 'Sugar'],
  // Nawias bywa częścią prawdziwego tytułu — tego nie wolno uciąć.
  ["(I Can't Get No) Satisfaction", "(I Can't Get No) Satisfaction"],
  // „Live” w dopisku to koncertówka, ale w samym tytule nic nie znaczy.
  ['Hotel California - Live', null],
  ['Live and Let Die', 'Live and Let Die'],
  ['Layla (Acoustic)', null],
  ['Imagine (Karaoke Version)', null],
  ['Smells Like Teen Spirit (Remix)', null],
]) {
  assert.equal(wyczyscTytul(surowy), oczekiwany, `wyczyscTytul("${surowy}")`);
}
console.log('✓ tytuł ze sklepu obiera się z dopisków, a koncertówki odpadają');

// Ta sama piosenka leży w sklepie w kilku wydaniach, każde z własną datą.
// Do katalogu ma wejść raz, z rokiem premiery — inaczej „Gee Whiz” z 1961
// trafiłoby do lat 2000. jako utwór ze składanki.
const zeSklepu = [
  { tytul: 'Gee Whiz (Look at His Eyes)', wykonawca: 'Carla Thomas', album: 'Gee Whiz', podglad: 'p', data: '1961-01-05', dlugoscMs: 155_000 },
  { tytul: 'Gee Whiz (Look at His Eyes) [Greatest Hits]', wykonawca: 'Carla Thomas', album: 'Hits', podglad: 'p', data: '2001-01-05', dlugoscMs: 155_000 },
  { tytul: 'B-A-B-Y', wykonawca: 'Carla Thomas', album: 'Carla', podglad: 'p', data: '1966-07-01', dlugoscMs: 160_000 },
  { tytul: 'Tramp - Live', wykonawca: 'Carla Thomas', album: 'Koncert', podglad: 'p', data: '1967-01-01', dlugoscMs: 160_000 },
  { tytul: 'Bez Podglądu', wykonawca: 'Carla Thomas', album: 'X', podglad: '', data: '1966-01-01', dlugoscMs: 160_000 },
  { tytul: 'Skit', wykonawca: 'Carla Thomas', album: 'X', podglad: 'p', data: '1966-01-01', dlugoscMs: 20_000 },
  { tytul: 'Coś Innego', wykonawca: 'Kto Inny', album: 'X', podglad: 'p', data: '1966-01-01', dlugoscMs: 160_000 },
];
const wydania = najwczesniejszeWydania(zeSklepu, 'Carla Thomas').sort((a, b) => a.rok - b.rok);
assert.deepEqual(
  wydania.map((w) => `${w.rok} ${w.tytul}`),
  ['1961 Gee Whiz (Look at His Eyes)', '1966 B-A-B-Y'],
  `złe wydania: ${wydania.map((w) => `${w.rok} ${w.tytul}`).join(' | ')}`,
);
console.log('✓ z kilku wydań utworu zostaje jedno, z rokiem premiery');

// Sklep oddaje nagrania od najpopularniejszych i ta kolejność musi przeżyć
// przesiewanie: w tej grze utwór trzeba ROZPOZNAĆ, więc bierzemy z góry listy.
// Gdyby kolejność się gubiła (albo gdyby ktoś posortował wynik po roku), do
// katalogu trafiałyby nagrania sprzed popularności artysty.
const wKolejnosciSklepu = [
  { tytul: 'Wielki Przebój', wykonawca: 'Ktoś', album: 'Hity', podglad: 'p', data: '1975-01-01', dlugoscMs: 200_000 },
  { tytul: 'Mniejszy Przebój', wykonawca: 'Ktoś', album: 'Hity', podglad: 'p', data: '1972-01-01', dlugoscMs: 200_000 },
  { tytul: 'Zupełnie Nieznany Kawałek', wykonawca: 'Ktoś', album: 'Debiut', podglad: 'p', data: '1969-01-01', dlugoscMs: 200_000 },
];
assert.deepEqual(
  najwczesniejszeWydania(wKolejnosciSklepu, 'Ktoś').map((w) => w.tytul),
  ['Wielki Przebój', 'Mniejszy Przebój', 'Zupełnie Nieznany Kawałek'],
  'kolejność ze sklepu (od najpopularniejszych) nie może się zmienić',
);
console.log('✓ kolejność ze sklepu przeżywa przesiewanie — bierzemy przeboje, nie deep cuty');

// Wykonawca z lat 60., któremu jeden kawałek wyszedł z 2015, ma w sklepie
// wznowienie — a nie nagrał nic nowego po pięćdziesięciu latach.
assert.deepEqual(
  bezWznowien([1965, 1966, 1967, 1968, 2015].map((rok) => ({ tytul: String(rok), rok }))).map((w) => w.rok),
  [1965, 1966, 1967, 1968],
);
// Przy dwóch trafieniach nie ma od czego liczyć mediany — niczego nie zgadujemy.
assert.equal(bezWznowien([{ tytul: 'a', rok: 1965 }, { tytul: 'b', rok: 2015 }]).length, 2);
console.log('✓ rok odstający od dorobku wykonawcy jest odsiewany jako wznowienie');

// Najważniejsza bramka: kandydat, który już jest w katalogu, nie wchodzi.
// Bez tego przebudowa katalogu po cichu podmieniłaby istniejący wpis nowym
// (zostaje późniejszy), zmieniając utworowi kategorię.
const istniejacy = { tytul: 'Radio Ga Ga', wykonawca: 'Queen', rok: 1984, gatunek: 'rock' };
const przesiane = przesiej([
  { ...istniejacy, gatunek: 'pop', rok: 1999 },
  { tytul: 'Zupełnie Nowy Utwór', wykonawca: 'Ktoś Nowy', rok: 1985, gatunek: 'rock' },
  { tytul: 'Zły Rok', wykonawca: 'Ktoś', rok: 1900, gatunek: 'rock' },
  { tytul: 'Nieznana Kategoria', wykonawca: 'Ktoś', rok: 1985, gatunek: 'jazz' },
  { tytul: 'Oppenheimer Main Theme', wykonawca: 'Oppenheimer Orchestra', rok: 2023, gatunek: 'filmowa', film: 'Oppenheimer' },
], { katalog: [istniejacy] });
assert.deepEqual(przesiane.przyjete.map((u) => u.tytul), ['Zupełnie Nowy Utwór'],
  `przesiew przepuścił za dużo: ${przesiane.przyjete.map((u) => u.tytul).join(', ')}`);
assert.ok(przesiane.odrzucone.some((o) => o.powod.includes('już jest w katalogu')),
  'dubel nie został rozpoznany jako dubel');
console.log('✓ kandydat będący już w katalogu nie podmienia istniejącego wpisu');

/* --- ścieżki dźwiękowe: kategoria filmowa --- */

// Sama nazwa filmu w tytule albumu nie wystarcza — film „Up” pasowałby wtedy
// do połowy sklepu.
for (const [album, film, oczekiwane] of [
  ['Top Gun (Original Motion Picture Soundtrack)', 'Top Gun', true],
  ['Up (Original Motion Picture Soundtrack)', 'Up', true],
  ['Up All Night', 'Up', false],
  ['Greatest Hits', 'Top Gun', false],
]) {
  assert.equal(toSciezkaZFilmu(album, film), oczekiwane, `toSciezkaZFilmu("${album}", "${film}")`);
}

const zeSciezki = utworyZeSciezki([
  { tytul: 'Top Gun Anthem', wykonawca: 'Harold Faltermeyer', album: 'Top Gun (Original Motion Picture Soundtrack)', podglad: 'p', data: '1986-05-01', dlugoscMs: 200_000 },
  { tytul: 'Danger Zone', wykonawca: 'Kenny Loggins', album: 'Top Gun (Original Motion Picture Soundtrack)', podglad: 'p', data: '1986-05-01', dlugoscMs: 210_000 },
  { tytul: 'Obcy Album', wykonawca: 'X', album: 'Zupełnie Co Innego', podglad: 'p', data: '1986-05-01', dlugoscMs: 200_000 },
  { tytul: 'Nie Z Tego Wydania', wykonawca: 'Y', album: 'Top Gun (Original Motion Picture Soundtrack)', podglad: 'p', data: '2020-01-01', dlugoscMs: 200_000 },
], { nazwa: 'Top Gun', rok: 1986 }, { maksNaFilm: 5 });
assert.deepEqual(zeSciezki.map((u) => u.tytul), ['Danger Zone', 'Top Gun Anthem'],
  `ze ścieżki wyszło co innego: ${zeSciezki.map((u) => u.tytul).join(', ')}`);
// Utwór, którego tytuł zdradza film, ma być NA KOŃCU kolejki: gra pokaże przy
// nim wykonawcę, więc pytanie zostaje dobre, ale lepszych bierzemy pierwsze.
assert.equal(zeSciezki.at(-1).tytul, 'Top Gun Anthem');
assert.ok(zeSciezki.every((u) => u.film === 'Top Gun' && u.rok === 1986 && u.gatunek === 'filmowa'));
console.log('✓ ze ścieżki dźwiękowej wchodzą utwory tego filmu, z rokiem premiery');

console.log('\nNARZĘDZIA OK');
