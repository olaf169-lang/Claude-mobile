// Stałe dane apki: obszary, biblioteka ćwiczeń, plany startowe, rozciąganie,
// poziomy koksa i odznaki. Nic tu się nie zapisuje, stan użytkownika trzyma
// magazyn.js. Zdjęcia: free-exercise-db (domena publiczna), klucz `img`.

// Kolory obszarów to kolory tarcz olimpijskich. Ten sam kolor oznacza ten sam
// obszar wszędzie: pasek na karcie, kropka w liście, wykres w postępach.
export const OBSZARY = {
  klatka: { nazwa: 'Klatka', kolor: 'var(--t-czerwona)' },
  plecy: { nazwa: 'Plecy', kolor: 'var(--t-niebieska)' },
  barki: { nazwa: 'Barki', kolor: 'var(--t-zolta)' },
  nogi: { nazwa: 'Pośladki i tył uda', kolor: 'var(--t-zielona)' },
  rece: { nazwa: 'Ręce', kolor: 'var(--t-biala)' },
  brzuch: { nazwa: 'Brzuch', kolor: 'var(--t-chrom)' },
};

// typ: 'hantle' | 'maszyna' | 'wyciag' | 'cialo'. Od typu zależy krok
// podpowiadanego ciężaru i to, czy ciężar w ogóle jest potrzebny.
// alt: zamienniki, które robią to samo dla tego samego mięśnia.
const C = (id, nazwa, obszar, typ, img, rady, alt = [], extra = {}) =>
  ({ id, nazwa, obszar, typ, img, rady, alt, ...extra });

