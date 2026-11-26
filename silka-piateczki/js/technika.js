// Rozszerzony opis techniki dla każdego ćwiczenia z biblioteki.
// ustawienie: sprzęt, kąt ławki, chwyt. blad: najczęstszy błąd.
// pro: wskazówki dla zaawansowanych (tempo, zakres, intensyfikacja).
// Podstawowe wskazówki ruchu są w dane.js (pole rady).

export const TECHNIKA = {
  // Klatka
  'wyc-hantle': {
    ustawienie: 'Ławka płaska. Hantle kładziesz na udach, kładziesz się i wnosisz je kolanami. Stopy płasko, lekki łuk w górnej części pleców, pośladki na ławce.',
    blad: 'Łokcie rozłożone na 90° do tułowia. Bark ucieka do przodu, klatka pracuje mniej. Trzymaj je około 45 do 60°.',
    pro: ['Tempo 3 s w dół, krótka pauza nad klatką, mocno w górę. Rozciągnięcie na dole robi najwięcej dla wzrostu.', 'Na górze nie prostuj łokci do końca, wtedy klatka nie odpoczywa między powtórzeniami.'],
  },
  'wyc-hantle-neutral': {
    ustawienie: 'Ławka płaska, dłonie zwrócone do siebie przez cały ruch, hantle stykają się bokami albo prawie.',
    blad: 'Opuszczanie tylko do połowy. Hantle schodzą do linii klatki.',
    pro: ['Dociskaj hantle do siebie przez cały ruch, jakbyś chciał je zgnieść. Środek klatki pracuje wtedy przez cały czas.', 'Dobry wybór, gdy bolą barki przy zwykłym chwycie.'],
  },
  'wyc-maszyna': {
    ustawienie: 'Siedzisko tak, żeby uchwyty były na wysokości środka klatki (linia sutków). Plecy przyklejone, łopatki ściągnięte.',
    blad: 'Zbyt wysokie siedzisko: pracują barki zamiast klatki.',
    pro: ['Maszyna nie wymaga stabilizacji, więc ostatnią serię możesz zrobić do upadku mięśniowego bez ryzyka.', 'Spróbuj jednorącz: lepiej czujesz środek klatki i wyrównujesz strony.'],
  },
  pompki: {
    ustawienie: 'Dłonie trochę szerzej niż barki, palce do przodu. Ciało w linii od głowy do pięt, pośladki i brzuch napięte.',
    blad: 'Opadające biodra i łokcie wypchnięte na boki.',
    pro: ['Za łatwo? Nogi na ławce, kamizelka albo talerz na plecach, albo 3 s w dół.', 'Dłonie na hantlach dają głębsze zejście i mocniejsze rozciągnięcie klatki.'],
  },
  dipy: {
    ustawienie: 'Poręcze trochę szerzej niż barki. Start na prostych rękach, nogi ugięte, tułów pochylony do przodu około 30°.',
    blad: 'Pionowy tułów: wtedy robisz ćwiczenie na triceps, a nie na dół klatki.',
    pro: ['Schodź 2 do 3 s, na dole krótka pauza bez odbicia. Zejście poniżej kąta prostego tylko przy zdrowych barkach.', 'Gdy robisz więcej niż 12, dołóż ciężar na pasie i wpisz go w pole kg z plusem.'],
  },
  'wyc-decline': {
    ustawienie: 'Ławka w dół pod kątem 15 do 30°. Nogi zablokowane pod wałkami. Hantle podaj sobie z ud albo poproś o podanie.',
    blad: 'Za duży spadek ławki (ponad 30°): ruch robi się krótki i mniej pracuje klatka.',
    pro: ['Prowadź hantle do dolnej części klatki, na górze zbliż je do siebie. To dobrze trafia w dół klatki.', 'Odkładanie: przyciągnij hantle do klatki i usiądź z nimi, nie upuszczaj ich nad głową.'],
  },
  'wyc-maszyna-decline': {
    ustawienie: 'Siedzisko tak, żeby uchwyty były na wysokości dolnej części klatki. Łopatki dociśnięte do oparcia.',
    blad: 'Odrywanie pleców od oparcia przy ostatnich powtórzeniach.',
    pro: ['Pchaj w dół i lekko do środka, wtedy mocniej czujesz dół klatki.', 'Na ostatniej serii możesz zrobić serię z obniżaniem ciężaru: od razu odejmij 20 do 30% i rób do upadku.'],
  },
  'smith-decline': {
    ustawienie: 'Ławka w dół 15 do 30°, ustawiona tak, żeby gryf schodził do dolnej części klatki. Chwyt trochę szerzej niż barki.',
    blad: 'Ławka przesunięta za wysoko: gryf ląduje przy szyi.',
    pro: ['Bezpieczniki ustaw tuż nad klatką, wtedy możesz robić serie do upadku sam.', 'Tempo 3 s w dół, bez odbijania gryfu od klatki.'],
  },
  'pec-deck': {
    ustawienie: 'Siedzisko tak, żeby uchwyty były na wysokości klatki, a ramiona równolegle do podłogi. Plecy przy oparciu.',
    blad: 'Za duży ciężar i wypychanie rękami zamiast zbliżania łokci.',
    pro: ['Myśl o zbliżaniu łokci, nie dłoni. Na końcu ruchu trzymaj 1 do 2 s i ściśnij mocno środek klatki.', 'Na ostatniej serii zrób kilka częściowych powtórzeń w rozciągnięciu, gdy pełne już nie wychodzą.'],
  },
  'linki-krzyz': {
    ustawienie: 'Brama, bloczki u góry. Krok do przodu, lekki skłon tułowia, jedna noga przed drugą dla stabilności.',
    blad: 'Uginanie łokci w trakcie, co zamienia rozpiętki w wyciskanie.',
    pro: ['Prowadź dłonie w dół do bioder i skrzyżuj je na końcu. Skrzyżowanie mocniej domyka środek klatki.', 'Zmieniaj wysokość bloczków: z góry w dół to dół klatki, poziomo to środek.'],
  },
  'rozpietki-hantle': {
    ustawienie: 'Ławka płaska albo skos 15°. Hantle nad klatką, dłonie do siebie, łokcie lekko ugięte.',
    blad: 'Za ciężkie hantle i zbyt głębokie zejście, które przeciąża bark.',
    pro: ['Schodź tylko do linii barków. Ruch tylko w barku, kąt w łokciu stały.', 'Najwięcej daje dolna część ruchu. Górę możesz skrócić, bo tam hantel prawie nie obciąża mięśnia.'],
  },
  'rozpietki-pochylenie': {
    ustawienie: 'Stojąc, stopy na szerokość bioder, kolana lekko ugięte. Tułów pochylony o 30 do 45°, łokcie lekko ugięte i zablokowane w tym kącie.',
    blad: 'Za ciężkie hantle i machanie z rozpędu. Pracują wtedy barki, a klatka prawie wcale.',
    pro: ['Na dole zatrzymaj hantle przed biodrami na 1 do 2 s i dociśnij je do siebie, jakbyś chciał je zgnieść.', 'Hantel obciąża klatkę głównie w dolnej części ruchu. Ten sam ruch na linkach (krzyżowanie z góry w dół) trzyma napięcie cały czas, więc gdy brama jest wolna, wybierz linki.'],
  },
  'linki-lawka': {
    ustawienie: 'Ławka płaska w środku bramy, bloczki na dole. Łokcie lekko ugięte, dłonie nad klatką.',
    blad: 'Ławka ustawiona za blisko jednej strony i nierówne ciągnięcie linek.',
    pro: ['Linka trzyma napięcie także na górze, więc na górze zatrzymaj się na sekundę i ściśnij.', 'Dobrze działa jako drugie ćwiczenie na klatkę po wyciskaniu.'],
  },

  // Plecy
  'sciaganie-szeroko': {
    ustawienie: 'Wałek dociska uda. Chwyt nachwytem około 1,5 szerokości barków. Klatka w górę, lekki odchył około 15°.',
    blad: 'Ciągnięcie samymi rękami i bujanie całym tułowiem.',
    pro: ['Zacznij ruch od ściągnięcia łopatek w dół, dopiero potem ciągnij łokcie do żeber. Kciuk możesz trzymać nad drążkiem, mniej pracuje wtedy przedramię.', 'Na górze pozwól ramionom wyjechać do pełnego rozciągnięcia. Od tego zależy szerokość.'],
  },
  podciaganie: {
    ustawienie: 'Chwyt nachwytem trochę szerzej niż barki. Na maszynie z odciążeniem dobierz przeciwwagę na 6 do 10 czystych powtórzeń.',
    blad: 'Półpowtórzenia bez pełnego zwisu na dole i bujanie nogami.',
    pro: ['Gdy masz ponad 12 czystych powtórzeń, zmniejsz odciążenie o krok albo dołóż ciężar na pasie.', 'Na ostatniej serii dorób powolne opuszczanie: wskocz na górę i schodź 4 do 5 s.'],
  },
  'sciaganie-waskie': {
    ustawienie: 'Uchwyt V albo wąski drążek. Wałek na udach, lekki odchył.',
    blad: 'Za duży odchył, który zmienia ćwiczenie w wiosłowanie.',
    pro: ['Ciągnij uchwyt do mostka, łokcie w dół wzdłuż tułowia.', 'Na dole ruchu pauza 1 s i ściśnięcie łopatek.'],
  },
  'sciaganie-jednoracz': {
    ustawienie: 'Pojedynczy uchwyt na górnym bloczku. Siad albo klęk, tułów lekko pochylony w stronę ręki, która nie ćwiczy.',
    blad: 'Skręcanie tułowia, żeby dociągnąć ciężar.',
    pro: ['Na górze pozwól łopatce wyjechać mocno w górę, wtedy rozciągnięcie jest większe niż przy drążku.', 'Zacznij od słabszej strony i zrób tyle samo powtórzeń drugą.'],
  },
  'proste-rece': {
    ustawienie: 'Górny bloczek, drążek albo lina. Krok w tył, lekki skłon w biodrach, łokcie lekko ugięte i zablokowane.',
    blad: 'Uginanie łokci, które zamienia ćwiczenie w prostowanie ramion na triceps.',
    pro: ['Prowadź ręce łukiem do ud i ściśnij mięśnie najszersze na dole przez sekundę.', 'Świetnie działa jako rozgrzewka mięśni najszerszych przed ściąganiem.'],
  },
  'wioslo-hantel': {
    ustawienie: 'Kolano i dłoń tej samej strony na ławce płaskiej, druga noga na podłodze. Plecy równolegle do podłogi.',
    blad: 'Szarpanie i skręcanie tułowia, żeby podnieść za ciężki hantel.',
    pro: ['Ciągnij hantel łukiem do biodra, nie pionowo do barku. Wtedy pracują mięśnie najszersze.', 'Na dole pozwól łopatce wyjechać, na górze pauza 1 s.'],
  },
  'wioslo-skos': {
    ustawienie: 'Ławka skośna 30 do 45°, leżysz na niej brzuchem, klatka przy górnej krawędzi, stopy na podłodze.',
    blad: 'Odrywanie klatki od ławki przy ostatnich powtórzeniach.',
    pro: ['Ławka zdejmuje pracę z lędźwi, więc możesz dojść bliżej upadku mięśniowego.', 'Łokcie szeroko to środek pleców i tył barków. Łokcie wąsko to mięśnie najszersze.'],
  },
  'wioslo-wyciag': {
    ustawienie: 'Stopy na podestach, kolana lekko ugięte, uchwyt V. Plecy proste, siedzisz pionowo.',
    blad: 'Duże bujanie tułowiem do przodu i do tyłu.',
    pro: ['Pozwól łopatkom wyjechać do przodu na rozciągnięciu, ale bez zaokrąglania lędźwi.', 'Ciągnij do pępka, łokcie blisko ciała, pauza 1 s przy brzuchu.'],
  },
  'wioslo-maszyna': {
    ustawienie: 'Siedzisko tak, żeby uchwyty były na wysokości dolnej części klatki. Klatka oparta o podparcie.',
    blad: 'Odklejanie klatki od podparcia, żeby dociągnąć ciężar.',
    pro: ['Rób też jednorącz: łatwiej wyrównać słabszą stronę.', 'Ostatnia seria do upadku, potem kilka częściowych powtórzeń.'],
  },
  'high-row': {
    ustawienie: 'Siedzisko tak, żeby uchwyty na starcie były trochę nad głową. Uda pod wałkiem.',
    blad: 'Ciągnięcie do szyi zamiast w dół do klatki.',
    pro: ['Łączy ściąganie z wiosłowaniem. Dobrze robi szerokość i grubość pleców naraz.', 'Jednorącz daje większy zakres ruchu.'],
  },

  // Barki
  wznosy: {
    ustawienie: 'Stojąc, lekki skłon tułowia do przodu około 15°. Hantle przy udach, łokcie lekko ugięte.',
    blad: 'Za ciężkie hantle i bujanie. Barki podjeżdżają do uszu i robi się ćwiczenie na kaptury.',
    pro: ['Prowadź łokcie w bok i trochę do przodu, nie do tyłu. Mały palec może być minimalnie wyżej niż kciuk.', 'Na koniec dorób częściowe powtórzenia w dolnej połowie ruchu, aż bark zapiecze.'],
  },
  'wznosy-siedzac': {
    ustawienie: 'Siedząc na końcu ławki, plecy proste, hantle wzdłuż ciała.',
    blad: 'Kołysanie tułowiem mimo siedzenia.',
    pro: ['Siedząc nie da się oszukać nogami, więc ciężar będzie mniejszy, ale praca czystsza.', 'Tempo 1 s w górę, 3 s w dół.'],
  },
  'wznosy-wyciag': {
    ustawienie: 'Brama, dolny bloczek, pojedynczy uchwyt. Stań bokiem, linka przechodzi przed ciałem.',
    blad: 'Ciągnięcie dłonią zamiast łokciem.',
    pro: ['Linka trzyma napięcie także na dole ruchu, czego hantel nie daje.', 'Zrób serię z obniżaniem ciężaru: po upadku od razu o krok lżej.'],
  },
  'wznosy-mankiet': {
    ustawienie: 'Brama, bloczek na najniższej pozycji, mankiet na nadgarstku albo tuż nad nim. Stań bokiem pół kroku od bramy, drugą ręką trzymaj się słupka.',
    blad: 'Za ciężki stos i wyrzucanie ręki tułowiem. Lepiej lżej i czysto.',
    pro: ['Przechyl się lekko od bramy, około 10 do 15°. Bark jest wtedy rozciągnięty na starcie i pracuje w pełnym zakresie.', 'Unoś do wysokości barku, wyżej pracują już kaptury. Na górze zatrzymaj się na sekundę.'],
  },
  'wznosy-przod': {
    ustawienie: 'Stojąc, stopy na szerokość bioder, kolana miękko. Hantle przed udami, chwyt nachwytem albo młotkowy, łokcie minimalnie ugięte.',
    blad: 'Wyrzucanie hantli z bioder i odchylanie się do tyłu. Ruch robi wtedy rozpęd, nie bark.',
    pro: ['Unoś na zmianę jedną i drugą ręką, wtedy łatwiej trzymać tułów nieruchomo. Wyżej niż do linii oczu nie ma potrzeby.', 'Przód barku mocno pracuje już przy każdym wyciskaniu, więc wystarczą 2 lżejsze serie po 10 do 15 powtórzeń na końcu treningu.'],
  },
  'wyc-barki': {
    ustawienie: 'Ławka skośna 75 do 85°, prawie pionowo. Hantle startują na wysokości uszu, łokcie trochę przed tułowiem.',
    blad: 'Mocne wygięcie lędźwi, które zamienia ćwiczenie w wyciskanie skośne.',
    pro: ['Nie stukaj hantlami na górze. Zatrzymaj się tuż przed wyprostem, wtedy barki pracują cały czas.', 'Tempo 2 do 3 s w dół, do wysokości uszu albo trochę niżej.'],
  },
  'wyc-barki-maszyna': {
    ustawienie: 'Siedzisko tak, żeby uchwyty na starcie były na wysokości brody albo ust.',
    blad: 'Siedzisko za nisko i zbyt głębokie zejście, które drażni barki.',
    pro: ['Na maszynie możesz bezpiecznie dojść do upadku, więc ostatnia seria do końca.', 'Chwyt neutralny, jeśli maszyna go ma, jest łagodniejszy dla barków.'],
  },
  arnold: {
    ustawienie: 'Ławka 75 do 85°. Start z hantlami przy klatce, dłonie do siebie.',
    blad: 'Szybki, niekontrolowany obrót.',
    pro: ['Obrót rób płynnie w pierwszej połowie wyciskania.', 'Ciężar o 20 do 30% mniejszy niż w zwykłym wyciskaniu.'],
  },
  'odwrotne-maszyna': {
    ustawienie: 'Przodem do oparcia. Uchwyty ustawione do tyłu, na wysokości barków, chwyt neutralny albo nachwyt.',
    blad: 'Ściskanie łopatek na siłę. Wtedy pracuje środek pleców, nie tył barków.',
    pro: ['Myśl o rozkładaniu rąk szeroko na boki, łopatki zostają prawie w miejscu.', 'Tempo 1 s na zewnątrz, pauza, 3 s z powrotem. Tył barków lubi długie serie 15 do 20.'],
  },
  'face-pull': {
    ustawienie: 'Lina na górnym bloczku, mniej więcej na wysokości oczu. Chwyt kciukami do tyłu, krok w tył.',
    blad: 'Za duży ciężar i odchylanie się całym ciałem do tyłu.',
    pro: ['Ciągnij do czoła i rozsuwaj końce liny, na końcu obróć ręce jak w pozie podwójnego bicepsa.', 'Świetne na postawę i zdrowe barki przy dużej ilości wyciskania.'],
  },
  'odwrotne-hantle': {
    ustawienie: 'Leżąc przodem na ławce skośnej 30 do 45° albo stojąc w opadzie, tułów prawie poziomo.',
    blad: 'Podnoszenie tułowia i bujanie.',
    pro: ['Bardzo lekkie hantle, 12 do 20 powtórzeń.', 'Kciuki lekko w dół pomagają trafić w tył barku.'],
  },
  'tyl-linki': {
    ustawienie: 'Brama, bloczki na wysokości barków. Linki skrzyżowane: lewa ręka trzyma prawą linkę i odwrotnie.',
    blad: 'Uginanie łokci, które zamienia ruch w wiosłowanie.',
    pro: ['Rozkładaj ręce na boki na wysokości barków, w szerokim łuku.', 'Bez uchwytów, trzymając samą linkę, mniej angażujesz przedramię.'],
  },

  // Pośladki i tył uda
  'hip-thrust': {
    ustawienie: 'Ławka za plecami, jej krawędź pod łopatkami. Stopy na szerokość bioder, na górze goleń pionowo.',
    blad: 'Przeprost w lędźwiach na górze zamiast dokończenia ruchu pośladkami.',
    pro: ['Broda przy klatce i wzrok przed siebie, wtedy miednica sama podwija się na górze.', 'Pauza 2 s na górze z maksymalnym ściśnięciem.'],
  },
  mostek: {
    ustawienie: 'Leżąc na podłodze, stopy blisko pośladków, hantel albo talerz na biodrach.',
    blad: 'Pchanie stopami w palce zamiast w pięty.',
    pro: ['Pchaj piętami i podwijaj miednicę na górze.', 'Pauza 2 s na górze.'],
  },
  'mostek-jednonoz': {
    ustawienie: 'Leżąc albo z łopatkami na ławce. Jedna stopa na podłodze, druga noga w górze.',
    blad: 'Opadanie miednicy na bok nogi, która nie pracuje.',
    pro: ['Dobre do wyrównania stron. Zaczynaj od słabszej.', 'Wersja z łopatkami na ławce daje dłuższy ruch.'],
  },
  'pull-through': {
    ustawienie: 'Lina na dolnym bloczku. Tyłem do wyciągu, lina między nogami, krok lub dwa od stosu.',
    blad: 'Uginanie kolan i robienie przysiadu zamiast ruchu z bioder.',
    pro: ['Tyłek mocno do tyłu, aż poczujesz rozciągnięcie z tyłu ud, potem wypchnij biodra i ściśnij pośladki.', 'Bezpieczne dla kolan i lędźwi, więc możesz robić je często.'],
  },
  kickback: {
    ustawienie: 'Mankiet na kostce, dolny bloczek. Tułów pochylony, ręce na bramie.',
    blad: 'Wyginanie lędźwi, żeby wyrzucić nogę wyżej.',
    pro: ['Noga idzie do tyłu i lekko na zewnątrz, na końcu ściśnij pośladek.', 'Krótki zakres przy pełnym napięciu daje więcej niż wymach.'],
  },
  'uginanie-lezac': {
    ustawienie: 'Kolana tuż za krawędzią ławki, wałek nad piętami, czyli nad ścięgnem Achillesa. Biodra dociśnięte.',
    blad: 'Unoszenie bioder, żeby dociągnąć ciężar.',
    pro: ['Stopy zadarte do siebie pomagają tyłowi uda. Opuszczaj 3 s.', 'Na ostatniej serii dorób częściowe powtórzenia w dolnej połowie ruchu.'],
  },
  'uginanie-siedzac': {
    ustawienie: 'Oś maszyny na wysokości kolana. Wałek nad kolanami mocno dociśnięty, dolny nad piętami.',
    blad: 'Za luźny wałek na udach i podjeżdżanie biodrami.',
    pro: ['Pochyl tułów lekko do przodu, wtedy tył uda jest bardziej rozciągnięty i rośnie lepiej.', 'Pauza 1 s w pełnym zgięciu.'],
  },
  'uginanie-stojac': {
    ustawienie: 'Kolano przy podparciu, wałek nad piętą, ręce trzymają uchwyty.',
    blad: 'Wypychanie biodra do tyłu.',
    pro: ['Jednonóż: zacznij od słabszej nogi.', 'Opuszczanie 3 s.'],
  },
  'uginanie-pilka': {
    ustawienie: 'Leżąc, pięty na piłce, biodra w górze.',
    blad: 'Opadanie bioder w trakcie.',
    pro: ['Za łatwo? Rób jedną nogą.', 'Biodra cały czas w górze, ciało w linii.'],
  },
  wyprosty: {
    ustawienie: 'Ławka rzymska 45°. Górna krawędź podparcia tuż pod kością biodrową, tak żeby biodra mogły się zginać. Pięty dociśnięte do wałka.',
    blad: 'Przeprost na górze i praca samymi lędźwiami.',
    pro: ['Górę pleców trzymaj lekko zaokrągloną, a stopy możesz ustawić lekko na zewnątrz. Wtedy najmocniej pracują pośladki.', 'Ciężar: talerz trzymany przy klatce. Gdy masz ponad 15 powtórzeń, dołóż.'],
  },
  'reverse-hyper': {
    ustawienie: 'Tułów leży na maszynie, nogi zwisają, wałek przy kostkach.',
    blad: 'Wymachiwanie nogami z rozpędu.',
    pro: ['Unoś nogi pośladkami do linii tułowia, nie wyżej.', 'Odciąża lędźwie, dobre przy ich zmęczeniu.'],
  },

  // Ręce
  'uginanie-skos': {
    ustawienie: 'Ławka skośna 45 do 60°. Ręce zwisają pionowo za tułowiem, głowa na oparciu.',
    blad: 'Łokcie uciekające do przodu przy podnoszeniu.',
    pro: ['To ćwiczenie daje największe rozciągnięcie bicepsa, więc opuszczaj powoli, 3 s.', 'Na górze obróć mały palec w górę i ściśnij biceps.'],
  },
  'uginanie-hantle': {
    ustawienie: 'Stojąc, łokcie przy tułowiu, dłonie przodem.',
    blad: 'Bujanie tułowiem i podnoszenie łokci.',
    pro: ['Naprzemiennie: lepiej czujesz każdy biceps.', 'Ostatnia seria: po upadku przejdź na młotkowe tym samym ciężarem.'],
  },
  modlitewnik: {
    ustawienie: 'Siedzisko tak, żeby pachy leżały na górnej krawędzi podparcia.',
    blad: 'Odrywanie łokci od podparcia.',
    pro: ['Najtrudniejszy jest dół ruchu. Nie prostuj łokci gwałtownie.', 'Pauza 1 s na górze.'],
  },
  'uginanie-wyciag': {
    ustawienie: 'Dolny bloczek, drążek albo uchwyt EZ, krok od wyciągu.',
    blad: 'Wychylanie się do tyłu.',
    pro: ['Linka trzyma napięcie na górze ruchu, więc tam ściśnij biceps na sekundę.', 'Dobre na serie z obniżaniem ciężaru, bo zmieniasz go jednym bolcem.'],
  },
  koncentryczne: {
    ustawienie: 'Siedząc, łokieć oparty o wewnętrzną stronę uda.',
    blad: 'Pomaganie sobie tułowiem.',
    pro: ['Na górze obróć dłoń na zewnątrz i ściśnij biceps.', 'Dobre na końcówkę treningu rąk.'],
  },
  mlotkowe: {
    ustawienie: 'Stojąc albo siedząc, dłonie do siebie, łokcie przy tułowiu.',
    blad: 'Wyrzucanie hantli tułowiem.',
    pro: ['Prowadź hantel w poprzek ciała w stronę przeciwnego barku, wtedy mocniej pracuje ramię z boku.', 'Pogrubia ramię widziane z przodu.'],
  },
  'mlotkowe-lina': {
    ustawienie: 'Lina na dolnym bloczku, krok od wyciągu, łokcie przy tułowiu.',
    blad: 'Łokcie wyjeżdżające do przodu.',
    pro: ['Na górze rozsuń końce liny.', 'Stałe napięcie, dobre na wysokie powtórzenia.'],
  },
  'triceps-glowa': {
    ustawienie: 'Lina na dolnym albo średnim bloczku. Tyłem do wyciągu, krok w przód, lekki skłon, łokcie przy głowie.',
    blad: 'Łokcie rozjeżdżające się na boki.',
    pro: ['Na dole pozwól dłoniom zejść głęboko za głowę. Rozciągnięcie długiej głowy tricepsa daje najwięcej masy.', 'Na górze rozsuń końce liny.'],
  },
  'triceps-hantel': {
    ustawienie: 'Siedząc na ławce z oparciem około 80°, jeden hantel trzymany oburącz za talerz.',
    blad: 'Za ciężki hantel i łokcie rozjeżdżające się na boki.',
    pro: ['Schodź nisko za głowę, 3 s.', 'Oparcie chroni lędźwie.'],
  },
  'triceps-lina': {
    ustawienie: 'Górny bloczek, lina. Lekki skłon, łokcie przy bokach.',
    blad: 'Łokcie wędrujące do przodu i pchanie barkami.',
    pro: ['Na dole rozsuń końce liny na boki i ściśnij triceps na sekundę.', 'Łokcie zostają w miejscu przez cały ruch.'],
  },
  'triceps-drazek': {
    ustawienie: 'Górny bloczek, prosty drążek albo V, nachwyt.',
    blad: 'Pochylanie się nad drążkiem i dopychanie ciałem.',
    pro: ['Pełny wyprost i pauza na dole.', 'Podchwyt mocniej angażuje boczną głowę tricepsa.'],
  },
  'kickback-triceps': {
    ustawienie: 'Opad tułowia albo kolano na ławce. Ramię równolegle do podłogi.',
    blad: 'Ramię opadające w trakcie ruchu.',
    pro: ['Lekki hantel i pełny wyprost z pauzą.', 'Wersja na wyciągu trzyma napięcie przez cały ruch.'],
  },
  'triceps-maszyna': {
    ustawienie: 'Łokcie na podparciu, w jednej linii z osią maszyny.',
    blad: 'Łokcie poza osią maszyny: ruch robi się nierówny.',
    pro: ['Do upadku na ostatniej serii.', 'Pauza w pełnym wyproście.'],
  },

  // Brzuch
  'reverse-crunch': {
    ustawienie: 'Leżąc na ławce płaskiej albo podłodze, dłonie trzymają ławkę za głową, kolana ugięte pod kątem 90°.',
    blad: 'Wymachiwanie nogami zamiast podwijania miednicy.',
    pro: ['Myśl o zwijaniu kręgosłupa od dołu, kość ogonowa w górę. To odwrotność przodopochylenia miednicy.', 'Za łatwo? Ławka skośna głową w górę albo wolniejsze opuszczanie.'],
  },
  'dead-bug': {
    ustawienie: 'Leżąc na plecach, ręce w górę, kolana nad biodrami ugięte pod kątem prostym.',
    blad: 'Odklejanie lędźwi od podłogi przy prostowaniu nogi.',
    pro: ['Wydech przy prostowaniu, wolno, 3 s w każdą stronę.', 'Za łatwo? Trzymaj lekki talerz albo dociskaj dłońmi piłkę do kolan.'],
  },
  deska: {
    ustawienie: 'Przedramiona pod barkami, ciało w linii.',
    blad: 'Biodra w górze albo zapadnięte lędźwie.',
    pro: ['Podwiń miednicę i ściśnij pośladki. 30 s tak robionej deski daje więcej niż 2 minuty luźnej.', 'Ciągnij łokcie w stronę stóp bez ruchu, napięcie brzucha rośnie wtedy bardzo mocno.'],
  },
  'unoszenie-zwis': {
    ustawienie: 'Zwis na drążku albo w poręczach z oparciem na przedramionach.',
    blad: 'Bujanie i unoszenie nóg biodrami bez podwijania miednicy.',
    pro: ['Na górze podwiń miednicę w stronę klatki.', 'Pełne proste nogi to wersja dla zaawansowanych.'],
  },
  'unoszenie-lawka': {
    ustawienie: 'Leżąc na ławce, pośladki przy krawędzi, dłonie trzymają ławkę za głową.',
    blad: 'Odrywanie lędźwi przy opuszczaniu nóg.',
    pro: ['Opuszczaj nogi tylko do momentu, w którym lędźwie jeszcze dotykają ławki.', 'Na górze unieś biodra.'],
  },
  'spiecia-lina': {
    ustawienie: 'Klęk przed wyciągiem, lina przy głowie z górnego bloczka.',
    blad: 'Ciągnięcie rękami i siadanie na piętach.',
    pro: ['Zwijaj tułów, łokcie w stronę kolan, biodra w miejscu.', 'Brzuch można dociążać jak inne mięśnie. Gdy masz 15 powtórzeń, dołóż.'],
  },
};

// Ogólne zasady wykonywania serii. Pokazywane pod opisem każdego ćwiczenia.
export const ZASADY_SERII = [
  'Pierwsza seria: na rozgrzewkę 1 seria lekka (około 50%) przed pierwszym ćwiczeniem na daną partię.',
  'Każda seria robocza kończy się 1 do 2 powtórzeń przed upadkiem. Ostatnią serię ćwiczenia możesz dociągnąć do upadku, zwłaszcza na maszynach.',
  'Opuszczanie wolniej niż podnoszenie: 2 do 3 s w dół, płynnie w górę.',
  'Gdy w obu seriach dojdziesz do górnej granicy powtórzeń, następnym razem dokładasz ciężar. Apka podpowie to sama.',
];
