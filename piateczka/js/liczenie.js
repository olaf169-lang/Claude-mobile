/* ==========================================================================
   Turniej Pana Piąteczki — cała matematyka sezonu w jednym miejscu.

   WALUTĄ SĄ ZWYCIĘSTWA. Wygrany mecz to wygrany mecz — nieważne, czy poszło
   15:2 czy 15:13. Punkty zdobyte w setach są tylko rozstrzygnięciem remisu,
   a punkty stracone nie liczą się do tabeli w ogóle (decyzja z 2026-09-15:
   „przegranie seta 15-2 waży tak samo jak przegranie go 15-13”).

   Kolejność w tabeli:
     1. wygrane mecze
     2. wygrane sety
     3. zdobyte punkty
     4. mecz bezpośredni (bilans z osobami, z którymi jest remis)

   Singiel i debel to DWIE OSOBNE rozgrywki: osobna tabela, osobne statystyki,
   osobne ELO. Tryb meczu wynika z liczby grających po stronie, więc nic się
   dodatkowo nie wpisuje.

   Jedna definicja wygranego meczu, używana wszędzie (tabela, MVP, ELO):
   więcej wygranych setów, a przy remisie w setach rozstrzyga suma punktów.
   ========================================================================== */

import { GRACZE, czyGosc, normalizujFormat, FORMAT_DOMYSLNY } from './dane.js';

export const TRYBY = [
  { id: 'debel',   nazwa: 'Debel',   krotko: 'debla' },
  { id: 'singiel', nazwa: 'Singiel', krotko: 'singla' },
];

/** Tryb wynika z obsady: jeden na jednego to singiel, reszta to debel. */
export function trybMeczu(mecz) {
  return (mecz?.a?.length ?? 0) === 1 && (mecz?.b?.length ?? 0) === 1 ? 'singiel' : 'debel';
}

/* --------------------------------------------------------- układ wieczoru */

/* Przy czwórce istnieją DOKŁADNIE trzy zestawienia debla i po tych trzech
   meczach każdy zagrał z każdym raz w parze i dwa razy przeciw. Zero
   losowania, pełna symetria — to jest fundament uczciwości tabeli. */
const ROTACJA_4 = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

/* Single układamy metodą karuzeli (round robin): jeden gracz stoi, reszta
   obraca się wokół niego. Dzięki temu w każdej rundzie każdy gra dokładnie
   raz, więc nikt nie ma trzech meczów pod rząd, a przy nieparzystej liczbie
   chętnych ktoś po prostu pauzuje. */
function paryKazdyZKazdym(n) {
  const idx = [...Array(n).keys()];
  if (n % 2) idx.push(-1);                 // pauza dla nieparzystych
  const m = idx.length;
  const pary = [];
  for (let r = 0; r < m - 1; r += 1) {
    for (let i = 0; i < m / 2; i += 1) {
      const a = idx[i], b = idx[m - 1 - i];
      if (a !== -1 && b !== -1) pary.push([[a], [b]]);
    }
    idx.splice(1, 0, idx.pop());           // obrót karuzeli, pierwszy stoi
  }
  return pary;
}

/** Mecze wieczoru dla danego składu. `tryb` mówi, czy układamy deble, czy
    single; przy mniej niż czterech chętnych debel i tak schodzi na singla,
    bo nie ma z kogo złożyć par. `przesuniecie` obraca kolejność, żeby nie
    zawsze te same osoby otwierały grę. */
export function ukladMeczow(sklad, przesuniecie = 0, format = FORMAT_DOMYSLNY, tryb = 'debel') {
  const n = sklad.length;
  if (n < 2) return [];
  const wzor = (tryb === 'singiel' || n < 4) ? paryKazdyZKazdym(n) : ROTACJA_4;

  const f = normalizujFormat(format);
  const obrot = ((przesuniecie % wzor.length) + wzor.length) % wzor.length;
  return wzor.map((_, i) => {
    const [a, b] = wzor[(i + obrot) % wzor.length];
    return { nr: i + 1, a: a.map((k) => sklad[k]), b: b.map((k) => sklad[k]), sety: [], format: f };
  });
}

