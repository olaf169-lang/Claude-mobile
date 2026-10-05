#!/usr/bin/env node
/* ==========================================================================
   Audyt dosypki katalogu: co właściwie weszło i czy to się nadaje do gry.
   --------------------------------------------------------------------------
       node narzedzia/audyt-dosypki.mjs            # względem HEAD~1
       node narzedzia/audyt-dosypki.mjs HEAD~3

   Po co, skoro są testy: testy pilnują tego, co da się sprawdzić maszynowo,
   dubli, zakresów lat, kategorii z listy. Nie powiedzą, czy utwór nadaje się
   do gry, w której trzeba go ROZPOZNAĆ, ani czy rok ze sklepu to rok premiery,
   czy rok wznowienia. To się przegląda oczami, a ten skrypt układa dane tak,
   żeby dało się to zrobić w minutę zamiast czytać dwa tysiące linijek.

   Pierwszy przebieg w CI zebrał 345 utworów z poprawnymi latami i prawie
   wszystkie były nieznanymi kawałkami z płyt, testy były zielone. Drugi
   dołożył kolędy i wznowienia w złych dekadach, też przy zielonych testach.
   Oba razy wyłapał to dopiero ten audyt.

   Na co patrzeć w wyniku:
     - PRÓBKA: czy te utwory w ogóle da się rozpoznać ze słuchu;
     - rozstrzał lat wykonawcy: duży oznacza wznowienie w złej dekadzie;
     - podejrzane tytuły i dopiski: resztki po danych ze sklepu.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { UTWORY } from '../dane/utwory.js';
import { idUtworu, dekada, zdradzaFilm, daSieSpytacOFilm } from '../js/katalog.js';

const PLIK_KATALOGU = 'jaka-to-melodia/dane/utwory.js';
// Kolędy i święta: w tej grze nie do użytku, bo każdy je zna i każdy je nagrał.
const SWIATECZNE = /\b(?:christmas|xmas|santa|noel|jingle bells?|silent night|cicha noc|kol[ęe]d|miko[łl]aj)\b/i;
const DOPISKI = /\b(?:remaster|version|edit|\bmix\b|live|mono|stereo|deluxe|bonus|from ["„])/i;
const ROZSTRZAL_LAT = 28;

async function katalogZGita(wskazanie) {
  const tekst = execFileSync('git', ['show', `${wskazanie}:${PLIK_KATALOGU}`],
    { encoding: 'utf8', maxBuffer: 64e6 });
  const plik = join(mkdtempSync(join(tmpdir(), 'jtm-audyt-')), 'stare.mjs');
  writeFileSync(plik, tekst);
  return (await import(plik)).UTWORY;
}

const policz = (lista, klucz) => {
  const ile = new Map();
  for (const u of lista) ile.set(klucz(u), (ile.get(klucz(u)) || 0) + 1);
  return [...ile].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
};

export function porownaj(stare, nowe) {
  const byly = new Set(stare.map(idUtworu));
  const dodane = nowe.filter((u) => !byly.has(idUtworu(u)));

  const naWykonawce = new Map();
  for (const u of dodane) naWykonawce.set(u.wykonawca, (naWykonawce.get(u.wykonawca) || 0) + 1);

  // Rozstrzał liczymy na CAŁYM katalogu, nie tylko na dosypce: wznowienie
  // widać dopiero obok oryginału, który mógł leżeć tam od dawna.
  const lata = new Map();
  for (const u of nowe) {
    if (!lata.has(u.wykonawca)) lata.set(u.wykonawca, []);
    lata.get(u.wykonawca).push(u.rok);
  }
  const rozstrzelone = [...lata]
    .filter(([, l]) => l.length >= 2 && Math.max(...l) - Math.min(...l) > ROZSTRZAL_LAT)
    .map(([w, l]) => ({ wykonawca: w, od: Math.min(...l), do: Math.max(...l) }))
    .sort((a, b) => (b.do - b.od) - (a.do - a.od));

  const filmowe = dodane.filter((u) => u.gatunek === 'filmowa');
  return {
    bylo: stare.length,
    jest: nowe.length,
    dodane,
    wgKategorii: policz(dodane, (u) => u.gatunek),
    wgDekady: policz(dodane, (u) => dekada(u)),
    wykonawcow: naWykonawce.size,
    najplodniejsi: [...naWykonawce].sort((a, b) => b[1] - a[1]).slice(0, 8),
    rozstrzelone,
    swiateczne: dodane.filter((u) => SWIATECZNE.test(u.tytul)),
    zDopiskiem: dodane.filter((u) => DOPISKI.test(u.tytul)),
    filmoweBezFilmu: filmowe.filter((u) => !u.film),
    filmoweZdradzajaOba: filmowe.filter((u) => u.film && !daSieSpytacOFilm(u)),
    filmoweZdradzaTytul: filmowe.filter((u) => u.film && zdradzaFilm(u.tytul, u.film)),
    filmowe,
  };
}

export function raportAudytu(w, { ileProbki = 30 } = {}) {
  const opis = (u) => `${u.rok} [${u.gatunek}${u.film ? ` / ${u.film}` : ''}] ${u.wykonawca} · ${u.tytul}`;
  const wiersze = [
    `Katalog: ${w.bylo} → ${w.jest} (nowych ${w.dodane.length})`,
    '',
    `Kategorie: ${w.wgKategorii.map(([k, n]) => `${k} ${n}`).join(', ')}`,
    `Dekady:    ${w.wgDekady.map(([k, n]) => `${k} ${n}`).join(', ')}`,
    `Wykonawców: ${w.wykonawcow}, najwięcej utworów: ${w.najplodniejsi.map(([a, n]) => `${a} ${n}`).join(', ')}`,
    '',
    `Muzyka filmowa: ${w.filmowe.length} nowych | bez filmu: ${w.filmoweBezFilmu.length}`
    + ` | zdradza oba pola: ${w.filmoweZdradzajaOba.length} | zdradza tytuł: ${w.filmoweZdradzaTytul.length}`,
  ];
  const sekcja = (naglowek, lista, formatuj = opis) => {
    if (!lista.length) return;
    wiersze.push('', `${naglowek} (${lista.length}):`);
    for (const x of lista.slice(0, 20)) wiersze.push(`  ${formatuj(x)}`);
  };
  sekcja('⚠ Rozstrzał lat wykonawcy, możliwe wznowienie w złej dekadzie', w.rozstrzelone,
    (r) => `${r.wykonawca}: ${r.od}-${r.do}`);
  sekcja('⚠ Świąteczne', w.swiateczne);
  sekcja('⚠ Tytuł z podejrzanym dopiskiem', w.zDopiskiem);
  sekcja('⚠ Filmowa bez filmu', w.filmoweBezFilmu);
  sekcja('⚠ Filmowa, w której film zdradzają oba pola', w.filmoweZdradzajaOba);

  if (w.dodane.length) {
    wiersze.push('', `PRÓBKA, czy te utwory da się rozpoznać ze słuchu?`, '');
    const krok = Math.max(1, Math.floor(w.dodane.length / ileProbki));
    for (let i = 0; i < w.dodane.length && i / krok < ileProbki; i += krok) {
      wiersze.push(`  ${opis(w.dodane[i])}`);
    }
  }
  return `${wiersze.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const wskazanie = process.argv[2] || 'HEAD~1';
  const wynik = porownaj(await katalogZGita(wskazanie), UTWORY);
  console.log(raportAudytu(wynik));
}
