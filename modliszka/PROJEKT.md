# MODLISZKA (roboczo MANTIS), projekt gry

Wersja robocza, 2026-09-19, po pierwszej rundzie decyzji. Zastępuje pierwotny brief,
którego kopia leży obok w `brief-pierwotny.md`. Nic nie jest jeszcze zakodowane.

Oznaczenia: **ZMIANA** = odejście od briefu, **DECYZJA** = ustalone, **PYTANIE** = czekam
na Ciebie (zebrane w rozdziale 18).

---

## 0. Co już ustalone

| sprawa | ustalenie |
|---|---|
| trudność | skradanie, owady mają czujność i mogą uciec, pierwsze są pewniakami |
| grafika | hybryda: ilustrowane tło plus modliszka i owady złożone z osobnych, ładnie narysowanych części animowanych kodem. Nie figury geometryczne |
| telefon | Android |
| odblokowania | po kolei: pierwsza otwiera drugą, druga trzecią |
| prawda przyrodnicza | priorytet, patrz rozdział 5. Gra ma uczyć prawdziwej modliszki, nie bajkowej |

---

## 1. Gracz i cel

Jedno dziecko, 5,5 roku, dokładne i wyczulone na szczegóły, nie czyta jeszcze płynnie.
Android, pion, offline, bez konta, bez reklam.

Pięć emocji, i to jest cała definicja sukcesu:

1. „To jest moja modliszka.”
2. „Muszę łapać owady.”
3. „Jak ją nakarmię, urośnie.”
4. „O KURCZE, ONA UROSŁA!”
5. „BRAWO! Odblokowałem nową modliszkę!”

Plus szósta, dopisana po Twojej uwadze o dokładności syna:

6. „Prawdziwa modliszka naprawdę tak robi.”

---

## 2. Ocena briefu

Brief jest dobry tam, gdzie zwykle się psuje: zna odbiorcę, wie, że wylinka jest
najważniejsza, rezygnuje ze śmierci i kar, trzyma tekst na minimum. Szkielet zostaje.
Trzy rzeczy wymagały rozstrzygnięcia.

**Sprzeczność wewnętrzna.** Rozdział 5 briefu: „dotknij owada, modliszka sama podejdzie
i złapie”. Rozdział 22: satysfakcja ma płynąć z „podejścia i dobrego momentu”. To się
wyklucza. Jeżeli wszystko dzieje się samo, nie ma momentu, jest ekran do stukania.
Rozstrzygnięcie: skradanie, rozdział 4.

**Brak technologii i brak odpowiedzi, skąd obrazki.** Rozstrzygnięcie: rozdziały 3 i 12.

**Płaskie zakończenie.** Trzy modliszki różniące się kolorem to ta sama gra trzy razy.
Rozstrzygnięcie: trzy prawdziwe gatunki, trzy światy i trzy różne sposoby polowania,
wszystkie wzięte z biologii, rozdział 10.

Poza tym brief mylił się w jednym konkretnym fakcie przyrodniczym (mrówki jako
pożywienie, patrz rozdział 7) i mocno upraszczał liczbę stadiów.

---

## 3. Technologia i dystrybucja

**DECYZJA: gra powstaje tak jak BANGladesz26, czyli jako zwykła strona internetowa
działająca jak aplikacja (PWA), na Canvas 2D, bez silnika gier i bez kroku budowania.**

Czym jest BANGladesz26: to jest projekt, który już leży w tym repozytorium, w katalogu
`bangladesz26`. Losownik miast świata na daną literę. Dla nas ważne jest nie to, co robi,
tylko jak jest zrobiony, bo to jest sprawdzony na Twoim telefonie sposób dostarczania
aplikacji:

- to jest zwykły `index.html` plus kilka plików JavaScript, bez instalatora i bez sklepu,
- wchodzi się na adres w przeglądarce i przez menu Chrome „Zainstaluj aplikację” ląduje
  ikona na ekranie głównym telefonu, od tej pory wygląda i działa jak normalna aplikacja,
  pełny ekran, bez paska przeglądarki,
