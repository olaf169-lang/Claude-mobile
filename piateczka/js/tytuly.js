/* ==========================================================================
   Przydomki, MVP dnia i Gracz Miesiąca.

   KAŻDY gracz ma przydomek przez cały czas — to jego ksywka bojowa, liczona
   na bieżąco z sezonowych statystyk. Nie jest losowy: appka sprawdza warunki
   od najtrudniejszego (złoto) do najzwyklejszego (brąz) i bierze pierwszy
   pasujący. Kto nie załapie się na nic wyczynowego, dostaje przydomek
   startowy — lekki, „dla klimatu" — i to one na starcie sezonu rozdają się
   każdemu inne, żeby nikt nie miał tego samego co kolega.

   Gdy zakwalifikujesz się na lepszy przydomek, stary znika. Jak długo tkwisz
   na tym samym poziomie, appka rotuje wśród równorzędnych, żebyś nie nosił
   w kółko jednej ksywki.

   MVP — najlepsze saldo wieczoru. Gracz Miesiąca — najlepsze saldo miesiąca;
   nie dostaje osobnego znaczka, tylko jego przydomek świeci wtedy na złoto.
   ========================================================================== */

import { GRACZE, nazwaMiesiaca, dzisiajIso } from './dane.js';
import { klasyfikacja, mvpWieczoru, wieczorRozegrany, zbierz, rekordyWieczoru, mecze } from './liczenie.js';

export const MIN_WIECZOROW_NA_TYTUL = 1;

/* Trzy poziomy trudności — kolor godła bierze się stąd. */
export const POZIOMY = {
  braz:   { nazwa: 'Brąz',   klasa: 'godlo-braz' },
  srebro: { nazwa: 'Srebro', klasa: 'godlo-srebro' },
  zloto:  { nazwa: 'Złoto',  klasa: 'godlo-zloto' },
};

/* ------------------------------------------------------------- przydomki

   Kolejność = od najrzadszego do najzwyklejszego. Gracz dostaje pierwszy
   z góry, na który się kwalifikuje. `rodzaj: 'start'` to przydomki bez
   warunku — wchodzą, gdy nic wyczynowego nie pasuje. */

