/* ==========================================================================
   Turniej Pana Piąteczki: stałe rozgrywek.

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
    ale nigdy nie wchodzi do klasyfikacji sezonu, patrz liczenie.js. */
export const GOSC = { id: 'gosc', imie: 'Gość', skrot: 'GOŚ' };

export function gracz(id) {
  const stały = GRACZE.find((g) => g.id === id);
  if (stały) return stały;
  // Dopisane osoby (gosc, gosc1, gosc2…) mają imię tylko w swoim wieczorze,
  // patrz imieW niżej. Tu, bez kontekstu wieczoru, zostaje ogólne „Gość”,
  // żeby nigdzie nie wyświetlił się surowy identyfikator.
  if (String(id).startsWith('gosc')) return { id, imie: 'Gość', skrot: 'GOŚ' };
  return { id, imie: String(id), skrot: '???' };
}

/** Imię widoczne na ekranie. Dopisane osoby („goście”) siedzą w samym
    wieczorze. Dzięki temu na jeden wtorek można zaprosić kogo się chce,
    a stała czwórka zostaje stałą czwórką. */
export function imieW(wieczor, id) {
  const dopisani = wieczor?.goscie ?? {};
  if (dopisani[id]) return dopisani[id];
  if (id === GOSC.id) return wieczor?.goscImie || 'Gość';
  return gracz(id).imie;
}

export const czyGosc = (id) => id === GOSC.id || String(id).startsWith('gosc');

/* ------------------------------------------------------------------ format */

/* Format jest teraz DWIEMA liczbami, nie jednym sztywnym wyborem:
     setow: ile wygranych setów kończy mecz (1 albo 2),
     doIlu: do ilu punktów gra się seta.
   Domyślnie „do dwóch wygranych setów, sety do 15”, ale można ustawić
   szybką gierkę do 7 w jednym secie i nic w tabeli się nie sypie, bo liczymy
   wygrane mecze, a mecz to mecz. Przy remisie na styku (np. 15:15) zawsze
   gra się na przewagę dwóch punktów, bez górnego limitu, więc pola na wynik
   przyjmują liczby dużo powyżej granicy seta. */
export const FORMAT_DOMYSLNY = { setow: 2, doIlu: 15 };

/** Gotowce do jednego dotknięcia. Ostatnia pozycja („własny”) otwiera pola. */
export const FORMATY_SZYBKIE = [
  { setow: 2, doIlu: 15 },
  { setow: 2, doIlu: 11 },
  { setow: 1, doIlu: 21 },
  { setow: 1, doIlu: 15 },
  { setow: 1, doIlu: 11 },
  { setow: 1, doIlu: 7 },
];

/* Stare wieczory trzymały format jako klucz tekstowy ('3x15'). Mapujemy je
   na nowy kształt, żeby nic z historii nie zniknęło. */
const STARE_FORMATY = {
  '3x15': { setow: 2, doIlu: 15 },
  '2x15': { setow: 2, doIlu: 15 },
  '2x11': { setow: 2, doIlu: 11 },
  '1x21': { setow: 1, doIlu: 21 },
};

export function normalizujFormat(f) {
  if (typeof f === 'string') return STARE_FORMATY[f] ?? { ...FORMAT_DOMYSLNY };
  const setow = f?.setow === 1 ? 1 : 2;
  const doIlu = Number.isFinite(f?.doIlu) && f.doIlu >= 3 && f.doIlu <= 99
    ? Math.round(f.doIlu) : FORMAT_DOMYSLNY.doIlu;
  return { setow, doIlu };
}

export function opisFormatu(f) {
  const { setow, doIlu } = normalizujFormat(f);
  return setow === 1 ? `1 set do ${doIlu}` : `do 2 wygranych setów, do ${doIlu}`;
}

export function krotkiFormat(f) {
  const { setow, doIlu } = normalizujFormat(f);
  return setow === 1 ? `1×${doIlu}` : `2×${doIlu}`;
}

/* ---------------------------------------------------------------- kalendarz */

export const SEZON = {
  nazwa: '2026/27',
  pierwszy: '2026-09-15',
  ostatni: '2027-03-30',
  final: '2027-03-23',
  rundy: [
    { id: 'jesien', nazwa: 'Runda Jesienna', od: '2026-09-01', do: '2026-12-31' },
    { id: 'zima',   nazwa: 'Runda Zimowa',   od: '2027-01-01', do: '2027-03-31' },
  ],
  /* Wtorki, których z góry nie planujemy. Reszta terminów jest umowna,
     appka i tak przyjmuje wynik z dowolnej daty. */
  wolne: {
    '2026-12-22': 'Tydzień Wigilii',
    '2026-12-29': 'Między świętami',
    '2027-03-30': 'Wtorek po Wielkanocy, termin rezerwowy',
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

/** Numer tygodnia od startu sezonu (0 = tydzień startowy). Służy do rotacji
    kolejności meczów: co wtorek wypada następna z trzech kolejności, więc dwa
    sąsiednie wtorki nigdy nie mają tej samej. Liczone z daty, więc deterministyczne
    (wszyscy widzą identyczny układ). */
export function indeksTygodnia(iso) {
  const start = new Date(SEZON.pierwszy + 'T12:00:00');
  const d = new Date(iso + 'T12:00:00');
  return Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));
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
