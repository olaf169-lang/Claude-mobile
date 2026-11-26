// Stan apki w localStorage telefonu. Jeden klucz, jeden obiekt.
// Kopia zapasowa to ten sam obiekt zapisany do pliku JSON.

import { CWICZENIA, PLANY_START, PLANY_STARE } from './dane.js';

const KLUCZ = 'silka:v1';

function pusty() {
  return {
    wersja: 1,
    plany: structuredClone(PLANY_START),
    wlasne: {}, // id -> { id, nazwa, obszar, typ, rady: [], wlasne: true }
    treningi: [], // zakończone, od najstarszego
    aktywny: null, // trening w toku
    rozciaganie: [], // daty ISO zakończonych sesji
    odznaki: {}, // id -> data ISO
    ustawienia: { przerwa: 90, dzwiek: true, masaCiala: 80 },
  };
}

let stan = wczytaj();

function wczytaj() {
  try {
    const surowy = localStorage.getItem(KLUCZ);
    if (!surowy) return pusty();
    return uzupelnij(JSON.parse(surowy));
  } catch {
    return pusty();
  }
}

// Brakujące pola (np. po aktualizacji apki) dostają wartości domyślne.
function uzupelnij(s) {
  const baza = pusty();
  const wynik = { ...baza, ...s };
  wynik.ustawienia = { ...baza.ustawienia, ...(s.ustawienia || {}) };
  wynik.plany = { ...baza.plany, ...(s.plany || {}) };
  // Nietknięty stary plan startowy zamieniamy na aktualny (np. po zmianie kolejności).
  for (const k of Object.keys(PLANY_START)) {
    const teraz = (wynik.plany[k] || []).map((w) => w.cw).join();
    if (PLANY_STARE.some((st) => st[k] && st[k].join() === teraz)) wynik.plany[k] = structuredClone(PLANY_START[k]);
  }
  return wynik;
}

export function pobierz() {
  return stan;
}

export function zapisz() {
  try {
    localStorage.setItem(KLUCZ, JSON.stringify(stan));
    return true;
  } catch {
    return false;
  }
}

export function zmien(fn) {
  fn(stan);
  return zapisz();
}

export function cwiczenie(id) {
  return CWICZENIA.find((c) => c.id === id) || stan.wlasne[id] || null;
}

export function wszystkieCwiczenia() {
  return [...CWICZENIA, ...Object.values(stan.wlasne)];
}

export function dodajWlasne({ nazwa, obszar, typ }) {
  const baza = nazwa.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cwiczenie';
  let id = `wl-${baza}`;
  let n = 2;
  while (cwiczenie(id)) id = `wl-${baza}-${n++}`;
  const c = { id, nazwa: nazwa.trim(), obszar, typ, img: null, rady: [], alt: [], wlasne: true };
  zmien((s) => { s.wlasne[id] = c; });
  return c;
}

export function eksport() {
  return JSON.stringify({ ...stan, eksport: new Date().toISOString() }, null, 1);
}

export function importuj(tekst) {
  const dane = JSON.parse(tekst);
  if (!dane || !Array.isArray(dane.treningi) || !dane.plany) throw new Error('To nie jest kopia Siłki Piąteczki.');
  delete dane.eksport;
  stan = uzupelnij(dane);
  zapisz();
}

export function wyczysc() {
  stan = pusty();
  zapisz();
}