/** Format konkretnego meczu — własny, a jak go nie ma, to domyślny wieczoru. */
export function formatMeczu(mecz, wieczor) {
  return normalizujFormat(mecz?.format ?? wieczor?.format ?? FORMAT_DOMYSLNY);
}

/** Ile pól na sety pokazać przy meczu. Przy „do dwóch wygranych” trzeci set
    wyskakuje dopiero przy stanie 1:1; przy jednym secie jest jedno pole. */
export function ilePolNaSety(format, mecz) {
  const f = normalizujFormat(format);
  const { setyA, setyB } = wynikMeczu(mecz);
  const zapisane = (mecz?.sety ?? []).filter((s) => setRozegrany(s)).length;
  const zFormatu = f.setow === 1 ? 1 : (setyA === 1 && setyB === 1 ? 3 : 2);
  // Nigdy nie chowamy seta, który już jest zapisany — inaczej po zmianie
  // formatu wynik zniknąłby z oczu, choć dalej liczyłby się do tabeli.
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
  const roznica = pktA - pktB;
  // Jedna definicja zwycięstwa na całą aplikację: sety, a przy remisie punkty.
  let werdykt = 'remis';
  if (setyA > setyB || (setyA === setyB && roznica > 0)) werdykt = 'a';
  else if (setyB > setyA || (setyA === setyB && roznica < 0)) werdykt = 'b';

  return {
    rozegrany: setow > 0, setow, setyA, setyB, pktA, pktB, roznica, werdykt,
    tryb: trybMeczu(mecz),
  };
}

/** Czy mecz jest już rozstrzygnięty zgodnie ze swoim formatem — czyli czy
    jest co zapisywać. Przy „do 2 wygranych” trzeba mieć 2:0 albo 2:1. */
export function meczKompletny(mecz, wieczor) {
  const f = formatMeczu(mecz, wieczor);
  const { setyA, setyB, rozegrany } = wynikMeczu(mecz);
  if (!rozegrany) return false;
  return Math.max(setyA, setyB) >= f.setow;
}

/* ------------------------------------------------- statystyki gracza/dnia */

function pustyRekord(id) {
  return {
    id,
    zdobyte: 0, stracone: 0, roznica: 0,
    setyW: 0, setyP: 0, meczeW: 0, meczeP: 0, meczeR: 0, mecze: 0,
    wieczory: 0,
    seria: 0,                  // bieżąca seria wygranych MECZÓW
    najdluzszaSeria: 0,
    bezZwyciestwa: 0,          // ile meczów z rzędu bez wygranej (do klątwy)
    setyPrzewagaW: 0,          // sety wygrane po dogrywce (powyżej granicy seta)
    najgorszyPrzegranySet: null, // ile punktów zdobyłem w najgorzej przegranym secie
    meczeKolejno: [],          // { data, wygrany, trzySety, tryb } — chronologicznie
    dni: [],                   // { data, w, p } — bilans pojedynczego wieczoru
    partnerzy: {},             // id → { w, p }
    przeciwnicy: {},           // id → { w, p }
    historia: [],              // { data, w } — do iskry w tabeli
  };
}

const bilans = (obj, id) => (obj[id] ??= { w: 0, p: 0 });

/** Mecze wieczoru w kolejności numerów, opcjonalnie tylko z jednego trybu. */
export function mecze(wieczor, tryb = null) {
  const m = wieczor?.mecze ?? {};
  const lista = Object.keys(m)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => m[k])
    .filter(Boolean);
  return tryb ? lista.filter((x) => trybMeczu(x) === tryb) : lista;
}

/** Statystyki jednego wieczoru: mapa id → rekord. `tryb` zawęża do singla
    albo debla; `wszyscy` dorzuca osoby spoza stałej czwórki. */
