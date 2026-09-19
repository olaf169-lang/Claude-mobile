# MANTIS — brief gry mobilnej

## 1. Cel gry

Stwórz prostą, efektowną i przyjazną grę mobilną przeznaczoną dla dziecka około 5–6 lat.

Gracz steruje **modliszką**, która przemierza niewielkie naturalne środowisko, poluje na owady, łapie je i zjada. Za zdobywanie pożywienia modliszka rośnie i przechodzi przez kolejne stadia rozwoju:

**L1 → L2 → L3 → L4 → L5 → ... → ostatnie stadium**

Po każdym przejściu do kolejnego stadium następuje **wylinka** — ważny, efektowny moment gry, a nie zwykły ekran „level up”.

Po osiągnięciu ostatniego stadium gra dla danej modliszki zostaje ukończona. Pojawia się specjalny ekran zwycięstwa, a ukończenie gry **odblokowuje kolejne dwie modliszki**.

Gra ma być przede wszystkim:
- intuicyjna,
- przyjemna wizualnie,
- pozbawiona przemocy,
- z bardzo małą ilością tekstu,
- możliwa do obsługi przez dziecko bez czytania instrukcji,
- efektowna podczas polowania, jedzenia i wzrostu.

Gra działa wyłącznie lokalnie na telefonie. Nie potrzebuje konta, internetu ani serwera.

---

# 2. Główna pętla rozgrywki

Podstawowa pętla:

**PORUSZAJ SIĘ → ZNAJDŹ OWADA → ZŁAP → ZJEDZ → UROŚNIJ → WYLINKA → WIĘKSZA MODLISZKA**

Najważniejszym feedbackiem dla dziecka ma być wizualne poczucie:

> „Moja modliszka właśnie urosła!”

---

# 3. Sterowanie

Sterowanie musi być maksymalnie proste.

### Wariant preferowany

- przesuwanie palcem po ekranie = kierowanie modliszką,
- modliszka automatycznie idzie w kierunku wskazanym przez palec,
- dotknięcie owada znajdującego się w zasięgu = próba złapania.

Nie wymagaj precyzyjnego celowania.

Gra powinna posiadać **duży margines błędu**.

Jeżeli dziecko dotknie owada trochę obok, modliszka powinna nadal próbować go złapać.

---

# 4. Mechanika łapania i jedzenia

Najlepiej rozdzielić łapanie i jedzenie tylko wizualnie, ale nie robić z tego dwóch trudnych przycisków.

### 1. Polowanie

Modliszka chodzi po świecie.

Owady:
- chodzą,
- latają,
- czasami zatrzymują się,
- pojawiają się w różnych miejscach.

Niektóre owady mogą być szybsze.

### 2. Atak

Kiedy modliszka znajdzie się wystarczająco blisko owada, dziecko dotyka owada.

Modliszka wykonuje szybki, charakterystyczny ruch przednimi odnóżami i **chwytа owada**.

### 3. Jedzenie

Po złapaniu następuje krótka, efektowna animacja jedzenia.

Nie ma być brutalna ani obrzydliwa.

Po jedzeniu pojawia się **mały efekt energii/pożywienia**, który wlatuje do modliszki.

Pasek wzrostu zwiększa się.

---

# 5. Alternatywa mechaniki

Do przetestowania dwa warianty:

### Wariant A — bardzo prosty

Dotknij owada → modliszka automatycznie podejdzie → złapie → zje.

To powinien być domyślny wariant.

### Wariant B — odrobinę bardziej zręcznościowy

Dziecko musi doprowadzić modliszkę do odpowiedniej odległości, a następnie dotknąć ekranu.

Jeżeli modliszka jest odpowiednio blisko, następuje automatyczne złapanie.

**Nie dodawać klasycznego joysticka + osobnego przycisku ataku**, chyba że testy pokażą, że sterowanie jest wygodne.

Dla dziecka 5,5 roku priorytetem jest prostota.

---

# 6. Świat gry

Widok najlepiej zrobić jako **2D z boku / lekko z góry**, przypominający mały fragment naturalnego środowiska.

Nie tworzyć ogromnej mapy.

Jedna plansza powinna być stosunkowo mała i żywa.

Elementy:
- liście,
- łodygi,
- trawy,
- gałązki,
- małe kwiaty,
- kamienie,
- krople rosy,
- delikatne tło,
- światło słoneczne.

