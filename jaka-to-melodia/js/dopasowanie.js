/* ==========================================================================
   Dopasowanie wpisu z katalogu do nagrania w sklepie muzycznym.
   --------------------------------------------------------------------------
   Wyszukiwarka iTunes na zapytanie „Queen Radio Ga Ga” odda też karaoke,
   składanki coverów i koncertowe wersje z 2011 roku. Tu wybieramy to jedno
   właściwe: zgodny wykonawca, zgodny tytuł, rok blisko oryginału.

   Ten sam kod działa w przeglądarce i w narzedzia/pobierz-podglady.mjs, żeby
   podgląd dobrany w CI był tym samym, co dobrałby telefon.
   ========================================================================== */

import { normalizuj, glownyWykonawca } from './katalog.js';

/** Dopiski, które zdradzają, że to nie jest oryginał. */
const PODEJRZANE = [
  'karaoke', 'tribute', 'made famous', 'in the style of', 'instrumental',
  'cover version', 'covered by', 'lullaby', 'workout', 'ringtone',
  'as made popular', 'originally performed',
];

const zawiera = (tekst, fraza) => ` ${tekst} `.includes(` ${fraza} `);

/**
 * Ocena kandydata. Zwraca null, jeśli nagranie w ogóle nie wchodzi w grę
 * (inny wykonawca, karaoke, brak podglądu).
 */
export function ocenTrafienie(cel, kandydat) {
  if (!kandydat.podglad) return null;

  const tytul = normalizuj(kandydat.tytul);
  const wykonawca = normalizuj(kandydat.wykonawca);
  const celTytul = normalizuj(cel.tytul);
  const celWykonawca = normalizuj(glownyWykonawca(cel.wykonawca));

  const opis = `${tytul} ${normalizuj(kandydat.album || '')}`;
  for (const slowo of PODEJRZANE) {
    // „Live” w tytule oryginału jest w porządku — odrzucamy tylko dopiski,
    // których nie ma we wpisie z katalogu.
    if (zawiera(opis, slowo) && !zawiera(celTytul, slowo)) return null;
  }

  const wykonawcaZgodny =
    wykonawca === celWykonawca ||
    zawiera(wykonawca, celWykonawca) ||
    zawiera(celWykonawca, wykonawca);
  if (!wykonawcaZgodny) return null;

  let punkty = 0;
  if (tytul === celTytul) punkty += 60;
  else if (tytul.startsWith(`${celTytul} `)) punkty += 40;   // „Tytuł (Radio Edit)”
  else if (zawiera(tytul, celTytul)) punkty += 25;
  else return null;

  if (wykonawca === celWykonawca) punkty += 20;

  const rok = Number(String(kandydat.data || '').slice(0, 4));
  if (rok) {
    const roznica = Math.abs(rok - cel.rok);
    // Nagranie z roku wydania singla bije wznowienie sprzed dwóch lat i
    // koncertówkę sprzed dwudziestu.
    if (roznica <= 1) punkty += 25;
    else if (roznica <= 3) punkty += 15;
    else if (roznica <= 10) punkty += 5;
    else punkty -= Math.min(20, roznica / 3);
  }

  // Krótkie edycje i przedłużone remiksy zostawiamy na koniec kolejki.
  const dlugosc = Number(kandydat.dlugoscMs) || 0;
  if (dlugosc && (dlugosc < 90_000 || dlugosc > 600_000)) punkty -= 10;

  return punkty;
}

export function wybierzNajlepszy(cel, kandydaci) {
  let najlepszy = null;
  let najlepszaOcena = -Infinity;
  for (const kandydat of kandydaci) {
    const ocena = ocenTrafienie(cel, kandydat);
    if (ocena === null || ocena <= najlepszaOcena) continue;
    najlepszaOcena = ocena;
    najlepszy = kandydat;
  }
  return najlepszy ? { ...najlepszy, ocena: najlepszaOcena } : null;
}

/* --- ujednolicenie odpowiedzi z obu sklepów do jednego kształtu --- */

export const zITunes = (wpis) => ({
  tytul: wpis.trackName || '',
  wykonawca: wpis.artistName || '',
  album: wpis.collectionName || '',
  podglad: wpis.previewUrl || '',
  okladka: (wpis.artworkUrl100 || '').replace('100x100bb', '500x500bb'),
  data: wpis.releaseDate || '',
  dlugoscMs: wpis.trackTimeMillis || 0,
  zrodloId: String(wpis.trackId || ''),
  zrodlo: 'itunes',
});

export const zDeezera = (wpis) => ({
  tytul: wpis.title || '',
  wykonawca: wpis.artist?.name || '',
  album: wpis.album?.title || '',
  podglad: wpis.preview || '',
  okladka: wpis.album?.cover_big || wpis.album?.cover_medium || '',
  data: '',                                  // wyszukiwarka Deezera nie podaje roku
  dlugoscMs: (wpis.duration || 0) * 1000,
  zrodloId: String(wpis.id || ''),
  zrodlo: 'deezer',
});

export const zapytanie = (utwor) => `${glownyWykonawca(utwor.wykonawca)} ${utwor.tytul}`;
