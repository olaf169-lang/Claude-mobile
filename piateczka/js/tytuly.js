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
    opis: 'Z ostatnich 6 meczów 2 przegrałeś dopiero w 3. secie. Urwać urwałeś, dowieźć nie dowiozłeś — ale szło się bić do końca. #NiePłakał',
    warunek: (r) => ostatnie(r, 6).filter((m) => !m.wygrany && m.trzySety).length >= 2,
  },
  {
    id: 'spalona', nazwa: 'Spalona Gierka', poziom: 'braz',
    haslo: 'Spaliłeś się dziś smyku za mocno',
    opis: 'Spaliłeś się dziś smyku za mocno — 3 przegrane w jeden wieczór. Zaczęło się obiecująco, pary poszły w 1. secie.',
    warunek: (r) => (r.dni.at(-1)?.p ?? 0) >= 3,
  },
  {
    id: 'pierd', nazwa: 'Pierd w Cwelsalce', poziom: 'braz',
    haslo: 'Było głośno, nie było efektu',
    opis: 'Przegrałeś seta, zdobywając najwyżej 4 punkty. Huku dużo, śladu żadnego.',
    warunek: (r) => r.najgorszyPrzegranySet !== null && r.najgorszyPrzegranySet <= 4,
  },
  {
    id: 'klatwa', nazwa: 'Klątwa Kamisha', poziom: 'braz',
    haslo: 'Kamish BBK przyszedł i rzucił urok',
    opis: '5 przegranych meczów z rzędu. To już nie forma, to zaklęcie — ktoś Ci narobił pod rakietą.',
    warunek: (r) => r.przegraneZRzedu >= 5,
  },
  {
    id: 'majkel', nazwa: 'Majkel Schmeichel', poziom: 'braz',
    haslo: 'Zapierdalasz, ale formą w dół',
    opis: 'Zapierdalasz, ale formą w dół: z ostatnich 7 meczów wygrałeś najwyżej 2. Roboty jest, biegania jest, punktów brak.',
    warunek: (r) => r.meczeKolejno.length >= 7 && ostatnie(r, 7).filter((m) => m.wygrany).length <= 2,
  },
  {
    id: 'pedal', nazwa: 'Mistrz Pedałowania', poziom: 'braz',
    haslo: 'W parze orzeł, sam — niekoniecznie',
    opis: 'Min. 60% wygranych w deblu i najwyżej 35% w singlu. Na tandemie jedzie się raźniej — zawsze można uznać, że to drugi mocniej pedałuje.',
    warunek: (r, c) => {
      const d = c.statDebel.get(r.id);
      const p = c.statSingiel.get(r.id);
      if (!d || !p || d.mecze < 2 || p.mecze < 2) return false;
      return d.meczeW / d.mecze >= 0.6 && p.meczeW / p.mecze <= 0.35;
    },
  },

  /* ----------------------------------------------------------- SREBRO */
  {
    id: 'wbite', nazwa: 'Masz Wbite', poziom: 'srebro',
    haslo: '10 pkt za styl',
    opis: 'Zdobyłeś najwięcej punktów w ostatnich 5 meczach i się nawet nie spociłeś.',
    warunek: (r, c) => c.iluGra >= 2 && c.najlepszeZOstatnich5 > 0
      && sumaZOstatnich(r, 5) === c.najlepszeZOstatnich5,
  },
  {
    id: 'bezrobocie', nazwa: 'Bezrobocie', poziom: 'srebro',
    haslo: 'Nie było przy czym pracować',
    opis: 'Straciłeś najmniej punktów ze wszystkich. Rywale trafiali tak rzadko, że mogłeś rozłożyć leżak i poczekać na koniec seta.',
    warunek: (r, c) => r.mecze > 0 && c.iluGra >= 2 && r.stracone === c.minStracone,
  },
  {
    id: 'robin', nazwa: 'Robin', poziom: 'srebro',
    haslo: 'Do peleryny jeszcze trochę',
    opis: 'Zawsze drugi. Batman ma różne gadżety, a Ty możesz co najwyżej potrzymać rakietę kolegi.',
    warunek: (r, c) => c.drugiId === r.id,
  },
  {
    id: 'hounter', nazwa: 'Hounter', poziom: 'srebro',
    haslo: 'Trochę straszy, trochę sprzedaje',
    opis: 'Pokonałeś lidera tabeli. Polujesz na graczy jak menel na kaucyjne. Prawdziwy łowca!',
    warunek: (r, c) => c.liderId && c.liderId !== r.id && (r.przeciwnicy[c.liderId]?.w ?? 0) > 0,
  },
  {
    id: 'swed', nazwa: 'Psim Swędem', poziom: 'srebro',
    haslo: 'Nie wiadomo jak, ale jest',
    opis: '2 sety wygrane po dogrywce — takie na 17:15 czy 21:19. Nikt nie wie, skąd je wytrzasnąłeś, ale wywęszyłeś i masz.',
    warunek: (r) => r.setyPrzewagaW >= 2,
  },
  {
    id: 'wilk', nazwa: 'Samotny Wilk', poziom: 'srebro',
    haslo: 'Poluje sam i wraca z łupem',
    opis: 'Min. 60% wygranych w singlu i najwyżej 35% w deblu. Sam sobie radzisz, ale jak trzeba się dogadać z partnerem, to już gorzej.',
    warunek: (r, c) => {
      const d = c.statDebel.get(r.id);
      const p = c.statSingiel.get(r.id);
      if (!d || !p || d.mecze < 2 || p.mecze < 2) return false;
      return p.meczeW / p.mecze >= 0.6 && d.meczeW / d.mecze <= 0.35;
    },
  },

  /* ------------------------------------------------------------ ZŁOTO */
  {
    id: 'mmmpuuu', nazwa: 'Mmmpuuu!', poziom: 'zloto',
    haslo: 'Robisz strzał i miażdżysz przeciwników',
    opis: 'Robisz strzał i miażdżysz przeciwników — 5 wygranych meczów z rzędu, licząc też te z zeszłego wtorku. Rozpędziłeś się i nikt Cię nie zatrzymał.',
    warunek: (r) => r.seria >= 5,
  },
  {
    id: 'nafali', nazwa: 'Na Fali', poziom: 'zloto',
    haslo: 'Złapałeś i jedziesz',
    opis: 'Wygrałeś wszystkie mecze wieczoru — minimum 3, zero przegranych. Złapałeś falę i pojechałeś na niej do samej plaży.',
    warunek: (r) => r.dni.some((d) => d.w >= 3 && d.p === 0),
  },
  {
    id: 'kwinciok', nazwa: 'Forma Kwincioka', poziom: 'zloto',
    haslo: 'Forma top, rozjebałbyś Kwintę',
    opis: 'Forma top, rozjebałbyś Kwintę: w tym miesiącu wygrałeś 75% swoich meczów, przy minimum 4 rozegranych. Szczyt możliwości.',
    warunek: (r, c) => {
      const m = c.statMiesiaca.get(r.id);
      return !!m && m.mecze >= 4 && m.meczeW / m.mecze >= 0.75;
    },
  },
  {
    id: 'sanjay', nazwa: 'Sanjay Kapoor', poziom: 'zloto',
    haslo: 'Lśnisz jak diament',
    opis: 'W ostatnich 5 meczach wygrałeś 4 sety, w których rywal nie doszedł nawet do 9 punktów. Gra jak hinduski mistrz badmintona — czysto i bez wysiłku.',
    warunek: (r) => ostatnie(r, 5).reduce((suma, m) => suma + (m.setyDoOsmiu ?? 0), 0) >= 4,
  },
];

