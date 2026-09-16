# Turniej Pana Piąteczki

Badmintonowa liga wtorkowa dla czterech osób. Gramy deble, ale **punkty liczą się
osobno każdemu** — i o to była cała trudność.

## Adres do rozesłania

```
https://olaf169-lang.github.io/Claude-mobile/piateczka/
```

To pełny link do wysłania na grupę — otwiera się w każdej przeglądarce, bez logowania
i bez instalowania. Na telefonie warto raz dać **„Dodaj do ekranu głównego”** (Android:
menu ⋮ → *Dodaj do ekranu głównego*; iPhone: przycisk udostępniania → *Do ekranu
początkowego*) — wtedy zachowuje się jak zwykła aplikacja i działa nawet bez zasięgu
w hali.

| | |
|---|---|
| Skład | Jacek · Tomek · Kafaar · Piąteczka |
| Kiedy | wtorki, sezon jesienno-zimowy (start 15 września 2026) |
| Format | domyślnie do dwóch wygranych setów, sety do 15 (przy 15:15 na przewagę 2); zmienny przy każdym meczu |
| Waluta | wygrane mecze → wygrane sety → zdobyte punkty → mecz bezpośredni |
| Rozgrywki | debel i singiel osobno: dwie tabele, dwa rankingi |
| Finał | Puchar Pana Piąteczki, 23 marca 2027 |

---

## Skąd się wziął taki, a nie inny system

### Trzy mecze, w których każdy gra z każdym

Przy czterech osobach istnieją **dokładnie trzy** możliwe zestawienia debla:

| mecz | para A | para B |
|---|---|---|
| 1 | Jacek + Tomek | Kafaar + Piąteczka |
| 2 | Jacek + Kafaar | Tomek + Piąteczka |
| 3 | Jacek + Piąteczka | Tomek + Kafaar |

Po tych trzech meczach każdy zagrał **raz w parze z każdym** i **dwa razy przeciw
każdemu**. Nic się nie losuje, nikt nie siedzi na ławce, wszyscy grają cały czas.
To jest fundament: skoro warunki były identyczne, wynik mierzy grę, a nie szczęście
do partnera.

### Liczą się zwycięstwa

Wygrany mecz to wygrany mecz. **15:2 waży dokładnie tyle samo co 15:13** i tak samo
przegrana 2:15 waży tyle co 13:15 — punkty stracone nie wchodzą do tabeli w ogóle.
To świadoma decyzja z 2026-09-15: liga ma nagradzać wygrywanie, a nie ładne
przegrywanie.

Remisy w liczbie zwycięstw rozstrzygają się po kolei:

```
1. wygrane mecze
2. wygrane sety
3. zdobyte punkty
4. mecz bezpośredni  (bilans z osobami, z którymi nadal jest remis)
```

Przy trzech deblach bilans wygranych może wyjść **tylko na trzy sposoby**:
3-1-1-1, 2-2-1-1 albo 2-2-2-0, więc same zwycięstwa faktycznie by się zbiły w kupę —
dlatego kryteria 2–4. Urwane sety i punkty z tablicy nie są walutą, tylko linijką
do mierzenia remisów.

O wygranej meczu decydują **sety, a przy remisie w setach — suma punktów**. Ta jedna
definicja obowiązuje wszędzie: w tabeli, przy MVP i w rankingu ELO.

### Singiel i debel to dwie osobne rozgrywki

Osobna tabela, osobne statystyki, osobne ELO. Trybu się nie wpisuje — bierze się
z obsady: jeden na jednego to singiel, dwóch na dwóch to debel. W tabeli pokazują
się **tylko ci, którzy w danym trybie zagrali**; zagraliście singla we dwóch, reszta
się tam nie pojawi.

W wyniku wieczoru i przy MVP liczą się wszystkie mecze razem — tam chodzi o to, kto
miał dobry dzień, a nie o osobne ligi.

### Format nie jest sztywny

