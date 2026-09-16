/* ==========================================================================
   System podpowiedzi.

   Jedno źródło, dwa miejsca: te same hasła wyświetlają się jako małe dymki ⓘ
   przy kartach na ekranach ORAZ składają się na wielką instrukcję pod
   „Zasady”. Dzięki temu nie da się doprowadzić do sytuacji, w której
   podpowiedź mówi co innego niż regulamin — bo to dosłownie ten sam tekst.

   Dopisując regułę: dopisz hasło tutaj, wpisz jego klucz do SEKCJE i wstaw
   dymek(klucz) przy odpowiedniej karcie. Nic więcej.
   ========================================================================== */

/* `kluczowe: true` = hasło, bez którego nie da się grać. Ekran „Zasady”
   rysuje takie w wyróżnionym boksie, żeby nie utonęły między resztą. */
export const POMOC = {

  /* ------------------------------------------------------- jak liczymy */

  punktacja: {
    kluczowe: true,
    tytul: 'Jak liczymy punkty',
    tresc: `<p><b>Liczą się zwycięstwa.</b> Wygrany mecz to wygrany mecz — nieważne, czy poszło 15:2,
      czy 15:13. Kto wygrał ich więcej, ten jest wyżej. Koniec.</p>
      <p>Gdy dwie osoby mają tyle samo zwycięstw, tabela schodzi po kolei niżej:</p>
      <ol class="lista-kryteriow">
        <li><b>wygrane mecze</b></li>
        <li><b>wygrane sety</b></li>
        <li><b>zdobyte punkty</b></li>
        <li><b>mecz bezpośredni</b> — kto kogo ogrywał</li>
      </ol>
      <p><b>Punkty stracone nie liczą się wcale.</b> Przegrana 15:2 waży w tabeli dokładnie tyle samo co
      przegrana 15:13 — przegrana to przegrana. Za to urwany set widać i w tabeli, i w 🏸ELO🏸.</p>
      <p class="pomoc-nota">Nieobecność kosztuje dokładnie zero: nie grasz, nic nie zyskujesz i nic
      nie tracisz.</p>`,
  },

  tryby: {
    kluczowe: true,
    tytul: 'Singiel i debel to dwie rozgrywki',
    tresc: `<p><b>Osobna tabela, osobne statystyki, osobne 🏸ELO🏸.</b> Debel i singiel to dwie różne gry,
      więc nie mieszamy ich w jednym worku.</p>
      <p><b>Wybierasz na starcie wieczoru</b> — pierwsza karta pyta „w co gracie?”. Appka układa wtedy
      albo trzy deble z pełną rotacją, albo single każdy z każdym. Drugi rodzaj dorzucisz w każdej
      chwili przyciskiem „Dograj mecz”: po deblach można jeszcze zagrać szybkiego singielka.</p>
      <p>Na ekranach Tabela i 🏸ELO🏸 przełączasz się między nimi jednym dotknięciem. Debel chodzi
      w błękicie, singiel w złocie — te same barwy wracają na kartach meczów.</p>
      <p class="pomoc-nota">W wyniku wieczoru i przy MVP liczą się wszystkie mecze razem — tam chodzi
      o to, kto miał dobry dzień, a nie o osobne ligi.</p>`,
  },

  werdykt: {
    kluczowe: true,
    tytul: 'Kto wygrał mecz',
    tresc: `<p>Najpierw <b>sety</b>. Gdy jest remis w setach (np. 1:1), rozstrzyga <b>suma punktów</b>
      z całego meczu. Mecz 15:5, 13:15 to 28:20, więc to wygrana, choć sety są po jednym.</p>
      <p>Ta jedna definicja obowiązuje wszędzie: w tabeli, przy MVP i w 🏸ELO🏸. Remis w meczu jest możliwy
      tylko wtedy, gdy i sety, i punkty wyjdą równo — czyli prawie nigdy.</p>`,
  },

  format: {
    kluczowe: true,
    tytul: 'Format meczu',
    tresc: `<p>Domyślnie gramy <b>do dwóch wygranych setów, sety do 15</b> — tak samo w deblu i w singlu.
      Ale format nie jest sztywny: ustawiasz <b>ile setów</b> (jeden albo dwa wygrane) i <b>do ilu punktów</b>.
      Chcecie szybką gierkę do siedmiu w jednym secie? Proszę bardzo.</p>
      <p><b>Przy remisie na styku gra się na przewagę dwóch punktów</b> — bez górnego limitu. Set kończy się
      więc na 17:15, 21:19 albo i dalej. Wpisujecie dokładnie taki wynik, jaki był na tablicy; pole
      przyjmuje liczby powyżej granicy seta.</p>
      <p>Trzeci set pojawia się w aplikacji dopiero przy stanie 1:1, więc pola do wpisania są zawsze
      te, które faktycznie rozegraliście.</p>
      <p class="pomoc-nota">Format wybrany na karcie wieczoru jest domyślny dla nowych meczów, ale
      <b>każdy mecz może mieć swój</b> — dotknij małego przycisku z formatem przy jego nagłówku.
      Tabela liczy zwycięstwa, więc mieszanie formatów niczego nie psuje.</p>`,
  },

  rotacja: {
    tytul: 'Trzy mecze, każdy z każdym',
    tresc: `<p>Przy czwórce istnieją <b>dokładnie trzy</b> możliwe zestawienia debla — i appka ustawia wszystkie trzy.
      Po takim wieczorze każdy zagrał <b>raz w parze z każdym</b> i <b>dwa razy przeciw każdemu</b>.</p>
      <p>Nic się nie losuje i nikt nie siedzi na ławce. To jest fundament, na którym stoi cała tabela:
      skoro wszyscy mieli identyczne warunki, liczba zwycięstw mierzy grę, a nie szczęście do partnera.</p>
      <p class="pomoc-nota">Kolejność meczów przesuwa się co tydzień, żeby nie zawsze ta sama para
      rozgrzewała halę. Dodatkowe mecze — także singlowe — dorzucacie przyciskiem „Dograj mecz”
      i sami wybieracie, kto z kim.</p>`,
  },

  sklady: {
    tytul: 'Przyszło mniej niż czterech',
    tresc: `<p>Przy <b>deblach</b>: czterech to trzy mecze z pełną rotacją. Jak przyszło mniej,
      appka i tak ułoży single — z trójki nie da się złożyć par.</p>
      <p>Przy <b>singlach</b>: każdy z każdym. Czterech → sześć meczów, trzech → trzy, dwóch → jeden.
      Karuzela jest ułożona tak, że w każdej rundzie gracie po jednym meczu, więc nikt nie ma trzech
      pod rząd.</p>
      <p>Deble wpadają do tabeli debla, single do tabeli singla. W wyniku wieczoru i przy MVP
      liczą się wszystkie mecze razem.</p>
      <p class="pomoc-nota">W podsumowaniu wieczoru widać <b>tylko tych, którzy faktycznie grali</b>.
      Zagracie singla we dwóch — nieobecni się nie pojawią.</p>`,
  },

  gosc: {
    tytul: 'Dopisane osoby',
    tresc: `<p>Przyciskiem <b>„+ dopisz osobę”</b> dorzucasz do wieczoru kogokolwiek spoza czwórki — ilu
      chcesz, każdy ze swoim imieniem. Grają normalnie i mają swój wynik wieczoru, ale
      <b>nie wchodzą do tabeli sezonu</b> ani do 🏸ELO🏸.</p>
      <p>Dlaczego: tabela i rating mają sens tylko wtedy, gdy wszyscy grają przez cały sezon.
      Ktoś, kto wpadł raz, nie ma się do czego porównać — a mecz z nim nie pozwala uczciwie wycenić
      niczyjego zwycięstwa.</p>
      <p class="pomoc-nota">Dopisana osoba żyje tylko w tym jednym wieczorze. Następnym razem
      dopisujesz ją od nowa.</p>`,
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
    tresc: `<p>Dostaje go osoba z <b>największą liczbą wygranych meczów danego dnia</b> — licząc single
      i deble razem. Przy remisie decydują wygrane sety, potem zdobyte punkty. Gdy i to jest równe,
      MVP jest dzielone.</p>
      <p>Tytuł jest jednorazowy: obowiązuje do następnej gry i nie przenosi się na sezon.</p>`,
  },

  bigboss: {
    tytul: 'Gracz Miesiąca',
    tresc: `<p>Kto w danym miesiącu wygrał <b>najwięcej meczów</b>. Tytuł nosi się przez cały następny
      miesiąc — do chwili, aż ktoś go zdejmie. Nie dostajesz osobnego znaczka „Gracz Miesiąca”: zamiast
      tego <b>Twój przydomek zaczyna świecić</b> i dostaje koronę, żeby było widać, kto tu rządzi.</p>
      <p class="pomoc-nota">Wystarczy jeden rozegrany wieczór. Dopóki miesiąc trwa, widać
      <i>prowadzącego</i> — tytuł twardnieje z końcem miesiąca.</p>`,
  },

  przydomki: {
    tytul: 'Przydomki',
    tresc: `<p><b>Na starcie nikt nie ma przydomka.</b> Trzeba sobie na niego zasłużyć — albo go
      przechlapać. Appka liczy je na bieżąco z Twoich wyników, nic się nie losuje.</p>
      <p>Trzy poziomy: <b>🥉 brąz</b> — pocieszne, za pech i słabszą passę (Klątwa Kamisha, Spalona
      Gierka). <b>🥈 srebro</b> — solidne, tu już coś umiesz (Młot, Hounter, Mistrz Podwórka).
      <b>🥇 złoto</b> — wyczyn (Mmmpuuu!, Piąteczkowy Szał, Forma Kwincioka).</p>
      <p>Zawsze nosisz <b>najlepszy</b>, na jaki się aktualnie łapiesz — złoto przykrywa srebro, srebro
      przykrywa brąz. Kto spełnia kilka warunków z tego samego poziomu, temu ksywka podmienia się
      z tygodniami, żeby się nie znudziło.</p>
      <p class="pomoc-nota">Gracz Miesiąca nie dostaje osobnego znaczka ani czwartego poziomu — to jego
      przydomek świeci wtedy własnym kolorem i dostaje koronę. Pełna lista z godłami i warunkami
      jest na ekranie „Tytuły”.</p>`,
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
    tytul: '🏸ELO🏸 — forma',
    tresc: `<p>Tabela mówi, kto wygrał więcej meczów. ELO mówi co innego: <b>jak mocno grasz względem tego,
      z kim akurat trafiłeś</b>. Każdy startuje z 1000, siła pary to średnia ratingów obu graczy,
      a po meczu wygrani zabierają przegranym tyle, na ile wynik był niespodzianką.</p>
      <p><b>Punkty zdobyte w setach nie mają tu żadnego znaczenia</b> — liczy się, kto wygrał. Jedyny
      wyjątek: urwany set. Wygrana 2:0 waży więcej niż 2:1, a przegrana 1:2 boli mniej niż 0:2 — bo
      urwać komuś seta to jednak coś.</p>
      <p><b>Singiel i debel mają osobne ratingi.</b> Mecze z dopisanymi osobami są pomijane: ktoś bez
      ratingu nie pozwala uczciwie wycenić zwycięstwa.</p>
      <p class="pomoc-nota">ELO <b>nie liczy się do tytułu</b> i nie daje nikomu żadnych ułatwień.</p>`,
  },

  seria: {
    tytul: 'Seria zwycięstw — ×3 🔥',
    tresc: `<p>Znaczek przy nazwisku to <b>ile meczów z rzędu właśnie wygrałeś</b> w danym trybie.
      Pokazuje się od dwóch — jedna wygrana to jeszcze nie passa. Od pięciu zapala się drugi płomień.</p>
      <p>Seria biegnie przez cały sezon, także między wtorkami. Jedna przegrana i zeruje się do zera —
      dlatego to jest miara formy, a nie dorobku.</p>`,
  },

  forma: {
    tytul: 'Forma zestawień',
    tresc: `<p>Appka porównuje średnie ELO obu stron i pokazuje, jak rozkładają się szanse w każdym
      z możliwych zestawień. Nic poza tym.</p>
      <p><b>Nikt nigdy nie dostaje punktów na start, wyrównania ani żadnego innego ułatwienia.</b> Gracie
      normalnie, wpisujecie wynik z tablicy. Procenty są po to, żeby przed meczem wiedzieć, czy
      zapowiada się równa walka, czy ktoś jest faworytem — i nic więcej.</p>`,
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
    tresc: `<p><b>Nie grasz — nie zyskujesz i nie tracisz.</b> Twój dorobek po prostu stoi tam, gdzie stał.
      Nie ma kary za nieobecność, bo nie ma czego odejmować.</p>
      <p>Dlatego nie ma tu żadnych progów „musisz zagrać minimum X razy”. Możecie opuścić pięć wtorków
      z rzędu i tabela dalej będzie miała sens.</p>
      <p class="pomoc-nota">Uczciwie: kto gra częściej, ten ma więcej okazji na zwycięstwa, a tabela
      liczy je sumarycznie. Przy czwórce, która i tak gra razem albo wcale, to żaden problem —
      a kto opuścił wieczór, ten po prostu nie miał szansy dołożyć.</p>`,
  },

  /* --------------------------------------------------------- obsługa */

  wpisywanie: {
    tytul: 'Jak wpisać wynik',
    tresc: `<p>Wchodzisz w <b>Wieczór</b>, wybierasz dzień gry, zaznaczasz kto przyszedł — a appka sama
      ustawia mecze. Potem wpisujesz wyniki setów, po jednej liczbie na pole. Wszystko przelicza się
      na bieżąco, nie trzeba nic zatwierdzać w trakcie.</p>
      <p>Grę można dorzucić w dowolnym momencie: przycisk <b>„Dograj mecz”</b> pyta, kto gra po której
      stronie i w jakim formacie. Singla i debla wpisujesz tak samo — tryb bierze się z obsady.</p>
      <p class="pomoc-nota">Dzień gry to zwykłe pole daty. Graliście w sobotę? Ustawiasz sobotę i tyle.</p>`,
  },

  zamykanie: {
    kluczowe: true,
    tytul: 'Zapisanie wieczoru i kod',
    tresc: `<p>Gdy wszystko jest wpisane, naciskasz <b>„Zapisz wieczór”</b>. Wynik zostaje policzony,
      a wieczór <b>zamyka się na klucz</b> — od tej chwili nikt już w nim nic nie zmieni.</p>
      <p>Po co: żeby raz ustalony wynik nie „poprawiał się” tydzień później. Dopóki wieczór jest otwarty,
      poprawiacie do woli — po zapisaniu jest ustalony.</p>
      <p><b>Poprawka po zapisaniu</b> wymaga kodu, który ma tylko Pan Piąteczka. Napisz na grupie, co się
      nie zgadza; jak się zgodzi, poda kod, wtedy przycisk „Mam kod — odblokuj edycję” otwiera wieczór
      z powrotem. Po poprawce zapisujesz go na nowo.</p>
      <p class="pomoc-nota">Uczciwie: to zapora przed pomyłką i cichą zmianą wyniku, nie sejf.
      Kto się zna na przeglądarce i bardzo chce, ten to obejdzie — ale wtedy już wie, że oszukuje.</p>`,
  },

  poprawianie: {
    tytul: 'Pomyłka przy wpisywaniu',
    tresc: `<p>Dopóki wieczór jest otwarty: po prostu wpisz poprawną liczbę na miejsce błędnej —
      wszystko przeliczy się od nowa, łącznie z tabelą, ELO i przydomkami.</p>
      <p>Cały mecz kasuje się przyciskiem 🗑 przy jego nagłówku, a cały wieczór — na dole ekranu „Wieczór”.</p>
      <p class="pomoc-nota">Po naciśnięciu „Zapisz wieczór” trzeba już kodu — patrz „Zapisanie wieczoru”.</p>`,
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
    wstep: 'Ranking, który nie daje ani tytułu, ani żadnych ułatwień — tylko pokazuje formę.',
    hasla: ['elo', 'seria', 'forma'],
  },
  {
    id: 'sezon', nazwa: 'Sezon i kalendarz', godlo: '📅',
    wstep: 'Terminy są umowne — i system jest tak zbudowany, żeby to nie przeszkadzało.',
    hasla: ['kalendarz', 'rundy', 'nieobecnosci'],
  },
  {
    id: 'obsluga', nazwa: 'Obsługa aplikacji', godlo: '📱',
    wstep: 'Wpisywanie, zapisywanie, poprawianie i co się dzieje, gdy w hali nie ma zasięgu.',
    hasla: ['wpisywanie', 'zamykanie', 'poprawianie', 'ktowpisuje', 'offline'],
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