export const CWICZENIA = [
  // Klatka
  C('wyc-hantle', 'Wyciskanie hantli na ławce płaskiej', 'klatka', 'hantle', 'Dumbbell_Bench_Press', [
    'Łopatki ściągnięte i wciśnięte w ławkę, stopy pewnie na podłodze.',
    'Opuszczaj nisko, aż poczujesz rozciągnięcie klatki.',
    'Na górze zbliż hantle do siebie i ściśnij klatkę, ale nie stukaj nimi.',
  ], ['wyc-hantle-neutral', 'wyc-maszyna', 'pompki'], { cel: 'Środek klatki' }),
  C('wyc-hantle-neutral', 'Wyciskanie hantli chwytem neutralnym', 'klatka', 'hantle', 'Dumbbell_Bench_Press_with_Neutral_Grip', [
    'Dłonie zwrócone do siebie, łokcie bliżej tułowia.',
    'Hantle dociskaj do siebie przez cały ruch, to mocniej angażuje środek klatki.',
  ], ['wyc-hantle', 'wyc-maszyna']),
  C('wyc-maszyna', 'Wyciskanie na maszynie siedząc', 'klatka', 'maszyna', 'Leverage_Chest_Press', [
    'Ustaw siedzisko tak, żeby uchwyty były na wysokości środka klatki.',
    'Na końcu ruchu zatrzymaj się na sekundę i ściśnij klatkę.',
  ], ['wyc-hantle', 'pompki']),
  C('pompki', 'Pompki', 'klatka', 'cialo', 'Pushups', [
    'Ciało w jednej linii, brzuch i pośladki napięte.',
    'Schodź klatką prawie do podłogi, łokcie pod kątem około 45 stopni.',
  ], ['wyc-hantle', 'wyc-maszyna']),
  C('dipy', 'Dipy na poręczach (na klatkę)', 'klatka', 'cialo', 'Dips_-_Chest_Version', [
    'Tułów pochylony do przodu, łokcie lekko na boki.',
    'Schodź do kąta prostego w łokciach, nie niżej, jeśli czujesz bark.',
    'Za ciężko? Maszyna z odciążeniem. Za lekko? Pas z obciążeniem.',
  ], ['wyc-decline', 'wyc-maszyna-decline', 'linki-krzyz'], { cel: 'Dół klatki' }),
  C('wyc-decline', 'Wyciskanie hantli na ławce głową w dół', 'klatka', 'hantle', 'Decline_Dumbbell_Bench_Press', [
    'Ławka ustawiona lekko w dół, nogi zablokowane pod wałkami.',
    'Opuszczaj hantle do dolnej części klatki, wypychaj w górę i lekko do siebie.',
  ], ['wyc-maszyna-decline', 'smith-decline', 'dipy'], { cel: 'Dół klatki' }),
  C('wyc-maszyna-decline', 'Wyciskanie na maszynie w dół', 'klatka', 'maszyna', 'Leverage_Decline_Chest_Press', [
    'Pchasz uchwyty w dół i do przodu, w stronę bioder.',
    'Łopatki cały czas dociśnięte do oparcia.',
  ], ['wyc-decline', 'dipy']),
  C('smith-decline', 'Wyciskanie na suwnicy Smitha w dół', 'klatka', 'maszyna', 'Smith_Machine_Decline_Press', [
    'Gryf opuszczaj do dolnej części klatki.',
    'Spokojnie w dół, mocno w górę.',
  ], ['wyc-decline', 'wyc-maszyna-decline']),
  C('pec-deck', 'Rozpiętki na maszynie (pec deck)', 'klatka', 'maszyna', 'Butterfly', [
    'Łokcie lekko ugięte, klatka wypięta, łopatki ściągnięte.',
    'Na końcu ruchu zatrzymaj ręce złączone przed sobą na 1 do 2 sekund i ściśnij.',
    'Wracaj powoli, aż poczujesz rozciągnięcie.',
  ], ['linki-krzyz', 'rozpietki-hantle', 'linki-lawka'], { cel: 'Środek klatki' }),
  C('linki-krzyz', 'Krzyżowanie linek wyciągu', 'klatka', 'wyciag', 'Cable_Crossover', [
    'Krok do przodu, lekki skłon, łokcie minimalnie ugięte.',
    'Prowadź linki z góry w dół, aż dłonie skrzyżują się przed biodrami. To pracuje dół i środek klatki.',
    'Na końcu ściśnij na sekundę.',
  ], ['pec-deck', 'rozpietki-hantle']),
  C('rozpietki-hantle', 'Rozpiętki z hantlami na ławce płaskiej', 'klatka', 'hantle', 'Dumbbell_Flyes', [
    'Łokcie lekko ugięte i zablokowane w tym kącie przez cały ruch.',
    'Opuszczaj szeroko do rozciągnięcia, na górze zbliż hantle.',
  ], ['pec-deck', 'linki-lawka']),
  C('linki-lawka', 'Rozpiętki z linkami na ławce', 'klatka', 'wyciag', 'Flat_Bench_Cable_Flyes', [
    'Ławka między wyciągami, linki z dolnych bloczków.',
    'Linka ciągnie cały czas, więc klatka pracuje także na górze ruchu.',
  ], ['pec-deck', 'rozpietki-hantle']),

  // Plecy
  C('sciaganie-szeroko', 'Ściąganie drążka szerokim chwytem', 'plecy', 'wyciag', 'Wide-Grip_Lat_Pulldown', [
    'Klatka w górę, lekki odchył do tyłu.',
    'Ciągnij łokciami w dół, drążek do górnej części klatki.',
    'Na górze pozwól łopatkom się rozjechać, to rozciąga mięśnie najszersze.',
  ], ['podciaganie', 'sciaganie-jednoracz', 'high-row'], { cel: 'Szerokość pleców' }),
  C('podciaganie', 'Podciąganie z gumą lub na maszynie', 'plecy', 'cialo', 'Band_Assisted_Pull-Up', [
    'Chwyt szerzej niż barki, start z pełnego zwisu.',
    'Klatka do drążka, łokcie w dół do bioder.',
    'W polu ciężaru wpisuj odciążenie z minusem albo dociążenie z plusem.',
  ], ['sciaganie-szeroko', 'sciaganie-waskie']),
  C('sciaganie-waskie', 'Ściąganie wyciągu wąskim chwytem', 'plecy', 'wyciag', 'Close-Grip_Front_Lat_Pulldown', [
    'Uchwyt V albo wąski drążek, łokcie blisko tułowia.',
    'Ciągnij do mostka i ściśnij łopatki.',
  ], ['podciaganie', 'sciaganie-szeroko']),
  C('sciaganie-jednoracz', 'Ściąganie wyciągu jednorącz', 'plecy', 'wyciag', 'One_Arm_Lat_Pulldown', [
    'Ciągnij łokieć do biodra, tułów nie skręca.',
    'Pełne wyprostowanie ręki na górze.',
  ], ['sciaganie-szeroko', 'proste-rece']),
  C('proste-rece', 'Ściąganie liny prostymi rękami', 'plecy', 'wyciag', 'Straight-Arm_Pulldown', [
    'Ręce prawie proste, lekki skłon w biodrach.',
    'Prowadź linę łukiem do ud, napinając mięśnie najszersze.',
  ], ['sciaganie-szeroko', 'sciaganie-jednoracz']),
  C('wioslo-hantel', 'Wiosłowanie hantlem z podparciem', 'plecy', 'hantle', 'One-Arm_Dumbbell_Row', [
    'Kolano i dłoń na ławce, plecy proste.',
    'Ciągnij hantel do biodra, nie do barku.',
    'Na dole pozwól łopatce zjechać, na górze ściśnij.',
  ], ['wioslo-skos', 'wioslo-maszyna', 'wioslo-wyciag']),
  C('wioslo-skos', 'Wiosłowanie hantlami leżąc na ławce skośnej', 'plecy', 'hantle', 'Dumbbell_Incline_Row', [
    'Leżysz brzuchem na ławce, więc lędźwie odpoczywają.',
    'Ciągnij oba hantle do bioder i ściśnij łopatki.',
  ], ['wioslo-hantel', 'wioslo-maszyna']),
  C('wioslo-wyciag', 'Wiosłowanie na wyciągu dolnym siedząc', 'plecy', 'wyciag', 'Seated_Cable_Rows', [
    'Plecy proste, tułów nie buja się do tyłu.',
    'Ciągnij do brzucha, łokcie blisko ciała, ściśnij łopatki.',
  ], ['wioslo-maszyna', 'wioslo-hantel', 'high-row']),
  C('wioslo-maszyna', 'Wiosłowanie na maszynie', 'plecy', 'maszyna', 'Leverage_Iso_Row', [
    'Klatka oparta o podparcie, ruch tylko w rękach i łopatkach.',
    'Ściśnij łopatki na sekundę.',
  ], ['wioslo-wyciag', 'wioslo-skos']),
  C('high-row', 'Przyciąganie na maszynie z góry (high row)', 'plecy', 'maszyna', 'Leverage_High_Row', [
    'Ciągnij łokciami w dół i do tyłu.',
    'Dobre zastępstwo, gdy wyciąg górny jest zajęty.',
  ], ['sciaganie-szeroko', 'wioslo-maszyna']),

  // Barki
  C('wznosy', 'Unoszenie hantli bokiem', 'barki', 'hantle', 'Side_Lateral_Raise', [
    'Łokcie lekko ugięte, prowadzisz łokciami, nie dłońmi.',
    'Unoś do wysokości barków, bez bujania tułowiem.',
    'Opuszczaj powoli, 2 do 3 sekund. Lepiej lżej i czysto.',
  ], ['wznosy-mankiet', 'wznosy-wyciag', 'wznosy-siedzac'], { cel: 'Szerokie barki' }),
  C('wznosy-siedzac', 'Unoszenie hantli bokiem siedząc', 'barki', 'hantle', 'Seated_Side_Lateral_Raise', [
    'Siedząc trudniej oszukać bujaniem, więc bark pracuje sam.',
  ], ['wznosy-mankiet', 'wznosy', 'wznosy-wyciag']),
  C('wznosy-wyciag', 'Unoszenie ramienia bokiem na wyciągu (brama)', 'barki', 'wyciag', 'Cable_Seated_Lateral_Raise', [
    'Brama, linka z dolnego bloczka. Stań bokiem, ćwiczysz jedną ręką, linka przechodzi przed ciałem.',
    'Łokieć lekko ugięty, unoś do wysokości barku, opuszczaj powoli. Ciężar wpisujesz na jedną rękę, obie robią tyle samo.',
    'Linka ciągnie też na dole ruchu, czego hantel nie daje.',
  ], ['wznosy-mankiet', 'wznosy', 'wznosy-siedzac'], { cel: 'Szerokie barki' }),
  C('wznosy-mankiet', 'Unoszenie bokiem stojąc, z mankietem (brama)', 'barki', 'wyciag', 'Standing_Low-Pulley_Deltoid_Raise', [
    'Brama, dolny bloczek, mankiet na nadgarstek (ten sam co na kostkę). Stań bokiem, ręka z mankietem dalej od wyciągu, linka przechodzi przed ciałem.',
    'Drugą ręką trzymaj się bramy. Łokieć lekko ugięty, unoś bokiem do wysokości barku, opuszczaj 2 do 3 sekund.',
    'Mankiet zamiast uchwytu: nie ściskasz dłoni, więc pracuje sam bark, nie przedramię.',
    'Każda seria osobno na lewą i prawą rękę. Po lewej od razu prawa, potem przerwa.',
  ], ['wznosy-wyciag', 'wznosy', 'wznosy-siedzac'], { cel: 'Szerokie barki', strony: true }),
  C('wyc-barki', 'Wyciskanie hantli nad głowę siedząc', 'barki', 'hantle', 'Seated_Dumbbell_Press', [
    'Oparcie prawie pionowo, plecy przyklejone.',
    'Hantle od wysokości uszu do góry, bez blokowania łokci na sztywno.',
  ], ['wyc-barki-maszyna', 'arnold']),
  C('wyc-barki-maszyna', 'Wyciskanie nad głowę na maszynie', 'barki', 'maszyna', 'Leverage_Shoulder_Press', [
    'Uchwyty na starcie mniej więcej na wysokości brody.',
    'Spokojnie w dół, dynamicznie w górę.',
  ], ['wyc-barki', 'arnold']),
  C('arnold', 'Wyciskanie Arnolda', 'barki', 'hantle', 'Arnold_Dumbbell_Press', [
    'Start z dłońmi do siebie, w trakcie wyciskania obracasz je na zewnątrz.',
    'Lżej niż zwykłe wyciskanie.',
  ], ['wyc-barki', 'wyc-barki-maszyna']),
  C('odwrotne-maszyna', 'Odwrotne rozpiętki na maszynie', 'barki', 'maszyna', 'Reverse_Machine_Flyes', [
    'Przodem do oparcia, ręce prawie proste.',
    'Rozkładaj ręce szeroko i do tyłu, łopatek nie ściskaj za mocno, niech pracuje tył barku.',
  ], ['face-pull', 'odwrotne-hantle', 'tyl-linki'], { cel: 'Tył barków i postawa' }),
  C('face-pull', 'Przyciąganie liny do twarzy (face pull)', 'barki', 'wyciag', 'Face_Pull', [
    'Lina na wysokości oczu, ciągniesz do czoła.',
    'Na końcu łokcie wysoko, kciuki do tyłu.',
  ], ['odwrotne-maszyna', 'tyl-linki']),
  C('odwrotne-hantle', 'Odwrotne rozpiętki z hantlami w opadzie', 'barki', 'hantle', 'Reverse_Flyes', [
    'Leżysz przodem na ławce skośnej albo w opadzie tułowia.',
    'Lekkie hantle, rozkładaj ręce na boki.',
  ], ['odwrotne-maszyna', 'face-pull']),
  C('tyl-linki', 'Rozpiętki tyłu barków na linkach', 'barki', 'wyciag', 'Cable_Rear_Delt_Fly', [
    'Linki skrzyżowane z górnych bloczków.',
    'Rozciągaj ręce szeroko na wysokości barków.',
  ], ['odwrotne-maszyna', 'face-pull']),

  // Pośladki i tył uda (bez obciążania kolana)
  C('hip-thrust', 'Hip thrust (wypychanie bioder)', 'nogi', 'maszyna', 'Barbell_Hip_Thrust', [
    'Łopatki na ławce, broda przy klatce, stopy na szerokość bioder.',
    'Na górze podwiń miednicę i ściśnij pośladki na sekundę.',
    'Nie wyginaj lędźwi, ruch kończą pośladki, nie plecy. Z hantlem albo na maszynie.',
  ], ['wyprosty', 'mostek-jednonoz', 'pull-through', 'mostek'], { cel: 'Pośladki i ustawienie miednicy' }),
  C('mostek', 'Mostek biodrowy z obciążeniem', 'nogi', 'hantle', 'Barbell_Glute_Bridge', [
    'Plecy na podłodze, ciężar na biodrach.',
    'Krótszy ruch niż hip thrust, ale ten sam mięsień.',
  ], ['hip-thrust', 'mostek-jednonoz']),
  C('mostek-jednonoz', 'Mostek biodrowy na jednej nodze', 'nogi', 'cialo', 'Single_Leg_Glute_Bridge', [
    'Druga noga w górze, miednica równo, nie opada na bok.',
    'Wpisz powtórzenia na każdą nogę.',
  ], ['hip-thrust', 'mostek']),
  C('pull-through', 'Przeciąganie liny między nogami (pull through)', 'nogi', 'wyciag', 'Pull_Through', [
    'Tyłem do wyciągu, lina między nogami.',
    'Ruch z bioder: tyłek do tyłu, potem wypchnij biodra i ściśnij pośladki. Kolana prawie nie pracują.',
  ], ['hip-thrust', 'wyprosty']),
  C('kickback', 'Odwodzenie nogi w tył na wyciągu', 'nogi', 'wyciag', 'One-Legged_Cable_Kickback', [
    'Mankiet na kostce, tułów lekko pochylony.',
    'Wypychaj nogę do tyłu, ściśnij pośladek, nie wyginaj pleców.',
  ], ['hip-thrust', 'pull-through']),
  C('uginanie-lezac', 'Uginanie nóg leżąc na maszynie', 'nogi', 'maszyna', 'Lying_Leg_Curls', [
    'Biodra dociśnięte do ławki przez cały ruch.',
    'Uginaj do końca, opuszczaj 2 do 3 sekund.',
  ], ['uginanie-siedzac', 'uginanie-stojac', 'uginanie-pilka'], { cel: 'Dwugłowy uda' }),
  C('uginanie-siedzac', 'Uginanie nóg siedząc na maszynie', 'nogi', 'maszyna', 'Seated_Leg_Curl', [
    'Wałek nad kolanami dociśnięty, plecy przy oparciu.',
    'Siedząc tył uda jest bardziej rozciągnięty, więc rośnie lepiej.',
  ], ['uginanie-lezac', 'uginanie-stojac'], { cel: 'Dwugłowy uda' }),
  C('uginanie-stojac', 'Uginanie nogi stojąc na maszynie', 'nogi', 'maszyna', 'Standing_Leg_Curl', [
    'Jedna noga naraz, biodro nie ucieka do tyłu.',
  ], ['uginanie-lezac', 'uginanie-siedzac']),
  C('uginanie-pilka', 'Uginanie nóg na piłce', 'nogi', 'cialo', 'Ball_Leg_Curl', [
    'Biodra w górze przez cały czas, przyciągaj piłkę piętami.',
  ], ['uginanie-lezac', 'uginanie-siedzac']),
  C('wyprosty', 'Wyprosty na ławce rzymskiej (45°)', 'nogi', 'cialo', 'Hyperextensions_Back_Extensions', [
    'Ruch zaczynasz z bioder, nie z lędźwi.',
    'Górne plecy lekko zaokrąglone, wtedy pracują pośladki i tył uda.',
    'Na górze ściśnij pośladki, nie przeprostowuj się. Ciężar: talerz trzymany przy klatce.',
  ], ['pull-through', 'mostek-jednonoz', 'reverse-hyper', 'hip-thrust'], { cel: 'Pośladki i tył uda' }),
  C('reverse-hyper', 'Odwrotne wyprosty na maszynie', 'nogi', 'maszyna', 'Reverse_Hyperextension', [
    'Tułów leży, ruch robią nogi unoszone pośladkami.',
  ], ['wyprosty', 'kickback']),

  // Ręce
  C('uginanie-skos', 'Uginanie ramion z hantlami na ławce skośnej', 'rece', 'hantle', 'Incline_Dumbbell_Curl', [
    'Ręce zwisają za tułowiem, biceps jest mocno rozciągnięty.',
    'Łokcie zostają w miejscu, na górze obróć mały palec do góry.',
  ], ['uginanie-hantle', 'modlitewnik', 'uginanie-wyciag'], { cel: 'Biceps' }),
  C('uginanie-hantle', 'Uginanie ramion z hantlami stojąc', 'rece', 'hantle', 'Dumbbell_Bicep_Curl', [
    'Łokcie przy tułowiu, bez bujania.',
  ], ['uginanie-skos', 'uginanie-wyciag']),
  C('modlitewnik', 'Uginanie na modlitewniku (maszyna)', 'rece', 'maszyna', 'Machine_Preacher_Curls', [
    'Pachy dociśnięte do podparcia, pełny wyprost na dole.',
  ], ['uginanie-skos', 'koncentryczne']),
  C('uginanie-wyciag', 'Uginanie ramion na wyciągu dolnym', 'rece', 'wyciag', 'Standing_Biceps_Cable_Curl', [
    'Linka trzyma napięcie przez cały ruch.',
  ], ['uginanie-skos', 'uginanie-hantle']),
  C('koncentryczne', 'Uginanie w podporze o udo', 'rece', 'hantle', 'Concentration_Curls', [
    'Łokieć oparty o wewnętrzną stronę uda, powoli w dół.',
  ], ['modlitewnik', 'uginanie-skos']),
  C('mlotkowe', 'Uginanie młotkowe z hantlami', 'rece', 'hantle', 'Hammer_Curls', [
    'Dłonie zwrócone do siebie przez cały ruch.',
    'Pogrubia ramię z boku i przedramię.',
  ], ['mlotkowe-lina', 'uginanie-hantle'], { cel: 'Biceps i przedramię' }),
  C('mlotkowe-lina', 'Uginanie młotkowe z liną na wyciągu', 'rece', 'wyciag', 'Cable_Hammer_Curls_-_Rope_Attachment', [
    'Lina z dolnego bloczka, łokcie przy tułowiu.',
  ], ['mlotkowe', 'uginanie-wyciag']),
  C('triceps-glowa', 'Prostowanie ramion nad głową z liną', 'rece', 'wyciag', 'Cable_Rope_Overhead_Triceps_Extension', [
    'Tyłem do wyciągu, łokcie wysoko i blisko głowy.',
    'Nad głową triceps jest rozciągnięty, to najlepiej buduje jego masę.',
  ], ['triceps-hantel', 'triceps-lina', 'triceps-maszyna'], { cel: 'Triceps' }),
  C('triceps-hantel', 'Prostowanie ramion z hantlem nad głową', 'rece', 'hantle', 'Standing_Dumbbell_Triceps_Extension', [
    'Jeden hantel w obu dłoniach, łokcie skierowane w sufit.',
    'Możesz robić siedząc z oparciem.',
  ], ['triceps-glowa', 'triceps-lina']),
  C('triceps-lina', 'Prostowanie ramion na wyciągu z liną', 'rece', 'wyciag', 'Triceps_Pushdown_-_Rope_Attachment', [
    'Łokcie przyklejone do boków.',
    'Na dole rozsuń końce liny i ściśnij triceps.',
  ], ['triceps-drazek', 'triceps-glowa', 'kickback-triceps'], { cel: 'Triceps' }),
  C('triceps-drazek', 'Prostowanie ramion na wyciągu z drążkiem', 'rece', 'wyciag', 'Triceps_Pushdown', [
    'Łokcie przy bokach, ruch tylko w łokciu.',
  ], ['triceps-lina', 'triceps-maszyna']),
  C('kickback-triceps', 'Prostowanie ramienia w opadzie z hantlem', 'rece', 'hantle', 'Tricep_Dumbbell_Kickback', [
    'Ramię równolegle do podłogi, prostujesz tylko przedramię.',
  ], ['triceps-lina', 'triceps-hantel']),
  C('triceps-maszyna', 'Prostowanie ramion na maszynie', 'rece', 'maszyna', 'Machine_Triceps_Extension', [
    'Łokcie na podparciu, pełny wyprost.',
  ], ['triceps-lina', 'triceps-glowa']),

  // Brzuch (podwija miednicę, czyli pomaga na jej ustawienie)
  C('reverse-crunch', 'Spięcia z unoszeniem bioder (reverse crunch)', 'brzuch', 'cialo', 'Reverse_Crunch', [
    'Leżąc przyciągasz kolana do klatki i odrywasz biodra od podłogi.',
    'Ruch robi dół brzucha, nie rozpęd. Powoli w dół.',
  ], ['dead-bug', 'unoszenie-zwis', 'deska'], { cel: 'Brzuch i miednica' }),
  C('dead-bug', 'Martwy robak (dead bug)', 'brzuch', 'cialo', 'Dead_Bug', [
    'Lędźwie przyklejone do podłogi przez cały czas.',
    'Prostujesz przeciwną rękę i nogę, powoli, z wydechem.',
  ], ['reverse-crunch', 'deska']),
  C('deska', 'Deska z podwiniętą miednicą', 'brzuch', 'cialo', 'Plank', [
    'Podwiń miednicę i ściśnij pośladki, wtedy brzuch pracuje naprawdę.',
    'W polu powtórzeń wpisz sekundy.',
  ], ['dead-bug', 'reverse-crunch'], { jednostka: 's' }),
  C('unoszenie-zwis', 'Unoszenie kolan w zwisie', 'brzuch', 'cialo', 'Hanging_Leg_Raise', [
    'Bez bujania, kolana do klatki, podwijając miednicę.',
  ], ['reverse-crunch', 'unoszenie-lawka']),
  C('unoszenie-lawka', 'Unoszenie nóg leżąc na ławce', 'brzuch', 'cialo', 'Flat_Bench_Lying_Leg_Raise', [
    'Dłonie trzymają ławkę, lędźwie dociśnięte.',
  ], ['reverse-crunch', 'unoszenie-zwis']),
  C('spiecia-lina', 'Spięcia brzucha z liną klęcząc', 'brzuch', 'wyciag', 'Cable_Crunch', [
    'Biodra w miejscu, zwijasz tułów łokciami do kolan.',
  ], ['reverse-crunch', 'dead-bug']),
];