export function rekordyWieczoru(wieczor, { wszyscy = false, tryb = null } = {}) {
  const rek = new Map();
  const nasz = (id) => wszyscy || GRACZE.some((g) => g.id === id);
  const daj = (id) => {
    if (!rek.has(id)) rek.set(id, pustyRekord(id));
    return rek.get(id);
  };

  for (const mecz of mecze(wieczor, tryb)) {
    const r = wynikMeczu(mecz);
    if (!r.rozegrany) continue;
    const granica = formatMeczu(mecz, wieczor).doIlu;

    for (const [strona, moi, ich, pkt, pktIch, setyMoje, setyIch] of [
      ['a', mecz.a, mecz.b, r.pktA, r.pktB, r.setyA, r.setyB],
      ['b', mecz.b, mecz.a, r.pktB, r.pktA, r.setyB, r.setyA],
    ]) {
      const wygrany = r.werdykt === strona;
      for (const id of moi) {
        if (!nasz(id)) continue;
        const s = daj(id);
        s.mecze += 1;
        s.zdobyte += pkt;
        s.stracone += pktIch;
        s.roznica += pkt - pktIch;
        s.setyW += setyMoje;
        s.setyP += setyIch;
        if (wygrany) s.meczeW += 1;
        else if (r.werdykt === 'remis') s.meczeR += 1;
        else s.meczeP += 1;
        s.meczeKolejno.push({
          data: wieczor?.data ?? null,
          wygrany,
          remis: r.werdykt === 'remis',
          trzySety: r.setow >= 3,
          tryb: r.tryb,
        });
        for (const partner of moi) if (partner !== id) {
          const b = bilans(s.partnerzy, partner);
          if (wygrany) b.w += 1; else if (r.werdykt !== 'remis') b.p += 1;
        }
        for (const opp of ich) {
          const b = bilans(s.przeciwnicy, opp);
          if (wygrany) b.w += 1; else if (r.werdykt !== 'remis') b.p += 1;
        }
      }
    }

    for (const set of mecz.sety ?? []) {
      if (!setRozegrany(set)) continue;
      for (const [moi, mojePkt, ichPkt] of [[mecz.a, set[0], set[1]], [mecz.b, set[1], set[0]]]) {
        for (const id of moi) {
          if (!nasz(id)) continue;
          const s = daj(id);
          if (mojePkt > ichPkt) {
            // Set wygrany po dogrywce — własny wynik przebił granicę seta.
            if (mojePkt > granica) s.setyPrzewagaW += 1;
          } else if (ichPkt > mojePkt) {
            s.najgorszyPrzegranySet = s.najgorszyPrzegranySet === null
              ? mojePkt : Math.min(s.najgorszyPrzegranySet, mojePkt);
          }
        }
      }
    }
  }

  for (const [, s] of rek) {
    if (s.mecze > 0) s.dni.push({ data: wieczor?.data ?? null, w: s.meczeW, p: s.meczeP });
  }
  return rek;
}

/** Sumuje wieczory w statystyki sezonu. Zwraca mapę id → rekord. */
export function zbierz(wieczory, opcje = {}) {
  const { wszyscy = false, pomijajTowarzyskie = true, tryb = null } = opcje;
  const suma = new Map();
  const daj = (id) => {
    if (!suma.has(id)) suma.set(id, pustyRekord(id));
    return suma.get(id);
  };
  if (!wszyscy) GRACZE.forEach((g) => daj(g.id));

  const posortowane = [...wieczory].sort((x, y) => x.data.localeCompare(y.data));
  for (const w of posortowane) {
    if (pomijajTowarzyskie && w.towarzyski) continue;
    for (const [id, dzien] of rekordyWieczoru(w, { wszyscy, tryb })) {
      if (dzien.mecze === 0) continue;
      const s = daj(id);
      for (const pole of ['zdobyte', 'stracone', 'roznica', 'setyW', 'setyP',
        'meczeW', 'meczeP', 'meczeR', 'mecze', 'setyPrzewagaW']) {
        s[pole] += dzien[pole];
      }
      if (dzien.najgorszyPrzegranySet !== null) {
        s.najgorszyPrzegranySet = s.najgorszyPrzegranySet === null
          ? dzien.najgorszyPrzegranySet
          : Math.min(s.najgorszyPrzegranySet, dzien.najgorszyPrzegranySet);
      }
      for (const [partner, b] of Object.entries(dzien.partnerzy)) {
        const c = bilans(s.partnerzy, partner);
        c.w += b.w; c.p += b.p;
      }
      for (const [opp, b] of Object.entries(dzien.przeciwnicy)) {
        const c = bilans(s.przeciwnicy, opp);
        c.w += b.w; c.p += b.p;
      }
      // Seria wygranych MECZÓW biegnie przez cały sezon, także między wtorkami.
      for (const m of dzien.meczeKolejno) {
        s.meczeKolejno.push(m);
        if (m.wygrany) {
          s.seria += 1;
          s.bezZwyciestwa = 0;
          s.najdluzszaSeria = Math.max(s.najdluzszaSeria, s.seria);
        } else {
          s.seria = 0;
          s.bezZwyciestwa += 1;
        }
      }
      s.dni.push(...dzien.dni);
      s.wieczory += 1;
      s.historia.push({ data: w.data, w: dzien.meczeW, p: dzien.meczeP });
    }
  }
  return suma;
}

