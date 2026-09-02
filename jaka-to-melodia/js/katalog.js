/* Katalog — wszystko, co obie strony (przeglądarka i skrypty w narzedzia/)
   muszą rozumieć tak samo: identyfikator utworu, dekada, porównywanie tytułów. */

import { UTWORY } from '../dane/utwory.js';

export { UTWORY };

export const KATEGORIE = [
  { id: 'pop',     nazwa: 'Pop',        emoji: '🎤' },
  { id: 'rock',    nazwa: 'Rock',       emoji: '🎸' },
  { id: 'rap',     nazwa: 'Rap',        emoji: '🎧' },
  { id: 'dance',   nazwa: 'Dance',      emoji: '🪩' },
  { id: 'rnb',     nazwa: 'R&B / soul', emoji: '🎷' },
  { id: 'polskie', nazwa: 'Polskie',    emoji: '🇵🇱' },
];

export const DEKADY = [
  { id: 1980, nazwa: 'lata 80.' },
  { id: 1990, nazwa: 'lata 90.' },
  { id: 2000, nazwa: 'lata 2000.' },
  { id: 2010, nazwa: 'lata 2010.' },
  { id: 2020, nazwa: 'lata 2020.' },
];

export const dekada = (utwor) => Math.floor(utwor.rok / 10) * 10;

/** Tekst bez ogonków, znaków przestankowych i wielkich liter — do porównań. */
export function normalizuj(tekst) {
  return String(tekst)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/gi, 'l')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Identyfikator utworu: stały tak długo, jak nie zmieni się tytuł ani wykonawca. */
export const idUtworu = (utwor) =>
  `${normalizuj(utwor.wykonawca).replace(/ /g, '-')}--${normalizuj(utwor.tytul).replace(/ /g, '-')}`;

const ROZDZIELACZ = /\s+(?:feat\.|ft\.|with|vs\.?|&|x|i)\s+|,\s+/i;

/** Wykonawca bez dopisków typu „feat. X” — do sprawdzania, czy to ten sam artysta. */
export const glownyWykonawca = (wykonawca) =>
  String(wykonawca).split(ROZDZIELACZ)[0].trim();

/**
 * Wszyscy wymienieni w polu „wykonawca”, znormalizowani. Dzięki temu w jednym
 * pytaniu nie wylądują obok siebie „Taco Hemingway” i „Dawid Podsiadło & Taco
 * Hemingway” — to byłaby ta sama odpowiedź napisana dwa razy.
 */
export const wszyscyWykonawcy = (wykonawca) =>
  String(wykonawca)
    .split(ROZDZIELACZ)
    .map((czesc) => normalizuj(czesc))
    .filter(Boolean);

/** Katalog z policzonymi z góry polami, których gra używa w każdej rundzie. */
export function przygotujKatalog(utwory = UTWORY) {
  return utwory.map((u) => ({
    ...u,
    id: idUtworu(u),
    dekada: dekada(u),
    styl: u.styl || u.gatunek,
    kluczTytulu: normalizuj(u.tytul),
    kluczWykonawcy: normalizuj(glownyWykonawca(u.wykonawca)),
    kluczeWykonawcow: wszyscyWykonawcy(u.wykonawca),
  }));
}