// Plany startowe. Użytkownik może je zmieniać na stałe w apce.
// Kolejność według zasad:
// 1. Od dużych partii do małych: klatka i plecy, potem pośladki i tył uda,
//    potem barki w izolacji, ręce, brzuch.
// 2. Wielostawowe przed izolowanymi, póki jest najwięcej siły.
// 3. Wypychanie na zmianę z przyciąganiem (klatka, plecy, klatka, plecy),
//    więc jedna grupa odpoczywa, gdy pracuje druga.
// 4. Góra przed nogami, bo to priorytet użytkownika (środek i dół klatki,
//    szerokie plecy), a wyprosty i uginanie nie zależą od zmęczenia góry.
//    Hip thrust wypadł z planu A na prośbę użytkownika (bez maszyny, sztangi
//    na biodrach nie chce), zastąpiły go wyprosty na ławce rzymskiej.
//    Pośladki i tył uda idą jednak przed wznosami bokiem: to cięższe ruchy,
//    a lekkie wznosy dobrze znoszą ogólne zmęczenie.
// 5. Ręce na koniec, bo biceps i triceps pomagają w każdym ćwiczeniu
//    na klatkę i plecy. Zmęczone na początku osłabiłyby całą resztę.
// 6. Brzuch zawsze ostatni, bo stabilizuje tułów we wszystkim wcześniej.
// para: ćwiczenia z tą samą literą robi się w superserii, jedno po drugim.
export const PLANY_START = {
  A: [
    { cw: 'wyc-hantle', zakres: [8, 12] },
    { cw: 'sciaganie-szeroko', zakres: [8, 12] },
    { cw: 'dipy', zakres: [8, 12] },
    { cw: 'wioslo-hantel', zakres: [8, 12] },
    { cw: 'wyprosty', zakres: [10, 15] },
    { cw: 'uginanie-lezac', zakres: [8, 12] },
    { cw: 'wznosy-mankiet', zakres: [12, 15] },
    { cw: 'uginanie-skos', zakres: [8, 12], para: 'r' },
    { cw: 'triceps-glowa', zakres: [10, 12], para: 'r' },
    { cw: 'reverse-crunch', zakres: [10, 15] },
  ],
  B: [
    { cw: 'wyc-decline', zakres: [8, 12] },
    { cw: 'podciaganie', zakres: [6, 12] },
    { cw: 'pec-deck', zakres: [10, 14] },
    { cw: 'wioslo-wyciag', zakres: [8, 12] },
    { cw: 'wyprosty', zakres: [10, 15] },
    { cw: 'uginanie-siedzac', zakres: [8, 12] },
    { cw: 'wyc-barki', zakres: [8, 12] },
    { cw: 'wznosy-mankiet', zakres: [12, 15] },
    { cw: 'odwrotne-maszyna', zakres: [12, 15] },
    { cw: 'mlotkowe', zakres: [8, 12], para: 'r' },
    { cw: 'triceps-lina', zakres: [10, 12], para: 'r' },
    { cw: 'dead-bug', zakres: [8, 12] },
  ],
};

