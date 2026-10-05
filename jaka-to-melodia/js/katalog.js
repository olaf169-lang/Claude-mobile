/* Katalog, wszystko, co obie strony (przeglądarka i skrypty w narzedzia/)
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
  { id: 'country', nazwa: 'Country & Folk', emoji: '🪕' },
  // Specjalne: bez wymogu równomiernego rozkładu po dekadach (patrz
  // sprawdz-dane.mjs), wąski, konkretny temat zamiast szerokiego gatunku,
  // więc naturalnie skupia się w kilku latach zamiast rozkładać się równo.
  { id: 'disney',  nazwa: 'Disney',              emoji: '🏰', specjalna: true },
  { id: 'furious', nazwa: 'Szybcy i wściekli',   emoji: '🏎️', specjalna: true },
  { id: 'szanty',  nazwa: 'Szanty',              emoji: '⚓', specjalna: true },
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
 * Nie każdy gatunek istniał w każdej epoce, rapu w latach 60. po prostu nie
 * było, a disco to dopiero druga połowa lat 70. Zamiast wpisywać do katalogu
 * naciągane „przykłady”, te pary są wykluczone: filtry ich nie pokazują,
 * a kontrola danych nie zgłasza ich jako braków. Utwory, które w innej epoce
 * poszłyby do tej kategorii, wzmacniają pozostałe kategorie tej samej dekady.
 */
export const NIEISTNIEJACE = new Set(['1960/rap', '1960/dance', '1970/rap']);

export const istnieje = (dekada, kategoria) => !NIEISTNIEJACE.has(`${dekada}/${kategoria}`);

export const dekada = (utwor) => Math.floor(utwor.rok / 10) * 10;

/** Tekst bez ogonków, znaków przestankowych i wielkich liter, do porównań. */
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

/* --- czy podpowiedź nie zdradza filmu? ------------------------------------
   Pytanie filmowe pokazuje tytuł ALBO wykonawcę i każe zgadnąć film. Jeśli
   pokazana podpowiedź zawiera nazwę filmu („Theme from Jaws” przy filmie
   „Jaws”, wykonawca „Encanto Cast” przy „Encanto”), pytanie odpowiada samo
   sobie. Gra pokazuje wtedy drugą podpowiedź, a kontrola danych zgłasza wpis,
   w którym zdradzają obie, z takiego utworu nie da się zrobić zagadki. */

/** Słowa, które same z siebie nie wskazują na konkretny film. */
const SLOWA_NIEISTOTNE = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'from', 'in', 'on', 'at', 'to', 'for',
  'with', 'theme', 'main', 'title', 'song', 'suite', 'overture', 'soundtrack',
  'my', 'me', 'you', 'it', 'is', 'part', 'i', 'ii', 'iii',
  'w', 'z', 'na', 'do', 'motyw', 'temat', 'piosenka',
]);

/** Liczba pojedyncza zamiast mnogiej, „Raiders” i „Raider” to to samo słowo. */
const rdzen = (slowo) => slowo.replace(/(ies|es|s)$/, '');

const slowaIstotne = (tekst) =>
  normalizuj(tekst)
    .split(' ')
    .filter((slowo) => slowo && !SLOWA_NIEISTOTNE.has(slowo))
    .map(rdzen);

/**
 * Czy ta podpowiedź zdradza, z jakiego filmu jest utwór?
 *
 * Wychodzimy tu raczej na „tak”, bo pomyłka w tę stronę nic nie psuje,
 * gra pokaże drugą podpowiedź i pytanie nadal będzie dobre. Pomyłka w drugą
 * stronę daje pytanie z odpowiedzią w treści, czyli dokładnie to, czego nie
 * chcemy.
 */
export function zdradzaFilm(podpowiedz, film) {
  const slowaFilmu = slowaIstotne(film || '');
  const wPodpowiedzi = new Set(slowaIstotne(podpowiedz || ''));
  if (!slowaFilmu.length || !wPodpowiedzi.size) return false;
  // Cała nazwa filmu w podpowiedzi: „Goldfinger”, „Live and Let Die”.
  if (slowaFilmu.every((slowo) => wPodpowiedzi.has(slowo))) return true;
  // Albo choćby jedno dość charakterystyczne słowo: „Raiders March” przy
  // „Raiders of the Lost Ark”. Krótkie słowa („Top Gun”, „The Lion King”)
  // same niczego nie zdradzają, więc liczą się dopiero od pięciu znaków.
  return slowaFilmu.some((slowo) => slowo.length >= 5 && wPodpowiedzi.has(slowo));
}

/** Czy z utworu da się zrobić pytanie o film, czy została jakaś uczciwa podpowiedź. */
export const daSieSpytacOFilm = (utwor) =>
  Boolean(utwor.film) &&
  (!zdradzaFilm(utwor.tytul, utwor.film) || !zdradzaFilm(utwor.wykonawca, utwor.film));

/** Identyfikator utworu: stały tak długo, jak nie zmieni się tytuł ani wykonawca. */
export const idUtworu = (utwor) =>
  `${normalizuj(utwor.wykonawca).replace(/ /g, '-')}--${normalizuj(utwor.tytul).replace(/ /g, '-')}`;

const ROZDZIELACZ = /\s+(?:feat\.|ft\.|with|vs\.?|&|x|i)\s+|,\s+/i;

/** Wykonawca bez dopisków typu „feat. X”, do sprawdzania, czy to ten sam artysta. */
export const glownyWykonawca = (wykonawca) =>
  String(wykonawca).split(ROZDZIELACZ)[0].trim();

/**
 * Wszyscy wymienieni w polu „wykonawca”, znormalizowani. Dzięki temu w jednym
 * pytaniu nie wylądują obok siebie „Taco Hemingway” i „Dawid Podsiadło & Taco
 * Hemingway”, to byłaby ta sama odpowiedź napisana dwa razy.
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
