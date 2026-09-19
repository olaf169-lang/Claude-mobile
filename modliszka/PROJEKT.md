# MODLISZKA (roboczo MANTIS), projekt gry

Wersja robocza dokumentu, 2026-09-19. Zastępuje pierwotny brief, którego kopia leży
obok w `brief-pierwotny.md`. Nic nie jest jeszcze zakodowane.

Oznaczenia:
**ZMIANA** = świadomie odchodzę od briefu, uzasadnienie pod spodem.
**DECYZJA** = brief milczał, wybieram domyślnie.
**PYTANIE** = potrzebuję Twojej odpowiedzi, zebrane też na końcu w rozdziale 16.

---

## 1. Gracz i cel

Jedno dziecko, 5,5 roku, nie czyta płynnie, telefon pionowo, jedna ręka albo dwie.
Gra działa offline, bez konta, bez reklam, bez zakupów, bez sieci.

Pięć emocji, po kolei, i to jest cała definicja sukcesu projektu:

1. „To jest moja modliszka.” (kilkanaście sekund)
2. „Muszę łapać owady.” (minuta)
3. „Jak ją nakarmię, to urośnie.” (kilka minut)
4. „O KURCZE, ONA UROSŁA!” (pierwsza wylinka)
5. „BRAWO! Odblokowałem nowe modliszki!” (koniec)

Wszystko, co nie pracuje na te pięć zdań, wypada z zakresu. To jest kryterium,
którym będę odrzucał pomysły, także własne.

---

## 2. Ocena briefu

Brief jest dobry w rzeczach, które najczęściej się psuje: wie, dla kogo jest gra,
wie, że najważniejsza jest wylinka, świadomie rezygnuje ze śmierci i kar, trzyma
tekst na minimum i ma rozsądną listę MVP. To solidny szkielet i większość zostaje.

Trzy rzeczy trzeba rozstrzygnąć, zanim powstanie pierwsza linia kodu.

**Pierwsza: brief sam ze sobą się kłóci.** Rozdział 5 mówi, że domyślny wariant to
„dotknij owada, modliszka sama podejdzie, złapie i zje”. Rozdział 22 mówi, że
satysfakcja ma wynikać ze „znalezienia, podejścia, dobrego momentu i efektownego
złapania”. Te dwa zdania się wykluczają. Jeżeli wszystko dzieje się samo, nie ma
żadnego „dobrego momentu”, jest ekran, w który się stuka. Dziecko wytrzyma przy
tym trzy minuty. Rozstrzygam to w rozdziale 4 i jest to najważniejsza zmiana w
całym dokumencie.

**Druga: brief nie mówi nic o technologii ani o tym, skąd się biorą obrazki.**
To jest realne ryzyko całego projektu, większe niż cokolwiek w mechanice. Gra
opisana słowami „urocza stylizowana natura, animacja inspirowana prawdziwymi
modliszkami” to przy klasycznym podejściu kilkaset klatek animacji dla pięciu
stadiów i trzech modliszek, czyli praca na tygodnie i pieniądze na grafika.
Rozstrzygam w rozdziałach 3 i 11.

**Trzecia: gra kończy się za szybko i za płasko.** Po ukończeniu pierwszej
modliszki odblokowują się dwie kolejne, ale są to te same stadia, ten sam świat i
te same owady w innym kolorze. Drugie przejście będzie nudne. Rozstrzygam w
rozdziale 9.

Poza tym drobiazgi: brak przycisku wyciszenia (rodzic go będzie potrzebował
pierwszego dnia), brak możliwości zagrania modliszką od nowa po ukończeniu (dziecko
w tym wieku powtarza to samo dwadzieścia razy), brak decyzji o języku i nazwie.

---

## 3. Technologia i dystrybucja

**DECYZJA: gra powstaje jak BANGladesz26, czyli zwykła strona PWA,
HTML plus JavaScript plus Canvas 2D, bez frameworka i bez kroku budowania.**

Powody:

