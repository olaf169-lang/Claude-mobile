/* ==========================================================================
   🏸ELO🏸, czyli forma.

   Tabela mówi, kto wygrał więcej meczów. ELO mówi co innego: jak mocno grasz
   względem tego, z kim akurat trafiłeś. Nie liczy się do tytułu i NIE daje
   nikomu żadnych ułatwień.

   Zasady, celowo krótkie:
   • każdy startuje z 1000,
   • siła pary = średnia ratingów obu graczy,
   • liczy się TYLKO to, kto wygrał. Punkty zdobyte w setach nie mają
     tu żadnego znaczenia,
   • urwany set robi jednak różnicę: wygrana 2:0 waży więcej niż 2:1,
     a przegrana 1:2 boli mniej niż 0:2,
   • singiel i debel mają OSOBNE ratingi, bo to dwie różne gry,
   • mecze z osobami spoza czwórki są pomijane: ktoś bez ratingu nie pozwala
     uczciwie wycenić zwycięstwa.
   ========================================================================== */

import { GRACZE } from './dane.js';
import { mecze, wynikMeczu, meczKompletny, trybMeczu } from './liczenie.js';

export const START = 1000;
export const K = 24;

/** Ile „wart” jest wynik z punktu widzenia ELO. Sama wygrana to podstawa,
    a urwany przeciwnikowi set przesuwa wskazówkę o 0,15 w jego stronę. */
export function wartoscWyniku(setyMoje, setyIch) {
  if (setyMoje === setyIch) return 0.5;
  const urwal = Math.min(setyMoje, setyIch) > 0;
  return setyMoje > setyIch ? (urwal ? 0.85 : 1) : (urwal ? 0.15 : 0);
}

export function oczekiwanie(mojRating, ichRating) {
  return 1 / (1 + 10 ** ((ichRating - mojRating) / 400));
}

function srednia(ids, rating) {
  return ids.reduce((s, id) => s + (rating[id] ?? START), 0) / ids.length;
}

/** Przelicza cały sezon od zera dla jednego trybu ('debel' albo 'singiel').
    Zwraca { rating, historia, zmiany, seria }, gdzie `seria` to aktualna liczba
    wygranych meczów z rzędu, ta od 🔥 przy nazwisku. */
export function przelicz(wieczory, tryb = 'debel') {
  const rating = {};
  const seria = {};
  const historia = {};
  GRACZE.forEach((g) => {
    rating[g.id] = START;
    seria[g.id] = 0;
    historia[g.id] = [{ data: null, rating: START }];
  });
  let zmiany = {};

  const posortowane = [...wieczory]
    .filter((w) => !w.towarzyski)
    .sort((x, y) => x.data.localeCompare(y.data));

  for (const w of posortowane) {
    const przed = { ...rating };
    for (const mecz of mecze(w)) {
      if (trybMeczu(mecz) !== tryb) continue;
      const r = wynikMeczu(mecz);
      if (!meczKompletny(mecz, w)) continue;   // tylko mecze dograne do końca
      // Mecz z kimkolwiek spoza czwórki nie rusza ratingu, patrz nagłówek.
      if (![...mecz.a, ...mecz.b].every((id) => id in rating)) continue;

      const ea = oczekiwanie(srednia(mecz.a, rating), srednia(mecz.b, rating));
      const ruch = K * (wartoscWyniku(r.setyA, r.setyB) - ea);
      for (const id of mecz.a) rating[id] += ruch;
      for (const id of mecz.b) rating[id] -= ruch;

      for (const [strona, ids] of [['a', mecz.a], ['b', mecz.b]]) {
        for (const id of ids) {
          if (r.werdykt === strona) seria[id] += 1;
          else if (r.werdykt !== 'remis') seria[id] = 0;
        }
      }
    }
    const ruszylo = GRACZE.some((g) => rating[g.id] !== przed[g.id]);
    if (!ruszylo) continue;
    for (const g of GRACZE) {
      if (rating[g.id] !== przed[g.id]) historia[g.id].push({ data: w.data, rating: rating[g.id] });
    }
    zmiany = Object.fromEntries(GRACZE.map((g) => [g.id, rating[g.id] - przed[g.id]]));
  }

  return { rating, historia, zmiany, seria };
}

/* --------------------------------------------------------- poziom formy */

/* Żartobliwa etykieta przy ratingu: im wyższe ELO, tym wyżej w drabince.
   Na starcie wszyscy stoją na 1000, czyli „Drewno”: każdy jest drewnem,
   dopóki nie udowodni inaczej. Progi liczone względem 1000. */
export const POZIOMY_FORMY = [
  { prog: 1075, emoji: '👑', nazwa: 'Legenda' },
  { prog: 1035, emoji: '🤖', nazwa: 'Maszyna' },
  { prog: 1005, emoji: '🔥', nazwa: 'Rozgrzany' },
  { prog: 965,  emoji: '🪵', nazwa: 'Drewno' },
  { prog: -Infinity, emoji: '🫠', nazwa: 'Pierdoła' },
];

export function poziomFormy(rating) {
  return POZIOMY_FORMY.find((p) => rating >= p.prog);
}

/** Znaczek serii przy nazwisku: ×3 🔥. Poniżej dwóch wygranych z rzędu
    nic nie pokazujemy, bo jedna wygrana to jeszcze nie passa. */
export function znaczekSerii(ile) {
  if (!ile || ile < 2) return '';
  const ogien = ile >= 5 ? '🔥🔥' : '🔥';
  return `×${ile} ${ogien}`;
}

/** Lista do wyświetlenia: posortowana, z zaokrągleniem, trendem i serią. */
export function ranking(wieczory, tryb = 'debel') {
  const { rating, historia, zmiany, seria } = przelicz(wieczory, tryb);
  return GRACZE
    .map((g) => ({
      id: g.id,
      rating: Math.round(rating[g.id]),
      dokladny: rating[g.id],
      zmiana: Math.round(zmiany[g.id] ?? 0),
      seria: seria[g.id] ?? 0,
      historia: historia[g.id],
    }))
    .sort((a, b) => b.dokladny - a.dokladny)
    .map((r, i) => ({ ...r, miejsce: i + 1 }));
}

/** Szanse obu stron w danym zestawieniu: czysta informacja, zero ułatwień. */
export function szanse(paraA, paraB, rating) {
  const a = oczekiwanie(srednia(paraA, rating), srednia(paraB, rating));
  return { a, b: 1 - a, wyrownany: Math.abs(a - 0.5) < 0.06 };
}
