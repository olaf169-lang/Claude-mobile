/* ==========================================================================
   Tytuły: MVP dnia i Big Boss miesiąca wraz z przydomkiem.

   MVP — najlepsze saldo wieczoru. Znika w następny wtorek.
   Big Boss — najlepsze saldo miesiąca. Nosi tytuł, dopóki ktoś go nie zdejmie,
   a razem z tytułem dostaje PRZYDOMEK opisujący, CZYM ten miesiąc wygrał.
   Przydomek nie jest losowy: appka sprawdza warunki po kolei i bierze
   pierwszy pasujący, od najrzadszego do najzwyklejszego.

   Miesiąc z jednym wieczorem to za mało na tytuł — taki miesiąc dokleja się
   do następnego (stąd okresy typu „Grudzień + Styczeń”). To ustępstwo na
   rzecz świąt: sezon ma dziury i tytuł nie może zależeć od tego, ile razy
   udało się wyjść z domu.
   ========================================================================== */

import { nazwaMiesiaca, dzisiajIso } from './dane.js';
import { klasyfikacja, mvpWieczoru, wieczorRozegrany } from './liczenie.js';

export const MIN_WIECZOROW_NA_TYTUL = 2;

/* ------------------------------------------------------------- przydomki */

export const PRZYDOMKI = [
  {
    id: 'feniks',
    nazwa: 'Feniks',
    haslo: 'Z dna na szczyt',
    opis: 'W poprzednim okresie byłeś ostatni, w tym pierwszy. Najrzadszy przydomek w grze — nie da się go zdobyć dwa razy z rzędu.',
    warunek: (c) => c.poprzednia && c.poprzednia.at(-1)?.id === c.zwyciezca.id,
  },
  {
    id: 'walec',
    nazwa: 'Walec',
    haslo: 'Przejechał się po wszystkich',
    opis: 'Wygrałeś okres z przewagą co najmniej 10 salda na wieczór nad drugim miejscem. To nie była rywalizacja, to były roboty publiczne.',
    warunek: (c) => c.przewagaNaWieczor >= 10,
  },
  {
    id: 'cwaniak',
    nazwa: 'Cwaniak',
    haslo: 'Wygrał na styk i się cieszy',
    opis: 'Wygrałeś okres przewagą najwyżej 2 salda na wieczór. Papier mistrza wygląda tak samo jak przy dwudziestu.',
    warunek: (c) => c.przewagaNaWieczor <= 2,
  },
  {
    id: 'lokomotywa',
    nazwa: 'Lokomotywa',
    haslo: 'Rozpędził się i nie hamował',
    opis: 'Najdłuższa seria wygranych setów w okresie — co najmniej sześć z rzędu, licząc także sety z poprzedniego wtorku.',
    warunek: (c) => c.zwyciezca.najdluzszaSeria >= 6
      && c.zwyciezca.najdluzszaSeria === Math.max(...c.tabela.map((r) => r.najdluzszaSeria)),
  },
  {
    id: 'armia',
    nazwa: 'Jednoosobowa Armia',
    haslo: 'Ciągnął każdego partnera',
    opis: 'Dodatnie saldo z KAŻDYM partnerem, z jakim grałeś w tym okresie. Kogo byś nie dostał, wychodziliście na plus.',
    warunek: (c) => {
      const p = Object.values(c.zwyciezca.partnerzy);
      return p.length >= 2 && p.every((s) => s > 0);
    },
  },
  {
    id: 'chirurg',
    nazwa: 'Chirurg',
    haslo: 'Wygrywa końcówki',
    opis: 'Najlepszy bilans w setach rozstrzygniętych różnicą najwyżej dwóch punktów (minimum trzy takie sety). Nerwy jak kable.',
    warunek: (c) => {
      if (c.zwyciezca.setyNaStyk < 3) return false;
      const stosunek = (r) => (r.setyNaStyk ? r.setyNaStykW / r.setyNaStyk : -1);
      return stosunek(c.zwyciezca) === Math.max(...c.tabela.map(stosunek)) && stosunek(c.zwyciezca) > 0.5;
    },
  },
  {
    id: 'mur',
    nazwa: 'Mur',
    haslo: 'Nikt mu nic nie zrobił',
    opis: 'Straciłeś najmniej punktów ze wszystkich w tym okresie. Wygrana zaczyna się od tego, że przeciwnik nie punktuje.',
    warunek: (c) => c.zwyciezca.stracone === Math.min(...c.tabela.map((r) => r.stracone)),
  },
  {
    id: 'mlot',
    nazwa: 'Młot',
    haslo: 'Wbijał, aż się skończyły',
    opis: 'Zdobyłeś najwięcej punktów ze wszystkich w tym okresie. Metoda prosta: bić, aż przestanie wracać.',
    warunek: (c) => c.zwyciezca.zdobyte === Math.max(...c.tabela.map((r) => r.zdobyte)),
  },
  {
    id: 'boss',
    nazwa: 'Big Boss',
    haslo: 'Po prostu najlepszy',
    opis: 'Wygrałeś okres bez żadnej spektakularnej statystyki obok. Sam tytuł też jest niezły.',
    warunek: () => true,
  },
];

export const przydomek = (id) => PRZYDOMKI.find((p) => p.id === id) ?? PRZYDOMKI.at(-1);

/* ----------------------------------------------------------------- godła */

/* Rysowane w SVG, nie emoji — mają wyglądać jak odznaka, a nie jak SMS.
   Kolory biorą się ze zmiennych CSS, więc godło samo dopasowuje się do motywu. */