// Poprzednie wersje planów startowych. Jeśli użytkownik ich nie zmieniał,
// apka po aktualizacji podmienia je na nowe (magazyn.js). Zmienionych nie rusza.
export const PLANY_STARE = [
  {
    A: ['wyc-hantle', 'sciaganie-szeroko', 'dipy', 'wioslo-hantel', 'wyprosty', 'uginanie-lezac', 'wznosy-wyciag', 'uginanie-skos', 'triceps-glowa', 'reverse-crunch'],
    B: ['wyc-decline', 'podciaganie', 'pec-deck', 'wioslo-wyciag', 'wyprosty', 'uginanie-siedzac', 'wyc-barki', 'wznosy-wyciag', 'odwrotne-maszyna', 'mlotkowe', 'triceps-lina', 'dead-bug'],
  },
  {
    A: ['wyc-hantle', 'sciaganie-szeroko', 'dipy', 'wioslo-hantel', 'wyprosty', 'uginanie-lezac', 'wznosy', 'uginanie-skos', 'triceps-glowa', 'reverse-crunch'],
  },
  {
    A: ['wyc-hantle', 'sciaganie-szeroko', 'dipy', 'wioslo-hantel', 'hip-thrust', 'uginanie-lezac', 'wznosy', 'uginanie-skos', 'triceps-glowa', 'reverse-crunch'],
  },
  {
    A: ['wyc-hantle', 'sciaganie-szeroko', 'dipy', 'wioslo-hantel', 'wznosy', 'hip-thrust', 'uginanie-lezac', 'uginanie-skos', 'triceps-glowa', 'reverse-crunch'],
    B: ['wyc-decline', 'podciaganie', 'wyc-barki', 'wioslo-wyciag', 'pec-deck', 'wznosy-wyciag', 'wyprosty', 'uginanie-siedzac', 'odwrotne-maszyna', 'mlotkowe', 'triceps-lina', 'dead-bug'],
  },
  {
    A: ['wyc-hantle', 'dipy', 'sciaganie-szeroko', 'wioslo-hantel', 'wznosy', 'hip-thrust', 'uginanie-lezac', 'uginanie-skos', 'triceps-glowa', 'reverse-crunch'],
    B: ['pec-deck', 'wyc-decline', 'wioslo-wyciag', 'podciaganie', 'wyc-barki', 'wznosy-wyciag', 'odwrotne-maszyna', 'uginanie-siedzac', 'wyprosty', 'mlotkowe', 'triceps-lina'],
  },
];
export const SERII = 2;