- Dziecko dostaje ikonę na ekranie głównym telefonu przez „Dodaj do ekranu
  głównego”, bez App Store, bez Google Play, bez konta dewelopera i bez
  99 dolarów rocznie.
- Działa offline po pierwszym otwarciu (service worker), tak samo jak BANGladesz26.
- Hostuje się za darmo na GitHub Pages, tym samym mechanizmem, który już masz.
- Nowa wersja to jeden `git push`, dziecko dostaje ją przy następnym otwarciu.
- Ten sam styl kodu i te same konwencje co reszta repo, więc za pół roku da się
  do tego wrócić.

Czego świadomie nie używam: Unity, Godota, Fluttera, React Native, żadnego
silnika gier. Dla gry tej wielkości silnik to 20 do 60 MB pobierania,
kilkusekundowe ładowanie na telefonie i sklep jako jedyna sensowna dystrybucja.
Canvas 2D uciągnie to bez zadyszki, bo na ekranie będzie jedna modliszka,
kilkanaście owadów i tło.

Rendering: jeden `<canvas>` na pełny ekran, stała rozdzielczość logiczna w pionie,
skalowanie do ekranu, `devicePixelRatio` ograniczone do 2, pętla na
`requestAnimationFrame` z ograniczeniem kroku czasu, pauza przy schowaniu
aplikacji w tło.

---

## 4. Sterowanie i pętla rozgrywki

**ZMIANA: nie robimy dwóch wariantów A i B do przetestowania. Jest jeden wariant,
który łączy zalety obu. Testy porównawcze nie mają tu sensu, bo tester jest jeden
i ma 5,5 roku, a gra musi być zrozumiała od pierwszego uruchomienia.**

### Sterowanie

- **Dotknięcie pustego miejsca**: modliszka idzie w tamtą stronę. Palec można
  przytrzymać i przesuwać, wtedy modliszka idzie za palcem jak na smyczy.
- **Dotknięcie owada (albo blisko owada)**: modliszka bierze go na cel, podchodzi
  sama i atakuje, kiedy jest w zasięgu.
- Promień wybaczania przy dotknięciu owada jest duży, w praktyce około jednej
  trzeciej szerokości ekranu wokół punktu dotyku wybiera najbliższego owada.
- Nie ma joysticka, nie ma osobnego przycisku ataku, nie ma podwójnego
  dotknięcia, nie ma przytrzymania jako mechaniki (poza opisanym ciągnięciem).

**ZMIANA ważna dla wygody: modliszka nigdy nie jest pod palcem.** Dziecko celuje w
owada, nie w modliszkę, więc ręka nie zasłania bohatera. W wariancie „przesuwaj
modliszkę palcem” z briefu dłoń dziecka siedziałaby dokładnie na tym, co ma
oglądać.

### Skradanie, czyli miejsce na „dobry moment”

**ZMIANA: owady zauważają modliszkę i mogą uciec. To jedyne wyzwanie w grze
i jest ono miękkie.**

Każdy owad ma promień czujności i próg hałasu. Hałas modliszki zależy od jej
prędkości. Jeżeli modliszka wejdzie w promień czujności szybko, owad się płoszy,
odskakuje albo odlatuje kawałek i robi się ostrożniejszy. Jeżeli modliszka
podchodzi wolno (dziecko przesuwa palec powoli, albo stuka w punkt bliżej siebie),
owad jej nie zauważa.

Po trzecim spłoszeniu owad odlatuje ze świata na dobre i po chwili pojawia się
inny. To jest całe „przegranie”: jeden owad mniej, żadnej kary, żadnego ekranu,
żadnego dźwięku porażki, pasek nie spada.

Dlaczego to jest kluczowe:

- To jest prawdziwa modliszka. Modliszka poluje z zasadzki i czeka, nie biega za
  muchami. Mechanika i temat zaczynają mówić to samo.
- Daje napięcie i ulgę, bez przemocy i bez kary. Bez tego gra nie ma żadnego łuku
  emocjonalnego i to jest, moim zdaniem, największa dziura w briefie.
- Uczy czegoś sensownego: cierpliwości. Dla pięciolatka „wolniej znaczy lepiej”
  to niebanalne odkrycie i widać, kiedy mu wchodzi.
