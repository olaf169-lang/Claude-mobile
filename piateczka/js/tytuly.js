/* ==========================================================================
   Tytuły: Gracz Miesiąca, MVP i przydomki.

   Przydomek to ksywka bojowa liczona na bieżąco ze statystyk. NIKT NIE
   STARTUJE Z PRZYDOMKIEM — na początku sezonu wszyscy mają czysto i trzeba
   sobie cokolwiek zasłużyć (albo przechlapać).

   Trzy poziomy:
     🥉 brąz   — pocieszne. Dostajesz je za pech i za słabszą passę.
     🥈 srebro — solidne. Tu już coś umiesz.
     🥇 złoto  — wyczyn. Trzeba się napracować.

   Gracz Miesiąca NIE ma osobnego znaczka ani czwartego poziomu: jego
   przydomek zostaje w swoim kolorze i dostaje tylko poświatę i koronę.
   ========================================================================== */

import { GRACZE, dzisiajIso, nazwaMiesiaca } from './dane.js';
import { klasyfikacja, zbierz, rekordyWieczoru, wieczorRozegrany, mvpWieczoru } from './liczenie.js';

/** Ile wieczorów musi mieć okres, żeby wyłonić Gracza Miesiąca. Jeden
    wystarczy — decyzja użytkownika, nie podnoś tego z powrotem. */
export const MIN_WIECZOROW_NA_TYTUL = 1;

export const POZIOMY = {
  braz:   { nazwa: 'Brąz',   klasa: 'godlo-braz' },
  srebro: { nazwa: 'Srebro', klasa: 'godlo-srebro' },
  zloto:  { nazwa: 'Złoto',  klasa: 'godlo-zloto' },
};

/* ------------------------------------------------------------- przydomki

   Kolejność: brąz → srebro → złoto. `warunek(r, ctx)` dostaje rekord gracza
   z całego sezonu (patrz liczenie.js) i kontekst z porównaniami. Wszystko
   liczy się z samych wyników — nic się nie wpisuje ręcznie. */

