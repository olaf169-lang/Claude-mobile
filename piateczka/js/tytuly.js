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
    opis: 'Pięć przegranych meczów z rzędu. To już nie forma, to zaklęcie — ktoś Ci narobił pod rakietą.',
    warunek: (r) => r.przegraneZRzedu >= 5,
  },
  {
    id: 'majkel', nazwa: 'Majkel Schmeichel', poziom: 'braz',
    haslo: 'Zapierdalasz, ale formą w dół',
    opis: 'Zapierdalasz, ale formą w dół: z ostatnich siedmiu meczów wygrałeś najwyżej dwa. Roboty jest, biegania jest, punktów brak.',
    warunek: (r) => r.meczeKolejno.length >= 7 && ostatnie(r, 7).filter((m) => m.wygrany).length <= 2,
  },
  {
    id: 'pedal', nazwa: 'Mistrz Pedałowania', poziom: 'braz',
    haslo: 'W parze orzeł, sam — niekoniecznie',
    opis: 'Solidny bilans w deblu, mizerny w singlu. Na tandemie jedzie się raźniej, bo zawsze można uznać, że to drugi mocniej pedałuje.',
    warunek: (r, c) => {
      const d = c.statDebel.get(r.id);
      const p = c.statSingiel.get(r.id);
      if (!d || !p || d.mecze < 2 || p.mecze < 2) return false;
      return d.meczeW / d.mecze >= 0.6 && p.meczeW / p.mecze <= 0.35;
    },
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
    opis: 'Z ostatnich pięciu meczów cztery sety wygrane tak, że rywal utknął najwyżej na ośmiu punktach. Nikt Cię nawet nie musnął.',
    warunek: (r) => ostatnie(r, 5).reduce((suma, m) => suma + (m.setyDoOsmiu ?? 0), 0) >= 4,
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
  const statDebel = zbierz(grane, { tryb: 'debel' });
  const statSingiel = zbierz(grane, { tryb: 'singiel' });
  // Lider singla: najlepszy spośród tych, którzy zagrali co najmniej dwa
  // single I cokolwiek wygrali. Bez warunku na wygrane „Mistrzem Podwórka"
  // zostawał ktoś, kto przegrał wszystko — wystarczyło, że reszta zagrała
  // po jednym meczu i wypadła spod progu.
  const liderSingla = klasyfikacja(grane, { tryb: 'singiel' })
    .find((r) => r.mecze >= 2 && r.meczeW > 0)?.id ?? null;

  // Statystyki bieżącego miesiąca — do „Formy Kwincioka”.
  const biezacyMies = grane.at(-1)?.data.slice(0, 7) ?? null;
  const statMiesiaca = zbierz(grane.filter((w) => w.data.slice(0, 7) === biezacyMies));

  return {
    stat,
    statDebel,
    statSingiel,
    tabela,
    // Lider musi mieć choć jedną wygraną — inaczej „Hounter" (pokonałeś
    // lidera) dawałoby się zdobyć na kimś, kto nie wygrał nic.
    liderId: tabela.find((r) => r.meczeW > 0)?.id ?? null,
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

/** Wszystkie przydomki, na które gracz się aktualnie łapie — nie tylko ten
    noszony. Przydaje się, żeby sprawdzić, czy warunek w ogóle działa, bo
    `przydomekGracza` pokazuje wyłącznie zwycięzcę i słabszy trafiony warunek
    jest w nim niewidoczny. */
export function pasujacePrzydomki(id, wieczory) {
  const ctx = kontekst(wieczory);
  const r = ctx.stat.get(id);
  if (!r || r.mecze === 0) return [];
  return PRZYDOMKI.filter((pp) => {
    try { return pp.warunek(r, ctx); } catch { return false; }
  });
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

/* Rysowane w SVG, nie emoji — mają wyglądać jak odznaka. Każde godło nawiązuje
   wprost do treści przydomka.

   Zasada rysowania, wspólna dla wszystkich: bryła wypełniona gradientem na
   niskim kryciu (0,18–0,3) PLUS obrys tym samym gradientem, a najważniejszy
   detal — iskra, żar, oko — solidnym wypełnieniem. Sam cienki obrys, jak było
   wcześniej, przy 56 px po prostu znikał.

   Kolory NIE są tutaj, tylko w styles.css jako zmienne `--metal-1` / `--metal-2`
   ustawiane klasą poziomu. Dzięki temu motyw jasny ma własny, ciemniejszy
   komplet metali — poprzednio górny stop srebra (#EDF3FB) miał na białej
   karcie kontrast 1,12:1, czyli był po prostu niewidoczny.

   `#@` w ścieżkach to podmieniany znacznik gradientu tej konkretnej odznaki. */
const GLIFY = {
  /* ------------------------------------------------------------- brąz */

  // Łza — duża, spadająca, z refleksem światła.
  plakal: '<path d="M32 16.5c8.2 11.2 12.8 18.3 12.8 24A12.8 12.8 0 0 1 19.2 40.5c0-5.7 4.6-12.8 12.8-24Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<path d="M25 41c0 4.4 2.9 8.1 7.2 9.1" opacity=".55"/>'
    + '<ellipse cx="27" cy="34" rx="1.9" ry="2.8" transform="rotate(-20 27 34)" fill="url(#@)" stroke="none" opacity=".55"/>',

  // Dopalający się „joincik": ustnik, żar na końcu i dym unoszący się w górę.
  spalona: '<path d="M19.5 47 36 30.5" stroke-width="6"/>'
    + '<path d="M19.5 47 24 42.5" stroke-width="6" opacity=".4"/>'
    + '<circle cx="39.4" cy="27.2" r="3.9" fill="url(#@)" stroke="none"/>'
    + '<circle cx="39.4" cy="27.2" r="1.7" fill="url(#@)" stroke="none" opacity=".45"/>'
    + '<path d="M44.5 21.5c2.8-2.6 1.4-5.4-.8-7.2" opacity=".5"/>'
    + '<path d="M49 25c2.8-2.6 1.3-5.8-1-7.5" opacity=".3"/>'
    + '<path d="M30 39.5 26 42M34 34.5 30 37" opacity=".3"/>',

  // Falki wiatru — klasyczny znak podmuchu, trzy smugi z zawijasem.
  pierd: '<path d="M14.5 26.5h19a5.6 5.6 0 1 0-5.6-5.6"/>'
    + '<path d="M14.5 35.5h25.5a6.2 6.2 0 1 1-6.2 6.2"/>'
    + '<path d="M16.5 44.5h13" opacity=".65"/>',

  // Czaszka z klątwy: wypełniona, oczodoły solidne, zęby u dołu.
  klatwa: '<path d="M32 17.5c9.8 0 16 6.8 16 15 0 5.2-2.6 8.8-5.2 10.9V49H21.2v-5.6C18.6 41.3 16 37.7 16 32.5c0-8.2 6.2-15 16-15Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<circle cx="25.2" cy="33.5" r="3.9" fill="url(#@)" stroke="none"/>'
    + '<circle cx="38.8" cy="33.5" r="3.9" fill="url(#@)" stroke="none"/>'
    + '<path d="M32 38.5l-2.2 4.4h4.4Z" fill="url(#@)" stroke="none" opacity=".8"/>'
    + '<path d="M26.5 49v-4.2M32 49v-4.2M37.5 49v-4.2" opacity=".5"/>',

  // Bolid F1 z boku: tylne skrzydło, klin nadwozia, halo i dwa grube koła.
  majkel: '<path d="M14 25h10M14 28.5h10" stroke-width="2.8"/>'
    + '<path d="M14.5 23v7.5M23.5 23v7.5" opacity=".85"/>'
    + '<path d="M19 30.5V36" opacity=".7"/>'
    + '<path d="M15 41.5v-5.2l8-1.4h13l9.5 2.3 6 2.3v2Z" fill="url(#@)" fill-opacity=".28"/>'
    + '<circle cx="30.5" cy="31.6" r="3.2" fill="url(#@)" fill-opacity=".6"/>'
    + '<path d="M25.8 32.4a5.4 5.4 0 0 1 9.4 0" opacity=".55"/>'
    + '<circle cx="22.5" cy="40" r="5.6"/><circle cx="22.5" cy="40" r="2" fill="url(#@)" stroke="none" opacity=".5"/>'
    + '<circle cx="43" cy="40" r="5.2"/><circle cx="43" cy="40" r="1.9" fill="url(#@)" stroke="none" opacity=".5"/>'
    + '<path d="M47.5 43.5h5" stroke-width="2.8"/><path d="M52 41.5v4" opacity=".85"/>'
,

  /* ----------------------------------------------------------- srebro */

  // Młot z obuchem i trzonkiem — bryła zamiast samego konturu.
  mlot: '<path d="M17.5 18h29v12.5h-29Z" fill="url(#@)" fill-opacity=".28"/>'
    + '<path d="M28.3 30.5 26.8 51h10.4L35.7 30.5" fill="url(#@)" fill-opacity=".2"/>'
    + '<path d="M22 24h20" opacity=".4"/>',

  // Mur obronny z blankami i wiązaniem cegieł.
  mur: '<path d="M16 28.5h4.5v-4.5h5.5v4.5h5.5v-4.5h5.5v4.5H43V24h5v24H16Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<path d="M16 35h32M16 41.5h32" opacity=".55"/>'
    + '<path d="M26 28.5V35M37 28.5V35M21 35v6.5M32 35v6.5M43 35v6.5M26 41.5V48M37 41.5V48" opacity=".45"/>',

  // Wąska maska Robina — oczy wycięte regułą evenodd, więc prześwituje tarcza.
  robin: '<path fill-rule="evenodd" d="M13 31.5c5.4-3.6 12.2-5.4 19-5.4s13.6 1.8 19 5.4c-1.1 6.8-5.8 11.6-11 11.6-3.4 0-6.1-2-8-5.3-1.9 3.3-4.6 5.3-8 5.3-5.2 0-9.9-4.8-11-11.6Zm7.4 1.6c1.5-1.5 5.4-1.5 7 .4-1.4 1.9-5.5 1.9-7-.4Zm16.2.4c1.6-1.9 5.5-1.9 7-.4-1.5 2.3-5.6 2.3-7 .4Z" fill="url(#@)" fill-opacity=".3"/>',

  // Duch z celownikiem zamiast twarzy.
  hounter: '<path d="M21 47.5V33.5a11 11 0 0 1 22 0v14l-3.7-3.2-3.6 3.2-3.7-3.2-3.6 3.2Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<circle cx="32" cy="32.5" r="7.4" stroke-width="2.1"/>'
    + '<path d="M32 21.5v6M32 37.5v6M21 32.5h6M37 32.5h6"/>'
    + '<circle cx="32" cy="32.5" r="1.8" fill="url(#@)" stroke="none"/>',

  // Hełm gladiatora: pióropusz z fakturą, nanośnik i nauszniki.
  gladiator: '<path d="M26.5 17c3-4.8 8-4.8 11 0l-1.2 6.5h-8.6Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M29 18.5c1.6-1.2 4.4-1.2 6 0M28.5 21.5c1.8-1.2 5.2-1.2 7 0" opacity=".45"/>'
    + '<path d="M19.5 49.5c0-18 5.6-26 12.5-26s12.5 8 12.5 26h-6.4l-1.5-8.8h-9.2L25.9 49.5Z" fill="url(#@)" fill-opacity=".18"/>'
    + '<path d="M25 34.5h5.6M33.4 34.5H39" stroke-width="3"/>'
    + '<path d="M32 30v9" opacity=".55"/>'
    + '<path d="M24.5 41.5v8M39.5 41.5v8" opacity=".4"/>',

  // Puchar podwórkowy między dwiema sztachetami płotu.
  podworko: '<path d="M23 19h18v11.5a9 9 0 0 1-18 0Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M41 22h6a6 6 0 0 1-6 7.6M23 22h-6a6 6 0 0 0 6 7.6" opacity=".7"/>'
    + '<path d="M27.5 22.5h9" opacity=".45"/>'
    + '<path d="M32 39.5v6"/>'
    + '<path d="M24.5 51h15l-1.6-5.5H26.1Z" fill="url(#@)" fill-opacity=".3"/>',

  /* ------------------------------------------------------------ złoto */

  // Tandem: dwa koła, rama na dwa siodełka, dwie kierownice, korby z pedałami.
  pedal: '<circle cx="17" cy="42" r="8.5"/><circle cx="47" cy="42" r="8.5"/>'
    + '<circle cx="32" cy="42" r="3" fill="url(#@)" stroke="none" opacity=".6"/>'
    + '<path d="M17 42 26 28h8l-4.5 14M32 42 41 28h6" fill="url(#@)" fill-opacity=".14"/>'
    + '<path d="M26 28h-3.5M41 28h-3.5" stroke-width="2.2"/>'
    + '<path d="M22.5 25.5v3M37.5 25.5v3" opacity=".8"/>'
    + '<path d="M20.5 30.5h6M35.5 30.5h6" stroke-width="2.6"/>'
    + '<path d="M28 44.5h8" opacity=".5"/>',

  // Trysk ze źródła — dysza i wachlarz strug z kroplami na końcach.
  mmmpuuu: '<path d="M12.5 33.5h8.5l4.5 3.2v3.6L21 43.5h-8.5Z" fill="url(#@)" fill-opacity=".32"/>'
    + '<path d="M29.8 35.5 36.2 29.8M30.5 36.4 38 32.4M30.9 37.4 41.5 34.8M31 38.5 42 38.5M30.9 39.6 41.5 42.2M30.5 40.6 38 44.6M29.8 41.5 36.2 47.2" stroke-width="2.8"/>'
    + '<circle cx="39.3" cy="27" r="1.5" fill="url(#@)" stroke="none" opacity=".75"/>'
    + '<circle cx="45.6" cy="33.7" r="1.8" fill="url(#@)" stroke="none"/>'
    + '<circle cx="46.2" cy="38.5" r="2.4" fill="url(#@)" stroke="none"/>'
    + '<circle cx="45.6" cy="43.3" r="1.8" fill="url(#@)" stroke="none"/>'
    + '<circle cx="39.3" cy="50" r="1.5" fill="url(#@)" stroke="none" opacity=".75"/>',

  // Szał: lotka w środku eksplozji promieni, plus iskry.
  szal: '<ellipse cx="26" cy="25.5" rx="10" ry="12" transform="rotate(-30 26 25.5)" fill="url(#@)" fill-opacity=".16"/>'
    + '<path d="M18.2 16.6 33.4 29.8M15.4 21.2 30.6 34.4M21.6 13.6 35 25.2" opacity=".4" stroke-width="1.4"/>'
    + '<path d="M20 30.8 31.4 19.4M16.6 26.4 28 15M24 34.4 35.4 23" opacity=".4" stroke-width="1.4"/>'
    + '<path d="M30.4 33.2 34.6 38.4M37.8 29.8 34.6 38.4" opacity=".75"/>'
    + '<path d="M34.6 38.4 41 45.6" stroke-width="3"/>'
    + '<path d="M39.8 44.2 44 49" stroke-width="5.6" opacity=".75"/>'
    + '<path d="M42 12.5l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1Z" fill="url(#@)" stroke="none"/>'
    + '<path d="M48 24l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8Z" fill="url(#@)" stroke="none" opacity=".85"/>'
    + '<path d="M13.5 36l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z" fill="url(#@)" stroke="none" opacity=".6"/>'
    + '<path d="M39 17.5c3.6-1.1 6.9-.4 9.6 2M43.5 33c2.6 1.7 4.2 4.3 4.7 7.6" opacity=".32"/>',

  // Płomień z rozgrzanym rdzeniem, iskrami i podmuchem po bokach.
  kwinciok: '<path d="M19.4 43.3 20.7 38.1 17.5 35.0 20.0 31.4 15.7 25.6 22.9 25.3 22.6 18.5 28.6 21.8 32.0 13.2 35.4 21.8 41.2 18.8 41.1 25.3 47.9 25.7 44.0 31.4 46.5 35.0 43.3 38.1 45.2 43.8" stroke-width="1.4" stroke-linejoin="miter" opacity=".24"/>'
    + '<path d="M21.7 41.6 22.0 37.5 20.2 34.7 21.4 31.6 18.3 26.8 24.0 26.3 24.1 20.9 29.0 23.1 32.0 16.0 35.0 23.1 39.7 21.1 40.0 26.3 45.4 27.0 42.6 31.6 43.8 34.7 42.0 37.5 43.0 42.1" stroke-width="1.9" stroke-linejoin="miter" opacity=".9"/>'
    + '<circle cx="32" cy="31" r="4" fill="url(#@)" fill-opacity=".4"/>'
    + '<path d="M32 35v6.4"/>'
    + '<path d="M32 36.4 26.9 38.9 27.9 43.1M32 36.4 37.1 38.9 36.1 43.1"/>'
    + '<path d="M32 41.4 28.1 47.7M32 41.4 35.9 47.7"/>',

  // Brylant z fasetami — plus jedna iskra, żeby błyszczał.
  nietykalny: '<path d="M21 25.5h22l7.5 8.5L32 53 13.5 34Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<path d="M21 25.5l3.6 8.5h14.8l3.6-8.5M13.5 34h37M24.6 34 32 53M39.4 34 32 53" opacity=".5"/>'
    + '<path d="M47.5 19l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" fill="url(#@)" stroke="none" opacity=".85"/>',
};

let _gid = 0;

/** Odznaka jako gotowy HTML. `reign` = oprawa Gracza Miesiąca: korona nad
    tarczą i poświata, ale kolor zostaje ten od poziomu przydomka.
    `id === null` rysuje pustą tarczę — tak wygląda „jeszcze nic”.

    Kolory idą przez klasę `godlo-<poziom>` i zmienne CSS, nie przez styl
    w atrybucie — dlatego motyw jasny może mieć własny, ciemniejszy komplet
    metali, a poświata sama się do niego dostraja. */
export function godlo(id, { rozmiar = 56, klasa = '', reign = false } = {}) {
  const p = id ? przydomek(id) : null;
  const poziom = p && POZIOMY[p.poziom] ? p.poziom : (p ? 'braz' : 'puste');
  const gid = `ppg${(_gid += 1)}`;
  const glif = p
    ? (GLIFY[p.id] ?? '').replaceAll('#@', `#${gid}`)
    : '<path d="M32 25v13M32 44v2.5" opacity=".6"/>';
  const korona = reign && p
    ? '<path class="godlo-korona" d="M21 12l4.5 5.5L32 9l6.5 8.5L43 12l-2 11.5H23Z"/>' : '';
  const etykieta = p ? `Godło: ${p.nazwa}${reign ? ' (Gracz Miesiąca)' : ''}` : 'Brak przydomka';
  return `<svg class="godlo godlo-${poziom} ${reign && p ? 'godlo-reign' : ''} ${klasa}"
    style="width:${rozmiar}px" viewBox="0 3 64 77" fill="none" stroke="url(#${gid})"
    stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"
    role="img" aria-label="${etykieta}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--metal-1)"/><stop offset="1" stop-color="var(--metal-2)"/>
    </linearGradient></defs>
    ${korona}
    <path class="godlo-tarcza" d="M32 9 60 21v25c0 16-12 28-28 33C16 74 4 62 4 46V21Z"
      fill="url(#${gid})" fill-opacity=".1" stroke-width="2.8"/>
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