- Skaluje trudność bez dotykania sterowania: pierwsze owady mają czujność zero
  (nie da się ich nie złapać), późniejsze coraz wyższą. Trudność rośnie przez
  zawartość, a nie przez wymagania wobec palca.

### Atak i jedzenie

Modliszka w zasięgu wykonuje szybkie uderzenie przednimi odnóżami. Zasięg jest
hojny, mniej więcej półtorej długości ciała. Trafienie: chwyt, krótkie zatrzymanie
kamery, dźwięk „klap”, potem 1 do 2 sekund animacji jedzenia i iskierka energii,
która wlatuje w pasek. Pudło: owad ucieka na bok, modliszka wraca do pozycji,
dziecko stuka jeszcze raz. Bez komunikatu i bez smutnego dźwięku.

---

## 5. Owady

Wartości startowe do dostrojenia na dziecku. „Czujność” 0 oznacza owada, którego
nie da się spłoszyć.

| owad | ruch | czujność | pożywienie | od stadium |
|---|---|---|---|---|
| mszyca | prawie stoi na łodydze | 0 | 1 | L1 |
| muszka | krótkie loty, długie przerwy | 0 | 1 | L1 |
| mrówka | idzie szybko po gałązce, nie zatrzymuje się | 0,2 | 1 | L1 |
| mucha | łuki w powietrzu, siada, zrywa się | 0,6 | 2 | L2 |
| ćma | wolne, chwiejne krążenie, ciągnie do światła | 0,3 | 2 | L3 |
| konik polny | siedzi, przy spłoszeniu daleki skok | 0,8 | 3 | L3 |
| chrząszcz | powolny łazik po ziemi, dłużej się je | 0,2 | 3 | L4 |
| ważka | szybka, nerwowa, trudna | 0,9 | 5 | po zwycięstwie |

**ZMIANA: ważka jest nagrodą po ukończeniu gry, nie zwykłym owadem.** Pojawia się
dopiero na wolnym polowaniu dorosłą modliszką (rozdział 8). Chodzi o to, żeby po
napisach było jeszcze coś do odkrycia.

Jednocześnie na planszy żyje 3 do 5 owadów, z czego przynajmniej jeden zawsze
łatwy. Nowy owad pojawia się poza kadrem albo zza liścia, nigdy nie „mrugnie”
w środku ekranu.

---

## 6. Wzrost i stadia

**ZMIANA: pięć stadiów, cztery wylinki.** Brief dawał przykład czterech poziomów
bez rozstrzygnięcia, ile ich w końcu jest. Pięć to dobry kompromis: jest ich
tyle, że dziecko czuje serię, i na tyle mało, że sesja mieści się w kwadransie.
Ostatnia wylinka jest inna niż poprzednie (rozdział 8).

| stadium | punkty do awansu | długość ciała | zasięg widoku kamery |
|---|---|---|---|
| L1 | 3 | 40 | 1,00 |
| L2 | 5 | 55 | 1,08 |
| L3 | 8 | 72 | 1,17 |
| L4 | 12 | 92 | 1,26 |
| L5 (dorosła) | koniec | 115 | 1,36 |

Razem 28 punktów, czyli mniej więcej 14 do 18 owadów i 8 do 12 minut pierwszej
rozgrywki. Liczby stroimy po pierwszym teście, nie wcześniej.

**ZMIANA: kamera odjeżdża z każdym stadium.** To jest tani trik, który podwaja
odczucie wzrostu: modliszka rośnie na ekranie, a jednocześnie liście, kamienie i
trawy stają się mniejsze względem niej. Dziecko nie potrafi tego nazwać, ale widzi,
że świat zrobił się mniejszy. Sama zmiana rozmiaru sprite'a nigdy nie daje takiego
efektu, bo mózg porównuje bohatera z otoczeniem, nie z pamięcią sprzed minuty.