export const PRZYDOMKI = [
  /* ------------------------------------------------------------- BRĄZ */
  {
    id: 'plakal', nazwa: 'Płakał', poziom: 'braz',
    haslo: 'Nie pykło, ale nie łam się, #NiePłakał',
    opis: 'Nie pykło, ale nie łam się, #NiePłakał. Z ostatnich sześciu meczów dwa przegrałeś dopiero w trzecim secie — urwać urwałeś, dowieźć nie dowiozłeś.',
    warunek: (r) => ostatnie(r, 6).filter((m) => !m.wygrany && m.trzySety).length >= 2,
  },
  {
    id: 'spalona', nazwa: 'Spalona Gierka', poziom: 'braz',
    haslo: 'Spaliłeś się dziś smyku za mocno',
    opis: 'Spaliłeś się dziś smyku za mocno — trzy przegrane w jeden wieczór. Zaczęło się obiecująco, pary poszły w pierwszym secie.',
    warunek: (r) => (r.dni.at(-1)?.p ?? 0) >= 3,
  },
  {
    id: 'pierd', nazwa: 'Pierd w Cwelsalce', poziom: 'braz',
    haslo: 'Było głośno, nie było efektu',
    opis: 'Przegrałeś seta, zdobywając najwyżej cztery punkty. Huku dużo, śladu żadnego.',
    warunek: (r) => r.najgorszyPrzegranySet !== null && r.najgorszyPrzegranySet <= 4,
  },
  {
    id: 'klatwa', nazwa: 'Klątwa Kamisha', poziom: 'braz',
    haslo: 'Kamish BBK przyszedł i rzucił urok',
    opis: 'Sześć meczów z rzędu bez zwycięstwa. To już nie forma, to zaklęcie — ktoś Ci narobił pod rakietą.',
    warunek: (r) => r.bezZwyciestwa >= 6,
  },
  {
    id: 'majkel', nazwa: 'Majkel Schmeichel', poziom: 'braz',
    haslo: 'Zapierdalasz, ale formą w dół',
    opis: 'Zapierdalasz, ale formą w dół: z ostatnich siedmiu meczów wygrałeś najwyżej dwa. Roboty jest, biegania jest, punktów brak.',
    warunek: (r) => r.meczeKolejno.length >= 7 && ostatnie(r, 7).filter((m) => m.wygrany).length <= 2,
  },

  /* ----------------------------------------------------------- SREBRO */
  {
    id: 'mlot', nazwa: 'Młot', poziom: 'srebro',
    haslo: 'Wali do skutku',
    opis: 'Zdobyłeś najwięcej punktów ze wszystkich. Metoda prosta: przywalać, aż przestanie wracać.',
    warunek: (r, c) => r.mecze > 0 && c.iluGra >= 2 && r.zdobyte === c.maxZdobyte,
  },
  {
    id: 'mur', nazwa: 'Mur', poziom: 'srebro',
    haslo: 'Beton nie do przejścia',
    opis: 'Straciłeś najmniej punktów ze wszystkich. Wygrana zaczyna się od tego, że rywal w ogóle nie punktuje.',
    warunek: (r, c) => r.mecze > 0 && c.iluGra >= 2 && r.stracone === c.minStracone,
  },
  {
    id: 'robin', nazwa: 'Robin', poziom: 'srebro',
    haslo: 'Do peleryny jeszcze trochę',
    opis: 'Drugie miejsce w tabeli. Do superbohatera jeszcze trochę brakuje — jesteś tym, co lata obok Batmana i podaje mu rakietę.',
    warunek: (r, c) => c.drugiId === r.id,
  },
  {
    id: 'hounter', nazwa: 'Hounter', poziom: 'srebro',
    haslo: 'Trochę straszy, trochę sprzedaje',
    opis: 'Pokonałeś lidera tabeli. Nie „hunter”, tylko Hounter — nigdy nie wiadomo, czy polujesz, czy sprzedajesz. Lider i tak leży.',
    warunek: (r, c) => c.liderId && c.liderId !== r.id && (r.przeciwnicy[c.liderId]?.w ?? 0) > 0,
  },
  {
    id: 'gladiator', nazwa: 'Gladiator', poziom: 'srebro',
    haslo: 'Dobija na przewagi',
    opis: 'Wygrałeś co najmniej dwa sety po dogrywce — takie na 17:15 czy 21:19. W boju o życie ręka nie drży.',
    warunek: (r) => r.setyPrzewagaW >= 2,
  },
  {
    id: 'podworko', nazwa: 'Mistrz Podwórka', poziom: 'srebro',
    haslo: 'Jeden na jednego, bez wymówek',
    opis: 'Pierwszy w tabeli singla. W deblu zawsze można zwalić na partnera — tu nie ma na kogo.',
    warunek: (r, c) => c.liderSingla === r.id,
  },

  /* ------------------------------------------------------------ ZŁOTO */
  {
    id: 'mmmpuuu', nazwa: 'Mmmpuuu!', poziom: 'zloto',
    haslo: 'Robisz strzał i miażdżysz przeciwników',
    opis: 'Robisz strzał i miażdżysz przeciwników — pięć wygranych meczów z rzędu, licząc też te z zeszłego wtorku. Rozpędziłeś się i nikt Cię nie zatrzymał.',
    warunek: (r) => r.seria >= 5,
  },
  {
    id: 'szal', nazwa: 'Piąteczkowy Szał', poziom: 'zloto',
    haslo: 'Komplet, bez litości',
    opis: 'Wygrałeś wszystkie mecze jednego wieczoru — minimum trzy, zero przegranych. Wieczór wzięty w całości.',
    warunek: (r) => r.dni.some((d) => d.w >= 3 && d.p === 0),
  },
  {
    id: 'kwinciok', nazwa: 'Forma Kwincioka', poziom: 'zloto',
    haslo: 'Forma top, rozjebałbyś Kwintę',
    opis: 'Forma top, rozjebałbyś Kwintę: w tym miesiącu wygrałeś co najmniej trzy czwarte swoich meczów, przy minimum czterech rozegranych. Szczyt możliwości.',
    warunek: (r, c) => {
      const m = c.statMiesiaca.get(r.id);
      return !!m && m.mecze >= 4 && m.meczeW / m.mecze >= 0.75;
    },
  },
  {
    id: 'nietykalny', nazwa: 'Nietykalny', poziom: 'zloto',
    haslo: 'Ani jednej rysy',
    opis: 'Co najmniej pięć rozegranych meczów i ani jednego oddanego. Nikt Cię nawet nie musnął.',
    warunek: (r) => r.mecze >= 5 && r.meczeP === 0,
  },
];