- po pierwszym otwarciu działa bez internetu (service worker trzyma pliki na telefonie),
- hostuje się za darmo na GitHub Pages, czyli nowa wersja to jeden `git push`, a dziecko
  dostaje ją przy następnym otwarciu, bez aktualizacji ze sklepu.

Dla MANTIS to oznacza: zero kosztów, zero konta dewelopera, zero czekania na akceptację
w Google Play, natychmiastowe poprawki po każdym teście na dziecku.

Czego nie używamy: Unity, Godot, Flutter, React Native. Dla gry tej wielkości silnik to
kilkadziesiąt MB pobierania, wolniejszy start i sklep jako jedyna sensowna droga.
Na ekranie będzie jedna modliszka, kilka owadów i tło, Canvas 2D uciągnie to spokojnie.

Technicznie: jeden canvas na pełny ekran, stała rozdzielczość logiczna, `devicePixelRatio`
ograniczone do 2, pętla na `requestAnimationFrame`, pauza przy schowaniu w tło.

---

## 4. Sterowanie i skradanie

**ZMIANA: jeden wariant sterowania zamiast dwóch do przetestowania.** Tester jest jeden
i ma 5,5 roku, więc gra musi być zrozumiała od pierwszego uruchomienia.

- dotknięcie pustego miejsca: modliszka idzie w tamtą stronę, palec można przytrzymać
  i przesuwać, wtedy idzie za palcem,
- dotknięcie owada albo blisko owada: bierze go na cel, podchodzi sama i atakuje
  z zasięgu,
- duży promień wybaczania przy celowaniu, brak podwójnych dotknięć, brak joysticka,
  brak osobnego przycisku ataku,
- **palec nigdy nie jest na modliszce**, dziecko celuje w owada, więc dłoń nie zasłania
  bohatera.

**Skradanie (potwierdzone).** Każdy owad ma promień czujności i próg hałasu, hałas
modliszki zależy od jej prędkości. Szybkie wejście w promień czujności płoszy owada,
wolne podejście nie. Po trzecim spłoszeniu owad odlatuje na dobre i pojawia się nowy.
To jest całe przegranie: żadnej kary, pasek nie spada, żadnego smutnego dźwięku.

Pierwsze owady mają czujność zero, czyli nie da się ich nie złapać. Trudność rośnie przez
to, jakie owady się pojawiają, a nie przez wymagania wobec palca.

To jest jednocześnie prawda przyrodnicza: modliszka nie goni zdobyczy. Podchodzi bardzo
wolno, kołysząc się, i czeka na odległość uderzenia.

---

## 5. Prawda przyrodnicza, czyli fundament gry

**ZMIANA, największa w tej wersji dokumentu.** Po Twojej uwadze przestawiam projekt tak,
żeby biologia była źródłem mechanik, a nie dekoracją. Każda rzecz poniżej jest prawdziwa
i każda ma swoje odbicie w grze.

### Zachowania, które widać na ekranie

| prawda o modliszce | jak to widać w grze |
|---|---|
| obraca głowę o prawie 180 stopni, jedyny taki owad | głowa śledzi najbliższego owada, nawet gdy ciało stoi. To jeden detal, który ożywia postać bardziej niż cokolwiek innego |
| ma wzrok stereoskopowy i „fałszywą źrenicę”, czyli ciemny punkt w oku, który zawsze zdaje się patrzeć na Ciebie | rysujemy ten punkt i zawsze kierujemy go na cel albo na gracza |
| kołysze się na boki, udając liść na wietrze | kołysanie przy chodzeniu i przy podchodzeniu, mocniejsze u modliszki duchowej |
| poluje z zasadzki, podchodzi wolno, nie goni | mechanika skradania, rozdział 4 |
| uderza odnóżami chwytnymi w około 50 do 70 milisekund, szybciej niż ludzkie oko | uderzenie ma krótkie zwolnienie czasu, inaczej dziecko go nie zobaczy. Przy okazji to prawda, którą można synowi pokazać: „to jest tak szybkie, że trzeba spowolnić” |
| po posiłku czyści odnóża chwytne i czułki, jak kot | osobna animacja po jedzeniu, jedna z najbardziej rozpoznawalnych rzeczy, jakie robi modliszka |
| przed wylinką przestaje jeść i robi się nieruchawa | krótka chwila bezruchu, zanim zacznie się wylinka |
| wylinka odbywa się w pozycji wiszącej głową w dół, bo grawitacja pomaga wyjść ze starej skóry | modliszka sama wspina się na gałązkę i zwisa, dopiero tam się linieje. Na ziemi wylinka się nie udaje, to prawdziwe |
| zaraz po wylince jest miękka, blada i bezbronna, twardnieje kilka godzin | przez kilka sekund po wylince jest jasna i porusza się wolno, nie atakuje |
| stara skóra (wylinka, czyli wylinek albo exuvium) zostaje wisząca | zostaje w świecie i można ją potem oglądać, nie znika |
| skrzydła pojawiają się dopiero u osobnika dorosłego, po ostatniej wylince | skrzydła są nagrodą finałową, rozdział 9 |
| wcześniej, od mniej więcej L5, widać na tułowiu zawiązki skrzydeł, które rosną z każdą wylinką | rysujemy je, więc dziecko widzi, że coś się szykuje, zanim to nadejdzie |
| dorosła samica składa kokon z pianki, czyli ooteka, z której wychodzą dziesiątki maleńkich L1 | epilog gry, rozdział 9 |
| samice linieją więcej razy niż samce i są większe | gramy samicą, mówimy o tym wprost jedną grafiką |