**ZMIANA: pasek jest segmentowany, jeden segment to jeden punkt pożywienia.**
Dziecko w tym wieku nie odczyta „75 procent”, ale policzy trzy puste okienka.
Duży owad zapełnia dwa albo trzy segmenty naraz i to jest mały fajerwerk sam w
sobie. Pasek nigdy nie spada.

Obok paska duża cyfra stadium (1 do 5) i sylwetka modliszki, która rośnie razem z
nią. Zero innego tekstu na ekranie gry.

---

## 7. Wylinka

Zostaje jako najważniejszy moment gry, zgodnie z briefem, z dwoma doprecyzowaniami.

Przebieg, około 4 do 5 sekund:

1. świat zwalnia do jakichś 20 procent prędkości, przyciemnia się poza modliszką,
2. kamera dojeżdża do modliszki, ta zawisa pod gałązką,
3. stary pancerzyk pęka na grzbiecie, jasna szczelina, iskry,
4. nowa modliszka powoli wysuwa się z niego, jest miękka i jaśniejsza,
5. skorupa zostaje i opada, nowa modliszka prostuje odnóża i otrząsa się,
6. kolor wraca do normalnego, błysk, pyłek, listki,
7. kamera odjeżdża już z nowym zasięgiem, duża cyfra stadium wchodzi na ekran.

**DECYZJA: 4 do 5 sekund, ani sekundy więcej.** Dziecko zobaczy tę animację 4 razy
na przejście i kilkanaście razy łącznie. Dziesięciosekundowa cutscenka przy
trzecim obejrzeniu jest już przeszkodą, a nie nagrodą. Po pierwszym obejrzeniu
dotknięcie ekranu przewija do końca, bez żadnego przycisku „pomiń”.

**DECYZJA: wylinka nie jest osobnym ekranem.** W briefie to SCREEN 3. Zrobię ją w
tej samej scenie gry, tylko z przejętą kamerą i zatrzymanymi owadami. Przełączenie
ekranu zabija wrażenie ciągłości („to działo się naprawdę, tam gdzie stałam”), a do
tego komplikuje kod bez powodu.

---

## 8. Zwycięstwo, skrzydła i wolne polowanie

**ZMIANA, i to jest mój ulubiony pomysł w całym dokumencie: ostatnia wylinka daje
skrzydła.**

Prawdziwa modliszka dostaje skrzydła dopiero po ostatniej wylince, kiedy staje się
dorosła. To jest gotowa, darmowa, prawdziwa i czytelna nagroda finałowa, dużo
lepsza niż puchar, bo zmienia bohatera, a nie dokłada ikonę obok niego. Przebieg:
modliszka wychodzi z ostatniej skorupy ze zmiętymi skrzydłami, przez dwie sekundy
je rozprostowuje, potem otwiera na całą szerokość. Wtedy światło, konfetti, listki
i świetliki.

Ekran zwycięstwa zgodnie z briefem: wielkie **BRAWO!**, modliszka na dużym liściu,
puchar może zostać jako ozdoba obok, ale gwiazdą sceny są skrzydła. Zdanie
„UKOŃCZYŁEŚ MODLISZKĘ!” wycinam, bo dziecko go nie przeczyta. Zamiast niego
grafika: modliszka, pięć gwiazdek (po jednej za stadium) i dwie karty modliszek,
które się odsłaniają.

**ZMIANA: po zwycięstwie gra wraca do świata, a nie do menu.** Dorosła modliszka
zostaje na planszy, paska już nie ma, nic nie trzeba, można polować dla przyjemności
i wtedy właśnie pojawia się ważka. Dziecko samo wyjdzie do menu, kiedy będzie
chciało. To jest pięć linijek kodu, a ratuje najgorszy moment każdej gry dla dzieci,
czyli „wygrałem i nagle nic”.

---

## 9. Trzy modliszki i trzy światy

**ZMIANA: każda modliszka ma własne środowisko, nie tylko własny kolor.**

Brief zakładał, że trzy modliszki różnią się kolorem, a świat jest jeden. Wtedy
drugie przejście to dokładnie ta sama gra w innym odcieniu i dziecko odpadnie po
pięciu minutach. Osobne tło to przy naszym podejściu do grafiki (rozdział 11) w
praktyce inna paleta, inne kształty roślin i inne cząsteczki w powietrzu, czyli
koszt godzin, a nie dni.

