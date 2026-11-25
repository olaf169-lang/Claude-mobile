// Czyste liczenie: rekordy, podpowiedzi ciężaru, XP, poziomy, serie, odznaki.
// Bez DOM i bez localStorage, więc da się to testować w Node
// (narzedzia/sprawdz.mjs).

import { POZIOMY, XP, MAKS_PRZERWA, ODZNAKI, ROZCIAGANIE_W_TYGODNIU } from './dane.js';

// Daty trzymamy jako ISO. Do liczenia dni bierzemy lokalny dzień kalendarzowy,
// bo trening o 23:50 i o 0:10 to dwa różne dni dla człowieka, nie dla UTC.
export function dzien(iso) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function dniMiedzy(a, b) {
  return Math.round((dzien(b) - dzien(a)) / 86400000);
}

export function krok(typ) {
  return typ === 'hantle' ? 2 : 2.5;
}

// Szacowany maks na jedno powtórzenie (wzór Epleya). Służy tylko do
// porównania dwóch serii różnym ciężarem, nie jako prawdziwy rekord życiowy.
export function e1rm(kg, powt) {
  if (!(powt > 0)) return 0;
  return kg * (1 + powt / 30);
}

// Wszystkie zrobione serie ćwiczenia, od najstarszych.
export function serieCwiczenia(treningi, cwId) {
  const wynik = [];
  for (const t of treningi) {
    for (const c of t.cwiczenia || []) {
      if (c.cw !== cwId) continue;
      for (const s of c.serie || []) if (s.ok && s.powt > 0) wynik.push({ ...s, data: t.data });
    }
  }
  return wynik;
}

// Rekord sprawdzamy względem wszystkiego, co było wcześniej: historii
// i serii już odhaczonych w tym treningu (`dotad`). Pierwszy raz w życiu
// to nie rekord, tylko punkt startowy.
export function sprawdzRekord(dotad, seria) {
  const kg = Number(seria.kg) || 0;
  const powt = Number(seria.powt) || 0;
  if (!dotad.length || powt <= 0) return null;
  const maksKg = Math.max(...dotad.map((s) => Number(s.kg) || 0));
  if (kg > maksKg) {
    return { typ: 'ciezar', tytul: 'Nowy rekord ciężaru', opis: `${fmtKg(kg)} kg, wcześniej najwięcej ${fmtKg(maksKg)} kg` };
  }
  const tymLubWiecej = dotad.filter((s) => (Number(s.kg) || 0) >= kg);
  const maksPowt = tymLubWiecej.length ? Math.max(...tymLubWiecej.map((s) => s.powt)) : 0;
  if (powt > maksPowt) {
    return { typ: 'powt', tytul: 'Rekord powtórzeń', opis: `${powt} powtórzeń z ${fmtKg(kg)} kg, wcześniej ${maksPowt}` };
  }
  if (kg > 0) {
    const maks = Math.max(...dotad.map((s) => e1rm(Number(s.kg) || 0, s.powt)));
    const teraz = e1rm(kg, powt);
    if (teraz > maks + 0.01) {
      return { typ: 'sila', tytul: 'Rekord siły', opis: `Szacowany maks ${fmtKg(Math.round(teraz * 2) / 2)} kg, wcześniej ${fmtKg(Math.round(maks * 2) / 2)} kg` };
    }
  }
  return null;
}

// Podpowiedź na dziś: ostatni wynik i czy dokładać ciężar. Zasada podwójnej
// progresji: gdy w ostatnim treningu każda seria doszła do górnej granicy
// zakresu, podnosimy ciężar o jeden krok.
export function podpowiedz(treningi, cwId, zakres, typ) {
  for (let i = treningi.length - 1; i >= 0; i--) {
    const c = (treningi[i].cwiczenia || []).find((x) => x.cw === cwId);
    const serie = c ? c.serie.filter((s) => s.ok && s.powt > 0) : [];
    if (!serie.length) continue;
    const kg = Math.max(...serie.map((s) => Number(s.kg) || 0));
    const dokladaj = serie.length >= 2 && serie.every((s) => s.powt >= zakres[1]);
    return {
      ostatnio: serie,
      data: treningi[i].data,
      kg: dokladaj && typ !== 'cialo' ? kg + krok(typ) : kg,
      powt: dokladaj ? zakres[0] : Math.min(...serie.map((s) => s.powt)),
      dokladaj,
    };
  }
  return null;
}

export function tonaz(trening) {
  let suma = 0;
  for (const c of trening.cwiczenia || []) {
    for (const s of c.serie || []) if (s.ok && s.kg > 0) suma += s.kg * s.powt;
  }
  return suma;
}

