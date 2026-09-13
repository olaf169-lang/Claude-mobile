/* ==========================================================================
   🏸ELO🏸 — ranking mocy.

   Tabela sezonu (saldo) mówi, kto ma najlepszy bilans. ELO mówi co innego:
   jak mocno grasz względem tego, z kim akurat trafiłeś. Nie liczy się do
   tytułu i NIE daje nikomu żadnych ułatwień — służy wyłącznie do pokazania
   FORMY: kto jest w gazie i jak wyrównane jest dane zestawienie par.

   Zasady, celowo krótkie, żeby dało się je wytłumaczyć jednym zdaniem:
   • każdy startuje z 1000,
   • siła pary = średnia ratingów obu graczy,
   • o wygranej decyduje ten sam werdykt co w tabeli (sety, potem saldo),
   • wyższa wygrana rusza ELO mocniej, ale najwyżej o połowę,
   • mecze z Gościem są pomijane — ktoś spoza czwórki nie ma ratingu, więc
     nie da się uczciwie policzyć, ile taka wygrana jest warta.
   ========================================================================== */

import { GRACZE } from './dane.js';
import { mecze, wynikMeczu } from './liczenie.js';

export const START = 1000;
export const K = 20;
export const K_MAX_BONUS = 0.5;   // +50% przy pogromie
export const SALDO_PELNEGO_BONUSU = 20;

export function oczekiwanie(mojRating, ichRating) {
  return 1 / (1 + 10 ** ((ichRating - mojRating) / 400));
}

function srednia(ids, rating) {
  return ids.reduce((s, id) => s + (rating[id] ?? START), 0) / ids.length;
}

/** Przelicza cały sezon od zera. Zwraca { rating, historia, zmiany }.
    historia: id → [{ data, rating }] do wykresu; zmiany: ostatni wieczór. */
export function przelicz(wieczory) {
  const rating = {};
  GRACZE.forEach((g) => { rating[g.id] = START; });
  const historia = {};
  GRACZE.forEach((g) => { historia[g.id] = [{ data: null, rating: START }]; });
  let zmiany = {};

  const posortowane = [...wieczory]
    .filter((w) => !w.towarzyski)
    .sort((x, y) => x.data.localeCompare(y.data));

  for (const w of posortowane) {
    const przed = { ...rating };
    for (const mecz of mecze(w)) {
      const r = wynikMeczu(mecz);
      if (!r.rozegrany) continue;
      // Mecz z kimkolwiek spoza czwórki nie rusza ratingu — patrz nagłówek.
      if (![...mecz.a, ...mecz.b].every((id) => id in rating)) continue;
      const ra = srednia(mecz.a, rating);
      const rb = srednia(mecz.b, rating);
      const ea = oczekiwanie(ra, rb);
      const wynikA = r.werdykt === 'a' ? 1 : r.werdykt === 'b' ? 0 : 0.5;
      const bonus = 1 + K_MAX_BONUS * Math.min(Math.abs(r.saldo), SALDO_PELNEGO_BONUSU) / SALDO_PELNEGO_BONUSU;
      const ruch = K * bonus * (wynikA - ea);
      for (const id of mecz.a) if (id in rating) rating[id] += ruch;
      for (const id of mecz.b) if (id in rating) rating[id] -= ruch;
    }
    const ruszylo = GRACZE.some((g) => rating[g.id] !== przed[g.id]);
    if (!ruszylo) continue;   // np. cały wieczór rozegrany z Gościem
    for (const g of GRACZE) {
      if (rating[g.id] !== przed[g.id]) historia[g.id].push({ data: w.data, rating: rating[g.id] });
    }
    zmiany = Object.fromEntries(GRACZE.map((g) => [g.id, rating[g.id] - przed[g.id]]));
  }

  return { rating, historia, zmiany };
}

/** Lista do wyświetlenia: posortowana, z zaokrągleniem i trendem. */
export function ranking(wieczory) {
  const { rating, historia, zmiany } = przelicz(wieczory);
  return GRACZE
    .map((g) => ({
      id: g.id,
      rating: Math.round(rating[g.id]),
      dokladny: rating[g.id],
      zmiana: Math.round(zmiany[g.id] ?? 0),
      historia: historia[g.id],
    }))
    .sort((a, b) => b.dokladny - a.dokladny)
    .map((r, i) => ({ ...r, miejsce: i + 1 }));
}

/** Szanse obu par w danym zestawieniu — czysta informacja, zero ułatwień.
    Nie proponujemy żadnych wyrównań ani punktów na start: wynik wpisuje się taki, jaki
    wyszedł na tablicy. To ma tylko pokazać, czy mecz zapowiada się wyrównany. */
export function szanse(paraA, paraB, rating) {
  const ra = srednia(paraA, rating);
  const rb = srednia(paraB, rating);
  const a = oczekiwanie(ra, rb);
  return { a, b: 1 - a, wyrownany: Math.abs(a - 0.5) < 0.06 };
}