export const PRZYDOMKI = [
  /* ----------------------------------------------------------- BRĄZ (zdobywany) */
  {
    id: 'mur', nazwa: 'Mur', poziom: 'braz',
    haslo: 'Beton nie do przejścia',
    opis: 'Straciłeś najmniej punktów ze wszystkich. Wygrana zaczyna się od tego, że rywal w ogóle nie punktuje.',
    warunek: (r, c) => r.mecze > 0 && c.iluGra >= 2 && r.stracone === c.minStracone,
  },
  {
    id: 'mlot', nazwa: 'Młot', poziom: 'braz',
    haslo: 'Wali do skutku',
    opis: 'Zdobyłeś najwięcej punktów ze wszystkich. Metoda prosta: przywalać, aż przestanie wracać.',
    warunek: (r, c) => r.mecze > 0 && c.iluGra >= 2 && r.zdobyte === c.maxZdobyte,
  },

  /* --------------------------------------------------------- STARTOWE (brąz, bez warunku) */
  { id: 'kozak',   nazwa: 'Kozak',   poziom: 'braz', rodzaj: 'start', haslo: 'Równy chłop',
    opis: 'Bez fajerwerków w statystykach, za to zawsze na miejscu i zawsze da radę. Klasa równa i pełna.' },
  { id: 'weteran', nazwa: 'Weteran', poziom: 'braz', rodzaj: 'start', haslo: 'Ogrywany od zawsze',
    opis: 'Wie, gdzie stanąć, zanim lotka doleci. Doświadczenie robi swoje.' },
  { id: 'ninja',   nazwa: 'Ninja',   poziom: 'braz', rodzaj: 'start', haslo: 'Znikąd, a boli',
    opis: 'Cichy, niepozorny, a punkt spada znienacka. Nie usłyszysz, kiedy Cię zdejmie.' },
  { id: 'szeryf',  nazwa: 'Szeryf',  poziom: 'braz', rodzaj: 'start', haslo: 'Trzyma porządek na korcie',
    opis: 'Na jego połowie panuje prawo. Kto wchodzi z buta, ten dostaje mandat.' },
  { id: 'cwaniak', nazwa: 'Cwaniak', poziom: 'braz', rodzaj: 'start', haslo: 'Wywinie się z każdej',
    opis: 'Tam, gdzie inni tracą, on kombinuje i wychodzi cało. Spryt ponad siłę.' },

  /* --------------------------------------------------------------- SREBRO */
  {
    id: 'walec', nazwa: 'Walec', poziom: 'srebro',
    haslo: 'Równa z trawą',
    opis: 'Twoje saldo to średnio co najmniej dwanaście na wieczór. To nie była gra, to były roboty drogowe.',
    warunek: (r) => r.wieczory >= 1 && r.saldo / r.wieczory >= 12,
  },
  {
    id: 'watazka', nazwa: 'Watażka', poziom: 'srebro',
    haslo: 'Przejął stery',
    opis: 'Dwa wtorki z rzędu bez przegranego meczu. Wjechałeś na halę i zrobiłeś porządek.',
    warunek: (r, c) => (c.passa.get(r.id) ?? 0) >= 2,
  },
  {
    id: 'armia', nazwa: 'Jednoosobowa Armia', poziom: 'srebro',
    haslo: 'Uciągnie każdego',
    opis: 'Dodatni bilans z KAŻDYM partnerem, z jakim grałeś. Kogo byś nie dostał, wychodziliście na plus.',
    warunek: (r) => {
      const p = Object.values(r.partnerzy);
      return p.length >= 2 && p.every((x) => x > 0);
    },
  },
  {
    id: 'chirurg', nazwa: 'Chirurg', poziom: 'srebro',
    haslo: 'Nerwy ze stali',
    opis: 'Najlepszy w setach rozstrzyganych o włos, na dwa punkty (minimum trzy takie). Ręka nie zadrży.',
    warunek: (r, c) => r.setyNaStyk >= 3
      && r.setyNaStykW / r.setyNaStyk > 0.55
      && r.setyNaStykW / r.setyNaStyk >= c.najlepszyStyk - 1e-9,
  },
  {
    id: 'lokomotywa', nazwa: 'Lokomotywa', poziom: 'srebro',
    haslo: 'Rozpędu nie hamuje',
    opis: 'Sześć wygranych setów pod rząd, licząc też te z zeszłego wtorku. Rozpędził się i pojechał.',
    warunek: (r) => r.najdluzszaSeria >= 6,
  },

  /* ---------------------------------------------------------------- ZŁOTO */
  {
    id: 'nietykalny', nazwa: 'Nietykalny', poziom: 'zloto',
    haslo: 'Ani jednej rysy',
    opis: 'Rozegrałeś w miesiącu co najmniej pięć meczów i nie oddałeś ani jednego. Nikt Cię nawet nie musnął.',
    warunek: (r) => r.mecze >= 5 && r.meczeP === 0,
  },
  {
    id: 'feniks', nazwa: 'Feniks', poziom: 'zloto',
    haslo: 'Z popiołów na tron',
    opis: 'Miesiąc temu zamykałeś tabelę, teraz jej przewodzisz. Powstanie z martwych w najczystszej postaci.',
    warunek: (r, c) => c.liderId === r.id && c.poprzedniaTabela
      && c.poprzedniaTabela.length >= 2 && c.poprzedniaTabela.at(-1) === r.id,
  },
  {
    id: 'nieustepliwy', nazwa: 'Nieustępliwy', poziom: 'zloto',
    haslo: 'Zawsze na posterunku',
    opis: 'Byłeś na co najmniej dziewięciu wtorkach na dziesięć. Choćby się waliło i paliło, Ty jesteś na hali.',
    warunek: (r, c) => c.wieczorowRazem >= 5 && r.wieczory / c.wieczorowRazem >= 0.9,
  },
  {
    id: 'gladiator', nazwa: 'Gladiator', poziom: 'zloto',
    haslo: 'Dobija na przewagi',
    opis: 'Wygrałeś co najmniej dwa sety po dogrywce 15:15 — takie na 18:16 czy 21:19. W boju o życie się nie łamiesz.',
    warunek: (r) => r.setyPrzewagaW >= 2,
  },
];