export const przydomek = (id) => PRZYDOMKI.find((p) => p.id === id) ?? null;

function ostatnie(r, ile) {
  return r.meczeKolejno.slice(-ile);
}

/* ------------------------------------------ przydomek gracza (na bieżąco) */

function seedId(id) {
  return Math.max(0, GRACZE.findIndex((g) => g.id === id));
}

/** Kontekst z porównaniami między graczami. Liczony raz na wywołanie. */
function kontekst(wieczory) {
  const grane = wieczory.filter((w) => !w.towarzyski && wieczorRozegrany(w))
    .sort((a, b) => a.data.localeCompare(b.data));
  const stat = zbierz(grane);
  const graja = [...stat.values()].filter((r) => r.mecze > 0);

  const tabela = klasyfikacja(grane);
  const liderSingla = klasyfikacja(grane, { tryb: 'singiel' })
    .find((r) => r.mecze >= 2)?.id ?? null;

  // Statystyki bieżącego miesiąca — do „Formy Kwincioka”.
  const biezacyMies = grane.at(-1)?.data.slice(0, 7) ?? null;
  const statMiesiaca = zbierz(grane.filter((w) => w.data.slice(0, 7) === biezacyMies));

  return {
    stat,
    tabela,
    liderId: tabela.find((r) => r.mecze > 0)?.id ?? null,
    drugiId: tabela.filter((r) => r.mecze > 0)[1]?.id ?? null,
    liderSingla,
    statMiesiaca,
    wieczorowRazem: grane.length,
    iluGra: graja.length,
    minStracone: graja.length ? Math.min(...graja.map((r) => r.stracone)) : 0,
    maxZdobyte: graja.length ? Math.max(...graja.map((r) => r.zdobyte)) : 0,
  };
}

const RANGA = { zloto: 3, srebro: 2, braz: 1 };

/** Wybiera przydomek jednego gracza. Zwraca null, gdy nic jeszcze nie pasuje
    — na starcie sezonu każdy ma czysto i tak ma być. */
function wybierz(id, ctx) {
  const r = ctx.stat.get(id);
  if (!r || r.mecze === 0) return null;

  const pasuja = PRZYDOMKI.filter((p) => {
    try { return p.warunek(r, ctx); } catch { return false; }
  });
  if (!pasuja.length) return null;

  // Bierzemy najwyższy poziom, a wśród równorzędnych rotujemy z wieczorami,
  // żeby ta sama osoba nie nosiła w kółko jednej ksywki.
  const najlepszy = Math.max(...pasuja.map((p) => RANGA[p.poziom]));
  const grupa = pasuja.filter((p) => RANGA[p.poziom] === najlepszy);
  return grupa[(r.wieczory + seedId(id)) % grupa.length];
}

/** Przydomek pojedynczego gracza — wygodne, samodzielne wywołanie. */
export function przydomekGracza(id, wieczory) {
  return wybierz(id, kontekst(wieczory));
}

/** Przydomki całej czwórki naraz + kto jest Graczem Miesiąca.
    Zwraca mapę id → { przydomek (może być null), reign }. */