### Czego świadomie nie pokazujemy

Kanibalizm (nimfy zjadają się nawzajem, samica potrafi zjeść samca) jest prawdziwy,
ale nie dla pięciolatka i nie w tej grze. Zjadanie zdobyczy pokazujemy przez chwyt,
zasłonięcie odnóżami i iskierkę energii, bez szczegółów.

---

## 6. Stadia i wzrost

**ZMIANA: osiem stadiów i siedem wylinek zamiast czterech poziomów z briefu.**

Sprawdziłem liczby. Modliszka zwyczajna (*Mantis religiosa*) przechodzi zwykle 6 do 7
wylinek zanim stanie się dorosła. U modliszki duchowej (*Phyllocrania paradoxa*) samiec
potrzebuje 6 wylinek i dorasta jako L7, a samica 7 wylinek i dorasta jako L8.
U modliszki storczykowej (*Hymenopus coronatus*) samica linieje 7 razy, samiec 6.

Skoro gramy samicą, prawdziwy schemat to: **L1 do L8, siedem wylinek, ostatnia daje
skrzydła.** Tak właśnie robimy. To jest prawie dwa razy więcej wylinek niż w briefie,
ale wylinka jest najlepszym momentem gry, więc więcej wylinek to lepsza gra, o ile
pojedyncze stadium jest krótkie.

| stadium | punkty do awansu | długość ciała | zasięg kamery |
|---|---|---|---|
| L1 | 2 | ok. 6 mm | 1,00 |
| L2 | 2 | ok. 9 mm | 1,05 |
| L3 | 3 | ok. 13 mm | 1,11 |
| L4 | 3 | ok. 18 mm | 1,17 |
| L5 | 4 | ok. 25 mm, pierwsze zawiązki skrzydeł | 1,24 |
| L6 | 4 | ok. 34 mm | 1,31 |
| L7 | 5 | ok. 45 mm, wyraźne zawiązki skrzydeł | 1,38 |
| L8 dorosła | koniec | ok. 65 mm, skrzydła | 1,45 |

Razem 23 punkty, czyli mniej więcej 14 do 18 owadów. Pierwsze stadia idą szybko (dwa
łatwe owady i już wylinka), późniejsze wolniej. Cała ścieżka to jakieś 15 minut, z czego
siedem wylinek zajmuje około minuty. Zapis po każdym owadzie, więc można to rozłożyć
na kilka dni.

Proporcje też są prawdziwe: nimfa ma większą głowę i krótszy odwłok względem ciała,
dorosła jest smuklejsza i długoskrzydła. Modliszka nie zmienia się tylko przez pomnożenie
przez skalę, zmienia proporcje.

**Kamera odjeżdża z każdym stadium.** Modliszka rośnie, a świat robi się względem niej
mniejszy. Mózg porównuje bohatera z otoczeniem, nie z pamięcią sprzed minuty, więc samo
powiększanie postaci nigdy nie daje takiego wrażenia wzrostu.