/** Czy w wieczorze jest cokolwiek policzalnego. */
export function wieczorRozegrany(wieczor) {
  return mecze(wieczor).some((m) => wynikMeczu(m).rozegrany);
}

/** Które tryby faktycznie padły tego wieczoru. */
export function trybyWieczoru(wieczor) {
  const zbior = new Set(mecze(wieczor).filter((m) => wynikMeczu(m).rozegrany).map(trybMeczu));
  return TRYBY.filter((t) => zbior.has(t.id));
}

/* ---------------------------------------------------------- klasyfikacja */

/** Bilans meczów bezpośrednich w obrębie remisującej grupy. */
function bezposrednio(rekord, grupa) {
  let punkt = 0;
  for (const inny of grupa) {
    if (inny === rekord.id) continue;
    const b = rekord.przeciwnicy[inny];
    if (b) punkt += b.w - b.p;
  }
  return punkt;
}

/** Tabela sezonu. Kolejność: wygrane mecze → wygrane sety → zdobyte punkty →
    mecz bezpośredni. Podawaj `tryb`, bo singiel i debel mają osobne tabele. */
export function klasyfikacja(wieczory, zakres = {}) {
  const { tryb = null, ...filtr } = zakres;
  const wybrane = wFiltrze(wieczory, filtr);
  const rek = [...zbierz(wybrane, { tryb }).values()];

  const klucz = (r) => `${r.meczeW}|${r.setyW}|${r.zdobyte}`;
  rek.sort((a, b) =>
    b.meczeW - a.meczeW ||
    b.setyW - a.setyW ||
    b.zdobyte - a.zdobyte ||
    a.id.localeCompare(b.id));

  // Mecz bezpośredni rozstrzyga dopiero wewnątrz grupy o identycznych trzech
  // pierwszych kryteriach — inaczej wywracałby cały porządek tabeli.
  const grupy = new Map();
  for (const r of rek) {
    const k = klucz(r);
    if (!grupy.has(k)) grupy.set(k, []);
    grupy.get(k).push(r);
  }
  const uporzadkowane = [];
  for (const grupa of grupy.values()) {
    const idy = grupa.map((r) => r.id);
    grupa.sort((a, b) => bezposrednio(b, idy) - bezposrednio(a, idy) || a.id.localeCompare(b.id));
    uporzadkowane.push(...grupa);
  }

  let miejsce = 0, poprzednie = null;
  return uporzadkowane.map((r, i) => {
    const idy = grupy.get(klucz(r)).map((x) => x.id);
    const k = `${klucz(r)}|${bezposrednio(r, idy)}`;
    if (k !== poprzednie) { miejsce = i + 1; poprzednie = k; }
    return { ...r, miejsce };
  });
}

export function wFiltrze(wieczory, { od, do: dokad } = {}) {
  return wieczory.filter((w) =>
    (!od || w.data >= od) && (!dokad || w.data <= dokad));
}

/* ------------------------------------------------------------------- MVP */