export function przydomkiGraczy(wieczory) {
  const ctx = kontekst(wieczory);
  const gm = graczMiesiaca(wieczory);
  const krolId = gm.aktualny?.zwyciezca.id ?? gm.wToku?.zwyciezca?.id ?? null;
  const mapa = new Map();
  for (const g of GRACZE) mapa.set(g.id, { przydomek: wybierz(g.id, ctx), reign: g.id === krolId });
  return mapa;
}

/* ----------------------------------------------------------------- godła */

/* Rysowane w SVG, nie emoji — mają wyglądać jak odznaka. Godło nawiązuje
   wprost do treści przydomka, a kolor bierze się z poziomu trudności. */
const GLIFY = {
  // brąz — pocieszne
  plakal: '<path d="M32 19c7.5 10.5 12 17 12 22.5A12 12 0 0 1 20 41.5C20 36 24.5 29.5 32 19Z"/><path d="M26 42c0 4 2.5 7.5 6.5 8.5" opacity=".5"/><path d="M36 26.5c2 3 3 5 3.5 6.5" opacity=".35"/>',
  spalona: '<path d="M22 53l16-24" stroke-width="3"/><ellipse cx="41" cy="24" rx="5.5" ry="7"/><path d="M41 13c2.5 3.5 3.5 5.5 3.5 7.5" opacity=".45"/><path d="M47 29c3 2 3.5 5 1.5 7" opacity=".4"/><path d="M30 41l-6 2M34 35l-6 2" opacity=".35"/>',
  pierd: '<path d="M24 43a7.5 7.5 0 0 1 2-14.5 9.5 9.5 0 0 1 18 1.5 6.5 6.5 0 0 1-1.5 13Z"/><path d="M27 48c2.5 1.5 5 1.5 7.5 0M38 50c2 1 4 1 6 0" opacity=".45"/><path d="M18 33c-2.5-1.5-3-4-1-6M49 26c2.5-1 4.5.5 4.5 3" opacity=".35"/>',
  klatwa: '<path d="M32 19c9.5 0 15.5 6.5 15.5 14.5 0 5-2.5 8.5-5 10.5V49H21.5v-5c-2.5-2-5-5.5-5-10.5C16.5 25.5 22.5 19 32 19Z"/><circle cx="25.5" cy="34" r="3.6" fill="currentColor" stroke="none"/><circle cx="38.5" cy="34" r="3.6" fill="currentColor" stroke="none"/><path d="M32 39l-2 4h4Z"/><path d="M27 49v-4M32 49v-4M37 49v-4" opacity=".5"/>',
  majkel: '<path d="M25 52V33a3.2 3.2 0 0 1 6.4 0v-7a3.2 3.2 0 0 1 6.4 0v7a3.2 3.2 0 0 1 6.4 0v19Z"/><path d="M25 40l-4 2v6l4 2" opacity=".45"/><path d="M16 24v13M11.5 32.5 16 37l4.5-4.5" opacity=".8"/>',

  // srebro — solidne
  mlot: '<rect x="19" y="19" width="26" height="11" rx="2.5"/><path d="M29 30l-1.5 24h9L35 30"/><path d="M23 24.5h18" opacity=".4"/>',
  mur: '<rect x="15" y="26" width="34" height="8" rx="1.5"/><rect x="15" y="34" width="34" height="8" rx="1.5"/><rect x="15" y="42" width="34" height="8" rx="1.5"/><path d="M26 26v8M38 26v8M20 34v8M32 34v8M44 34v8M26 42v8M38 42v8" opacity=".45"/>',
  robin: '<path d="M15 30h34c0 9-5.5 15-11 15-3.5 0-5.5-2.5-6-4.5-.5 2-2.5 4.5-6 4.5-5.5 0-11-6-11-15Z"/><path d="M23 36.5h7M34 36.5h7" opacity=".4"/><path d="M26 48c3 4 9 4 12 0" opacity=".5"/>',
  hounter: '<circle cx="30" cy="39" r="13"/><circle cx="30" cy="39" r="5.5"/><path d="M30 39 48 21" stroke-width="2.8"/><path d="M41 19h9v9" opacity=".8"/>',
  gladiator: '<path d="M27 19c3-4 7-4 10 0l-1.5 5h-7Z"/><path d="M20 49c0-17 5-25 12-25s12 8 12 25h-6l-1.5-8h-9L26 49Z"/><path d="M25 36h5.5M33.5 36h5.5" opacity=".55"/><path d="M32 31v6" opacity=".45"/>',
  podworko: '<path d="M25 19h14v8.5a7 7 0 0 1-14 0Z"/><path d="M39 21h5.5a5.5 5.5 0 0 1-5.5 6.5M25 21h-5.5a5.5 5.5 0 0 0 5.5 6.5" opacity=".6"/><path d="M32 34.5V40M26.5 46h11l-1-6h-9Z"/><path d="M14 33v19M50 33v19M11 39h6M47 39h6" opacity=".35"/>',

  // złoto — wyczyn
  mmmpuuu: '<circle cx="26" cy="44" r="6"/><path d="M30.5 39.5 42 22l4.5 3.5-12 18.5Z"/><path d="M33 26l-4.5-4.5M39 21.5V15M46 25l5.5-4" opacity=".55"/><path d="M15 50c1.5-4 4.5-7 8.5-8.5" opacity=".4"/>',
  szal: '<path d="M34.5 15 24 35h7l-3 15 14-21h-7.5Z"/><path d="M17 27c-3 4-4 9-3 14M47 27c3 4 4 9 3 14" opacity=".45"/><path d="M22 51c6 3 14 3 20 0" opacity=".4"/>',
  kwinciok: '<path d="M32 16c5 7 4 11.5 1.5 15 3.5-1 6-3.5 7-7 4 6.5 2.5 15.5-4 20.5-2.5 2-2 5-1 8.5-4.5-1-7.5-4.5-7.5-9.5 0-4.5 2-7.5 2-11 0-4-1-7.5 2-16.5Z"/><path d="M20 30l-3-3M44 30l3-3M17 42h-4M51 42h-4" opacity=".45"/>',
  nietykalny: '<path d="M21 30h22l6 7.5-17 18.5-17-18.5Z"/><path d="M21 30l3.5 7.5h15L43 30M25 37.5l7 18.5M39 37.5l-7 18.5" opacity=".45"/>',
};

