/* ==========================================================================
   Turniej Pana Piąteczki — stałe rozgrywek.

   Wszystko, co da się zmienić bez ruszania logiki, siedzi tutaj: skład,
   formaty meczów, kalendarz sezonu. Reszta modułów tego nie duplikuje.
   ========================================================================== */

export const GRACZE = [
  { id: 'jacek',     imie: 'Jacek',     skrot: 'JAC' },
  { id: 'tomek',     imie: 'Tomek',     skrot: 'TOM' },
  { id: 'kafaar',    imie: 'Kafaar',    skrot: 'KAF' },
  { id: 'piateczka', imie: 'Piąteczka', skrot: 'PIĄ' },
];

/** Ktoś spoza czwórki, kto wskoczył za nieobecnego. Gra i ma swoje saldo,
    ale nigdy nie wchodzi do klasyfikacji sezonu — patrz liczenie.js. */
export const GOSC = { id: 'gosc', imie: 'Gość', skrot: 'GOŚ' };

export function gracz(id) {
  return GRACZE.find((g) => g.id === id) ?? (id === GOSC.id ? GOSC : { id, imie: id, skrot: '???' });
}

/* ------------------------------------------------------------------ format */

/* Format obowiązujący: DO DWÓCH WYGRANYCH SETÓW, sety do 15 — tak samo
   w deblu i w singlu. Pozostałe warianty zostają w menu na wypadek krótszej
   rezerwacji hali; saldo liczy się identycznie w każdym z nich, więc format
   można zmienić nawet w środku sezonu bez psucia tabeli. */
export const FORMATY = {
  '3x15': { nazwa: 'Do 2 wygranych setów (do 15)', setow: 3, doIlu: 15, dogrywka: true, czas: '60–100 minut' },
  '2x15': { nazwa: '2 sety do 15, bez trzeciego', setow: 2, doIlu: 15, dogrywka: false, czas: 'około 70 minut' },
  '2x11': { nazwa: '2 sety do 11, bez trzeciego', setow: 2, doIlu: 11, dogrywka: false, czas: 'około 50 minut' },
  '1x21': { nazwa: '1 set do 21',  setow: 1, doIlu: 21, dogrywka: false, czas: 'około 55 minut' },
};
export const FORMAT_DOMYSLNY = '3x15';

/* ---------------------------------------------------------------- kalendarz */

export const SEZON = {
  nazwa: '2026/27',
  pierwszy: '2026-10-06',
  ostatni: '2027-03-30',
  final: '2027-03-23',
  rundy: [
    { id: 'jesien', nazwa: 'Runda Jesienna', od: '2026-10-01', do: '2026-12-31' },
    { id: 'zima',   nazwa: 'Runda Zimowa',   od: '2027-01-01', do: '2027-03-31' },
  ],
  /* Wtorki, których z góry nie planujemy. Reszta terminów jest umowna —
     appka i tak przyjmuje wynik z dowolnej daty. */
  wolne: {
    '2026-12-22': 'Tydzień Wigilii',
    '2026-12-29': 'Między świętami',
    '2027-03-30': 'Wtorek po Wielkanocy — termin rezerwowy',
  },
};

/** Wszystkie wtorki sezonu, z etykietą rundy i informacją o dniach wolnych. */
export function wtorkiSezonu() {
  const lista = [];
  const koniec = new Date(SEZON.ostatni + 'T12:00:00');
  for (const d = new Date(SEZON.pierwszy + 'T12:00:00'); d <= koniec; d.setDate(d.getDate() + 7)) {
    const data = isoData(d);
    lista.push({ data, wolne: SEZON.wolne[data] ?? null, runda: rundaDla(data) });
  }
  return lista;
}

export function rundaDla(data) {
  return SEZON.rundy.find((r) => data >= r.od && data <= r.do) ?? null;
}

export function isoData(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dzisiajIso() {
  return isoData(new Date());
}

/** Najbliższy wtorek od dziś (albo dziś, jeśli dziś wtorek). */
export function najblizszyWtorek(od = new Date()) {
  const d = new Date(od.getFullYear(), od.getMonth(), od.getDate(), 12);
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7));
  return isoData(d);
}

const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const MIESIACE_M = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

export function poPolsku(iso) {
  const [r, m, d] = iso.split('-').map(Number);
  return `${d} ${MIESIACE[m - 1]} ${r}`;
}

export function krotkaData(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}.${String(m).padStart(2, '0')}`;
}

export function nazwaMiesiaca(klucz) {
  const [r, m] = klucz.split('-').map(Number);
  return `${MIESIACE_M[m - 1]} ${r}`;
}