// Rozciąganie: ok. 7 minut. sekundy na stronę; strony: 2 albo 1.
export const ROZCIAGANIE = [
  { id: 'zginacze', nazwa: 'Zginacze biodra w klęku', img: 'Kneeling_Hip_Flexor', sekundy: 40, strony: 2,
    rada: 'Podwiń miednicę i ściśnij pośladek nogi, na której klęczysz. Pod kolano podłóż ręcznik. To najważniejsze ćwiczenie na ustawienie miednicy.' },
  { id: 'czworka', nazwa: 'Czwórka leżąc', img: 'Lying_Glute', sekundy: 40, strony: 2,
    rada: 'Kostka na kolanie drugiej nogi, przyciągnij obie nogi do siebie. Na zdjęciu pomaga partner, sam robisz to rękami.' },
  { id: 'tyl-uda', nazwa: 'Tył uda leżąc z ręcznikiem', img: 'Lying_Hamstring', sekundy: 40, strony: 2,
    rada: 'Noga prosta w górę, ciągnij ją ręcznikiem albo paskiem. Druga noga płasko na podłodze.' },
  { id: 'lydka', nazwa: 'Łydka przy ścianie, kolano proste', img: 'Calf_Stretch_Hands_Against_Wall', sekundy: 30, strony: 2,
    rada: 'Tylna noga prosta, pięta wciśnięta w podłogę, biodra do ściany.' },
  { id: 'achilles', nazwa: 'Achilles przy ścianie, kolano ugięte', img: 'Calf_Stretch_Hands_Against_Wall', sekundy: 20, strony: 2,
    rada: 'Ta sama pozycja, ale ugnij tylne kolano. Ciągnie nisko, przy ścięgnie Achillesa.' },
  { id: '90-90', nazwa: 'Siad 90/90 z przenoszeniem kolan', img: null, sekundy: 45, strony: 1,
    rada: 'Siedzisz, obie nogi ugięte pod kątem prostym. Przenoś kolana z jednej strony na drugą, tułów prosto. Ruchomość bioder do badmintona.' },
];
export const ROZCIAGANIE_W_TYGODNIU = 3;

