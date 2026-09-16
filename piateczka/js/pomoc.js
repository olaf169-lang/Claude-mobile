/* ==========================================================================
   System podpowiedzi.

   Jedno źródło, dwa miejsca: te same hasła wyświetlają się jako małe dymki ⓘ
   przy kartach na ekranach ORAZ składają się na wielką instrukcję pod
   „Zasady”. Dzięki temu nie da się doprowadzić do sytuacji, w której
   podpowiedź mówi co innego niż regulamin, bo to dosłownie ten sam tekst.

   Dopisując regułę: dopisz hasło tutaj, wpisz jego klucz do SEKCJE i wstaw
   dymek(klucz) przy odpowiedniej karcie. Nic więcej.
   ========================================================================== */

/* `kluczowe: true` = hasło, bez którego nie da się grać. Ekran „Zasady”
   rysuje takie w wyróżnionym boksie, żeby nie utonęły między resztą.

   Ton: rzeczowo i krótko. Zasada, jedno zdanie uzasadnienia tylko tam, gdzie
   bez niego reguła wygląda na przypadkową. Żadnych „dzięki temu jest fajnie”
   (wyraźna uwaga użytkownika z 2026-09-16, że instrukcja tłumaczyła za dużo). */
export const POMOC = {

  /* ------------------------------------------------------- jak liczymy */

  punktacja: {
    kluczowe: true,
    tytul: 'Jak liczymy punkty',
    tresc: `<p><b>Liczą się zwycięstwa.</b> 15:2 i 15:13 znaczą tyle samo.</p>
      <p>Przy równej liczbie zwycięstw decyduje po kolei:</p>
      <ol class="lista-kryteriow">
        <li><b>wygrane mecze</b></li>
        <li><b>wygrane sety</b></li>
        <li><b>zdobyte punkty</b></li>
        <li><b>mecz bezpośredni</b>: kto kogo ogrywał</li>
      </ol>
      <p><b>Punkty stracone nie liczą się wcale.</b> Nieobecność kosztuje zero.</p>`,
  },

  tryby: {
    kluczowe: true,
    tytul: 'Singiel i debel to dwie rozgrywki',
    tresc: `<p>Osobna tabela, osobne statystyki, osobne 🏸ELO🏸.</p>
      <p><b>Rodzaj wybierasz na starcie wieczoru</b>, na karcie „W co gracie?”. Appka układa wtedy trzy
      deble z pełną rotacją albo single każdy z każdym. Drugi rodzaj dorzucisz w każdej chwili
      przyciskiem „Dograj mecz”.</p>
      <p>Debel chodzi w błękicie, singiel w złocie, i tak samo na kartach meczów oraz w przełącznikach tabel.</p>
      <p class="pomoc-nota">W wyniku wieczoru i przy MVP liczą się wszystkie mecze razem.</p>`,
  },

  werdykt: {
    kluczowe: true,
    tytul: 'Kto wygrał mecz',
    tresc: `<p>Najpierw <b>sety</b>. Przy remisie w setach rozstrzyga <b>suma punktów</b> z całego meczu:
      15:5, 13:15 to 28:20, czyli wygrana mimo 1:1 w setach.</p>
      <p>Ta definicja obowiązuje w tabeli, przy MVP i w 🏸ELO🏸.</p>`,
  },

  format: {
    kluczowe: true,
    tytul: 'Format meczu',
    tresc: `<p>Domyślnie <b>do dwóch wygranych setów, sety do 15</b>. Format ustawiasz dwiema liczbami:
      ile wygranych setów (1 albo 2) i do ilu punktów, od szybkiej gierki do 7 po pełny dystans.</p>
      <p><b>Przy remisie na styku gra się na przewagę dwóch punktów</b>, bez górnego limitu: 17:15,
      21:19 i dalej. Wpisujecie wynik z tablicy, pole przyjmuje liczby powyżej granicy seta.</p>
      <p class="pomoc-nota">Format z karty wieczoru jest domyślny dla nowych meczów; <b>każdy mecz może
      mieć swój</b>, ustawia go mały przycisk przy jego nagłówku.</p>`,
  },

  rotacja: {
    tytul: 'Trzy deble, każdy z każdym',
    tresc: `<p>Przy czwórce istnieją <b>dokładnie trzy</b> zestawienia debla i appka ustawia wszystkie.
      Po takim wieczorze każdy zagrał raz w parze z każdym i dwa razy przeciw każdemu.</p>
      <p>Nic się nie losuje. Kolejność meczów przesuwa się co tydzień.</p>`,
  },

  sklady: {
    tytul: 'Ilu was przyszło',
    tresc: `<p><b>Deble:</b> czterech → trzy mecze z pełną rotacją. Mniej niż czterech → appka ułoży
      single, bo nie ma z czego złożyć par.</p>
      <p><b>Single:</b> każdy z każdym. Czterech → sześć meczów, trzech → trzy, dwóch → jeden.
      W każdej rundzie gracie po jednym meczu, więc nikt nie ma trzech pod rząd.</p>
      <p class="pomoc-nota">W wyniku wieczoru widać tylko tych, którzy faktycznie grali.</p>`,
  },

  gosc: {
    tytul: 'Dopisane osoby',
    tresc: `<p>Przycisk <b>„+ dopisz osobę”</b> dorzuca do wieczoru kogoś spoza czwórki, ilu chcecie,
      każdy ze swoim imieniem.</p>
      <p>Grają normalnie i mają swój wynik dnia, ale <b>nie wchodzą do tabeli sezonu ani do 🏸ELO🏸</b>:
      ktoś, kto wpadł raz, nie ma się do czego porównać.</p>
      <p class="pomoc-nota">Dopisana osoba żyje tylko w tym jednym wieczorze.</p>`,
  },

  towarzyski: {
    tytul: 'Wieczór towarzyski',
    tresc: `<p>Przełącznik „zapisz wyniki, ale nie licz ich do sezonu”. Wyniki zostają w historii,
      ale nie ruszają tabeli, ELO ani tytułów.</p>`,
  },

  /* ------------------------------------------------------------ tytuły */

  mvp: {
    tytul: 'MVP, czyli najlepszy tego wieczoru',
    tresc: `<p><b>Najwięcej wygranych meczów danego dnia</b>, licząc single i deble razem. Przy remisie:
      wygrane sety, potem zdobyte punkty. Gdy i to równe, MVP jest dzielone.</p>
      <p>Tytuł jest jednorazowy, do następnej gry.</p>`,
  },

  bigboss: {
    tytul: 'Gracz Miesiąca',
    tresc: `<p><b>Najwięcej wygranych meczów w miesiącu.</b> Tytuł nosi się przez cały następny miesiąc.</p>
      <p>Nie ma osobnego znaczka: <b>przydomek zdobywcy zaczyna świecić</b> i dostaje koronę.</p>
      <p class="pomoc-nota">Wystarczy jeden rozegrany wieczór. W trakcie miesiąca widać prowadzącego;
      tytuł twardnieje z jego końcem.</p>`,
  },

  przydomki: {
    tytul: 'Przydomki',
    tresc: `<p><b>Na starcie nikt nie ma przydomka.</b> Liczą się same z Twoich wyników, nic się nie losuje.</p>
      <p>Trzy poziomy: <b>🥉 brąz</b> za pech i słabszą passę, <b>🥈 srebro</b> za solidną robotę,
      <b>🥇 złoto</b> za wyczyn.</p>
      <p>Nosisz zawsze <b>najlepszy</b>, na jaki się łapiesz. Kto spełnia kilka warunków z tego samego
      poziomu, temu ksywka rotuje z wieczorami.</p>
      <p><b>Debel i singiel liczą się razem</b>, do jednej puli meczów. Oba tryby porównują tylko
      dwa przydomki: „Mistrz Pedałowania” (mocny w deblu, słaby w singlu) i „Samotny Wilk”
      (odwrotnie).</p>
      <p class="pomoc-nota">Wszystkie swoje trafione przydomki zobaczysz po dotknięciu swojego
      kafelka na ekranie „Tytuły” albo swojego wiersza w tabeli. Pełna lista z godłami
      i warunkami też jest na ekranie „Tytuły”.</p>`,
    wiecej: '#/tytuly',
  },

  puchar: {
    tytul: 'Puchar Pana Piąteczki',
    tresc: `<p>Osobny, singlowy wieczór na koniec sezonu: każdy z każdym, rozstawienie według tabeli.</p>
      <p>To oddzielne trofeum, więc mistrz sezonu i zdobywca Pucharu mogą być dwiema różnymi osobami.</p>`,
  },

  /* -------------------------------------------------------------- ELO */

  elo: {
    tytul: '🏸ELO🏸, czyli forma',
    tresc: `<p>Tabela mówi, kto wygrał więcej. ELO mówi, <b>jak mocno grasz względem tego, z kim
      trafiłeś</b>. Każdy startuje z 1000, siła pary to średnia ratingów, a wygrani zabierają tyle,
      na ile wynik był niespodzianką.</p>
      <p><b>Punkty w setach nie mają znaczenia</b>, liczy się, kto wygrał. Wyjątek: urwany set.
      Wygrana 2:0 waży więcej niż 2:1, przegrana 1:2 mniej niż 0:2.</p>
      <p><b>Singiel i debel mają osobne ratingi.</b> Mecze z dopisanymi osobami są pomijane.</p>
      <p class="pomoc-nota">ELO nie liczy się do tytułu i nie daje nikomu ułatwień.</p>`,
  },

  seria: {
    tytul: 'Seria zwycięstw, czyli ×3 🔥',
    tresc: `<p>Ile meczów z rzędu właśnie wygrałeś w danym trybie. Pokazuje się od dwóch, od pięciu
      zapala się drugi płomień.</p>
      <p>Biegnie przez cały sezon, także między wtorkami. Jedna przegrana zeruje.</p>`,
  },

  forma: {
    tytul: 'Forma zestawień',
    tresc: `<p>Porównanie średnich ELO obu stron, czyli jak rozkładają się szanse w danym zestawieniu.</p>
      <p><b>Nikt nie dostaje punktów na start ani żadnego wyrównania.</b> Procenty są tylko informacją
      przed meczem.</p>`,
  },

  /* ------------------------------------------------------------ sezon */

  kalendarz: {
    tytul: 'Kalendarz sezonu',
    tresc: `<p>Sezon 2026/27: wtorki od 15 września do 30 marca. Z góry odpuszczone: <b>22 i 29 grudnia</b>
      oraz <b>30 marca</b> (termin rezerwowy po Wielkanocy).</p>
      <p>Reszta dat jest <b>umowna</b>, appka przyjmie wynik z dowolnego dnia.</p>`,
  },

  rundy: {
    tytul: 'Dwie rundy',
    tresc: `<p><b>Runda Jesienna</b> trwa do świąt, <b>Runda Zimowa</b> od stycznia do marca.</p>
      <p>Każda ma swojego mistrza, obok leci klasyfikacja generalna z całego sezonu.</p>`,
  },

  nieobecnosci: {
    tytul: 'Opuszczone wtorki nic nie kosztują',
    tresc: `<p>Nie grasz, to nie zyskujesz i nie tracisz. Nie ma kary za nieobecność ani progu
      „musisz zagrać minimum X razy”.</p>
      <p class="pomoc-nota">Kto gra częściej, ma więcej okazji na zwycięstwa, bo tabela liczy je sumarycznie.</p>`,
  },

  /* -------------------------------------------------------- sędziowanie */

  sedzia: {
    tytul: 'Tryb sędziego',
    tresc: `<p>Zliczanie pojedynczych zagrań w jednym meczu: <b>winner, as, aut, siatka, błąd serwisu,
      błąd</b>. Wybierasz gracza, klikasz zdarzenie i gracz zostaje wybrany, więc serię akcji jednej
      osoby klikasz jednym palcem. Ostatnie zagranie cofa „↶”.</p>
      <p>Wchodzi się przyciskiem 🎙 przy nagłówku meczu. Liczba obok ikony mówi, ile zagrań już jest.</p>
      <p class="pomoc-nota"><b>Te liczby nie wchodzą do tabeli ani do 🏸ELO🏸.</b> Nie każdy mecz będzie
      sędziowany, więc porównywanie ich byłoby nieuczciwe. To ciekawostka, nie waluta.</p>`,
  },

  transkrypcja: {
    tytul: 'Sędziowanie z transkrypcji',
    tresc: `<p>Zamiast klikać, można mówić. Appka rozumie zwykłe zdania:
      <i>„Tomek serwis w aut. Przy moim serwisie winner. Błąd Jacka.”</i> Rozpoznaje odmianę imion
      i „mój/moim” jako siebie.</p>
      <p>Tekst bierze się z trzech miejsc: mikrofon na klawiaturze telefonu (działa wszędzie),
      przycisk 🎤 w apce (Android/Chrome) albo wklejenie gotowej transkrypcji z notatki głosowej.</p>
      <p><b>Nic nie zapisuje się od razu</b>: najpierw widzisz listę tego, co appka zrozumiała,
      możesz wyrzucić błędne pozycje, dopiero potem „Dopisz do meczu”. Kawałki, których nie
      rozumie, wypisuje osobno zamiast zgadywać.</p>
      <p class="pomoc-nota">Pliku audio appka nie przerobi, najpierw musi powstać tekst.</p>`,
  },

  /* --------------------------------------------------------- obsługa */

  wpisywanie: {
    tytul: 'Jak wpisać wynik',
    tresc: `<p><b>Wieczór</b> → dzień gry → w co gracie → kto przyszedł. Appka ustawia mecze, Wy wpisujecie
      wyniki setów. Przelicza się na bieżąco, nic nie trzeba zatwierdzać w trakcie.</p>
      <p>Dodatkowy mecz w dowolnym momencie: <b>„Dograj mecz”</b>. Wybierasz, kto gra po której stronie
      i w jakim formacie.</p>
      <p class="pomoc-nota">Dzień gry to zwykłe pole daty. Graliście w sobotę, to ustawiasz sobotę.</p>`,
  },

  zamykanie: {
    kluczowe: true,
    tytul: 'Zapisanie wieczoru i kod',
    tresc: `<p>Przycisk <b>„Zapisz wieczór”</b> zamyka wieczór na klucz. Od tej chwili nikt już w nim
      nic nie zmieni. Dopóki jest otwarty, poprawiacie do woli.</p>
      <p><b>Poprawka po zapisaniu wymaga kodu</b>, który ma tylko Pan Piąteczka. Po odblokowaniu
      zapisujecie wieczór na nowo.</p>
      <p class="pomoc-nota">Uczciwie: to zapora przed pomyłką i cichą zmianą wyniku, nie sejf.</p>`,
  },

  poprawianie: {
    tytul: 'Pomyłka przy wpisywaniu',
    tresc: `<p>W otwartym wieczorze: wpisz poprawną liczbę na miejsce błędnej. Przeliczy się wszystko,
      tabela, ELO, przydomki.</p>
      <p>Mecz kasuje 🗑 przy jego nagłówku, a cały wieczór przycisk na dole ekranu.</p>
      <p class="pomoc-nota">Po zapisaniu potrzebny jest kod, patrz „Zapisanie wieczoru”.</p>`,
  },

  ktowpisuje: {
    tytul: 'Każdy ze swojego telefonu',
    tresc: `<p>Wyniki lądują we wspólnej bazie: <b>wpisywać może każdy</b>, wszyscy widzą to od razu.
      Dwie osoby mogą wpisywać równocześnie, każdy mecz zapisuje się osobno.</p>
      <p class="pomoc-nota">Pytanie „kto tam?” na starcie służy tylko do podświetlenia Twojego wiersza
      w tabeli.</p>`,
  },

  offline: {
    tytul: 'Bez zasięgu w hali',
    tresc: `<p>Wpisuj normalnie. Appka trzyma kopię lokalną i wyśle zapisy, gdy łącze wróci.</p>
      <p>Kropka przy nazwie: <b class="plus">zielona</b> to na żywo, <b class="ostrzezenie">żółta</b> to
      lokalnie.</p>`,
  },
};