| modliszka | wygląd | świat | detal |
|---|---|---|---|
| 1. zielona | klasyczna, zielona | letnia łąka w słońcu | pyłki w powietrzu, koniczyna |
| 2. brązowa | jesienna, kamuflaż | sucha ściółka i gałęzie | opadające liście, złote światło |
| 3. storczykowa | biało-różowa, płatki na odnóżach | kwiat o zmierzchu | świetliki, ciemniejsze niebo |

Modliszka storczykowa (Hymenopus coronatus) to prawdziwy gatunek, wygląda jak
chodzący kwiat i jest bezkonkurencyjną nagrodą na koniec. Warto, żeby trzecia była
właśnie nią, a nie abstrakcyjną „kolorową”.

Żadnych umiejętności specjalnych, zgodnie z briefem. Różnice są wizualne, plus
inne owady akcentowane w danym świecie (nocne ćmy i świetliki u trzeciej).

**PYTANIE: odblokowanie dwóch naraz czy po kolei?** Brief mówi: ukończ pierwszą,
dostajesz dwie. Plus: mocniejszy moment nagrody, dwie karty odsłaniają się razem.
Minus: po drugim przejściu nie ma już nic do odblokowania, a przy trzeciej
modliszce dziecko wie, że nic z tego nie wyniknie. Alternatywa: pierwsza odblokowuje
drugą, druga odblokowuje trzecią, a trzecia odblokowuje coś małego na deser
(na przykład nocną wersję łąki albo złotą modliszkę do zabawy). Moja rekomendacja
to jednak zostawić dwie naraz jak w briefie, bo wizualnie jest to mocniejsze, i
dopiero za trzecią ukończoną dać małą niespodziankę.

---

## 10. Ekrany

Pięć, nie sześć (wylinka nie jest osobnym ekranem, patrz rozdział 7).

1. **DOM**: duża, animowana modliszka, pod nią trzy karty modliszek (zablokowane
   jako ciemne sylwetki z kłódką), pod spodem jeden wielki przycisk **GRAJ**.
   W rogu mała nutka do wyciszenia.
2. **GRA**: świat, modliszka, owady, pasek segmentowy, cyfra stadium. W rogu mała
   strzałka powrotu do domu, w bezpiecznej odległości od kciuka.
3. **NOWE STADIUM**: nakładka po wylince, duża cyfra, dwie sekundy, znika sama.
4. **ZWYCIĘSTWO**: BRAWO, skrzydła, gwiazdki, odsłonięcie dwóch kart.
5. **WYBÓR MODLISZKI**: to jest ten sam ekran co DOM, nie osobny. Brief miał to
   rozbite na SCREEN 1 i SCREEN 6 i dublowało się to bez potrzeby.

**DECYZJA: brak jakichkolwiek ustawień.** Jedyny przełącznik w całej grze to dźwięk.
Reset postępu (bo dziecko będzie chciało zagrać pierwszą modliszką od nowa) robię
tak: karta ukończonej modliszki dostaje mały znaczek „ukończone” i po jej wybraniu
gra zaczyna się od L1 z zachowaniem odblokowań. Czyli ukończenie nigdy nie blokuje
ponownej zabawy i nic nie trzeba kasować.

---

## 11. Grafika, czyli największe ryzyko projektu

**DECYZJA: modliszka i owady są rysowane proceduralnie w kodzie, wektorowo, nie
jako gotowe obrazki.**

Modliszka to szkielet: głowa, tułów, odwłok, sześć odnóży z przegubami, dwa
odnóża chwytne, czułki, po ostatniej wylince skrzydła. Rysuję ją krzywymi i
elipsami, animuję matematyką (chód jako fale przesunięte w fazie, uderzenie jako
krótka krzywa czasu, oddech jako sinus).

Co to daje:

- **Stadia są za darmo.** L1 do L5 to jeden rysunek z innymi proporcjami:
  większa skala, dłuższe odnóża, mniejsza głowa względem ciała. Zero dodatkowych
  klatek. To samo dotyczy trzech modliszek: inna paleta i inne proporcje.
- **Nie ma problemu „skąd wziąć animację”.** Nie kupujemy assetów, nie generujemy
  setek PNG, nie mamy kłopotu z licencją ani ze spójnością stylu.
- **Waży tyle, co nic.** Cała gra powinna zmieścić się w kilkuset kilobajtach,
  czyli ładuje się natychmiast i działa offline bez wysiłku.
- **Wszystko jest sterowalne.** Miękka, jaśniejsza modliszka zaraz po wylince to
  zmiana dwóch liczb, a nie osobny zestaw grafik.

Czego się spodziewać uczciwie: to nie będzie wyglądać jak ilustracja z książeczki.
Będzie wyglądać jak czysta, płynna, wektorowa animacja przyrodnicza. Moim zdaniem
lepiej, żeby modliszka poruszała się prawdziwie i płynnie, niż żeby była ładnie
namalowana i chodziła jak papierowa wycinanka. Ruch robi tu dużo więcej niż
malunek, zwłaszcza u modliszki, bo ona ma charakterystyczny, kołyszący chód
(prawdziwe modliszki kiwają się na boki, udając liść na wietrze, i to jeden ruch
sprzedaje całą postać).

Tło (trawy, liście, gałęzie, kamienie) rysuję raz przy starcie planszy na ukrytym
canvasie i potem tylko przesuwam, więc każda klatka to modliszka, owady i
cząsteczki. Na telefonie to nie zamuli.

**PYTANIE: zgadzasz się na ten kierunek, czy wolisz prawdziwe, malowane
ilustracje?** Druga droga jest możliwa (generowane grafiki albo kupione assety),
ale kosztuje tygodnie zamiast dni i usztywnia wszystko, co powyżej opisałem jako
„za darmo”.

---

## 12. Dźwięk

**DECYZJA: dźwięk syntezowany w Web Audio, bez plików.** Krótkie efekty (klap,
chrup, dzwoneczek wzrostu, akord wylinki, fanfara odblokowania) da się złożyć z
oscylatorów i szumu. Zero pobierania, zero licencji, wszystko offline, wszystko
strojone liczbami.

Tło: delikatny szum łąki (filtrowany szum plus rzadkie świerszcze). Muzyka
melodyczna dopiero na końcu prac, jeżeli w ogóle, bo przy takiej grze ambient
sprawdza się lepiej i nie męczy przy dwudziestym uruchomieniu.

**Obowiązkowo: przycisk wyciszenia na ekranie domowym, stan zapamiętany.** Brief o
tym nie wspomina, a to pierwsza rzecz, której zażąda dorosły w samochodzie albo
o 20:30. Do tego odblokowanie audio przy pierwszym dotknięciu, inaczej iPhone nie
puści dźwięku.

---

## 13. Zapis

`localStorage`, klucz z przedrostkiem `mantis:`, jak `b26:` w BANGladesz26.

Zapisujemy: wersję formatu, wybraną modliszkę, dla każdej modliszki jej stadium i
punkty, listę odblokowanych, listę ukończonych, ustawienie dźwięku.
Zapis po każdym zjedzonym owadzie i po każdej wylince, czyli zamknięcie gry w
dowolnym momencie nic nie kosztuje. Numer wersji formatu od początku, żeby dało
się później zmienić strukturę bez psucia postępu dziecka.

---

## 14. Telefon, rzeczy praktyczne

Brief tego nie obejmował, a bez tego gra jest nie do grania:

- pion na sztywno, obrót ekranu nic nie zmienia,
- brak przewijania strony, brak przybliżania dwoma palcami, brak podświetlania
  zaznaczenia, brak menu po przytrzymaniu palca,
- bezpieczne marginesy na wcięcie ekranu i pasek gestów,
- cele dotykowe nie mniejsze niż 48 punktów, przycisk powrotu daleko od miejsc,
  w które się gra,