// Poziomy koksa. prog: łączne XP potrzebne, żeby wejść na poziom.
// Pierwsze wpadają po 1 do 3 treningach, każdy kolejny wymaga więcej
// przerzuconego ciężaru. Przy ok. 1300 XP za trening i 1 do 2 treningach
// w tygodniu Legenda wypada po mniej więcej 100 treningach.
export const POZIOMY = [
  { nazwa: 'Patyczak', prog: 0 },
  { nazwa: 'Świeżak', prog: 1000 },
  { nazwa: 'Bywalec', prog: 3000 },
  { nazwa: 'Twardziel', prog: 6500 },
  { nazwa: 'Kafar', prog: 12000 },
  { nazwa: 'Koks', prog: 20000 },
  { nazwa: 'Byk', prog: 31000 },
  { nazwa: 'Tur', prog: 45000 },
  { nazwa: 'Mamut', prog: 62000 },
  { nazwa: 'Tytan', prog: 83000 },
  { nazwa: 'Atlas', prog: 108000 },
  { nazwa: 'Legenda Piąteczki', prog: 140000 },
];

// Główne źródło XP to praca: ciężar × powtórzenia × trudność ćwiczenia,
// 1 XP za każde 10 „kilogramów pracy”. Do tego premie.
export const XP = {
  kgNaXp: 10,
  trening: 100, // zakończony trening
  rekord: 50, // nowy rekord w ćwiczeniu (raz na ćwiczenie w treningu)
  komplet: 50, // wszystkie serie z planu odhaczone
  wTerminie: 60, // trening po przerwie najwyżej 5 dni
  rozciaganie: 40, // cała sesja rozciągania
};
export const MASA_CIALA = 80; // domyślnie, zmienia się w ustawieniach