**Pasek segmentowy**, jeden segment to jeden punkt pożywienia. Pięciolatek nie odczyta
procentów, ale policzy dwa puste okienka. Duży owad zapełnia dwa naraz. Pasek nigdy
nie spada. Obok paska duża cyfra stadium i rosnąca sylwetka. Zero innego tekstu.

---

## 7. Owady

**ZMIANA: mrówki wypadają z jadłospisu.** Brief dawał je jako pożywienie startowe, ale
modliszki mrówek zwykle nie jedzą (kwas mrówkowy, agresja, gryzą w obronie), a hodowcy
ich nie podają. Co więcej, młode modliszki storczykowe w pierwszym stadium same udają
mrówki, żeby nie zostać zjedzone. Mrówki zostają w grze jako tło: chodzą po gałązce,
modliszka je ignoruje, nie da się ich złapać. Dla dokładnego dziecka to jest lepsze
niż ich brak, bo widać, że gra wie, czego modliszka nie je.

Jadłospis układam tak, jak karmi się modliszki naprawdę: od muszek owocówek, przez muchy
domowe i plujki, po świerszcze, ćmy i motyle.

| owad | ruch | czujność | pożywienie | od stadium |
|---|---|---|---|---|
| muszka owocówka | krótkie zrywy, długie przerwy | 0 | 1 | L1 |
| mszyca | prawie nieruchoma na łodydze | 0 | 1 | L1 |
| skoczogonek | drobne skoki przy ziemi | 0,1 | 1 | L1 |
| mucha domowa | łuki, siada, zrywa się | 0,5 | 1 | L3 |
| mucha plujka | szybsza, głośniejsza, większa | 0,6 | 2 | L4 |
| ćma | wolne chwiejne krążenie, ciągnie do światła | 0,3 | 2 | L5 |
| świerszcz | chodzi, przy spłoszeniu daleki skok | 0,7 | 3 | L5 |
| motyl | spokojny, siada na kwiatach | 0,4 | 3 | L6 |
| konik polny | siedzi, potężny skok | 0,8 | 3 | L7 |
| ważka | szybka, nerwowa, prawdziwe wyzwanie | 0,9 | 5 | po dorośnięciu |

Ważka jest nagrodą po zwycięstwie, nie zwykłym owadem. Dorosła modliszka faktycznie
potrafi złapać ważkę i to jest wyczyn, więc niech to będzie wyczyn także w grze.

Jednocześnie na planszy 3 do 5 owadów, zawsze przynajmniej jeden łatwy. Nowe wchodzą
zza kadru albo zza liścia, nigdy nie pojawiają się z niczego na środku ekranu.

---

## 8. Wylinka

Najważniejszy moment gry, teraz zbudowany dokładnie według tego, co robi prawdziwa
modliszka.

1. pasek pełny, modliszka przestaje reagować na owady i zaczyna szukać gałązki,
2. sama wspina się na najbliższą gałązkę i **zawisa głową w dół**,
3. świat zwalnia, przyciemnia się poza nią, kamera dojeżdża,
4. pancerz pęka na karku i grzbiecie, jasna szczelina,
5. nowa modliszka powoli wysuwa się w dół, blada i miękka, odnóża wychodzą ostatnie,
6. zwisa chwilę na starej skórze, prostuje odnóża, otrząsa się,
7. wraca na gałązkę, stara skóra zostaje wisząca (i zostaje w świecie na stałe),
8. kolor wraca do normalnego, błysk, pyłek, kamera odjeżdża już z nowym zasięgiem,
   duża cyfra stadium wchodzi na ekran.

Przez kilka sekund po wylince modliszka jest jaśniejsza i porusza się wolniej, nie
atakuje. To prawda (świeżo po wylince jest miękka i bezbronna) i daje oddech
po całej sekwencji.

**Czas: 5 do 6 sekund.** Dziecko zobaczy tę animację siedem razy na przejście i kilkadziesiąt
razy łącznie, więc dłuższa cutscenka zamieni się w przeszkodę. Po pierwszym obejrzeniu
dotknięcie ekranu przewija do końca, bez przycisku „pomiń”.