let _gid = 0;
const METALE = {
  braz:   ['#F0A868', '#9C5223'],
  srebro: ['#EDF3FB', '#8496AC'],
  zloto:  ['#FBE38F', '#C68A24'],
};
const BEZ_PRZYDOMKA = ['#7D8DA6', '#3B4A63'];

/** Odznaka jako gotowy HTML. `reign` = oprawa Gracza Miesiąca: korona nad
    tarczą i poświata, ale kolor zostaje ten od poziomu przydomka.
    `id === null` rysuje pustą tarczę — tak wygląda „jeszcze nic”. */
export function godlo(id, { rozmiar = 56, klasa = '', reign = false } = {}) {
  const p = id ? przydomek(id) : null;
  const metal = p ? (METALE[p.poziom] ?? METALE.braz) : BEZ_PRZYDOMKA;
  const gid = `ppg${(_gid += 1)}`;
  const glif = p ? (GLIFY[p.id] ?? '') : '<path d="M32 24v14M32 44v2" opacity=".55"/>';
  const korona = reign && p
    ? '<path class="godlo-korona" d="M21 12l4.5 5.5L32 9l6.5 8.5L43 12l-2 11.5H23Z"/>' : '';
  const poswiata = reign && p ? `; filter: drop-shadow(0 0 5px ${metal[0]}aa)` : '';
  const etykieta = p ? `Godło: ${p.nazwa}${reign ? ' (Gracz Miesiąca)' : ''}` : 'Brak przydomka';
  return `<svg class="godlo ${reign && p ? 'godlo-reign' : ''} ${p ? '' : 'godlo-puste'} ${klasa}"
    style="width:${rozmiar}px; color:${metal[0]}${poswiata}"
    viewBox="0 3 64 77" fill="none" stroke="url(#${gid})" stroke-width="2.4"
    stroke-linejoin="round" stroke-linecap="round"
    role="img" aria-label="${etykieta}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${metal[0]}"/><stop offset="1" stop-color="${metal[1]}"/>
    </linearGradient></defs>
    ${korona}
    <path class="godlo-tarcza" d="M32 9 60 21v25c0 16-12 28-28 33C16 74 4 62 4 46V21Z"
      fill="${metal[1]}22" stroke-width="2.6"/>
    <path class="godlo-tarcza-in" d="M32 15 54 24v21c0 13-10 23-22 27C20 68 10 58 10 45V24Z"
      fill="none" opacity=".35" stroke-width="1.3"/>
    <g class="godlo-glif" transform="translate(0 6)">${glif}</g>
  </svg>`;
}