Modliszka może chodzić po liściach, gałązkach, ziemi i łodygach.

Ma wyglądać jak **urocza, animowana wersja prawdziwego świata**.

---

# 7. Owady

Na początku powinny pojawiać się małe i łatwe do złapania owady.

### Początek
- małe muchy,
- muszki,
- drobne owady,
- małe mrówki.

### Środek gry
- większe muchy,
- małe ćmy,
- koniki polne,
- większe chrząszcze.

### Późniejsze stadia
- większe chrząszcze,
- większe koniki polne,
- ćmy,
- większe owady latające.

Każdy rodzaj owada powinien mieć:
- własny wygląd,
- własny sposób poruszania,
- różną szybkość,
- inną wartość pożywienia.

Nie wszystkie muszą być dostępne od początku.

Dzięki temu dziecko zauważa:

> „Jestem większą modliszką, więc pojawiają się większe owady.”

---

# 8. System wzrostu

Każde stadium ma określoną ilość potrzebnego pożywienia.

Przykład:

**L1** — 3 owady  
**L2** — 5 owadów  
**L3** — 7 owadów  
**L4** — 9 owadów

Liczby należy dobrać tak, aby pojedyncza rozgrywka nie była zbyt długa.

Ważniejsze od dokładnej liczby jest poczucie stałego progresu.

Po każdym owadzie:
- krótki efekt,
- dźwięk,
- pasek wzrostu się zwiększa.

---

# 9. Pasek wzrostu

Na górze ekranu:

**L2**

[██████░░░]

Nie używać dużej ilości tekstu.

Najważniejszy jest wizualny pasek, który dziecko rozumie intuicyjnie.

Przy zapełnieniu paska:

**PASEK → 100% → świat reaguje → WYLINKA**

---

# 10. Wylinka — najważniejszy moment progresji

Wylinka powinna być jednym z najbardziej efektownych elementów całej gry.

Po zapełnieniu paska:
1. modliszka zatrzymuje się,
2. świat delikatnie zwalnia,
3. pojawia się subtelny efekt świetlny,
4. stara „skóra” zostaje za modliszką,
5. modliszka zaczyna się z niej wysuwać,
6. stopniowo pojawia się większa wersja,
7. nowa modliszka otrząsa się,
8. pojawia się błysk / pyłek / liście,
9. kamera delikatnie przybliża,
10. pokazuje się duże **L2**.

Można zastosować krótkie slow-motion.

**Nowa modliszka musi być wyraźnie większa od poprzedniej.**

---

# 11. Różnice między L1, L2, L3 itd.

Nie wystarczy tylko zmienić liczb.

Każde stadium powinno wizualnie pokazywać wzrost.

Zmieniają się:
- rozmiar ciała,
- długość odnóży,
- wielkość głowy,
- proporcje,
- kolor lub delikatne szczegóły,
- animacja ruchu.

Jednocześnie modliszka musi cały czas wyglądać jak ta sama modliszka.

Dziecko powinno rozpoznać:

> „To moja modliszka, tylko większa.”

---

# 12. Ostatnie stadium — ekran zwycięstwa

Po osiągnięciu ostatniego stadium nie wyświetlać suchego komunikatu typu „Dorosła modliszka”.

Zamiast tego przygotować **pełnoprawny ekran zwycięstwa**, przypominający dziecięce osiągnięcie.

Po ostatniej wylince:

- ekran rozświetla się,
- modliszka pojawia się na dużym, efektownym liściu,
- kamera pokazuje ją w całej okazałości,
- pojawiają się konfetti, małe listki, błyski lub świetliki,
- może pojawić się duży **złoty puchar / medal / odznaka**,
- modliszka wykonuje swoją charakterystyczną animację zwycięstwa.

Główny komunikat powinien być krótki i pozytywny, np.:

# BRAWO! 🎉

Pod spodem mniejszy komunikat:

**UKOŃCZYŁEŚ MODLISZKĘ!**

Jeszcze lepiej, jeżeli główny komunikat będzie częściowo graficzny, np. ogromne **BRAWO!** + puchar, zamiast dużej ilości tekstu.

Następnie pojawia się efekt:

**🔓 NOWE MODLISZKI ODBLOKOWANE!**