const STARTOWE = PRZYDOMKI.filter((p) => p.rodzaj === 'start');
export const przydomek = (id) => PRZYDOMKI.find((p) => p.id === id) ?? STARTOWE[0];

/* ------------------------------------------ przydomek gracza (na bieżąco) */

function seedId(id) {
  return Math.max(0, GRACZE.findIndex((g) => g.id === id));
}

/** Kontekst z porównaniami między graczami + dane, których nie widać w samym
    rekordzie sezonowym (passy, poprzednia tabela). Liczony raz na wywołanie. */
function kontekst(wieczory) {
  const grane = wieczory.filter((w) => !w.towarzyski && wieczorRozegrany(w))
    .sort((a, b) => a.data.localeCompare(b.data));
  const stat = zbierz(grane);
  const graja = [...stat.values()].filter((r) => r.mecze > 0);

  // Passa: ile wtorków z rzędu (do teraz) bez przegranego meczu.
  const biezaca = new Map(GRACZE.map((g) => [g.id, 0]));
  const passa = new Map(GRACZE.map((g) => [g.id, 0]));
  for (const w of grane) {
    const dzien = rekordyWieczoru(w);
    for (const g of GRACZE) {
      const r = dzien.get(g.id);
      if (!r || r.mecze === 0) continue;               // nie grał — passa się nie zmienia
      if (r.meczeP === 0) biezaca.set(g.id, biezaca.get(g.id) + 1);
      else biezaca.set(g.id, 0);
      passa.set(g.id, Math.max(passa.get(g.id), biezaca.get(g.id)));
    }
  }

  // Poprzednia tabela: stan na koniec ostatniego zamkniętego miesiąca.
  const biezacyMies = grane.at(-1)?.data.slice(0, 7) ?? null;
  const wczesniej = grane.filter((w) => w.data.slice(0, 7) < biezacyMies);
  const poprzedniaTabela = wczesniej.length ? klasyfikacja(wczesniej).map((r) => r.id) : null;

  return {
    stat,
    liderId: klasyfikacja(grane)[0]?.id ?? null,
    poprzedniaTabela,
    wieczorowRazem: grane.length,
    iluGra: graja.length,
    minStracone: graja.length ? Math.min(...graja.map((r) => r.stracone)) : 0,
    maxZdobyte: graja.length ? Math.max(...graja.map((r) => r.zdobyte)) : 0,
    najlepszyStyk: graja.length
      ? Math.max(...graja.map((r) => (r.setyNaStyk ? r.setyNaStykW / r.setyNaStyk : -1))) : -1,
    passa,
  };
}

const ZDOBYWANE = PRZYDOMKI.filter((p) => p.rodzaj !== 'start');
const RANGA = { zloto: 3, srebro: 2, braz: 1 };

/** Wybiera przydomek jednego gracza na podstawie gotowego kontekstu. */
function wybierz(id, ctx) {
  const r = ctx.stat.get(id);
  if (!r) return STARTOWE[0];

  const pasuja = ZDOBYWANE.filter((p) => {
    try { return p.warunek(r, ctx); } catch { return false; }
  });
  if (pasuja.length) {
    // Bierzemy najwyższy poziom, a wśród równorzędnych rotujemy z tygodniami,
    // żeby ta sama osoba nie nosiła w kółko jednej ksywki.
    const najlepszy = Math.max(...pasuja.map((p) => RANGA[p.poziom]));
    const grupa = pasuja.filter((p) => RANGA[p.poziom] === najlepszy);
    return grupa[(r.wieczory + seedId(id)) % grupa.length];
  }
  // Startowy — na starcie każdy inny (indeks gracza), potem powolna rotacja.
  const obrot = seedId(id) + Math.floor(r.wieczory / 2);
  return STARTOWE[obrot % STARTOWE.length];
}

