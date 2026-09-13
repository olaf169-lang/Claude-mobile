/* ==========================================================================
   System podpowiedzi.

   Jedno źródło, dwa miejsca: te same hasła wyświetlają się jako małe dymki ⓘ
   przy kartach na ekranach ORAZ składają się na wielką instrukcję pod
   „Zasady”. Dzięki temu nie da się doprowadzić do sytuacji, w której
   podpowiedź mówi co innego niż regulamin — bo to dosłownie ten sam tekst.

   Dopisując regułę: dopisz hasło tutaj, wpisz jego klucz do SEKCJE i wstaw
   dymek(klucz) przy odpowiedniej karcie. Nic więcej.
   ========================================================================== */

export const POMOC = {

  /* ------------------------------------------------------- jak liczymy */

  saldo: {
    tytul: 'Saldo — jedyna waluta turnieju',
    tresc: `<p>Po każdym secie dostajesz <b>tyle punktów, ile zdobyła Twoja para, minus tyle, ile straciła</b>.
      Wygrany set 15:10 to <b class="plus">+5</b>, przegrany 12:15 to <b class="minus">−3</b>. Twoje saldo wieczoru
      to suma z wszystkich setów, a saldo sezonu — suma z wszystkich wieczorów.</p>
      <p>To dlatego liczy się nie tylko czy wygrałeś, ale <i>jak</i>. Walka w przegranym secie do samego końca
      realnie ratuje tabelę.</p>
      <p class="pomoc-nota">Saldo wszystkich grających sumuje się w każdym wieczorze dokładnie do zera.
      Stąd bierze się cała reszta zasad — patrz „Opuszczone wtorki”.</p>`,
  },

  werdykt: {
    tytul: 'Kto wygrał mecz',
    tresc: `<p>Najpierw <b>sety</b>. Gdy jest remis w setach (np. 1:1), rozstrzyga <b>saldo</b> — czyli suma punktów
      z całego meczu. Mecz 15:5, 13:15 to saldo +8, więc to wygrana, choć sety są po jednym.</p>
      <p>Ta jedna definicja obowiązuje wszędzie: w tabeli, przy MVP i w 🏸ELO🏸. Remis w meczu jest możliwy tylko wtedy,
      gdy i sety, i saldo wyjdą równo — czyli prawie nigdy.</p>`,
  },

  format: {
    tytul: 'Format meczu',
    tresc: `<p>Gramy <b>do dwóch wygranych setów, sety do 15</b> — i dokładnie tak samo w singlu.
      Jeden format na wszystko, żeby nie trzeba było się zastanawiać, co dziś obowiązuje.</p>
      <p>Trzeci set pojawia się w aplikacji dopiero przy stanie 1:1, więc pola do wpisania są zawsze
      te, które faktycznie rozegraliście. Trzy mecze zajmują od 60 do 100 minut, zależnie od tego,
      ile z nich pójdzie na pełny dystans.</p>
      <p class="pomoc-nota">W menu zostają też krótsze warianty (2 sety do 15 bez trzeciego, 2 do 11,
      1 set do 21) na wypadek krótszej rezerwacji hali. Saldo liczy się identycznie w każdym z nich,
      więc zmiana formatu — nawet w środku sezonu — niczego w tabeli nie psuje.</p>`,
  },

  rotacja: {
    tytul: 'Trzy mecze, każdy z każdym',
    tresc: `<p>Przy czwórce istnieją <b>dokładnie trzy</b> możliwe zestawienia debla — i appka ustawia wszystkie trzy.
      Po takim wieczorze każdy zagrał <b>raz w parze z każdym</b> i <b>dwa razy przeciw każdemu</b>.</p>
      <p>Nic się nie losuje i nikt nie siedzi na ławce. To jest fundament, na którym stoi cała tabela:
      skoro wszyscy mieli identyczne warunki, saldo mierzy grę, a nie szczęście do partnera.</p>
      <p class="pomoc-nota">Kolejność meczów przesuwa się co tydzień, żeby nie zawsze ta sama para
      rozgrzewała halę.</p>`,
  },

  sklady: {
    tytul: 'Przyszło mniej niż czterech',
    tresc: `<p><b>Czterech</b> — trzy deble, pełna rotacja.<br>
      <b>Trzech</b> — single każdy z każdym: każdy gra dwa mecze i raz odpoczywa.<br>
      <b>Dwóch</b> — jeden singiel, a jak macie czas, dokładacie kolejne przyciskiem „Dograj mecz”.</p>
      <p>Format jest ten sam co zawsze: do dwóch wygranych setów, sety do 15.</p>
      <p>Wszystko wpada do tej samej tabeli, bo saldo w każdym z tych układów zachowuje się tak samo.
      Jedyna różnica: przy trójce gra się dwa mecze zamiast trzech, więc taki wieczór <b>rusza tabelą słabiej</b>.
      Tak ma być — mniejszy wieczór waży mniej.</p>`,
  },

  gosc: {
    tytul: 'Gość',
    tresc: `<p>Ktoś spoza czwórki może wskoczyć za nieobecnego — wtedy gracie normalne trzy deble.
      Gość ma swoje saldo w podsumowaniu wieczoru, ale <b>nie wchodzi do tabeli sezonu</b> ani do 🏸ELO🏸.</p>
      <p>Dla obecnych stałych graczy taki wieczór liczy się normalnie: każdy z nich i tak trafia na Gościa
      w parze dokładnie raz, więc układ pozostaje symetryczny.</p>`,
  },

  towarzyski: {
    tytul: 'Wieczór towarzyski',
    tresc: `<p>Przełącznik, który mówi: <b>zapisz wyniki, ale nie licz ich do sezonu</b>. Do użycia, gdy ktoś gra
      po kontuzji, gdy testujecie nowy format albo gdy to po prostu nie był ten wieczór.</p>
      <p>Wyniki zostają w historii i można je oglądać — po prostu nie ruszają ani tabeli, ani ELO, ani tytułów.</p>`,
  },

  /* ------------------------------------------------------------ tytuły */

  mvp: {
    tytul: 'MVP — najlepszy tego wieczoru',
    tresc: `<p>Dostaje go osoba z <b>najwyższym saldem danego wtorku</b>. Przy remisie decyduje bilans setów,
      potem liczba zdobytych punktów. Gdy i to jest równe, MVP jest dzielone.</p>
      <p>Tytuł jest jednorazowy: obowiązuje do następnego wtorku i nie przenosi się na sezon.</p>`,
  },

  bigboss: {
    tytul: 'Big Boss — gracz miesiąca',
    tresc: `<p>Najwyższe <b>saldo w miesiącu</b>. Tytuł nosi się przez cały następny miesiąc — do chwili,
      gdy ktoś go zdejmie. Razem z tytułem dostaje się <b>przydomek</b>.</p>
      <p>Miesiąc, w którym graliście tylko raz, to za mało na tytuł — taki miesiąc dokleja się do następnego
      i powstaje okres typu „Grudzień + Styczeń”. To ukłon w stronę świąt: sezon ma dziury i tytuł nie może
      zależeć od tego, ile razy udało się wyjść z domu.</p>
      <p class="pomoc-nota">Dopóki miesiąc trwa, appka pokazuje tylko <i>prowadzącego</i>. Big Bossem
      zostaje się dopiero, gdy miesiąc się zamknie.</p>`,
  },

  przydomki: {
    tytul: 'Przydomki Big Bossa',
    tresc: `<p>Przydomek nie jest losowy — opisuje, <b>czym</b> wygrałeś ten miesiąc. Appka sprawdza warunki
      po kolei, od najrzadszego do najzwyklejszego, i przyznaje pierwszy pasujący.</p>
      <p>Jest ich dziewięć, każdy z własnym godłem. „Feniks” za skok z ostatniego miejsca na pierwsze,
      „Walec” za zmiażdżenie stawki, „Cwaniak” za wygraną o włos, „Mur” za najmniej straconych punktów…</p>
      <p class="pomoc-nota">Pełna lista z godłami i warunkami jest na ekranie „Tytuły”.</p>`,
    wiecej: '#/tytuly',
  },

  puchar: {
    tytul: 'Puchar Pana Piąteczki',
    tresc: `<p>Turniej Pana Piąteczki kończy się <b>Pucharem Pana Piąteczki</b> — osobnym wieczorem singlowym
      na koniec sezonu, każdy z każdym, rozstawienie według tabeli.</p>
      <p>To oddzielne trofeum. Mistrz sezonu i zdobywca Pucharu to mogą być dwie różne osoby i o to chodzi:
      sezon nagradza regularność, Puchar — jeden dobry wieczór.</p>`,
  },

  /* -------------------------------------------------------------- ELO */

  elo: {
    tytul: '🏸ELO🏸 — ranking mocy',
    tresc: `<p>Tabela mówi, kto ma najlepszy bilans. ELO mówi co innego: <b>jak mocno grasz względem tego,
      z kim akurat trafiłeś</b>. Każdy startuje z 1000, siła pary to średnia ratingów obu graczy,
      a po meczu wygrani zabierają przegranym tyle punktów, na ile wynik był niespodzianką.</p>
      <p>Wyższa wygrana rusza ELO mocniej, ale najwyżej o połowę. Mecze z Gościem są pomijane —
      ktoś bez ratingu nie pozwala uczciwie wycenić zwycięstwa.</p>
      <p class="pomoc-nota">ELO <b>nie liczy się do tytułu</b>. Jest po to, żeby appka mogła wyliczyć fory.</p>`,
  },

  fory: {
    tytul: 'Fory',
    tresc: `<p>Appka porównuje średnie ELO obu par i proponuje, ile punktów przewagi dać słabszej parze na start.
      Jeden punkt fory za każde 40 punktów różnicy ELO, najwyżej pięć.</p>
      <p>Fory są <b>dobrowolne</b> i niczego nie zmieniają w liczeniu — wpisujecie wynik taki, jaki był na tablicy.
      Chodzi tylko o to, żeby mecz był ciekawy do ostatniej piłki.</p>`,
  },

  /* ------------------------------------------------------------ sezon */

  kalendarz: {
    tytul: 'Kalendarz sezonu',
    tresc: `<p>Sezon 2026/27 to 26 wtorków od 6 października do 30 marca. Z góry odpuszczamy trzy:
      <b>22 i 29 grudnia</b> (święta i Sylwester) oraz <b>30 marca</b>, który wypada zaraz po Wielkanocy
      i zostaje terminem rezerwowym.</p>
      <p>Reszta dat jest <b>umowna</b>. Appka przyjmie wynik z dowolnego dnia — także z czwartku, jeśli
      przełożycie. Kalendarz jest planem, nie regulaminem.</p>`,
  },

  rundy: {
    tytul: 'Dwie rundy',
    tresc: `<p><b>Runda Jesienna</b> — od października do świąt. <b>Runda Zimowa</b> — od stycznia do marca.
      Przerwa świąteczna sama dzieli sezon na pół, więc nie trzeba niczego udawać.</p>
      <p>Każda runda ma swojego mistrza, a obok leci <b>klasyfikacja generalna</b> z całego sezonu.
      Trzy tytuły zamiast jednego — jest o co grać nawet po słabym starcie.</p>`,
  },

  nieobecnosci: {
    tytul: 'Opuszczone wtorki nic nie kosztują',
    tresc: `<p>Saldo w każdym wieczorze sumuje się do zera, więc <b>nieobecność daje dokładnie 0 — czyli tyle,
      co średnia</b>. Nie tracisz i nie zyskujesz.</p>
      <p>Dlatego nie ma tu żadnych średnich na wieczór, procentów frekwencji ani progu „musisz zagrać
      minimum X razy”. Możecie opuścić pięć wtorków z rzędu i tabela dalej będzie uczciwa.</p>`,
  },

  /* --------------------------------------------------------- obsługa */

  wpisywanie: {
    tytul: 'Jak wpisać wynik',
    tresc: `<p>Wchodzisz w <b>Wieczór</b>, zaznaczasz kto przyszedł, a appka sama ustawia mecze.
      Potem wpisujesz wyniki setów — po jednej liczbie na pole. Saldo przelicza się na bieżąco,
      nie trzeba niczego zatwierdzać.</p>
      <p>Można wpisywać na żywo między meczami albo wszystko naraz po grze. Można też wrócić do wieczoru
      sprzed tygodnia i uzupełnić.</p>`,
  },

  poprawianie: {
    tytul: 'Pomyłka przy wpisywaniu',
    tresc: `<p>Po prostu wpisz poprawną liczbę na miejsce błędnej — wszystko przeliczy się od nowa,
      łącznie z tabelą, ELO i tytułami. Nic nie jest zamrożone.</p>
      <p>Cały mecz kasuje się przyciskiem 🗑 przy jego nagłówku, a cały wieczór — na dole ekranu „Wieczór”.</p>`,
  },

  ktowpisuje: {
    tytul: 'Każdy ze swojego telefonu',
    tresc: `<p>Wyniki lądują we wspólnej bazie, więc <b>wpisywać może każdy</b> i wszyscy widzą to od razu,
      bez odświeżania. Nie ma logowania — kto ma link, ten wpisuje.</p>
      <p>Dwie osoby mogą wpisywać równocześnie: każdy mecz zapisuje się osobno, więc nic się nie nadpisze.</p>
      <p class="pomoc-nota">Na starcie appka pyta „kto tam?”. To tylko po to, żeby podświetlać Twój wiersz
      w tabeli — nie blokuje niczego.</p>`,
  },

  offline: {
    tytul: 'Bez zasięgu w hali',
    tresc: `<p>Wpisuj normalnie. Appka trzyma kopię lokalną i pokazuje wszystko od razu, a zapisy wyśle,
      gdy łącze wróci. Kropka przy nazwie w nagłówku mówi, jak jest:
      <b class="plus">zielona</b> — na żywo, <b class="ostrzezenie">żółta</b> — lokalnie, wyśle się później.</p>`,
  },
};