**Wylinka dzieje się w scenie gry, nie na osobnym ekranie** (brief miał z tego SCREEN 3).
Przełączenie ekranu psuje wrażenie, że to dzieje się naprawdę, tam gdzie modliszka stała,
i bez powodu komplikuje kod.

---

## 9. Dorosłość: skrzydła i ooteka

**Ostatnia, siódma wylinka daje skrzydła.** To nie jest wymyślona nagroda, tylko
dokładnie to, co dzieje się naprawdę: modliszka dostaje skrzydła wyłącznie po ostatniej
wylince. Skrzydła wychodzą zmięte, przez dwie sekundy się rozprostowują (naprawdę tak
jest, pompuje się do nich hemolimfa), i dopiero wtedy otwierają się na całą szerokość.
Wtedy światło, konfetti, listki i świetliki.

Ekran zwycięstwa: wielkie **BRAWO!**, modliszka na dużym liściu z rozłożonymi skrzydłami,
osiem gwiazdek (po jednej za stadium), odsłonięcie karty następnej modliszki. Zdania
„UKOŃCZYŁEŚ MODLISZKĘ!” nie ma, bo dziecko go nie przeczyta. Zamiast tekstu grafika.

**ZMIANA: po zwycięstwie gra wraca do świata, a nie do menu.** Dorosła modliszka zostaje
na planszy, paska nie ma, nic nie trzeba. Można polować dla przyjemności, można latać
(krótki lot na skrzydłach, prawdziwy, choć modliszki latają słabo) i wtedy właśnie
pojawia się ważka.

**Epilog: ooteka.** Po jakimś czasie wolnego polowania dorosła samica buduje na gałązce
kokon z pianki, ooteka twardnieje, a po chwili wychodzi z niej kilkadziesiąt maleńkich
L1, które rozbiegają się po ekranie. To jest prawdziwe, piękne i domyka cykl: dziecko
samo zobaczy, że jedna z tych maleńkich modliszek to początek następnej gry. Lepszego
zaproszenia do zagrania jeszcze raz nie wymyślę.

---

## 10. Trzy modliszki: trzy gatunki, trzy światy, trzy sposoby polowania

**ZMIANA: zamiast trzech kolorów, trzy prawdziwe gatunki.** Odblokowywane po kolei
(Twoja decyzja): pierwsza otwiera drugą, druga trzecią.

### 1. Modliszka zwyczajna, *Mantis religiosa*

Zielona, klasyczna. Żyje w Polsce i jest u nas pod ochroną, co jest świetną rzeczą do
powiedzenia dziecku. Na wewnętrznej stronie odnóża chwytnego ma czarną plamkę z białym
środkiem, jak oko, i pokazuje ją, gdy chce kogoś odstraszyć (postawa odstraszająca).
Świat: letnia łąka w słońcu, trawy, koniczyna.
Polowanie: klasyczne skradanie.

### 2. Modliszka duchowa, *Phyllocrania paradoxa*

Brązowa, z wyrostkiem na głowie i płatkami na odnóżach, wygląda jak zeschły liść.
Kołysze się najmocniej ze wszystkich, udając liść na wietrze, i potrafi zastygnąć
całkowicie.
Świat: sucha ściółka i gałęzie jesienią, opadające liście.
Polowanie: **kamuflaż**. Kiedy stoi nieruchomo wśród liści, owady prawie jej nie
zauważają. Nagrodą jest cierpliwość, nie zwinność. To nie jest wymyślona umiejętność,
tylko to, jak ten gatunek naprawdę żyje.

### 3. Modliszka storczykowa, *Hymenopus coronatus*

Biało-różowa, z odnóżami w kształcie płatków, wygląda jak kwiat. W pierwszym stadium
jest czerwono-czarna i udaje mrówkę, a dopiero po pierwszej wylince robi się kwiatowa.
To znaczy, że w tej kampanii **pierwsza wylinka zmienia kolor modliszki** i będzie to
prawdziwa niespodzianka.
Świat: kwiat o zmierzchu, świetliki, ciemniejsze niebo.
Polowanie: **wabienie**. Badania pokazały, że ta modliszka przyciąga owady zapylające
skuteczniej niż prawdziwe kwiaty. W grze: kiedy siedzi nieruchomo na kwiecie, owady
same do niej przylatują. Zupełnie inny rytm gry niż w pierwszej kampanii, a wciąż
czysta prawda.