export function poziom(xp) {
  let i = 0;
  while (i + 1 < POZIOMY.length && xp >= POZIOMY[i + 1].prog) i++;
  const teraz = POZIOMY[i];
  const nast = POZIOMY[i + 1] || null;
  const postep = nast ? (xp - teraz.prog) / (nast.prog - teraz.prog) : 1;
  return {
    indeks: i,
    numer: i + 1,
    nazwa: teraz.nazwa,
    prog: teraz.prog,
    nastepny: nast,
    postep,
    // Masa koksa rośnie płynnie, także w obrębie poziomu, więc każdy trening
    // widać na sylwetce.
    masa: Math.min(1, (i + postep) / (POZIOMY.length - 1)),
  };
}

export function xpLaczne(stan) {
  const z = stan.treningi.reduce((a, t) => a + (t.xp || 0), 0);
  return z + stan.rozciaganie.length * XP.rozciaganie;
}

// Seria = treningi pod rząd, między którymi minęło najwyżej MAKS_PRZERWA dni.
export function serie(treningi, dzis = new Date().toISOString()) {
  const daty = treningi.map((t) => t.data).sort();
  let biezaca = 0;
  let najdluzsza = 0;
  for (let i = 0; i < daty.length; i++) {
    if (i > 0 && dniMiedzy(daty[i - 1], daty[i]) <= MAKS_PRZERWA) biezaca++;
    else biezaca = 1;
    najdluzsza = Math.max(najdluzsza, biezaca);
  }
  const ostatni = daty[daty.length - 1];
  const odOstatniego = ostatni ? dniMiedzy(ostatni, dzis) : null;
  if (odOstatniego !== null && odOstatniego > MAKS_PRZERWA) biezaca = 0;
  return { biezaca, najdluzsza, odOstatniego };
}

export function wTerminie(treningi, data) {
  const wczesniej = treningi.filter((t) => t.data < data).map((t) => t.data).sort();
  if (!wczesniej.length) return false;
  return dniMiedzy(wczesniej[wczesniej.length - 1], data) <= MAKS_PRZERWA;
}

// Poniedziałek tygodnia, w którym wypada data.
export function poczatekTygodnia(iso) {
  const d = dzien(iso);
  const dzienTyg = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dzienTyg);
  return d;
}

export function rozciaganieWTygodniu(lista, dzis = new Date().toISOString()) {
  const start = poczatekTygodnia(dzis).getTime();
  const dni = new Set(lista.filter((x) => dzien(x).getTime() >= start).map((x) => dzien(x).getTime()));
  return dni.size;
}

export function statystyki(stan) {
  const tygodnie = new Map();
  for (const x of stan.rozciaganie) {
    const k = poczatekTygodnia(x).getTime();
    if (!tygodnie.has(k)) tygodnie.set(k, new Set());
    tygodnie.get(k).add(dzien(x).getTime());
  }
  const s = serie(stan.treningi);
  return {
    treningi: stan.treningi.length,
    rekordy: stan.treningi.reduce((a, t) => a + (t.rekordy || []).length, 0),
    komplety: stan.treningi.filter((t) => t.komplet).length,
    najdluzszaSeria: s.najdluzsza,
    rozciagania: stan.rozciaganie.length,
    pelneTygodnieRozciagania: [...tygodnie.values()].filter((d) => d.size >= ROZCIAGANIE_W_TYGODNIU).length,
    maksTonaz: Math.max(0, ...stan.treningi.map(tonaz)),
  };
}

// Odznaki zdobyte teraz, a nie zapisane wcześniej.
export function noweOdznaki(stan) {
  const st = statystyki(stan);
  return ODZNAKI.filter((o) => !stan.odznaki[o.id] && o.w(st));
}

// XP za zakończony trening. `trening.rekordy` wypełnia ekran treningu.
export function policzXp(trening, wczesniejsze, planDlugosc) {
  const serieOk = trening.cwiczenia.reduce((a, c) => a + c.serie.filter((s) => s.ok).length, 0);
  const komplet = planDlugosc > 0 && trening.cwiczenia.length >= planDlugosc
    && trening.cwiczenia.every((c) => c.serie.length && c.serie.every((s) => s.ok));
  const termin = wTerminie(wczesniejsze, trening.data);
  const czesci = [
    { co: 'Odhaczone serie', ile: serieOk * XP.seria },
    { co: 'Zakończony trening', ile: XP.trening },
  ];
  if (trening.rekordy.length) czesci.push({ co: `Rekordy (${trening.rekordy.length})`, ile: trening.rekordy.length * XP.rekord });
  if (komplet) czesci.push({ co: 'Komplet serii', ile: XP.komplet });
  if (termin) czesci.push({ co: 'W terminie (do 5 dni przerwy)', ile: XP.wTerminie });
  return { czesci, suma: czesci.reduce((a, c) => a + c.ile, 0), komplet };
}

export function nastepnyPlan(treningi) {
  const ost = [...treningi].reverse().find((t) => t.plan === 'A' || t.plan === 'B');
  return ost && ost.plan === 'A' ? 'B' : 'A';
}

export function fmtKg(kg) {
  const n = Number(kg) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}
