/* ==========================================================================
   Turniej Pana Piąteczki — cała matematyka sezonu w jednym miejscu.

   Waluta to SALDO: różnica małych punktów (zdobyte − stracone) plus
   BONUS_WYGRANEJ za każdy wygrany mecz. Sama różnica punktów bilansuje się
   w każdym meczu do zera; bonus dokłada się z boku i tylko zwycięzcom, żeby
   wygrana znaczyła więcej niż ładna przegrana. Nieobecność nadal kosztuje
   dokładnie zero — nie grasz, nic nie zyskujesz i nic nie tracisz — więc
   kalendarz może być umowny, a wieczór da się rozegrać w każdym składzie
   od dwóch osób w górę.

   Jedna definicja wygranego meczu, używana wszędzie (tabela, MVP, ELO):
   więcej wygranych setów, a przy remisie w setach rozstrzyga różnica punktów.
   ========================================================================== */

import { GRACZE, GOSC } from './dane.js';

/* Ile punktów do klasyfikacji dostaje KAŻDY z graczy wygranej pary, ponad
   różnicę punktów. Decyzja użytkownika: samo saldo za słabo premiowało
   zwycięstwo, bo przegrana 14:15 wyglądała prawie tak samo jak wygrana. */
export const BONUS_WYGRANEJ = 3;

/* --------------------------------------------------------- układ wieczoru */

/* Przy czwórce istnieją DOKŁADNIE trzy zestawienia debla i po tych trzech
   meczach każdy zagrał z każdym raz w parze i dwa razy przeciw. Zero
   losowania, pełna symetria — to jest fundament uczciwości tabeli. */
const ROTACJA_4 = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

const ROTACJA_3 = [
  [[0], [1]],
  [[0], [2]],
  [[1], [2]],
];

/** Mecze wieczoru dla danego składu. `przesuniecie` obraca kolejność, żeby
    nie zawsze te same pary otwierały grę. */
export function ukladMeczow(sklad, przesuniecie = 0) {
  const n = sklad.length;
  let wzor;
  if (n >= 4) wzor = ROTACJA_4;
  else if (n === 3) wzor = ROTACJA_3;
  else if (n === 2) wzor = [[[0], [1]]];
  else return [];

  const obrot = ((przesuniecie % wzor.length) + wzor.length) % wzor.length;
  return wzor.map((_, i) => {
    const [a, b] = wzor[(i + obrot) % wzor.length];
    return { nr: i + 1, a: a.map((k) => sklad[k]), b: b.map((k) => sklad[k]), sety: [] };
  });
}

/** Ile pól na sety pokazać przy meczu. Przy „do dwóch wygranych" trzeci set
    wyskakuje dopiero przy stanie 1:1. */
export function ilePolNaSety(format, mecz) {
  const { setyA, setyB } = wynikMeczu(mecz);
  const zapisane = (mecz?.sety ?? []).filter((s) => setRozegrany(s)).length;
  const zFormatu = format.dogrywka
    ? (setyA === 1 && setyB === 1 ? 3 : 2)
    : format.setow;
  // Nigdy nie chowamy seta, który już jest zapisany — inaczej po zmianie
  // formatu wynik zniknąłby z oczu, choć dalej liczyłby się do salda.
  return Math.max(zFormatu, zapisane);
}

/* ------------------------------------------------------------ wynik meczu */

const liczba = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Set liczy się, gdy obie liczby są wpisane i ktoś w ogóle zdobył punkt. */
export function setRozegrany(set) {
  if (!Array.isArray(set)) return false;
  const [x, y] = [liczba(set[0]), liczba(set[1])];
  return x !== null && y !== null && (x > 0 || y > 0);
}