Trzy gatunki, trzy światy, trzy rytmy polowania i zero wymyślonych supermocy.

---

## 11. Ekrany

1. **DOM**: duża animowana modliszka, pod nią trzy karty gatunków (zablokowane jako
   ciemne sylwetki z kłódką), pod spodem wielki przycisk **GRAJ**, w rogu wyciszenie.
2. **GRA**: świat, modliszka, owady, pasek segmentowy, cyfra stadium, mała strzałka
   powrotu z dala od kciuka.
3. **NOWE STADIUM**: nakładka po wylince, duża cyfra, dwie sekundy, znika sama.
4. **ZWYCIĘSTWO**: BRAWO, skrzydła, gwiazdki, odsłonięcie następnej karty.
5. Wybór modliszki to ten sam ekran co DOM, nie osobny (brief dublował to jako
   SCREEN 1 i SCREEN 6).

Żadnych ustawień poza dźwiękiem. Ukończoną modliszką da się zagrać od nowa: karta
dostaje znaczek ukończenia, a wybranie jej startuje od L1 bez ruszania odblokowań.

---

## 12. Grafika: hybryda

**DECYZJA, zgodnie z Twoim wyborem: ilustrowane tło plus postacie złożone z osobnych,
ładnie narysowanych części, animowanych kodem. Bez figur geometrycznych.**

Modliszka jest rozebrana na elementy: głowa (z okiem i fałszywą źrenicą), czułki, tułów
przedni (długi, charakterystyczny), tułów tylny, odwłok, trzy pary odnóży krocznych po
trzy segmenty, dwa odnóża chwytne po trzy segmenty, zawiązki skrzydeł, skrzydła.
Każdy element to osobny, dopracowany rysunek z cieniowaniem, a kod porusza nimi w
przegubach, jak marionetką.

Co to daje:

- **osiem stadiów bez rysowania ośmiu modliszek**: zmieniamy skalę i proporcje
  poszczególnych części (nimfa ma większą głowę i krótszy odwłok, dorosła jest smuklejsza),
- **wylinkę da się w ogóle zrobić**: stara skóra to ten sam zestaw części w wersji pustej
  i przezroczystej, nowa modliszka wysuwa się z niej segment po segmencie,
- **trzy gatunki**: inne kształty kilku części (wyrostek na głowie u duchowej, płatki na
  odnóżach u storczykowej) plus inna paleta, a szkielet animacji wspólny,
- **chód, chwyt, czyszczenie odnóży, kołysanie**: wszystko to są ruchy przegubów,
  a nie osobne zestawy klatek.

Tło każdego świata to ilustracja (pierwszy plan, drugi plan, niebo), rysowana raz i
przesuwana warstwami. Owady robimy tą samą metodą co modliszkę, tylko prościej: korpus,
skrzydła, odnóża.

**Pierwszy krok w pracach to test wyglądu.** Zanim powstanie cokolwiek innego, pokażę
Ci statyczny obrazek modliszki L1 i L8 w docelowym stylu oraz jeden kadr świata.
Dopiero po Twojej akceptacji idziemy dalej. To jedyny sposób, żeby nie zbudować całej
gry wokół rysunku, który Ci się nie spodoba.

O rozmiarze aplikacji się nie martwimy, masz rację, że kilka MB na telefonie nie robi
różnicy. Liczy się wygląd i płynność.

---

## 13. Dźwięk

Efekty syntezowane w Web Audio, bez plików: klap uderzenia, chrupnięcie, dzwoneczek
wzrostu, akord wylinki, fanfara odblokowania. Tło: delikatny szum łąki, u trzeciej
modliszki wieczorne świerszcze.

**Obowiązkowo przycisk wyciszenia na ekranie domowym, stan zapamiętany** (brief o tym
zapomniał, a to pierwsza rzecz, której zażąda dorosły o 20:30). Do tego odblokowanie
dźwięku przy pierwszym dotknięciu ekranu.

---

## 14. Zapis