/** Przydomek pojedynczego gracza — wygodne, samodzielne wywołanie. */
export function przydomekGracza(id, wieczory) {
  return wybierz(id, kontekst(wieczory));
}

/** Przydomki całej czwórki naraz + kto jest Graczem Miesiąca (świeci na złoto).
    Zwraca mapę id → { przydomek, reign }. */
export function przydomkiGraczy(wieczory) {
  const ctx = kontekst(wieczory);
  const gm = graczMiesiaca(wieczory);
  const krolId = gm.aktualny?.zwyciezca.id ?? gm.wToku?.zwyciezca?.id ?? null;
  const mapa = new Map();
  for (const g of GRACZE) mapa.set(g.id, { przydomek: wybierz(g.id, ctx), reign: g.id === krolId });
  return mapa;
}

/* ----------------------------------------------------------------- godła */

/* Rysowane w SVG, nie emoji — mają wyglądać jak odznaka. Godło nawiązuje do
   treści przydomka (Chirurg = celownik, Gladiator = hełm, Mur = ceglana
   ściana), a kolor bierze się z poziomu trudności. */
const GLIFY = {
  mur: '<rect x="15" y="26" width="34" height="8" rx="1.5"/><rect x="15" y="34" width="34" height="8" rx="1.5"/><rect x="15" y="42" width="34" height="8" rx="1.5"/><path d="M26 26v8M38 26v8M20 34v8M32 34v8M44 34v8M26 42v8M38 42v8" opacity=".45"/>',
  mlot: '<rect x="19" y="19" width="26" height="11" rx="2.5"/><path d="M29 30l-1.5 24h9L35 30"/><path d="M23 24.5h18" opacity=".4"/>',
  kozak: '<path d="M32 18l4.9 10.1 11 1.6-8 7.7 1.9 11L32 44l-9.7 5.2 1.9-11-8-7.7 11-1.6Z"/>',
  weteran: '<path d="M25 19l7 11 7-11" opacity=".85"/><circle cx="32" cy="42" r="11"/><path d="M32 37l1.7 3.4 3.8.5-2.8 2.7.7 3.8L32 45.7l-3.4 1.8.7-3.8-2.8-2.7 3.8-.5Z" opacity=".7"/>',
  ninja: '<path d="M17 31h30v4c0 8-6 15-15 15s-15-7-15-15Z"/><path d="M47 32l6 2M47 36l6 2"/><path d="M24 40l6-1.5M40 40l-6-1.5"/>',
  szeryf: '<circle cx="32" cy="38" r="14"/><path d="M32 27l2.4 5 5.4.8-3.9 3.8.9 5.4L32 45.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/>',
  cwaniak: '<path d="M20 23l8 8M44 23l-8 8"/><path d="M22 29c1 10 5 16 10 20 5-4 9-10 10-20l-10 4Z"/><circle cx="28" cy="37" r="1.4" fill="currentColor" stroke="none"/><circle cx="36" cy="37" r="1.4" fill="currentColor" stroke="none"/><path d="M31 43h2" opacity=".6"/>',
  walec: '<rect x="13" y="23" width="22" height="11" rx="3"/><circle cx="42" cy="42" r="10"/><circle cx="42" cy="42" r="3.5" opacity=".5"/><rect x="15" y="37" width="10" height="9" rx="2"/>',
  watazka: '<path d="M17 23c11 3 21 13 27 27"/><path d="M47 23c-11 3-21 13-27 27"/><path d="M15 23h6.5M15 23v6.5" opacity=".75"/><path d="M49 23h-6.5M49 23v6.5" opacity=".75"/>',
  armia: '<path d="M15 41a17 13 0 0 1 34 0"/><rect x="12" y="41" width="40" height="6.5" rx="3"/><path d="M32 25l2.5 5.2 5.7.8-4.1 4 1 5.7L32 44l-5.1 2.7 1-5.7-4.1-4 5.7-.8Z"/>',
  chirurg: '<circle cx="32" cy="37" r="13"/><path d="M32 19v9M32 46v9M14 37h9M41 37h9"/><circle cx="32" cy="37" r="2.8" fill="currentColor" stroke="none"/>',
  lokomotywa: '<rect x="15" y="29" width="27" height="14" rx="2.5"/><rect x="19" y="21" width="6" height="8" rx="1.5"/><circle cx="23" cy="49" r="5"/><circle cx="37" cy="49" r="5"/><path d="M42 33h7v10h-7" opacity=".6"/>',
  nietykalny: '<path d="M21 30h22l6 7.5-17 18.5-17-18.5Z"/><path d="M21 30l3.5 7.5h15L43 30M25 37.5l7 18.5M39 37.5l-7 18.5" opacity=".45"/>',
  feniks: '<path d="M32 18c4.5 5.5 3.5 9.5 1 13 3.2-1 5.5-3.2 6.5-6.5 3.2 5.5 2 12.5-3.5 16.5-2 1.5-2 3.5-1 6.5-3.5-1-5.5-3.5-5.5-7.5 0-4 2-6.5 2-9.5 0-3.5-1-6.5.5-13Z"/><path d="M22 30c-3.5 3.5-4.5 8.5-2 13M42 30c3.5 3.5 4.5 8.5 2 13" opacity=".5"/>',
  nieustepliwy: '<path d="M13 51l11.5-24 7 12.5 5.5-9.5L51 51Z"/><path d="M24.5 27l-4.5 8.5h9Z" opacity=".5"/>',
  gladiator: '<path d="M30 18c3.5 3 4.5 9.5 4 14h-8c-.5-6 1-11 4-14Z"/><path d="M21 43a11 10 0 0 1 22 0Z"/><path d="M21 43v3a11 11 0 0 0 22 0v-3Z"/><path d="M32 46.5v7" opacity=".55"/>',
};

