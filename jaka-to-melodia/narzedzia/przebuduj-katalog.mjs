#!/usr/bin/env node
/* Porządkuje dane/utwory.js: grupuje po dekadach i kategoriach, sortuje po
   roku i wykonawcy, usuwa duble. Uruchamiane ręcznie po większej dosypce
   utworów — plik dopisywany na końcu robi się inaczej nieczytelny.

       node narzedzia/przebuduj-katalog.mjs

   Dubel to ten sam wykonawca i tytuł. Zostaje wpis późniejszy: nowsze sekcje
   dopisujemy świadomie (np. przenosząc „Eye of the Tiger” z rocka do muzyki
   filmowej), więc to on ma wygrać. Skrypt wypisuje, co usunął. */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { UTWORY } from '../dane/utwory.js';
import { KATEGORIE, DEKADY, idUtworu, dekada, istnieje } from '../js/katalog.js';

const PLIK = resolve(dirname(fileURLToPath(import.meta.url)), '../dane/utwory.js');
const KOLEJNOSC = KATEGORIE.map((k) => k.id);

/* --- apostrofy ---
   Tytuły dopisywane w pojedynczych cudzysłowach łatwo tracą apostrof
   („Don t Stop”), a to psuje dopasowanie do sklepu: „don t stop” i „dont stop”
   to dla wyszukiwarki dwie różne rzeczy. Tutaj wracają na miejsce. */
const SKROTY = [
  [/\b([A-Za-z]+)n t\b/g, "$1n't"],       // Don t → Don't, Can t → Can't
  [/\b([A-Za-z]+) ve\b/g, "$1've"],       // I ve → I've
  [/\b([A-Za-z]+) ll\b/g, "$1'll"],       // I ll → I'll
  [/\b([A-Za-z]+) re\b/g, "$1're"],       // You re → You're
  [/\b([A-Za-z]{2,}) s\b/g, "$1's"],      // Rapper s → Rapper's
  [/\bI m\b/g, "I'm"],
];
// Tylko dla tytułów bez polskich znaków: „Kobiety są gorące” nie ma nic
// wspólnego z angielskim „Kobiety's”, a granica słowa przed „ą” tak to widzi.
const naprawApostrofy = (tekst) =>
  (/^[\x20-\x7e]*$/.test(tekst)
    ? SKROTY.reduce((t, [wzor, na]) => t.replace(wzor, na), tekst)
    : tekst);

const naprawione = [];
for (const utwor of UTWORY) {
  const tytul = naprawApostrofy(utwor.tytul);
  const wykonawca = naprawApostrofy(utwor.wykonawca);
  if (tytul !== utwor.tytul || wykonawca !== utwor.wykonawca) {
    naprawione.push(`${utwor.wykonawca} — ${utwor.tytul}  →  ${wykonawca} — ${tytul}`);
    utwor.tytul = tytul;
    utwor.wykonawca = wykonawca;
  }
}

/* --- duble: wygrywa wpis późniejszy --- */
const wedlugId = new Map();
const usuniete = [];
for (const utwor of UTWORY) {
  const id = idUtworu(utwor);
  if (wedlugId.has(id)) usuniete.push(`${utwor.wykonawca} — ${utwor.tytul} (było: ${wedlugId.get(id).gatunek})`);
  wedlugId.set(id, utwor);
}
const utwory = [...wedlugId.values()];

const apostrof = (t) => (t.includes("'") ? `"${t.replace(/"/g, '\\"')}"` : `'${t}'`);
const linia = (u) => {
  const czesci = [
    `tytul: ${apostrof(u.tytul)}`,
    `wykonawca: ${apostrof(u.wykonawca)}`,
    `rok: ${u.rok}`,
    `gatunek: '${u.gatunek}'`,
  ];
  if (u.gatunek === 'polskie' && u.styl) czesci.push(`styl: '${u.styl}'`);
  // Film to nie tylko mechanika zgadywania (gatunek 'filmowa') — bywa też
  // samym znacznikiem na odsłonie przy innych gatunkach (np. 'furious'),
  // patrz rysujZnacznikiUtworu w prowadzacy.js/gracz.js.
  if (u.film) czesci.push(`film: ${apostrof(u.film)}`);
  return `  { ${czesci.join(', ')} },`;
};

const naglowek = readFileSync(PLIK, 'utf8').split('export const UTWORY = [')[0];
const kawalki = [`${naglowek}export const UTWORY = [`];
const tabela = {};

for (const dek of DEKADY) {
  const wDekadzie = utwory.filter((u) => dekada(u) === dek.id);
  kawalki.push(`\n  // ======================= ${dek.nazwa.toUpperCase()} =======================`);
  tabela[dek.id] = {};
  for (const kat of KOLEJNOSC) {
    const grupa = wDekadzie.filter((u) => u.gatunek === kat);
    tabela[dek.id][kat] = grupa.length;
    if (!grupa.length) continue;
    grupa.sort((a, b) => a.rok - b.rok || a.wykonawca.localeCompare(b.wykonawca, 'pl'));
    const nazwa = KATEGORIE.find((k) => k.id === kat).nazwa;
    kawalki.push(`  // --- ${nazwa.toLowerCase()} (${grupa.length}) ---`);
    kawalki.push(grupa.map(linia).join('\n'));
  }
}
kawalki.push('\n  // Tu dopisuj świeżynki i to, czego brakuje — jedna linijka na utwór.\n];\n');
writeFileSync(PLIK, kawalki.join('\n'));

/* --- raport --- */
if (naprawione.length) {
  console.log(`Poprawione apostrofy (${naprawione.length}):`);
  for (const n of naprawione) console.log('  ', n);
  console.log('');
}
if (usuniete.length) {
  console.log(`Usunięte duble (${usuniete.length}):`);
  for (const d of usuniete) console.log('  -', d);
  console.log('');
}
const szer = 9;
console.log('dekada  ' + KOLEJNOSC.map((k) => k.padStart(szer)).join('') + '    razem');
let suma = 0;
for (const dek of DEKADY) {
  const komorki = KOLEJNOSC.map((k) => {
    if (!istnieje(dek.id, k)) return '·'.padStart(szer);
    return String(tabela[dek.id][k]).padStart(szer);
  });
  const wDekadzie = Object.values(tabela[dek.id]).reduce((a, b) => a + b, 0);
  suma += wDekadzie;
  console.log(String(dek.id).padEnd(8) + komorki.join('') + String(wDekadzie).padStart(9));
}
console.log(`\nrazem: ${suma}`);