Format to dwie liczby: **ile wygranych setów** kończy mecz (1 albo 2) i **do ilu
punktów** gra się seta. Domyślnie 2 × 15, ale szybka gierka do 7 w jednym secie jest
równie legalna i liczy się normalnie — skoro walutą są zwycięstwa, mecz to mecz.
Format wybrany na karcie wieczoru jest domyślny dla nowych meczów, a **każdy mecz
może mieć swój własny**.

Niezależnie od formatu: przy remisie na styku gra się **na przewagę dwóch punktów**,
bez górnego limitu — set kończy się więc na 17:15, 21:19 albo dalej. Wpisuje się
dokładnie taki wynik, jaki był na tablicy.

Aplikacja liczy też **head-to-head** (bilans W:P z każdym rywalem i z każdym
partnerem osobno) i **rekordy sezonu** (najlepszy wieczór, największy pogrom,
najdłuższa seria zwycięstw, najlepszy duet) — wszystko z tych samych wyników, bez
żadnego dodatkowego wpisywania.

### Raz zapisany wieczór zostaje

Dopóki wieczór jest otwarty, poprawia się go do woli — wpisujesz liczbę i już.
Przycisk **„Zapisz wieczór”** zamyka go na klucz: wynik jest policzony i nikt go
przypadkiem nie ruszy. Poprawka po zapisaniu wymaga **kodu administratora**, który
ma tylko właściciel ligi.

Zapora jest dwuwarstwowa: aplikacja sprawdza SHA-256 kodu, a reguły Firestore
przepuszczają zapis do zamkniętego dokumentu **wyłącznie wtedy, gdy zdejmuje zamek
i niesie prawidłowy skrót**. Uczciwie: to nie jest sejf — skrót siedzi w kodzie
aplikacji, więc ktoś obeznany z konsolą przeglądarki to obejdzie. Chodzi o to, żeby
wynik nie zmieniał się przypadkiem ani po cichu.

### Co, gdy nie ma kompletu

| przyszło | co gramy |
|---|---|
| 4 | trzy deble, pełna rotacja |
| 3 | single każdy z każdym — każdy gra dwa mecze, raz odpoczywa |
| 2 | jeden singiel, kolejne dorzucane przyciskiem „Dograj mecz” |
| 4 + osoba z zewnątrz | trzy deble; dopisany ma wynik dnia, ale nie wchodzi do tabeli ani do ELO |

Wieczór w trójce rusza tabelą słabiej, bo każdy gra dwa mecze zamiast trzech.
Tak ma być — mniejszy wieczór waży mniej.

Dodatkowe mecze dorzuca się przyciskiem **„Dograj mecz”**: wybierasz, kto gra po
której stronie (dotknięcie dorzuca do słabiej obsadzonej, więc najpierw dostajesz
1 na 1, potem 2 na 2) i w jakim formacie. Osoby spoza czwórki dopisuje się w składzie
przyciskiem **„+ dopisz osobę”**; żyją tylko w tym jednym wieczorze.

Jest też przełącznik **„wieczór towarzyski”**: wyniki się zapisują, ale nie liczą
do sezonu.

---

## Tytuły

- **MVP** — najwięcej wygranych meczów danego dnia, licząc single i deble razem.
  Przy remisie: wygrane sety, potem zdobyte punkty.
- **Gracz Miesiąca** — najwięcej wygranych w miesiącu, tytuł na cały następny miesiąc.
  Miesiąc z jednym wieczorem też się liczy. Nie ma osobnego znaczka „Gracz Miesiąca”:
  **jego przydomek dostaje poświatę i koronę**, zostając w swoim kolorze.