// Trudność: mnożnik „kilogramów pracy”, żeby 9 kg we wznosach bokiem
// liczyło się uczciwie obok 80 kg w hip thruście. Wpisany ciężar to ciężar
// jednego hantla albo jednej strony, więc ćwiczenia na dwie ręce mają ×2
// w cenie, a izolacje na małe mięśnie dostają więcej.
// udzial: ćwiczenia z masą ciała liczą taki ułamek Twojej wagi plus to,
// co wpiszesz w polu kg (dociążenie na plus, odciążenie na minus).
// Deska: sekundy zamiast powtórzeń, stąd mały udział.
export const TRUDNOSC = {
  'wyc-hantle': { trud: 2 }, 'wyc-hantle-neutral': { trud: 2 }, 'wyc-maszyna': { trud: 1 },
  pompki: { trud: 1, udzial: 0.65 }, dipy: { trud: 1, udzial: 0.9 }, 'wyc-decline': { trud: 2 },
  'wyc-maszyna-decline': { trud: 1 }, 'smith-decline': { trud: 1 }, 'pec-deck': { trud: 1.3 },
  'linki-krzyz': { trud: 2 }, 'rozpietki-hantle': { trud: 2.5 }, 'linki-lawka': { trud: 2 },
  'sciaganie-szeroko': { trud: 1 }, podciaganie: { trud: 1.2, udzial: 0.95 }, 'sciaganie-waskie': { trud: 1 },
  'sciaganie-jednoracz': { trud: 2 }, 'proste-rece': { trud: 1.3 }, 'wioslo-hantel': { trud: 2 },
  'wioslo-skos': { trud: 2 }, 'wioslo-wyciag': { trud: 1 }, 'wioslo-maszyna': { trud: 1 }, 'high-row': { trud: 1 },
  wznosy: { trud: 4 }, 'wznosy-siedzac': { trud: 4 }, 'wznosy-wyciag': { trud: 4 }, 'wznosy-mankiet': { trud: 2 }, 'wyc-barki': { trud: 2.2 },
  'wyc-barki-maszyna': { trud: 1.2 }, arnold: { trud: 2.4 }, 'odwrotne-maszyna': { trud: 1.8 },
  'face-pull': { trud: 1.5 }, 'odwrotne-hantle': { trud: 4 }, 'tyl-linki': { trud: 3 },
  'hip-thrust': { trud: 0.7 }, mostek: { trud: 0.7 }, 'mostek-jednonoz': { trud: 2, udzial: 0.5 },
  'pull-through': { trud: 1 }, kickback: { trud: 3 }, 'uginanie-lezac': { trud: 1.3 },
  'uginanie-siedzac': { trud: 1.3 }, 'uginanie-stojac': { trud: 2.6 }, 'uginanie-pilka': { trud: 1, udzial: 0.35 },
  wyprosty: { trud: 1, udzial: 0.5 }, 'reverse-hyper': { trud: 1 },
  'uginanie-skos': { trud: 2.6 }, 'uginanie-hantle': { trud: 2.4 }, modlitewnik: { trud: 1.5 },
  'uginanie-wyciag': { trud: 1.4 }, koncentryczne: { trud: 2.6 }, mlotkowe: { trud: 2.4 },
  'mlotkowe-lina': { trud: 1.4 }, 'triceps-glowa': { trud: 1.6 }, 'triceps-hantel': { trud: 1.6 },
  'triceps-lina': { trud: 1.4 }, 'triceps-drazek': { trud: 1.3 }, 'kickback-triceps': { trud: 2.8 },
  'triceps-maszyna': { trud: 1.3 },
  'reverse-crunch': { trud: 1.5, udzial: 0.3 }, 'dead-bug': { trud: 1.5, udzial: 0.2 },
  deska: { trud: 1, udzial: 0.05 }, 'unoszenie-zwis': { trud: 1.8, udzial: 0.35 },
  'unoszenie-lawka': { trud: 1.5, udzial: 0.3 }, 'spiecia-lina': { trud: 1.2 },
};
// Własne ćwiczenia użytkownika: trudność z rodzaju sprzętu.
export const TRUDNOSC_TYPU = { hantle: { trud: 2 }, maszyna: { trud: 1 }, wyciag: { trud: 1 }, cialo: { trud: 1, udzial: 0.5 } };

