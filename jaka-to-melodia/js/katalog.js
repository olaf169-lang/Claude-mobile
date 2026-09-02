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
  { id: 'filmowa', nazwa: 'Filmowa',    emoji: '🎬' },
  { id: 'polskie', nazwa: 'Polskie',    emoji: '🇵🇱' },
];

export const DEKADY = [
  { id: 1960, nazwa: 'lata 60.', krotka: '60.' },
  { id: 1970, nazwa: 'lata 70.', krotka: '70.' },
  { id: 1980, nazwa: 'lata 80.', krotka: '80.' },
  { id: 1990, nazwa: 'lata 90.', krotka: '90.' },
  { id: 2000, nazwa: 'lata 2000.', krotka: '2000.' },
  { id: 2010, nazwa: 'lata 2010.', krotka: '2010.' },
  { id: 2020, nazwa: 'lata 2020.', krotka: '2020.' },
];

/**
 * Nie każdy gatunek istniał w każdej epoce — rapu w latach 60. po prostu nie
 * było, a disco to dopiero druga połowa lat 70. Zamiast wpisywać do katalogu
 * naciągane „przykłady”, te pary są wykluczone: filtry ich nie pokazują,
 * a kontrola danych nie zgłasza ich jako braków. Utwory, które w innej epoce
 * poszłyby do tej kategorii, wzmacniają pozostałe kategorie tej samej dekady.
 */
export const NIEISTNIEJACE = new Set(['1960/rap', '1960/dance', '1970/rap']);

export const istnieje = (dekada, kategoria) => !NIEISTNIEJACE.has(`${dekada}/${kategoria}`);

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