- **Przydomki** — szesnaście ksywek bojowych z własnymi godłami SVG, liczonych na
  bieżąco ze statystyk. **Na starcie nikt nie ma żadnej** — trzeba sobie zasłużyć
  albo przechlapać. Zawsze nosisz najlepszą, na jaką się aktualnie łapiesz; kto
  spełnia kilka warunków z tego samego poziomu, temu ksywka rotuje z wieczorami.

  | poziom | przydomek | za co |
  |---|---|---|
  | 🥉 | Płakał | z ostatnich 6 meczów ≥ 2 przegrane dopiero w trzecim secie |
  | 🥉 | Spalona Gierka | trzy przegrane w jeden wieczór |
  | 🥉 | Pierd w Cwelsalce | przegrany set przy własnym wyniku ≤ 4 |
  | 🥉 | Klątwa Kamisha | pięć przegranych meczów z rzędu |
  | 🥉 | Majkel Schmeichel | z ostatnich 7 meczów wygrane najwyżej 2 |
  | 🥉 | Mistrz Pedałowania | dobry bilans w deblu (≥60%), słaby w singlu (≤35%) |
  | 🥈 | Młot | najwięcej zdobytych punktów |
  | 🥈 | Mur | najmniej straconych punktów |
  | 🥈 | Robin | drugie miejsce w tabeli |
  | 🥈 | Hounter | wygrany mecz z liderem tabeli |
  | 🥈 | Gladiator | ≥ 2 sety wygrane po dogrywce |
  | 🥈 | Mistrz Podwórka | pierwsze miejsce w tabeli singla |
  | 🥇 | Mmmpuuu! | pięć wygranych meczów z rzędu (seria bieżąca) |
  | 🥇 | Piąteczkowy Szał | komplet zwycięstw w jednym wieczorze (min. 3 mecze) |
  | 🥇 | Forma Kwincioka | ≥ 75% wygranych w bieżącym miesiącu, przy min. 4 meczach |
  | 🥇 | Nietykalny | 4 sety z ostatnich 5 meczów wygrane tak, że rywal utknął na ≤ 8 pkt |

  Brąz to poziom pocieszny (za pech i słabszą passę), srebro solidny, złoto to wyczyn.

- **Puchar Pana Piąteczki** — singlowy wieczór na koniec sezonu, każdy z każdym,
  rozstawienie według tabeli. Osobne trofeum: sezon nagradza regularność, Puchar
  jeden dobry wieczór.

## 🏸ELO🏸

Ranking formy, który **nie daje tytułu**. Każdy startuje z 1000, siła pary to średnia
ratingów, a **punkty zdobyte w setach nie mają tu żadnego znaczenia** — liczy się, kto
wygrał. Jedyny wyjątek to urwany set: wygrana 2:0 waży 1,0, wygrana 2:1 — 0,85,
przegrana 1:2 — 0,15, przegrana 0:2 — 0,0. Urwać komuś seta to jednak coś.

**Singiel i debel mają osobne ratingi** — to dwie różne gry. Mecze z dopisanymi
osobami są pomijane, bo ktoś bez ratingu nie pozwala uczciwie wycenić zwycięstwa.

Przy nazwisku widać **serię zwycięstw** (`×3 🔥`), liczoną od dwóch wygranych z rzędu;
od pięciu zapala się drugi płomień. Seria biegnie przez cały sezon i zeruje się przy
pierwszej przegranej — to miara formy, nie dorobku.

**Nikt nigdy nie dostaje forów, punktów na start ani żadnego innego ułatwienia.**
Procenty są czystą informacją — gra się normalnie i wpisuje wynik z tablicy.

---

## Kalendarz sezonu 2026/27

29 wtorków (26 grywalnych) od 15 września do 30 marca. Z góry odpuszczone: **22 i 29 grudnia**
(święta, Sylwester) oraz **30 marca** — wypada zaraz po Wielkanocy i zostaje terminem
rezerwowym. Przerwa świąteczna sama dzieli sezon na **Rundę Jesienną** i **Zimową**,
każda ze swoim mistrzem, obok klasyfikacja generalna.

Reszta dat jest umowna. Aplikacja przyjmie wynik z dowolnego dnia.

---

## Jak to jest zrobione

Vanilla JS (moduły ES), zero buildu, zero frameworka — tak samo jak reszta aplikacji
w tym repozytorium. PWA z service workerem, żeby dało się ją otworzyć w hali bez zasięgu.