const GLIFY = {
  feniks: '<path d="M32 20c5 6 3 10 1 13 3-1 6-4 7-8 4 6 3 14-3 18-3 2-3 4-2 7-4-1-6-4-6-8 0-5 3-7 3-11 0-4-2-7 0-11Z"/><path d="M20 30c-3 4-4 9-2 14" opacity=".55"/><path d="M44 30c3 4 4 9 2 14" opacity=".55"/>',
  walec: '<rect x="14" y="24" width="22" height="11" rx="3"/><circle cx="42" cy="42" r="11"/><circle cx="42" cy="42" r="4" opacity=".5"/><rect x="16" y="38" width="9" height="8" rx="2"/>',
  cwaniak: '<path d="M18 24l5 8M46 24l-5 8"/><path d="M23 30h18l-9 20-9-20Z"/><circle cx="28" cy="36" r="1.6" fill="currentColor" stroke="none"/><circle cx="36" cy="36" r="1.6" fill="currentColor" stroke="none"/>',
  lokomotywa: '<rect x="16" y="30" width="26" height="13" rx="2"/><rect x="20" y="22" width="6" height="8" rx="1"/><circle cx="23" cy="49" r="5"/><circle cx="37" cy="49" r="5"/><path d="M42 34h6v9h-6" opacity=".6"/>',
  mur: '<rect x="15" y="26" width="34" height="8" rx="1"/><rect x="15" y="34" width="34" height="8" rx="1"/><rect x="15" y="42" width="34" height="8" rx="1"/><path d="M26 26v8M38 26v8M20 34v8M32 34v8M44 34v8M26 42v8M38 42v8" opacity=".55"/>',
  mlot: '<rect x="20" y="21" width="24" height="11" rx="2"/><path d="M30 32l-2 21h8l-2-21"/>',
  armia: '<path d="M16 40a16 16 0 0 1 32 0"/><rect x="12" y="40" width="40" height="7" rx="3"/><path d="M32 24l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z"/>',
  chirurg: '<circle cx="32" cy="37" r="14"/><path d="M32 19v10M32 45v10M14 37h10M40 37h10"/><circle cx="32" cy="37" r="3" fill="currentColor" stroke="none"/>',
  boss: '<path d="M15 46l-3-22 11 8 9-13 9 13 11-8-3 22Z"/><rect x="15" y="46" width="34" height="6" rx="2"/><circle cx="32" cy="34" r="2.4" fill="currentColor" stroke="none"/>',
};

/** Odznaka jako gotowy HTML. `rozmiar` w px steruje tylko szerokością. */
export function godlo(id, { rozmiar = 56, klasa = '' } = {}) {
  const glif = GLIFY[id] ?? GLIFY.boss;
  return `<svg class="godlo ${klasa}" style="width:${rozmiar}px" viewBox="0 0 64 76" fill="none"
    stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"
    role="img" aria-label="Godło: ${przydomek(id).nazwa}">
    <path class="godlo-tarcza" d="M32 3 60 15v25c0 16-12 28-28 33C16 68 4 56 4 40V15Z" stroke-width="2.6"/>
    <g class="godlo-glif">${glif}</g></svg>`;
}

/* --------------------------------------------------------- okresy i tytuł */

/** Dzieli sezon na okresy Big Bossa: zwykle kalendarzowy miesiąc, ale miesiąc
    z jednym wieczorem dokleja się do następnego. */
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
      // Miesiąc, który jeszcze trwa, ma dopiero prowadzącego, nie Big Bossa.
      wynik.push({ wieczory: bufor, otwarty: w.data.slice(0, 7) >= dzisiajIso().slice(0, 7) });
      bufor = [];
    }
  });
  if (bufor.length) wynik.push({ wieczory: bufor, otwarty: true });

  let poprzednia = null;
  return wynik.map((o) => {
    const tabela = klasyfikacja(o.wieczory);
    const zwyciezca = tabela[0];
    const drugi = tabela[1];
    const przewaga = drugi ? zwyciezca.saldo - drugi.saldo : Infinity;
    // Progi liczone na wieczór, żeby okres z ośmioma wtorkami nie robił
    // z każdego zwycięzcy „Walca” tylko dlatego, że było więcej grania.
    const przewagaNaWieczor = przewaga / o.wieczory.length;
    const kontekst = { zwyciezca, tabela, przewaga, przewagaNaWieczor, poprzednia };
    const wybrany = PRZYDOMKI.find((p) => {
      try { return p.warunek(kontekst); } catch { return false; }
    }) ?? PRZYDOMKI.at(-1);
    poprzednia = tabela;

    const miesiace = [...new Set(o.wieczory.map((w) => w.data.slice(0, 7)))];
    return {
      klucz: miesiace.join('+'),
      nazwa: miesiace.map(nazwaMiesiaca).join(' + '),
      wieczory: o.wieczory,
      otwarty: o.otwarty,
      tabela,
      zwyciezca: o.wieczory.length < MIN_WIECZOROW_NA_TYTUL ? null : zwyciezca,
      przydomek: wybrany,
      przewaga: Number.isFinite(przewaga) ? przewaga : null,
    };
  });
}

/** Aktualny Big Boss — z ostatniego ZAMKNIĘTEGO okresu. Dopóki bieżący
    miesiąc trwa, tytuł nosi zwycięzca poprzedniego. */
export function bigBoss(wieczory) {
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