Dwie nowe modliszki powinny zostać pokazane jako karty/sylwetki, które efektownie się odblokowują.

To ma być moment nagrody, a nie zwykły ekran końcowy.

---

# 13. Odblokowanie nowych modliszek

Na ekranie głównym zawsze powinien znajdować się wybór modliszek.

Przed ukończeniem pierwszej:

### WYBIERZ MODLISZKĘ

[ 🦗 MODLISZKA 1 ] — odblokowana

[ 🔒 MODLISZKA 2 ] — zablokowana

[ 🔒 MODLISZKA 3 ] — zablokowana

Zablokowane modliszki mogą być pokazane jako **ciemniejsze sylwetki / kształty**, żeby dziecko wiedziało, że czeka tam coś nowego.

Po ukończeniu pierwszej:

🔓 MODLISZKA 2  
🔓 MODLISZKA 3

Powinna nastąpić krótka animacja odblokowania.

---

# 14. Różne modliszki

Docelowo każda z trzech modliszek powinna mieć własny charakter wizualny.

### Modliszka 1
Klasyczna zielona modliszka.

### Modliszka 2
Brązowa / jesienna, bardziej kamuflująca się.

### Modliszka 3
Bardziej egzotyczna i kolorowa.

Na początku implementacji wystarczą różne kolory i wygląd.

Nie trzeba tworzyć skomplikowanych umiejętności specjalnych.

---

# 15. Ekran główny

Ekran główny powinien być bardzo czytelny.

W centrum:

**DUŻA MODLISZKA**

Pod nią:

**WYBIERZ MODLISZKĘ**

Następnie trzy duże karty modliszek.

Na dole:

**GRAJ**

Minimalna ilość tekstu.

Można używać ikon i animacji zamiast opisów.

---

# 16. Zapisywanie

Gra zapisuje lokalnie:
- odblokowane modliszki,
- najwyższe ukończone stadium dla każdej modliszki,
- aktualny progres,
- wybraną modliszkę.

Nie potrzeba konta ani chmury.

Po zamknięciu gry dziecko powinno móc wrócić do miejsca, w którym skończyło.

---

# 17. Dźwięk

Dźwięk powinien pomagać dziecku zrozumieć mechanikę.

### Złapanie
Krótki, satysfakcjonujący dźwięk „snap”.

### Jedzenie
Krótki miękki dźwięk.

### Wzrost
Charakterystyczny dźwięk sukcesu.

### Wylinka
Specjalna muzyka + efekty.

### Nowe stadium
Krótki „achievement sound”.

### Odblokowanie nowej modliszki
Wyjątkowy dźwięk.

Muzyka może być delikatna, naturalna i spokojna.

---

# 18. Styl graficzny

Najlepiej zastosować:

**stylizowana, urocza natura + animacja inspirowana prawdziwymi modliszkami.**

Nie robić:
- bardzo infantylnej kreskówki,
- przesadnie realistycznych owadów,
- krwi,
- brutalności,
- strasznych animacji.

Jedzenie powinno być efektowne, ale sympatyczne.

Dziecko ma mieć poczucie:

> „Mam fajną modliszkę, która poluje.”

---

# 19. UX dla dziecka 5,5 roku

Najważniejsza zasada:

## JEŻELI DZIECKO NIE WIE, CO ZROBIĆ, GRA POWINNA MU TO POKAZAĆ.

Nie używać długich instrukcji.

Pierwsze uruchomienie:
- modliszka pojawia się na liściu,
- pojawia się owad,
- delikatna animacja wskazuje owada,
- dziecko dotyka,
- modliszka automatycznie podchodzi / łapie / zjada,
- pasek rośnie.

Dziecko samo rozumie mechanikę.

---

# 20. Pierwsze 60 sekund gry

### 0–10 sekund
Modliszka pojawia się na liściu.

### 10–20 sekund
Pojawia się pierwszy bardzo łatwy owad.

### 20–30 sekund
Dziecko dotyka owada.

Modliszka go łapie.

### 30–40 sekund
Efekt jedzenia.

Pasek wzrostu się zwiększa.

### 40–60 sekund
Pojawiają się 2–3 kolejne owady.

Dziecko zaczyna samodzielnie polować.

Bez instrukcji tekstowej.

---

# 21. Kamera

Kamera automatycznie podąża za modliszką.