export const przydomek = (id) => PRZYDOMKI.find((p) => p.id === id) ?? null;

function ostatnie(r, ile) {
  return r.meczeKolejno.slice(-ile);
}

/** Punkty zdobyte w ostatnich `ile` meczach — „Masz Wbite" patrzy na formę,
    nie na dorobek całego sezonu. */
function sumaZOstatnich(r, ile) {
  return ostatnie(r, ile).reduce((s, m) => s + (m.zdobyte ?? 0), 0);
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
    statMiesiaca,
    wieczorowRazem: grane.length,
    iluGra: graja.length,
    minStracone: graja.length ? Math.min(...graja.map((r) => r.stracone)) : 0,
    maxZdobyte: graja.length ? Math.max(...graja.map((r) => r.zdobyte)) : 0,
    najlepszeZOstatnich5: graja.length ? Math.max(...graja.map((r) => sumaZOstatnich(r, 5))) : 0,
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

  // Masz Wbite: najprostszy młotek pod kątem, jak 🔨 — obuch, jaśniejsze czoło
  // i trzonek. Bez gwoździa, deski i smug: każdy dodatek psuł czytelność.
  wbite: '<g transform="translate(-3 8) rotate(45 32 32)">'
    + '<path d="M30 27h4.4v16.4a2.2 2.2 0 0 1-4.4 0Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M21 18h22a2.6 2.6 0 0 1 2.6 2.6v5A2.6 2.6 0 0 1 43 28.2H21Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M39.5 18h3.5a2.6 2.6 0 0 1 2.6 2.6v5A2.6 2.6 0 0 1 43 28.2h-3.5Z" fill="url(#@)" fill-opacity=".55"/>'
    + '</g>',

  // Bezrobocie: kubek z parą. Rywale nie punktowali, więc było się czym zająć
  // tylko między akcjami. Leżak przy tym rozmiarze czytał się jak flaga.
  bezrobocie: '<path d="M20 28h22v12a11 11 0 0 1-22 0Z" fill="url(#@)" fill-opacity=".25"/>'
    + '<path d="M42 31h4.5a5.5 5.5 0 0 1-4.5 8.5" />'
    + '<path d="M16 50.5h29" opacity=".5"/>'
    + '<path d="M26 22.5c2.5-2.5 2.5-5 0-7.5M34 22.5c2.5-2.5 2.5-5 0-7.5" opacity=".5"/>'
    + '<path d="M23 33.5h16" opacity=".35"/>',

  // Wąska maska Robina — oczy wycięte regułą evenodd, więc prześwituje tarcza.
  robin: '<path fill-rule="evenodd" d="M13 31.5c5.4-3.6 12.2-5.4 19-5.4s13.6 1.8 19 5.4c-1.1 6.8-5.8 11.6-11 11.6-3.4 0-6.1-2-8-5.3-1.9 3.3-4.6 5.3-8 5.3-5.2 0-9.9-4.8-11-11.6Zm7.4 1.6c1.5-1.5 5.4-1.5 7 .4-1.4 1.9-5.5 1.9-7-.4Zm16.2.4c1.6-1.9 5.5-1.9 7-.4-1.5 2.3-5.6 2.3-7 .4Z" fill="url(#@)" fill-opacity=".3"/>',

  // Duch z celownikiem zamiast twarzy.
  hounter: '<path d="M21 47.5V33.5a11 11 0 0 1 22 0v14l-3.7-3.2-3.6 3.2-3.7-3.2-3.6 3.2Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<circle cx="32" cy="32.5" r="7.4" stroke-width="2.1"/>'
    + '<path d="M32 21.5v6M32 37.5v6M21 32.5h6M37 32.5h6"/>'
    + '<circle cx="32" cy="32.5" r="1.8" fill="url(#@)" stroke="none"/>',

  // Psim Swędem: kundelek w profilu — okrągły łeb ze sterczącym uchem i krótką
  // kufą przy samej ziemi (jeden długi klin czytał się jak pysk konia),
  // przy pysku drobinki zapachu (węszy trop). Obok to, po czym poznać, że tu był.
  swed: '<path d="M10 48h44" opacity=".5"/>'
    + '<path d="M28 30h9a5 5 0 0 1 0 10h-9a5 5 0 0 1 0-10Z" fill="url(#@)" fill-opacity=".22"/>'
    + '<path d="M22.6 36.4 26.6 32.8" stroke-width="3.8"/>'
    + '<circle cx="18.2" cy="39" r="4.4" fill="url(#@)" fill-opacity=".26"/>'
    + '<path d="M15.6 42.4C13.8 43.4 12.6 44.4 12.8 45.6 13 46.8 14.4 47.2 15.8 46.6'
      + ' 17 46 18 44.8 18.8 43.6Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M17.4 34.8 21.8 33.8 20.4 38Z" fill="url(#@)" fill-opacity=".36"/>'
    + '<circle cx="17" cy="38" r="1.2" fill="url(#@)" stroke="none"/>'
    + '<circle cx="13.8" cy="45.8" r="1.5" fill="url(#@)" stroke="none"/>'
    + '<path d="M15 44.6 16.8 45.4" stroke-width="1.4" opacity=".5"/>'
    + '<path d="M27.5 40l-1.2 7.6M31 40l-1 7.6M37 40v7.6M40 40l.9 7.6"/>'
    + '<path d="M42 32.6c4-1.2 5.4-4.2 4-7.2"/>'
    + '<circle cx="10.6" cy="43.4" r=".9" fill="url(#@)" stroke="none" opacity=".5"/>'
    + '<circle cx="9.4" cy="40.4" r=".7" fill="url(#@)" stroke="none" opacity=".4"/>'
    + '<path d="M42.8 47.6c.3-2.3 2.8-3.6 5.8-3.6s5.5 1.3 5.8 3.6Z" fill="url(#@)" fill-opacity=".35"/>'
    + '<path d="M44.4 44.2c.3-2 2-3.1 4.2-3.1s3.8 1.1 4.1 3.1Z" fill="url(#@)" fill-opacity=".3"/>'
    + '<path d="M46.2 41.2c0-1.9 1.1-3.2 2.4-3.6.5.6.3 1.4-.3 1.9 1 .4 1.8 1 1.8 1.7Z" fill="url(#@)" fill-opacity=".28"/>',

  // Samotny Wilk: kanciasty łeb z kresek — ten znany, geometryczny motyw.
  wilk: '<path d="M32 51 17 38.5 14.5 20.5 23 26.5h18l8.5-6-2.5 18Z" fill="url(#@)" fill-opacity=".2"/>'
    + '<path d="M14.5 20.5 23 26.5M49.5 20.5 41 26.5" opacity=".75"/>'
    + '<path d="M17 38.5 24 34.5M47 38.5 40 34.5" opacity=".5"/>'
    + '<path d="M21.5 31.5 26 33.5M42.5 31.5 38 33.5" stroke-width="2.6"/>'
    + '<path d="M32 36.5 27.5 41.5 32 44 36.5 41.5Z" fill="url(#@)" fill-opacity=".45"/>'
    + '<path d="M32 44v4" opacity=".55"/>',

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

  // Na Fali: prosta fala jak z infografiki — stroma ściana, grzywa zawinięta
  // w prawo, długi ogon i osobna smuga wody pod spodem.
  nafali: '<path d="M12.5 41C18 33 23 27.5 28 24.5 33 21.5 37.5 23 39.5 26.5'
      + ' 41.5 30 40 33.5 37 34 34.5 34.4 33 32.8 33.6 31'
      + ' 31.5 33.5 32 36.5 35 37.5 40 39 46 37.5 51.5 33.5'
      + ' 47 39.5 40.5 42.5 34 42 27 41.5 19.5 41.5 12.5 41Z" fill="url(#@)" fill-opacity=".26"/>'
    + '<path d="M12.5 47C19.5 44 27.5 44 34.5 46 40.5 47.7 46 47.5 50.5 45.5'
      + ' 46 49.5 40 50.3 33.5 48.7 27 47.1 19.5 46.7 12.5 47Z" fill="url(#@)" fill-opacity=".26"/>',

  // Płomień z rozgrzanym rdzeniem, iskrami i podmuchem po bokach.
  kwinciok: '<path d="M19.4 43.3 20.7 38.1 17.5 35.0 20.0 31.4 15.7 25.6 22.9 25.3 22.6 18.5 28.6 21.8 32.0 13.2 35.4 21.8 41.2 18.8 41.1 25.3 47.9 25.7 44.0 31.4 46.5 35.0 43.3 38.1 45.2 43.8" stroke-width="1.4" stroke-linejoin="miter" opacity=".24"/>'
    + '<path d="M21.7 41.6 22.0 37.5 20.2 34.7 21.4 31.6 18.3 26.8 24.0 26.3 24.1 20.9 29.0 23.1 32.0 16.0 35.0 23.1 39.7 21.1 40.0 26.3 45.4 27.0 42.6 31.6 43.8 34.7 42.0 37.5 43.0 42.1" stroke-width="1.9" stroke-linejoin="miter" opacity=".9"/>'
    + '<circle cx="32" cy="31" r="4" fill="url(#@)" fill-opacity=".4"/>'
    + '<path d="M32 35v6.4"/>'
    + '<path d="M32 36.4 26.9 38.9 27.9 43.1M32 36.4 37.1 38.9 36.1 43.1"/>'
    + '<path d="M32 41.4 28.1 47.7M32 41.4 35.9 47.7"/>',

  // Brylant z fasetami — plus jedna iskra, żeby błyszczał.
  // Sanjay Kapoor: brylant z fasetami — lśni, bo o to w tym przydomku chodzi.
  sanjay: '<path d="M21 25.5h22l7.5 8.5L32 53 13.5 34Z" fill="url(#@)" fill-opacity=".22"/>'
    + '<path d="M21 25.5l3.6 8.5h14.8l3.6-8.5M13.5 34h37M24.6 34 32 53M39.4 34 32 53" opacity=".5"/>'
    + '<path d="M47.5 17l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1Z" fill="url(#@)" stroke="none" opacity=".9"/>'
    + '<path d="M15 20l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8Z" fill="url(#@)" stroke="none" opacity=".6"/>'
    + '<path d="M32 38.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z" fill="url(#@)" stroke="none" opacity=".55"/>',
};

let _gid = 0;

/** Odznaka jako gotowy HTML. `reign` = oprawa Gracza Miesiąca: korona nad
    tarczą i poświata, ale kolor zostaje ten od poziomu przydomka.
    `id === null` rysuje pustą tarczę — tak wygląda „jeszcze nic”.

    Kolory idą przez klasę `godlo-<poziom>` i zmienne CSS, nie przez styl
    w atrybucie — dlatego motyw jasny może mieć własny, ciemniejszy komplet
    metali, a poświata sama się do niego dostraja.

    `gradientUnits="userSpaceOnUse"` NIE jest ozdobnikiem. Domyślnie gradient
    liczy się względem ramki każdego kształtu z osobna, a ramka pojedynczej
    pionowej albo poziomej kreski ma zerową szerokość lub wysokość — taki
    kształt zostaje wtedy NIEPOMALOWANY i po prostu znika. Kosztowało to
    gwóźdź w „Masz Wbite" (rysowany, niewidoczny). Przy tej wersji gradient
    rozciąga się na całą tarczę, więc proste kreski działają, a metal jest
    spójny w obrębie odznaki zamiast startować od nowa w każdym kształcie. */
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
    <defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="76">
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