/* ------------------------------------------------------ wielka instrukcja */

export const SEKCJE = [
  {
    id: 'punktacja', nazwa: 'Jak liczymy punkty', godlo: '🧮',
    wstep: 'Liczą się zwycięstwa. Reszta to rozstrzyganie remisów.',
    hasla: ['punktacja', 'tryby', 'werdykt', 'rotacja', 'format', 'sklady', 'gosc', 'towarzyski'],
  },
  {
    id: 'tytuly', nazwa: 'Tytuły i trofea', godlo: '🏆',
    wstep: 'Trzy poziomy sławy: jeden wieczór, jeden miesiąc, cały sezon.',
    hasla: ['mvp', 'bigboss', 'przydomki', 'puchar'],
  },
  {
    id: 'elo', nazwa: '🏸ELO🏸 i forma', godlo: '📈',
    wstep: 'Ranking, który nie daje ani tytułu, ani żadnych ułatwień, tylko pokazuje formę.',
    hasla: ['elo', 'seria', 'forma'],
  },
  {
    id: 'sezon', nazwa: 'Sezon i kalendarz', godlo: '📅',
    wstep: 'Terminy są umowne, a system jest tak zbudowany, żeby to nie przeszkadzało.',
    hasla: ['kalendarz', 'rundy', 'nieobecnosci'],
  },
  {
    id: 'obsluga', nazwa: 'Obsługa aplikacji', godlo: '📱',
    wstep: 'Wpisywanie, zapisywanie, poprawianie i co się dzieje, gdy w hali nie ma zasięgu.',
    hasla: ['wpisywanie', 'zamykanie', 'poprawianie', 'sedzia', 'transkrypcja', 'ktowpisuje', 'offline'],
  },
];

/* ----------------------------------------------------------------- dymek */

/** Mały znaczek ⓘ przy nagłówku karty. Klika się go i wyskakuje wyjaśnienie
    (obsługę kliknięcia trzyma jeden delegowany listener w app.js). */
export function dymek(klucz, { etykieta = null } = {}) {
  const h = POMOC[klucz];
  if (!h) return '';
  return `<button class="dymek" type="button" data-pomoc="${klucz}"
    aria-label="Wyjaśnienie: ${h.tytul}" title="${h.tytul}">${etykieta ?? 'i'}</button>`;
}

/** Nagłówek karty razem z dymkiem: najczęstszy układ, żeby się nie powtarzać. */
export function naglowekZPomoca(tytul, klucz, { poziom = 'h2', dodatek = '' } = {}) {
  return `<${poziom} class="karta-tytul">${tytul}${dymek(klucz)}${dodatek}</${poziom}>`;
}