let _gid = 0;
const METALE = {
  braz:   ['#F0A868', '#9C5223'],
  srebro: ['#EDF3FB', '#8496AC'],
  zloto:  ['#FBE38F', '#C68A24'],
};

/** Odznaka jako gotowy HTML. `reign` = oprawa Gracza Miesiąca: złota korona
    nad tarczą i poświata, niezależnie od poziomu przydomka. */
export function godlo(id, { rozmiar = 56, klasa = '', reign = false } = {}) {
  const p = przydomek(id);
  const metal = METALE[p.poziom] ?? METALE.braz;
  const gid = `ppg${(_gid += 1)}`;
  const glif = GLIFY[id] ?? GLIFY.kozak;
  const korona = reign
    ? '<path class="godlo-korona" d="M21 12l4.5 5.5L32 9l6.5 8.5L43 12l-2 11.5H23Z"/>' : '';
  const poswiata = reign ? `; filter: drop-shadow(0 0 5px ${metal[0]}aa)` : '';
  return `<svg class="godlo ${reign ? 'godlo-reign' : ''} ${klasa}" style="width:${rozmiar}px; color:${metal[0]}${poswiata}"
    viewBox="0 3 64 77" fill="none" stroke="url(#${gid})" stroke-width="2.4"
    stroke-linejoin="round" stroke-linecap="round"
    role="img" aria-label="Godło: ${p.nazwa}${reign ? ' (Gracz Miesiąca)' : ''}">
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
    const zwyciezca = tabela[0];
    const miesiace = [...new Set(o.wieczory.map((w) => w.data.slice(0, 7)))];
    poprzednieWieczory = doTegoOkresu;
    return {
      klucz: miesiace.join('+'),
      nazwa: miesiace.map(nazwaMiesiaca).join(' + '),
      wieczory: o.wieczory,
      otwarty: o.otwarty,
      tabela,
      zwyciezca: o.wieczory.length < MIN_WIECZOROW_NA_TYTUL ? null : zwyciezca,
      przydomek: zwyciezca ? przydomekGracza(zwyciezca.id, doTegoOkresu) : STARTOWE[0],
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
