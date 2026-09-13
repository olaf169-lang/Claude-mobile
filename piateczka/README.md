# Turniej Pana Piąteczki

Badmintonowa liga wtorkowa dla czterech osób. Gramy deble, ale **punkty liczą się
osobno każdemu** — i o to była cała trudność.

Adres: **[/Claude-mobile/piateczka/](https://olaf169-lang.github.io/Claude-mobile/piateczka/)**

| | |
|---|---|
| Skład | Jacek · Tomek · Kafaar · Piąteczka |
| Kiedy | wtorki, sezon jesienno-zimowy (start 6 października 2026) |
| Format | do dwóch wygranych setów, sety do 15 — tak samo w deblu i w singlu |
| Waluta | saldo małych punktów |
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

### Dlaczego saldo, a nie wygrane mecze

Przy trzech meczach bilans wygranych może wyjść **tylko na trzy sposoby**:
3-1-1-1, 2-2-1-1 albo 2-2-2-0. Nic innego nie jest matematycznie możliwe. Remisy
byłyby więc regułą, a po sezonie tabela zbiłaby się w kupę.

Dlatego walutą jest **saldo małych punktów**: `zdobyte − stracone`, set po secie.
Wygrany set 15:10 to `+5`, przegrany 12:15 to `−3`. Trzy własności, dla których
akurat to rozwiązanie wygrało:

1. **Sumuje się do zera w każdym wieczorze.** Nieobecność daje 0, czyli dokładnie
   średnią — ani nie karze, ani nie nagradza. Żadnych średnich na wieczór, procentów
   frekwencji ani progu „musisz zagrać minimum X razy”. Sezon może mieć dziury po
   świętach i tabela dalej jest uczciwa.
2. **Działa w każdym składzie.** Przyszło trzech → single każdy z każdym. Dwóch →
   jeden singiel. Saldo dalej sumuje się do zera i wpada do tej samej tabeli.
3. **Rozróżnia wszystko.** 21:19 to nie to samo co 21:5, więc realnie nie ma remisów,
   a walka w przegranym secie do końca faktycznie ratuje tabelę.

O wygranej meczu decydują **sety, a przy remisie w setach — saldo**. Ta jedna
definicja obowiązuje wszędzie: w tabeli, przy MVP i w rankingu ELO.

### Co, gdy nie ma kompletu

| przyszło | co gramy |
|---|---|
| 4 | trzy deble, pełna rotacja |
| 3 | single każdy z każdym — każdy gra dwa mecze, raz odpoczywa |
| 2 | jeden singiel, kolejne dorzucane przyciskiem „Dograj mecz” |
| 4 + Gość za nieobecnego | trzy deble; Gość ma saldo, ale nie wchodzi do tabeli ani do ELO |

Wieczór w trójce rusza tabelą słabiej, bo każdy gra dwa mecze zamiast trzech.
Tak ma być — mniejszy wieczór waży mniej.

Jest też przełącznik **„wieczór towarzyski”**: wyniki się zapisują, ale nie liczą
do sezonu.

---

## Tytuły

- **MVP** — najlepsze saldo wieczoru. Przy remisie: bilans setów, potem zdobyte punkty.
- **Big Boss** — najlepsze saldo miesiąca, tytuł na cały następny miesiąc. Miesiąc
  z jednym wieczorem to za mało — dokleja się do następnego (stąd okresy typu
  „Grudzień + Styczeń”). Ukłon w stronę świąt.
- **Przydomek Big Bossa** — dziewięć odznak z własnymi godłami, przyznawanych
  automatycznie na podstawie statystyk okresu. Warunki sprawdzane po kolei, od
  najrzadszego do najzwyklejszego; pierwszy pasujący wygrywa.

  | | przydomek | za co |
  |---|---|---|
  | 1 | Feniks | z ostatniego miejsca poprzedniego okresu na pierwsze |
  | 2 | Walec | przewaga ≥ 10 salda na wieczór nad drugim |
  | 3 | Cwaniak | przewaga ≤ 2 salda na wieczór |
  | 4 | Lokomotywa | najdłuższa seria wygranych setów (≥ 6) |
  | 5 | Jednoosobowa Armia | dodatnie saldo z każdym partnerem |
  | 6 | Chirurg | najlepszy bilans w setach kończonych różnicą ≤ 2 |
  | 7 | Mur | najmniej straconych punktów |
  | 8 | Młot | najwięcej zdobytych punktów |
  | 9 | Big Boss | wygrana bez spektakularnej statystyki obok |

- **Puchar Pana Piąteczki** — singlowy wieczór na koniec sezonu, każdy z każdym,
  rozstawienie według tabeli. Osobne trofeum: sezon nagradza regularność, Puchar
  jeden dobry wieczór.

## 🏸ELO🏸

Ranking mocy, który **nie daje tytułu**. Każdy startuje z 1000, siła pary to średnia
ratingów, o wygranej decyduje ten sam werdykt co w tabeli, a wyższa wygrana rusza
ratingiem mocniej — najwyżej o połowę. Mecze z Gościem są pomijane, bo ktoś bez
ratingu nie pozwala uczciwie wycenić zwycięstwa.

Jest po to, żeby aplikacja mogła policzyć **fory**: jeden punkt przewagi dla słabszej
pary za każde 40 punktów różnicy ELO, najwyżej pięć. Fory są dobrowolne i nie zmieniają
liczenia — wpisuje się wynik z tablicy.

---

## Kalendarz sezonu 2026/27

26 wtorków od 6 października do 30 marca. Z góry odpuszczone: **22 i 29 grudnia**
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
js/liczenie.js      rotacja par, saldo, klasyfikacja, MVP
js/elo.js           rating i fory
js/tytuly.js        okresy Big Bossa, przydomki, godła SVG
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

> **Wdrożenie reguł.** Reguły Firestore dla kolekcji `piateczkaWieczory` dopisane są
> w `jaka-to-melodia/firestore.rules` (jeden projekt = jeden zestaw reguł). Żeby
> zaczęły obowiązywać, trzeba je raz wypchnąć:
> `firebase deploy --only firestore:rules` albo wkleić w konsoli Firebase.
> **Dopóki tego nie zrobisz, zapisy będą odbijane** i aplikacja zostanie w trybie
> lokalnym.

### Kolory

Granat `#0A1628` jako tło, złoto `#D9A441` **wyłącznie** przy zaszczytach (pierwsze
miejsce, MVP, Big Boss, Puchar) — rzadkie użycie zachowuje mu wartość. Zieleń
i czerwień zarezerwowane dla salda, miedź dla trzeciego miejsca na podium.
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
