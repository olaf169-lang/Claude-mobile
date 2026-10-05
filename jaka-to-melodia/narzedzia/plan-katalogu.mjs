#!/usr/bin/env node
/* ==========================================================================
   Plan rozbudowy katalogu: ile utworów dołożyć do każdego koszyka
   dekada × kategoria, żeby dojść do zadanej wielkości, nie psując proporcji.
   --------------------------------------------------------------------------
       node narzedzia/plan-katalogu.mjs            # plan do 4000 utworów
       node narzedzia/plan-katalogu.mjs --cel 3000

   Dlaczego proporcjonalnie, a nie równo po wszystkich koszykach: dzisiejszy
   rozkład nie jest przypadkowy. Rapu w latach 60. nie było, lata 2020. jeszcze
   się nie skończyły, a „polskie” są mocniejsze, bo to gra dla polskich graczy.
   Równanie wszystkiego do jednej liczby zepsułoby to, co działa, więc każdy
   koszyk rośnie tym samym mnożnikiem.

   Kategorie specjalne (Disney, Szybcy i wściekli, szanty) też są tu liczone,
   ale ich się nie da dociągnąć wyszukiwaniem po wykonawcach, to wąskie,
   skończone tematy, które rosną tylko ręczną robotą. Plan pokazuje ich
   niedobór osobno, żeby nie ginął w sumie.
   ========================================================================== */

import { resolve } from 'node:path';

import { przygotujKatalog, KATEGORIE, DEKADY, istnieje } from '../js/katalog.js';

export const CEL_DOMYSLNY = 4000;

/**
 * Plan dla każdego istniejącego koszyka dekada × kategoria.
 * Zwraca też sumy, żeby nie trzeba było ich liczyć po stronie wywołującego.
 */
export function planKoszykow(katalog, { cel = CEL_DOMYSLNY } = {}) {
  const teraz = new Map();
  for (const utwor of katalog) {
    const klucz = `${utwor.dekada}/${utwor.gatunek}`;
    teraz.set(klucz, (teraz.get(klucz) || 0) + 1);
  }

  const mnoznik = katalog.length ? cel / katalog.length : 0;
  const koszyki = [];
  for (const dekada of DEKADY) {
    for (const kategoria of KATEGORIE) {
      // Kombinacje wykluczone celowo (rap w latach 60.) nie są niedoborem.
      if (!kategoria.specjalna && !istnieje(dekada.id, kategoria.id)) continue;
      const jest = teraz.get(`${dekada.id}/${kategoria.id}`) || 0;
      // Koszyk, którego dziś nie ma, ma zostać pusty, tak wygląda „te same
      // proporcje”. Inaczej plan kazałby wymyślić disneyowskie lata 60.
      if (!jest) continue;
      const docelowo = Math.round(jest * mnoznik);
      koszyki.push({
        dekada: dekada.id,
        kategoria: kategoria.id,
        specjalna: Boolean(kategoria.specjalna),
        jest,
        docelowo,
        brak: Math.max(0, docelowo - jest),
      });
    }
  }

  koszyki.sort((a, b) => b.brak - a.brak);
  const suma = (filtr) => koszyki.filter(filtr).reduce((s, k) => s + k.brak, 0);
  return {
    cel,
    mnoznik,
    teraz: katalog.length,
    koszyki,
    brakRazem: suma(() => true),
    brakZwykle: suma((k) => !k.specjalna),
    brakSpecjalne: suma((k) => k.specjalna),
  };
}

/** Niedobór zsumowany po kategoriach, do raportu i do doboru wykonawców. */
export function brakiWgKategorii(plan) {
  const wynik = new Map();
  for (const koszyk of plan.koszyki) {
    wynik.set(koszyk.kategoria, (wynik.get(koszyk.kategoria) || 0) + koszyk.brak);
  }
  return wynik;
}

export function raportPlanu(plan) {
  const wiersze = [
    `## Plan katalogu: ${plan.teraz} → ${plan.cel} utworów`,
    '',
    `Mnożnik ${plan.mnoznik.toFixed(2)}×. Do dołożenia **${plan.brakRazem}**: ` +
    `${plan.brakZwykle} w kategoriach gatunkowych (da się pobrać po wykonawcach) ` +
    `i ${plan.brakSpecjalne} w specjalnych (Disney, Szybcy i wściekli, szanty, ręcznie).`,
    '',
    '| dekada | kategoria | jest | cel | brak |',
    '|---|---|---:|---:|---:|',
  ];
  for (const k of plan.koszyki.filter((k) => k.brak > 0)) {
    const nazwaKategorii = KATEGORIE.find((x) => x.id === k.kategoria)?.nazwa || k.kategoria;
    const nazwaDekady = DEKADY.find((x) => x.id === k.dekada)?.nazwa || k.dekada;
    wiersze.push(`| ${nazwaDekady} | ${nazwaKategorii}${k.specjalna ? ' ★' : ''} | ${k.jest} | ${k.docelowo} | ${k.brak} |`);
  }
  wiersze.push('', '★ kategoria specjalna, wąski temat, nie dociągnie się wyszukiwaniem po wykonawcach.');
  return `${wiersze.join('\n')}\n`;
}

/* --- wiersz poleceń --- */

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`) {
  const argumenty = process.argv.slice(2);
  const i = argumenty.indexOf('--cel');
  const cel = i >= 0 ? Number(argumenty[i + 1]) : CEL_DOMYSLNY;
  const plan = planKoszykow(przygotujKatalog(), { cel });
  console.log(raportPlanu(plan));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, raportPlanu(plan));
  }
}