`localStorage`, przedrostek `mantis:`, jak `b26:` w BANGladesz26. Zapisujemy wersję
formatu, wybraną modliszkę, dla każdej jej stadium i punkty, odblokowane, ukończone,
ustawienie dźwięku. Zapis po każdym zjedzonym owadzie i po każdej wylince, więc
zamknięcie gry w dowolnym momencie nic nie kosztuje.

---

## 15. Telefon (Android)

Pion na sztywno, brak przewijania i przybliżania dwoma palcami, brak menu po
przytrzymaniu, bezpieczne marginesy, cele dotykowe od 48 punktów, pauza przy przejściu
w tło, wibracja przy złapaniu, cel 60 klatek z sensownym wyglądem przy 30.
Instalacja: Chrome, menu, „Zainstaluj aplikację”, ikona na ekranie głównym.

**PYTANIE: jaki to model telefonu i z którego roku?** Od tego zależy budżet cząsteczek
i to, jak bogate może być tło.

---

## 16. Plan prac

Kolejność ułożona według ryzyka, nie według listy funkcji.

**M0. Test wyglądu.** Modliszka L1 i L8 oraz jeden kadr świata, statycznie, do akceptacji.

**M1. Czy to dobrze się czuje.** Świat, modliszka złożona z części, chód, kołysanie,
kamera, sterowanie palcem. Bez owadów. Dajemy dziecku: czy samo prowadzenie modliszki
jest przyjemne i zrozumiałe.

**M2. Pętla.** Owady, czujność i płoszenie, uderzenie, jedzenie, czyszczenie odnóży,
pasek, stadia z proporcjami i odjeżdżającą kamerą. Drugi test na dziecku: czy łapie bez
tłumaczenia i czy liczby są dobre.

**M3. Nagroda.** Wylinka z wieszaniem się głową w dół, nowe stadium, ostatnia wylinka
ze skrzydłami, ekran zwycięstwa, wolne polowanie, ooteka.

**M4. Meta.** Ekran domowy, wybór, odblokowania po kolei, zapis.

**M5. Drugi i trzeci gatunek.** Modliszka duchowa z kamuflażem i jesiennym światem,
storczykowa z wabieniem, zmianą koloru po pierwszej wylince i wieczornym światem.

**M6. Oprawa.** Dopracowanie animacji, cząsteczki, dźwięki, ikona, instalacja, offline.

Po każdym etapie gra jest uruchamialna na telefonie. Po M2 jest już grą.

---

## 17. Czego świadomie nie robimy

Bez śmierci, pasków życia, głodu i timerów. Bez waluty, sklepu i skórek. Bez reklam,
konta i chmury. Bez rankingów i poziomów trudności. Bez samouczka z tekstem, bez
joysticka, bez osobnego przycisku ataku. Bez kanibalizmu i bez drastycznych szczegółów
jedzenia.

---

## 18. Pytania do Ciebie

1. **Osiem stadiów i siedem wylinek zamiast czterech poziomów.** Zgoda? To jest zgodne
   z prawdą o samicy modliszki, daje dużo więcej najlepszego momentu gry, ale wydłuża
   jedno przejście do jakichś 15 minut (z zapisem, więc można na raty).
2. **Ooteka jako epilog.** Dorosła samica składa kokon, wychodzą z niego maleńkie L1.
   Piękne i prawdziwe, ale to jest temat rozmnażania. Wchodzimy w to, czy zostajemy na
   skrzydłach i ważce?
3. **Nazwy gatunkowe.** Czy pokazujemy przy wyborze modliszki prawdziwe nazwy
   („modliszka zwyczajna”, „*Mantis religiosa*”)? Syn ich nie przeczyta, ale Ty możesz
   mu je przeczytać i dla dokładnego dziecka to może być atut.
4. **Telefon.** Jaki model i rok?
5. **Nazwa gry.** „MANTIS” czy „MODLISZKA”? Pięciolatek zrozumie to drugie, a „mantis”
   nic mu nie mówi.
6. **Jak gracie.** Gra do zostawienia dziecku z telefonem, czy do grania razem z Tobą?
   Przy wersji „razem” mogę śmielej wchodzić w nazwy i ciekawostki, bo jest kto przeczyta.