export function wynikMeczu(mecz) {
  let setyA = 0, setyB = 0, pktA = 0, pktB = 0, setow = 0;
  for (const set of mecz?.sety ?? []) {
    if (!setRozegrany(set)) continue;
    setow += 1;
    pktA += set[0];
    pktB += set[1];
    if (set[0] > set[1]) setyA += 1;
    else if (set[1] > set[0]) setyB += 1;
  }
  const saldo = pktA - pktB;
  // Jedna definicja zwycięstwa na całą aplikację: sety, a przy remisie saldo.
  let werdykt = 'remis';
  if (setyA > setyB || (setyA === setyB && saldo > 0)) werdykt = 'a';
  else if (setyB > setyA || (setyA === setyB && saldo < 0)) werdykt = 'b';

  // Bonus jest asymetryczny: zwycięzcy dostają, przegrani NIE tracą. Dlatego
  // `saldo` zostaje surową różnicą punktów (używa jej ELO i podgląd meczu),
  // a bonus podajemy osobno i doliczamy dopiero w statystykach gracza.
  const bonusA = werdykt === 'a' ? BONUS_WYGRANEJ : 0;
  const bonusB = werdykt === 'b' ? BONUS_WYGRANEJ : 0;

  return { rozegrany: setow > 0, setow, setyA, setyB, pktA, pktB, saldo, werdykt, bonusA, bonusB };
}

/* ------------------------------------------------- statystyki gracza/dnia */

function pustyRekord(id) {
  return {
    id, saldo: 0, zdobyte: 0, stracone: 0,
    setyW: 0, setyP: 0, meczeW: 0, meczeP: 0, meczeR: 0, mecze: 0,
    wieczory: 0, seria: 0, najdluzszaSeria: 0,
    setyNaStyk: 0, setyNaStykW: 0, bonusy: 0,
    setyKolejno: [],       // kolejność wygranych/przegranych setów — do serii
    partnerzy: {},          // id → saldo zdobyte grając w parze z tą osobą
    historia: [],           // { data, saldo } — do wykresu formy
  };
}

/** Statystyki jednego wieczoru: mapa id → rekord (bez serii i historii,
    bo te mają sens dopiero w skali sezonu). */
export function rekordyWieczoru(wieczor, wszyscy = false) {
  const rek = new Map();
  const nasz = (id) => wszyscy || GRACZE.some((g) => g.id === id);
  const daj = (id) => {
    if (!rek.has(id)) rek.set(id, pustyRekord(id));
    return rek.get(id);
  };

  for (const mecz of mecze(wieczor)) {
    const r = wynikMeczu(mecz);
    if (!r.rozegrany) continue;

    for (const [strona, moi, pkt, pktIch, setyMoje, setyIch, bonus] of [
      ['a', mecz.a, r.pktA, r.pktB, r.setyA, r.setyB, r.bonusA],
      ['b', mecz.b, r.pktB, r.pktA, r.setyB, r.setyA, r.bonusB],
    ]) {
      for (const id of moi) {
        if (!nasz(id)) continue;
        const s = daj(id);
        s.mecze += 1;
        s.zdobyte += pkt;
        s.stracone += pktIch;
        // Bonus dostaje KAŻDY z wygranej pary, w całości — nie dzielimy go na pół.
        s.saldo += pkt - pktIch + bonus;
        s.bonusy += bonus;
        s.setyW += setyMoje;
        s.setyP += setyIch;
        if (r.werdykt === strona) s.meczeW += 1;
        else if (r.werdykt === 'remis') s.meczeR += 1;
        else s.meczeP += 1;
        // Ta sama waluta co w tabeli, razem z bonusem — inaczej „saldo
        // z partnerem" mówiłoby co innego niż saldo w klasyfikacji.
        for (const partner of moi) if (partner !== id) {
          s.partnerzy[partner] = (s.partnerzy[partner] ?? 0) + (pkt - pktIch) + bonus;
        }
      }
    }

    for (const set of mecz.sety ?? []) {
      if (!setRozegrany(set)) continue;
      const styk = Math.abs(set[0] - set[1]) <= 2;
      for (const [moi, mojePkt, ichPkt] of [[mecz.a, set[0], set[1]], [mecz.b, set[1], set[0]]]) {
        for (const id of moi) {
          if (!nasz(id)) continue;
          const s = daj(id);
          if (styk) { s.setyNaStyk += 1; if (mojePkt > ichPkt) s.setyNaStykW += 1; }
          s.setyKolejno.push(mojePkt > ichPkt);
        }
      }
    }
  }
  return rek;
}

/** Sumuje wieczory w statystyki sezonu. Zwraca mapę id → rekord.
    `opcje.wszyscy` dorzuca Gościa (przydatne przy podsumowaniu jednego
    wieczoru); domyślnie liczymy tylko stałą czwórkę, bo to ona ma tabelę. */