Nie należy wymagać od dziecka sterowania kamerą.

Kiedy modliszka znajduje się przy krawędzi ekranu:
- kamera delikatnie przesuwa się,
- świat nadal wygląda naturalnie.

Podczas łapania kamera może wykonać bardzo lekkie przybliżenie.

Podczas wylinki — większe, kontrolowane przybliżenie.

---

# 22. Ważna zasada projektowa

Gra nie może polegać na spamowaniu przycisku.

Najważniejsza satysfakcja powinna wynikać z:

**znalezienia owada → podejścia → dobrego momentu → efektownego złapania → zjedzenia → wzrostu.**

Jednocześnie, ponieważ gra jest dla 5,5-latka, mechanika musi być wybaczająca.

Nie karać dziecka mocno za pomyłki.

Jeżeli owad ucieknie — nic złego się nie dzieje.

Po prostu pojawia się kolejny.

---

# 23. Brak klasycznej śmierci

Na pierwszej wersji gry najlepiej nie implementować śmierci modliszki.

Nie ma:
- HP,
- game over po przegranej,
- trudnych przeciwników,
- karania dziecka.

Celem jest rozwój i odkrywanie.

Gra kończy się pozytywnym „ukończeniem” po osiągnięciu ostatniego stadium.

---

# 24. Struktura ekranów

### SCREEN 1 — HOME
Logo / duża modliszka

**WYBIERZ MODLISZKĘ**

3 karty modliszek

**GRAJ**

### SCREEN 2 — GAME
Świat natury  
Modliszka  
Owady  
Pasek wzrostu  
Stadium: L1 / L2 / L3 itd.

### SCREEN 3 — MOLTING
Specjalna pełnoekranowa animacja wylinki.

### SCREEN 4 — NEW STAGE
Krótka prezentacja nowego stadium.

### SCREEN 5 — VICTORY
Efektowna scena zwycięstwa:
- dorosła modliszka,
- puchar / medal,
- konfetti / świetliki / błyski,
- duże **BRAWO!**
- informacja o odblokowaniu nowych modliszek.

### SCREEN 6 — MANTIS SELECT
Pokazuje odblokowane i zablokowane modliszki.

---

# 25. Architektura kodu

Kod powinien być zbudowany tak, żeby łatwo można było później dodawać:
- nowe modliszki,
- nowe owady,
- nowe stadia,
- nowe środowiska,
- nowe animacje,
- nowe efekty dźwiękowe.

Przykładowa struktura danych:

### Mantis
- id
- name
- colors
- stages[]
- unlocked
- completed

### Stage
- id
- scale
- requiredFood
- availableInsects[]
- sprite/animation
- effects

### Insect
- id
- size
- speed
- foodValue
- movementType
- appearance

### GameState
- selectedMantis
- currentStage
- currentFood
- unlockedMantis[]
- completedMantis[]

---

# 26. Priorytet MVP

Pierwsza działająca wersja NIE musi mieć wszystkiego.

Najpierw stworzyć:

1. ekran wyboru modliszki,
2. jedną modliszkę,
3. jeden prosty świat,
4. chodzenie,
5. kilka owadów,
6. łapanie,
7. jedzenie,
8. pasek wzrostu,
9. L1 → L2 → L3,
10. prostą animację wylinki,
11. ostatnie stadium,
12. ekran zwycięstwa z pucharem / efektem „BRAWO!”,
13. odblokowanie dwóch pozostałych modliszek,
14. zapis lokalny.

Dopiero później dopracowywać:
- dodatkowe owady,
- lepsze animacje,
- efekty,
- dźwięki,
- różne środowiska,
- kolejne modliszki.

---

# 27. Najważniejsze kryterium jakości

Po uruchomieniu gry dziecko powinno po maksymalnie kilkunastu sekundach wiedzieć:

**„To jest moja modliszka.”**

Po minucie:

**„Muszę łapać owady.”**

Po kilku minutach:

**„Jak ją nakarmię, urośnie.”**

Po pierwszej wylince:

**„O KURCZE, ONA UROSŁA!”**

A po ukończeniu:

**„BRAWO! Wygrałem i odblokowałem nowe modliszki!”**

To właśnie te emocje powinny być głównym celem całej gry.

Nie komplikować gry dodatkowymi mechanikami, jeżeli nie zwiększają tego poczucia.