export const MAKS_PRZERWA = 5; // dni między treningami

// Odznaki. warunek dostaje statystyki z logika.js > statystyki().
export const ODZNAKI = [
  { id: 'start', nazwa: 'Pierwszy krok', opis: 'Pierwszy zakończony trening', w: (s) => s.treningi >= 1 },
  { id: 't5', nazwa: 'Rozkręcony', opis: '5 treningów', w: (s) => s.treningi >= 5 },
  { id: 't10', nazwa: 'Stały bywalec', opis: '10 treningów', w: (s) => s.treningi >= 10 },
  { id: 't25', nazwa: 'Żelazny', opis: '25 treningów', w: (s) => s.treningi >= 25 },
  { id: 't50', nazwa: 'Pół setki', opis: '50 treningów', w: (s) => s.treningi >= 50 },
  { id: 's3', nazwa: 'Rytm', opis: '3 treningi z rzędu bez przerwy dłuższej niż 5 dni', w: (s) => s.najdluzszaSeria >= 3 },
  { id: 's8', nazwa: 'Maszyna', opis: '8 treningów z rzędu w terminie', w: (s) => s.najdluzszaSeria >= 8 },
  { id: 'r1', nazwa: 'Pierwszy rekord', opis: 'Pobity pierwszy rekord', w: (s) => s.rekordy >= 1 },
  { id: 'r10', nazwa: 'Łowca rekordów', opis: '10 pobitych rekordów', w: (s) => s.rekordy >= 10 },
  { id: 'r30', nazwa: 'Niszczyciel', opis: '30 pobitych rekordów', w: (s) => s.rekordy >= 30 },
  { id: 'komplet', nazwa: 'Bez litości', opis: 'Trening z kompletem serii', w: (s) => s.komplety >= 1 },
  { id: 'gumka', nazwa: 'Gumowy', opis: 'Rozciąganie 3 razy w jednym tygodniu', w: (s) => s.pelneTygodnieRozciagania >= 1 },
  { id: 'gumka10', nazwa: 'Jak z gumy', opis: '10 sesji rozciągania', w: (s) => s.rozciagania >= 10 },
  { id: 'tona', nazwa: 'Tona w garści', opis: '5 ton przerzucone w jednym treningu', w: (s) => s.maksTonaz >= 5000 },
];