/** Najlepszy gracz wieczoru — po wszystkich meczach, singlowych i deblowych
    razem. Ta sama kolejność co w tabeli: wygrane mecze, potem wygrane sety,
    potem zdobyte punkty. Jeśli i to równe — MVP jest dzielone. */
export function mvpWieczoru(wieczor) {
  if (!wieczor || wieczor.towarzyski || !wieczorRozegrany(wieczor)) return null;
  const rek = [...rekordyWieczoru(wieczor, { wszyscy: true }).values()]
    .filter((r) => !czyGosc(r.id) && GRACZE.some((g) => g.id === r.id) && r.mecze > 0);
  if (!rek.length) return null;
  rek.sort((a, b) => b.meczeW - a.meczeW || b.setyW - a.setyW || b.zdobyte - a.zdobyte);
  const naj = rek[0];
  if (naj.meczeW === 0) return null;   // nikt nic nie wygrał — nie ma kogo chwalić
  const remis = rek.filter((r) =>
    r.meczeW === naj.meczeW && r.setyW === naj.setyW && r.zdobyte === naj.zdobyte);
  return { gracze: remis.map((r) => r.id), wygrane: naj.meczeW, rekord: naj };
}

/* ---------------------------------------------------------- rekordy sezonu */

/** Kilka „fajnych” liczb, których nie widać w samej tabeli. Wszystko
    wyprowadzone z tych samych wyników, bez żadnego dodatkowego wpisywania. */
export function rekordySezonu(wieczory) {
  const grane = wieczory.filter((w) => !w.towarzyski && wieczorRozegrany(w));
  if (!grane.length) return null;

  // Najlepszy pojedynczy wieczór (najwięcej wygranych meczów jednego dnia).
  let najlepszyWieczor = null;
  for (const w of grane) {
    for (const [id, r] of rekordyWieczoru(w)) {
      if (r.mecze === 0) continue;
      if (!najlepszyWieczor || r.meczeW > najlepszyWieczor.wygrane
        || (r.meczeW === najlepszyWieczor.wygrane && r.meczeP < najlepszyWieczor.przegrane)) {
        najlepszyWieczor = { id, wygrane: r.meczeW, przegrane: r.meczeP, data: w.data };
      }
    }
  }

  // Największy pogrom w jednym meczu (największa różnica punktów).
  let najwiekszyPogrom = null;
  for (const w of grane) {
    for (const mecz of mecze(w)) {
      const r = wynikMeczu(mecz);
      if (!r.rozegrany || r.werdykt === 'remis') continue;
      const roznica = Math.abs(r.roznica);
      if (!najwiekszyPogrom || roznica > najwiekszyPogrom.roznica) {
        const wygrani = r.werdykt === 'a' ? mecz.a : mecz.b;
        const przegrani = r.werdykt === 'a' ? mecz.b : mecz.a;
        najwiekszyPogrom = { roznica, wygrani, przegrani, data: w.data };
      }
    }
  }

  // Sezonowe rekordy z sumy: najdłuższa seria zwycięstw i najlepszy duet.
  const suma = zbierz(grane);
  let najdluzszaSeria = null;
  for (const [id, r] of suma) {
    if (r.najdluzszaSeria > 0 && (!najdluzszaSeria || r.najdluzszaSeria > najdluzszaSeria.dlugosc)) {
      najdluzszaSeria = { id, dlugosc: r.najdluzszaSeria };
    }
  }
  let najlepszyDuet = null;
  for (const [id, r] of suma) {
    for (const [partner, b] of Object.entries(r.partnerzy)) {
      // Para liczy się raz — bierzemy tylko id < partner, żeby nie dublować.
      if (id >= partner) continue;
      if (!najlepszyDuet || b.w > najlepszyDuet.wygrane) {
        najlepszyDuet = { para: [id, partner], wygrane: b.w, przegrane: b.p };
      }
    }
  }
  if (najlepszyDuet && najlepszyDuet.wygrane === 0) najlepszyDuet = null;

  return { najlepszyWieczor, najwiekszyPogrom, najdluzszaSeria, najlepszyDuet };
}