/* --------------------------------------------------------- okresy i tytuł */

/** Dzieli sezon na okresy Gracza Miesiąca: zwykle kalendarzowy miesiąc, ale
    miesiąc z jednym wieczorem też liczy (wystarczy jeden wtorek). */
export function okresy(wieczory) {
  const grane = wieczory
    .filter((w) => !w.towarzyski && wieczorRozegrany(w))
    .sort((a, b) => a.data.localeCompare(b.data));

  const wynik = [];
  let bufor = [];
  grane.forEach((w, i) => {
    bufor.push(w);
    const nastepny = grane[i + 1];
    const koniecMiesiaca = !nastepny || nastepny.data.slice(0, 7) !== w.data.slice(0, 7);
    if (koniecMiesiaca && bufor.length >= MIN_WIECZOROW_NA_TYTUL) {
      wynik.push({ wieczory: bufor, otwarty: w.data.slice(0, 7) >= dzisiajIso().slice(0, 7) });
      bufor = [];
    }
  });
  if (bufor.length) wynik.push({ wieczory: bufor, otwarty: true });

  // Przydomek zwycięzcy liczony ze stanu NA KONIEC danego okresu.
  let poprzednieWieczory = [];
  return wynik.map((o) => {
    const doTegoOkresu = [...poprzednieWieczory, ...o.wieczory];
    const tabela = klasyfikacja(o.wieczory);
    const zwyciezca = tabela.find((r) => r.mecze > 0) ?? null;
    const miesiace = [...new Set(o.wieczory.map((w) => w.data.slice(0, 7)))];
    poprzednieWieczory = doTegoOkresu;
    return {
      klucz: miesiace.join('+'),
      nazwa: miesiace.map(nazwaMiesiaca).join(' + '),
      wieczory: o.wieczory,
      otwarty: o.otwarty,
      tabela,
      zwyciezca: o.wieczory.length < MIN_WIECZOROW_NA_TYTUL ? null : zwyciezca,
      przydomek: zwyciezca ? przydomekGracza(zwyciezca.id, doTegoOkresu) : null,
    };
  });
}

/** Aktualny Gracz Miesiąca — z ostatniego ZAMKNIĘTEGO okresu. Dopóki bieżący
    miesiąc trwa, tytuł nosi zwycięzca poprzedniego. */
export function graczMiesiaca(wieczory) {
  const lista = okresy(wieczory);
  const zamkniete = lista.filter((o) => !o.otwarty && o.zwyciezca);
  const aktualny = zamkniete.at(-1) ?? null;
  const wToku = lista.at(-1)?.otwarty ? lista.at(-1) : null;
  return { aktualny, wToku, wszystkie: lista };
}

/** Historia MVP — od najnowszego. */
export function historiaMvp(wieczory) {
  return wieczory
    .filter((w) => !w.towarzyski && wieczorRozegrany(w))
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((w) => ({ data: w.data, mvp: mvpWieczoru(w) }))
    .filter((x) => x.mvp);
}