```
index.html          szkielet, pasek, dolna nawigacja
styles.css          granat + złoto, dwa motywy na zmiennych
js/dane.js          skład, formaty, kalendarz sezonu
js/liczenie.js      rotacja par, tryby, klasyfikacja, MVP
js/elo.js           rating (osobno debel/singiel), seria zwycięstw, szanse par
js/tytuly.js        Gracz Miesiąca, przydomki (3 poziomy), godła SVG
js/zamek.js         kod administratora do zapisanych wieczorów
js/pomoc.js         WSZYSTKIE teksty regulaminu
js/wykresy.js       iskry w tabeli i wykres ELO
js/baza.js          Firestore + kopia lokalna
js/ekran-*.js       po jednym module na ekran
narzedzia/ikony.py  generator ikon PWA (bez Pillow — własny zapis PNG)
```

### Podpowiedzi i instrukcja to jeden plik

`js/pomoc.js` jest jedynym źródłem regulaminu. Te same hasła wyświetlają się jako
dymki **ⓘ** przy nagłówkach kart **oraz** składają się na wielką instrukcję pod
„Zasady”. Nie da się doprowadzić do sytuacji, w której podpowiedź mówi co innego niż
regulamin, bo to dosłownie ten sam tekst.

Dopisując regułę: dopisz hasło w `POMOC`, wpisz jego klucz do `SEKCJE` i wstaw
`dymek('klucz')` przy odpowiedniej karcie. Nic więcej.

### Wspólna baza

Wyniki lądują w Firestore (ten sam projekt co „Jaka to Melodia” — kilkadziesiąt
dokumentów na sezon, darmowy plan to udźwignie). Dzięki temu **każdy wpisuje ze
swojego telefonu** i wszyscy widzą to od razu, bez odświeżania.

Jeden dokument na wieczór (id = data), mecze jako mapa w polu `mecze`. Zapis idzie
ścieżką pola, więc gdy dwie osoby wpisują różne mecze tego samego wieczoru, nic się
nie nadpisuje. Bez sieci aplikacja czyta z kopii w `localStorage`, a zapisy Firestore
kolejkuje.

Pole `zamkniety` trzyma zamek opisany wyżej. Reguły dopuszczają zapis do zamkniętego
dokumentu tylko wtedy, gdy ustawia `zamkniety: false` i niesie prawidłowy skrót kodu;
zmiana kodu wymaga podmiany skrótu w **dwóch** miejscach: `js/zamek.js`
i `jaka-to-melodia/firestore.rules`.

> **Wdrożenie reguł.** Reguły Firestore dla kolekcji `piateczkaWieczory` dopisane są
> w `jaka-to-melodia/firestore.rules` (jeden projekt = jeden zestaw reguł). Żeby
> zaczęły obowiązywać, trzeba je raz wypchnąć:
> `firebase deploy --only firestore:rules` albo wkleić w konsoli Firebase.
> **Dopóki tego nie zrobisz, zapisy będą odbijane** i aplikacja zostanie w trybie
> lokalnym.

### Kolory

Granat `#0A1628` jako tło, złoto `#D9A441` **wyłącznie** przy zaszczytach (pierwsze
miejsce, MVP, Gracz Miesiąca, seria zwycięstw, Puchar) — rzadkie użycie zachowuje mu
wartość. Zieleń i czerwień zarezerwowane dla zmian ratingu, miedź dla trzeciego
miejsca na podium. Motyw jasny nie jest wyprany: tło ma wyraźny chłodny odcień,
karty są czystą bielą, a złoto schodzi do `#8A5D12`, bo jasne na bieli jest nieczytelne.
Złoto na granacie ma kontrast 8,06:1; te same barwy na butelkowej zieleni dawały
4,2:1, czyli za mało na liczby w tabeli — stąd wybór granatu.

Cztery kolory serii na wykresach (`js/wykresy.js`) są przypisane **na stałe do
gracza**, nie do miejsca w tabeli, i przeszły walidację rozróżnialności przy
daltonizmie na granatowym tle.

## Uruchomienie lokalne

```sh
python3 -m http.server 8080      # z katalogu głównego repozytorium
# → http://localhost:8080/piateczka/
```

Ikony przerysowuje `python3 narzedzia/ikony.py`.