export function zbierz(wieczory, opcje = {}) {
  const { wszyscy = false, pomijajTowarzyskie = true } = opcje;
  const suma = new Map();
  const daj = (id) => {
    if (!suma.has(id)) suma.set(id, pustyRekord(id));
    return suma.get(id);
  };
  if (!wszyscy) GRACZE.forEach((g) => daj(g.id));

  const posortowane = [...wieczory].sort((x, y) => x.data.localeCompare(y.data));
  for (const w of posortowane) {
    if (pomijajTowarzyskie && w.towarzyski) continue;
    for (const [id, dzien] of rekordyWieczoru(w, wszyscy)) {
      if (dzien.mecze === 0) continue;
      const s = daj(id);
      for (const pole of ['saldo', 'zdobyte', 'stracone', 'setyW', 'setyP',
        'meczeW', 'meczeP', 'meczeR', 'mecze', 'setyNaStyk', 'setyNaStykW', 'bonusy']) {
        s[pole] += dzien[pole];
      }
      for (const [partner, saldo] of Object.entries(dzien.partnerzy)) {
        s.partnerzy[partner] = (s.partnerzy[partner] ?? 0) + saldo;
      }
      // Seria wygranych setów biegnie przez cały sezon, także między wtorkami.
      for (const wygrany of dzien.setyKolejno) {
        if (wygrany) { s.seria += 1; s.najdluzszaSeria = Math.max(s.najdluzszaSeria, s.seria); }
        else s.seria = 0;
      }
      s.wieczory += 1;
      s.historia.push({ data: w.data, saldo: dzien.saldo });
    }
  }
  return suma;
}

export function mecze(wieczor) {
  const m = wieczor?.mecze ?? {};
  return Object.keys(m)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => m[k])
    .filter(Boolean);
}

/** Czy w wieczorze jest cokolwiek policzalnego. */
export function wieczorRozegrany(wieczor) {
  return mecze(wieczor).some((m) => wynikMeczu(m).rozegrany);
}

/* ---------------------------------------------------------- klasyfikacja */

/** Tabela sezonu. Kolejność: saldo → wygrane mecze → wygrane sety → zdobyte. */
export function klasyfikacja(wieczory, zakres = {}) {
  const wybrane = wFiltrze(wieczory, zakres);
  const rek = [...zbierz(wybrane).values()];
  rek.sort((a, b) =>
    b.saldo - a.saldo ||
    b.meczeW - a.meczeW ||
    (b.setyW - b.setyP) - (a.setyW - a.setyP) ||
    b.zdobyte - a.zdobyte ||
    a.id.localeCompare(b.id));
  let miejsce = 0, poprzednie = null;
  return rek.map((r, i) => {
    const klucz = `${r.saldo}|${r.meczeW}|${r.setyW - r.setyP}|${r.zdobyte}`;
    if (klucz !== poprzednie) { miejsce = i + 1; poprzednie = klucz; }
    return { ...r, miejsce };
  });
}

export function wFiltrze(wieczory, { od, do: dokad } = {}) {
  return wieczory.filter((w) =>
    (!od || w.data >= od) && (!dokad || w.data <= dokad));
}

/* ------------------------------------------------------------------- MVP */

/** Najlepszy gracz wieczoru. Przy remisie salda: wygrane sety, potem zdobyte
    punkty. Jeśli i to równe — MVP jest dzielone. */
export function mvpWieczoru(wieczor) {
  if (!wieczor || wieczor.towarzyski || !wieczorRozegrany(wieczor)) return null;
  const rek = [...zbierz([wieczor], { wszyscy: true, pomijajTowarzyskie: false }).values()]
    .filter((r) => r.id !== GOSC.id && GRACZE.some((g) => g.id === r.id) && r.mecze > 0);
  if (!rek.length) return null;
  rek.sort((a, b) => b.saldo - a.saldo || (b.setyW - b.setyP) - (a.setyW - a.setyP) || b.zdobyte - a.zdobyte);
  const naj = rek[0];
  const remis = rek.filter((r) =>
    r.saldo === naj.saldo && (r.setyW - r.setyP) === (naj.setyW - naj.setyP) && r.zdobyte === naj.zdobyte);
  return { gracze: remis.map((r) => r.id), saldo: naj.saldo, rekord: naj };
}