- pauza, kiedy aplikacja idzie w tło (dziecko przełącza się na bajki i wraca),
- brak wyjścia z gry przypadkowym gestem, brak zewnętrznych linków,
- cel 60 klatek, ale gra ma wyglądać dobrze też przy 30,
- wibracja przy złapaniu, jeżeli telefon ją ma (BANGladesz26 już tak robi).

**PYTANIE: na jakim telefonie to ma chodzić (iPhone czy Android, mniej więcej
jaki model i rocznik)?** To wpływa na budżet cząsteczek i na to, jak agresywnie
muszę oszczędzać.

---

## 15. Plan prac

Kolejność inna niż lista MVP z briefu. Brief układał zadania według listy funkcji,
ja układam według ryzyka: najpierw to, co może się nie udać i co trzeba sprawdzić
na dziecku, potem to, co na pewno wyjdzie.

**M1. Czy to w ogóle dobrze się czuje.** Canvas, świat, modliszka, chód, kamera,
sterowanie palcem. Bez owadów, bez paska. Dajemy dziecku do ręki: czy chodzenie
modliszką samo w sobie jest przyjemne i czy dziecko rozumie, jak ją prowadzić.
Jeżeli nie, wszystko dalsze byłoby budowane na piasku.

**M2. Pętla.** Owady, czujność i płoszenie, atak, jedzenie, pasek, stadia z
rosnącą skalą i odjeżdżającą kamerą. Brzydka grafika, bez dźwięku. To jest
moment na drugi test na dziecku: czy łapie bez tłumaczenia, czy skradanie jest
zrozumiałe, czy liczby są dobre.

**M3. Nagroda.** Wylinka, nowe stadium, ostatnia wylinka ze skrzydłami, ekran
zwycięstwa, wolne polowanie po zwycięstwie.

**M4. Meta.** Ekran domowy, wybór modliszki, odblokowania, zapis, druga i trzecia
modliszka z własnymi światami.

**M5. Oprawa.** Dopracowanie rysunku i animacji, cząsteczki, dźwięki, ikona,
instalacja PWA, działanie offline.

Po każdym etapie gra jest uruchamialna na telefonie. Po M2 jest już grą.

---

## 16. Pytania do Ciebie

1. **Telefon.** iPhone czy Android, jaki model? Wpływa na wydajność i na
   sposób instalacji ikony.
2. **Skradanie.** Zgoda na to, że owady mogą się spłoszyć i uciec (moja mocna
   rekomendacja), czy wolisz wersję całkowicie bez wyzwania, gdzie każdy owad jest
   pewny?
3. **Grafika.** Rysowana w kodzie, wektorowo (moja rekomendacja, patrz rozdział 11),
   czy szukamy prawdziwych ilustracji?
4. **Odblokowania.** Dwie modliszki naraz jak w briefie, czy po kolei, żeby było
   po co grać trzeci raz?
5. **Nazwa i język.** Interfejs po polsku, tego jestem pewien. Ale nazwa: zostaje
   „MANTIS”, czy „MODLISZKA” (pięciolatek przeczyta i zrozumie to drugie, a „mantis”
   nic mu nie mówi)?
6. **Kto gra.** Czy to ma być gra „dla dziecka” do zostawienia mu z telefonem, czy
   gra do grania razem z Tobą? To zmienia długość sesji i to, ile emocji chowamy
   na później.

---

## 17. Czego świadomie nie robimy

Żeby nie wracać do tego przy każdej kolejnej rozmowie: bez śmierci, bez pasków
życia, bez głodu i bez timerów, bez waluty, sklepu i skórek do kupienia, bez
reklam, bez konta i chmury, bez rankingów, bez poziomów trudności do wyboru, bez
samouczka z tekstem, bez joysticka, bez osobnego przycisku ataku, bez przemocy i
bez krwi (łapanie kończy się iskierką energii, nie posiłkiem w szczegółach).

Jeżeli któraś z tych rzeczy wróci w rozmowie, to znaczy, że gra przestaje być grą
dla pięciolatka i staje się grą dla nas.