/* ------------------------------------------------------ wielka instrukcja */

export const SEKCJE = [
  {
    id: 'punktacja', nazwa: 'Jak liczymy punkty', godlo: '🧮',
    wstep: 'Jedna waluta, jedna definicja zwycięstwa i trzy mecze, w których każdy gra z każdym. Reszta z tego wynika.',
    hasla: ['saldo', 'werdykt', 'rotacja', 'format', 'sklady', 'gosc', 'towarzyski'],
  },
  {
    id: 'tytuly', nazwa: 'Tytuły i trofea', godlo: '🏆',
    wstep: 'Trzy poziomy sławy: jeden wieczór, jeden miesiąc, cały sezon.',
    hasla: ['mvp', 'bigboss', 'przydomki', 'puchar'],
  },
  {
    id: 'elo', nazwa: '🏸ELO🏸 i fory', godlo: '📈',
    wstep: 'Ranking, który nie daje tytułu, tylko wyrównuje mecze.',
    hasla: ['elo', 'fory'],
  },
  {
    id: 'sezon', nazwa: 'Sezon i kalendarz', godlo: '📅',
    wstep: 'Terminy są umowne — i system jest tak zbudowany, żeby to nie przeszkadzało.',
    hasla: ['kalendarz', 'rundy', 'nieobecnosci'],
  },
  {
    id: 'obsluga', nazwa: 'Obsługa aplikacji', godlo: '📱',
    wstep: 'Wpisywanie, poprawianie i co się dzieje, gdy w hali nie ma zasięgu.',
    hasla: ['wpisywanie', 'poprawianie', 'ktowpisuje', 'offline'],
  },
];

/* ----------------------------------------------------------------- dymek */

/** Mały znaczek ⓘ przy nagłówku karty. Klika się go i wyskakuje wyjaśnienie
    — obsługę kliknięcia trzyma jeden delegowany listener w app.js. */
export function dymek(klucz, { etykieta = null } = {}) {
  const h = POMOC[klucz];
  if (!h) return '';
  return `<button class="dymek" type="button" data-pomoc="${klucz}"
    aria-label="Wyjaśnienie: ${h.tytul}" title="${h.tytul}">${etykieta ?? 'i'}</button>`;
}

/** Nagłówek karty razem z dymkiem — najczęstszy układ, żeby się nie powtarzać. */
export function naglowekZPomoca(tytul, klucz, { poziom = 'h2', dodatek = '' } = {}) {
  return `<${poziom} class="karta-tytul">${tytul}${dymek(klucz)}${dodatek}</${poziom}>`;
}
