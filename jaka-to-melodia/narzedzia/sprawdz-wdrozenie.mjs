#!/usr/bin/env node
/* ==========================================================================
   Czy to, co widzę u siebie, jest naprawdę w aplikacji?
   --------------------------------------------------------------------------
       node narzedzia/sprawdz-wdrozenie.mjs

   Po co osobne narzędzie na coś tak prostego: bo „zrobione” ma tu cztery
   ogniwa, a pęknięcie każdego wygląda identycznie, pliki na dysku są zmienione
   i wszystko zdaje się gotowe.

       1. zmiana zacommitowana          (inaczej zostaje tylko na dysku)
       2. commit wypchnięty na gałąź roboczą
       3. gałąź robocza wmergowana w produkcyjną
       4. katalog na produkcyjnej ma tyle samo utworów co lokalnie

   Tak właśnie zgubiła się kiedyś cała rozbudowa katalogu: cykliczny Routine
   raportował SUKCES, bo u siebie faktycznie dopisał utwory, tylko nigdy nie
   doszedł do ogniwa drugiego. Ten skrypt przechodzi łańcuch do końca i kończy
   się błędem na pierwszym pękniętym ogniwie, zamiast zapewniać, że „gotowe”.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { UTWORY } from '../dane/utwory.js';

export const GALAZ_ROBOCZA = 'claude/music-kahoot-game-app-2jgycd';
export const GALAZ_PRODUKCYJNA = 'claude/przeglad-news-app-iqyboa';
const PLIK_KATALOGU = 'jaka-to-melodia/dane/utwory.js';

const git = (...argumenty) =>
  execFileSync('git', argumenty, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** Ile utworów ma katalog w danej wersji pliku, bez importowania go. */
const ileUtworow = (wskazanie) =>
  (git('show', `${wskazanie}:${PLIK_KATALOGU}`).match(/^\s*\{ tytul:/gm) || []).length;

export function sprawdzLancuch({
  galazRobocza = GALAZ_ROBOCZA,
  galazProdukcyjna = GALAZ_PRODUKCYJNA,
  lokalnieUtworow = UTWORY.length,
} = {}) {
  const ogniwa = [];
  const dodaj = (nazwa, ok, szczegol) => { ogniwa.push({ nazwa, ok, szczegol }); return ok; };

  /* 1. Czy katalog nie wisi niezacommitowany. */
  const brudne = git('status', '--porcelain', '--', PLIK_KATALOGU);
  if (!dodaj(
    'katalog zacommitowany',
    !brudne,
    brudne ? `niezacommitowane zmiany w ${PLIK_KATALOGU}` : `${lokalnieUtworow} utworów`,
  )) return ogniwa;

  /* 2. Czy commit jest na zdalnej gałęzi roboczej. */
  git('fetch', 'origin', galazRobocza);
  const lokalny = git('rev-parse', 'HEAD');
  const zdalnyRoboczy = git('rev-parse', `origin/${galazRobocza}`);
  const przed = git('rev-list', '--count', `origin/${galazRobocza}..HEAD`);
  if (!dodaj(
    `wypchnięte na ${galazRobocza}`,
    Number(przed) === 0,
    Number(przed) === 0
      ? `HEAD ${lokalny.slice(0, 8)} jest na zdalnej gałęzi`
      : `${przed} ${przed === '1' ? 'commit' : 'commitów'} tylko lokalnie. Zrób git push`,
  )) return ogniwa;

  /* 3. Czy gałąź robocza jest wmergowana w produkcyjną. */
  git('fetch', 'origin', galazProdukcyjna);
  const nieWmergowane = git('rev-list', '--count', `origin/${galazProdukcyjna}..origin/${galazRobocza}`);
  if (!dodaj(
    `wmergowane w ${galazProdukcyjna}`,
    Number(nieWmergowane) === 0,
    Number(nieWmergowane) === 0
      ? 'gałąź produkcyjna ma wszystko z roboczej'
      : `${nieWmergowane} ${nieWmergowane === '1' ? 'commit' : 'commitów'} jeszcze nie w produkcji. Zmerguj i wypchnij`,
  )) return ogniwa;

  /* 4. Czy katalog na produkcji jest ten sam. */
  const naProdukcji = ileUtworow(`origin/${galazProdukcyjna}`);
  dodaj(
    'katalog na produkcji zgodny',
    naProdukcji === lokalnieUtworow,
    naProdukcji === lokalnieUtworow
      ? `${naProdukcji} utworów, tyle samo co lokalnie`
      : `na produkcji ${naProdukcji}, lokalnie ${lokalnieUtworow}`,
  );
  // Nieużywane wprost, ale trzymamy w raporcie, przy rozjechanym stanie to
  // pierwsza rzecz, na którą człowiek patrzy.
  ogniwa.push({ nazwa: 'commit produkcyjny', ok: true, szczegol: zdalnyRoboczy.slice(0, 8) });
  return ogniwa;
}

export const raportLancucha = (ogniwa) => ogniwa
  .map((o) => `  ${o.ok ? '✓' : '✗'} ${o.nazwa}: ${o.szczegol}`)
  .join('\n');

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const ogniwa = sprawdzLancuch();
  console.log(`Droga zmiany do aplikacji (${UTWORY.length} utworów lokalnie):\n`);
  console.log(raportLancucha(ogniwa));
  const pekniete = ogniwa.filter((o) => !o.ok);
  if (pekniete.length) {
    console.error(`\nZmiana NIE jest jeszcze w aplikacji: ${pekniete[0].nazwa}.`);
    process.exit(1);
  }
  console.log('\nWszystko na miejscu, zmiana jest w aplikacji.');
}
