/* ---------- BIBLIA BANNERLORDA: baza wiedzy dla czatu ----------
   Każdy wpis: [id, tytuł, słowa kluczowe, treść, [źródła], wersja gry]
   Oznaczenia w treści: (gra) mechanika z opisu/kodu, (gracze) opinia lub praktyka graczy, (model apki) wyliczenie tej aplikacji. */
Object.assign(SRC, {
  armor:["Nexus: wzór pancerza (soak i redukcja)","https://www.nexusmods.com/mountandblade2bannerlord/mods/1414"],
  dmg:["Nexus: wzory obrażeń broni białej","https://www.nexusmods.com/mountandblade2bannerlord/articles/450"],
  surgery:["Steam: wzór przeżycia rannych","https://steamcommunity.com/app/261550/discussions/0/2521401367327016969"],
  learn:["Wiki: umiejętności i limit nauki","https://mountandblade.fandom.com/wiki/Skills_(Bannerlord)"],
  learncap:["Steam: twardy limit umiejętności","https://steamcommunity.com/app/261550/discussions/0/3463857594050147318"],
  autocalc:["Nexus: jak działa automatyczna bitwa","https://www.nexusmods.com/mountandblade2bannerlord/mods/673/"],
  reserve:["Steam: trebusze w rezerwie","https://steamcommunity.com/app/261550/discussions/0/3159831641988573510"],
  reserve2:["Steam: jak schować machinę do rezerwy","https://steamcommunity.com/app/261550/discussions/0/4351121630172692748"],
  engmap:["Steam: taran i wieże na mapie","https://steamcommunity.com/app/261550/discussions/0/2264691117432930655"],
  engperks2:["Gleetron: perki Inżynierii z liczbami","https://gleetron.pages.dev/posts/best-engineering-perks-in-mount-blade-2-bannerlord"],
  gryobl:["Gry-Online: oblężenia (PL)","https://www.gry-online.pl/poradniki/mount-and-blade-2-bannerlord/jak-atakowac-zamki-i-miasta/zc19d77"],
  grystew:["Gry-Online: wielkość oddziału (PL)","https://www.gry-online.pl/poradniki/mount-and-blade-2-bannerlord/jak-zwiekszyc-oddzial/zb19c86"],
  cohesion:["PC Invasion: armie i spójność","https://pcinvasion.com/?p=214507"],
  aistall:["Steam: AI buduje katapulty zamiast szturmu","https://steamcommunity.com/app/261550/discussions/0/3001047413723998497"],
  starveha:["Steam: zagłodź albo nękaj konnymi łucznikami","https://steamcommunity.com/workshop/filedetails/discussion/2968204274/4335357045503554174"]
});

const KB = [
/* ===== ŁATKA 1.5 / WAR SAILS ===== */
["p15-aso","Łatka 1.5: zaawansowane opcje startu","aso advanced starting options scenariusz start król wasal najemnik kupiec banita żebrak seed fast mode",
`(gra) Scenariusze świata: Domyślny; Zjednoczone Cesarstwo (wojna domowa skończona, wybrana frakcja cesarska zjednoczyła Cesarstwo); Inwazja (wybrana frakcja rządzi większością Calradii); Ostatni bastion (wybrana frakcja ma jedno miasto); Wojna dwóch frakcji (zostają dwie, w stanie wojny); Losowa Calradia (losowość w wybranym stopniu); Inwazja Nordów (War Sails).
Starty gracza: Domyślny, Król, Wasal, Najemnik, Kupiec (warsztat i karawana w losowym mieście), Banita (ścigany przez wszystkich), Żebrak (tylko łachmany), Admirał floty i Kupiec żeglarz (oba War Sails).
Odblokowanie: Król, Wasal i Najemnik po osiągnięciu tej rangi w dowolnej grze, także przez wczytanie zapisu, który spełnia warunek. Kupiec i Kupiec żeglarz bez warunków.
Modyfikatory (łączą się): Plaga bandytów (większe bandy, czasem ogromne), Niepokoje (większa szansa buntu: w oryginale buntowniczość już od lojalności 60, bunt od 50, rzut 50% dziennie), Brak rekrutów (notable dają dużo mniej ochotników), Szybka podróż, Własny statek (War Sails).
Seed plus te same opcje odtwarza tę samą Calradię. Tryb szybki jest teraz w opcjach startu.`,["p15","loyalty"],"1.5.7"],

["p15-sites","Łatka 1.5: pobojowiska i wraki","pobojowisko battle site wrak wreckage łupy przeszukiwanie roguery medycyna ranni rekrutacja",
`(gra) Po bitwach na lądzie i morzu na mapie zostają miejsca do przeszukania. Małe bitwy: miejsca potyczki i wraki. Średnie: pobojowiska. Duże: "pokłosie bitwy" nazwane od najbliższej osady, które potem zamienia się w "szczątki bitwy" i jeszcze chwilę zostaje.
Większe miejsce wymaga więcej czasu i ludzi, ale płaci więcej. Szybkość przeszukiwania zależy od Łotrostwa (Roguery) i liczebności drużyny.
Znaleźć można: rannych ocalałych do zwerbowania (ich liczba zależy od najlepszej Medycyny w drużynie, daje też XP Medycyny), denary, towary i kosztowności (XP Łotrostwa) oraz znacznik kryjówki bandytów w okolicy.
Przyciągają łupieżców i piratów. Miejsca z czasem znikają.
(gracze) Najbardziej opłaca się przeszukać duże pokłosie zaraz po bitwie armii, mając lekarza z wysoką Medycyną: wolny zastrzyk rekrutów.`,["p15"],"1.5.7"],

["p15-traits","Łatka 1.5: cechy charakteru mają efekty","cechy traits honor miłosierdzie okrucieństwo odwaga ostrożność hojność wyrachowanie liczby",
`(gra) Większość cech daje dwa plusy i jeden minus, każdy w stopniu I i II:
Wyrachowany/Wyrachowany II (Calculating/Cerebral): +10%/+20% dochodu z warsztatów i szybkości budowy machin oblężniczych; -3/-6 do relacji startowej z nowo poznanymi notablami.
Hojny/Szczodry (Generous/Munificent): +25%/+50% więcej najemników i szybszy wzrost morale; minus +10% zużycia jedzenia.
Uczciwy/Honorowy (Honest/Honorable): szybszy wzrost relacji i lojalności osad; wskaźnik przestępstw spada o 40%/80% wolniej. Gubernator honorowy mnoży dodatnie dni lojalności x1,1/x1,2.
Miłosierny/Współczujący: +25%/+50% szansy na wzięcie jeńca zamiast zabicia; +5%/+10% wzrostu domostw wsi; mniej złota z okupów.
Okrutny/Sadystyczny: +20%/+40% łupów z rajdów; -20%/-40% szansy buntu; więcej jeńców ginie w bitwie. Gubernator okrutny: rzut buntu 25% spada do 20%/15%.
Śmiały/Nieustraszony: odporność na spadek morale; +10%/+20% sławy po bitwach; wolniejsze leczenie dzienne.
Ostrożny/Bardzo ostrożny: mniej strat w symulacji oblężenia i mniej ucieczek jeńców; przygotowanie oblężenia trwa 30%/60% dłużej.
AI lordowie też korzystają z cech. Przywództwo (Leadership) rośnie za trzymanie wysokiego morale.`,["p15","loyalty"],"1.5.7"],

["p15-feud","Łatka 1.5: waśnie rodowe (Blood Feuds) i egzekucje","egzekucja waśń blood feud ścięcie lorda relacje okup ransom broker",
`(gra) Egzekucja członka innego klanu może zacząć waśń. Klan AI zaczyna ją sam, gdy straci członka z rąk klanu, z którym ma relację -50 lub gorszą. Liczy się też cecha Miłosierdzia porywacza.
W trakcie waśni: AI zawsze egzekwuje Twoich, jeśli może. Szansa egzekucji rośnie co dzień, aż do 100% w 10. dniu niewoli. Jeśli porywacz wejdzie do osady, jeniec zostaje stracony 8 dni później. Między skłóconymi klanami nie ma ofert okupu.
Waśń blokuje: przejścia lordów (defekcje), członkostwo we frakcji, zaproszenia od klanu panującego, bezpieczny przemarsz.
Koniec waśni: przez pośrednika okupów (liczą się tylko straceni członkowie rodziny). Jeśli straciłeś tyle samo lub więcej, płacisz małą prowizję; jeśli Ty straciłeś mniej, płacisz odszkodowanie. Relacje ustawiają się na -50. Waśń kończy się też, gdy relacja dojdzie do 0.
Egzekucja lorda: -45 do -50 relacji z władcą jego królestwa (-25 do -30, jeśli jesteś przebiegły), -100 jeśli lord z klanu panującego. Straconego lorda nie da się już zwerbować.
(gracze) Dla budowania królestwa egzekucje to strzał w stopę: wypuszczaj lordów, bo cena przekonania lorda zależy od relacji.`,["p15","begin","kingdom"],"1.5.7"],

["p15-camp","Łatka 1.5: zmiany kampanii i ekonomii","prędkość lojalność bunt 35 perswazja cooldown pertraktacje parley gubernator kultura wieś bezpieczeństwo",
`(gra) Prędkość drużyn na lądzie i morzu +15%.
Bezpieczeństwo osad: rozmiar garnizonu liczy się mniej; questy, kryjówki w okolicy, gubernatorzy, budynki i ochrona przed rajdami liczą się bardziej.
Miasta stają się buntownicze poniżej 35 lojalności (wcześniej 25).
Perswazja: po nieudanej próbie przeciągnięcia lorda odczekujesz jedną porę roku, a nie rok. Nieudane swaty też można ponowić po porze roku.
Pertraktacje (Parley) działają też z wrogimi oddziałami, nie tylko z osadami. Na padzie: przycisk Y (na PS5 odpowiednik to trójkąt).
Kara lojalności za gubernatora innej kultury została usunięta.
Wrogie akcje we wsi wywołują wojnę tylko, gdy wieś stawia opór i Ty wybierzesz atak.
Zamiast postaw drużyn klanu są przełączniki: rajdy na wsie, oddawanie żołnierzy do garnizonów, dołączanie do armii, posiadanie floty. Pokonana drużyna klanu odradza się z tym samym składem w bezpiecznym miejscu.`,["p15"],"1.5.7"],

["p15-ws","War Sails 1.3.7: promy, cumowanie, porty zamków, blokady","prom ferry cumowanie mooring port zamek blokada morska wydarzenia morskie abordaż liny perki morze",
`(gra) Prom: we wsi nad wodą (także wrogiej), poza armią, drużyna do 50 ludzi, cena rośnie z liczebnością i wrogością wsi. Każda wieś ma jeden stały cel. Cena bazowa w becie obniżona o połowę.
Cumowanie statków w neutralnych lub sojuszniczych miastach bez limitu. Gdy właściciel wejdzie z Tobą w wojnę, port jest niedostępny do pokoju.
Zamki nad morzem mają punkty portowe; blokady morskie w oblężeniu działają też na zamki. Obrońcy mogą zaatakować oblegającego przez jego blokadę.
39 wydarzeń morskich z wyborami i prawdopodobieństwami.
Walka na morzu: liny abordażowe można przestrzelić; mostów nie da się odciąć, gdy stoi na nich wróg. Większość perków spoza drzewek Marynarz, Bosman i Szyper działa na morzu o 50% słabiej (dlatego w drzewku widzisz dopiski o słabszym działaniu na morzu, nawet gdy grasz bez morza).
Na morzu: zużycie jedzenia -20%, żołd -20%.`,["p15","begin"],"1.5.7"],

["ws-nords","War Sails: Nordowie i nowe umiejętności","nordowie nords kultura marynarz bosman szyper mariner boatswain shipmaster focus statki",
`(gra) War Sails dodaje kulturę Nordów, tła nadmorskie, umiejętności Marynarz (Mariner), Bosman (Boatswain), Szyper (Shipmaster) i +6 punktów skupienia po kreacji.
Nordowie: +30% łupów z karawan, wieśniaków i wsi; statki +10% szybciej na rzekach i wybrzeżach (opis w grze mówi 20%); -30% spójności armii lądowych prowadzonych przez Norda.
Role w drużynie dochodzą: Pierwszy oficer i Nawigator.
Karawany morskie (konwoje) tylko w portach: 30 000 lub 45 000 (uzbrojony). Standardowy konwój startuje z sakiewką 35 000.
Statki zdobyte sprzedasz za 30% ceny stoczni minus naprawy; korbita ok. 7 200, dromon ok. 36 000.`,["begin","money","nords"],"WS 1.3.7"],

/* ===== START I DRUŻYNA ===== */
["start-create","Tworzenie postaci i tryby","kreacja postaci piaskownica sandbox fabuła story wiek punkty atrybut skupienie trudność",
`(gra) Oba tryby zaczynają z 1 000 denarów i bez wojska.
Fabuła: 6 wyborów w kreacji (+6 atrybutów, +12 skupienia, +120 poziomów umiejętności), rodzina, samouczek, wątek Smoczego Sztandaru (20 lat gry).
Piaskownica: 5 wyborów, wiek startowy 20/30/40/50 (2 do 8 dodatkowego skupienia, 1 do 4 atrybutów), brak rodziny. Wiek 30 to +4 skupienia i +2 atrybuty względem 20.
Każdy wybór w tle: +1 atrybut, +1 skupienie, +10 do dwóch umiejętności.
Poziom trudności "Freebooter": żołnierze dostają połowę obrażeń, +2 miejsca rekrutacji u notabla, +10% prędkości, perswazja 10% łatwiejsza. "Warrior" to połowa tych premii. "Bannerlord" bez premii.
Punkt atrybutu co 4 poziomy, punkt skupienia co poziom. Reset perków u mistrza areny: koszt = poziom umiejętności x 40 denarów, umiejętność co najmniej 25.`,["begin"],"1.4.8 / 1.5.7"],

["skills-learn","Umiejętności: limit nauki i twardy limit","limit nauki learning limit skupienie focus atrybut 330 maksimum xp umiejętności",
`(gra) Limit nauki rośnie o 30 za każdy punkt skupienia i o 10 za każdy punkt atrybutu powyżej pierwszego. Za limitem nauka gwałtownie zwalnia.
Praktyczny maks bez modów to 330 przy 10 atrybucie i 5 skupienia.
(gracze) Twardy limit liczony przez graczy: skupienie x 40 + atrybut x 14 - 10 (pierwszy punkt atrybutu się nie liczy).
Co 25 poziomów umiejętności otwiera się wybór perka.
Wniosek: 5 skupienia w kluczowej umiejętności dowódcy (Przywództwo, Taktyka, Zarządca u kwatermistrza) daje więcej niż rozrzucanie po 1 do 2.`,["learn","learncap"],"stałe"],

["party-size","Wielkość drużyny i progi klanu","wielkość drużyny limit party size zarządca steward tier klanu sława renown kompani",
`(gra) Progi klanu (sława / limit drużyny / limit kompanów / co daje):
Tier 0: 0 / 20 / 3 / rekrutacja, turnieje.
Tier 1: 50 / 45 / 4 / oferty najemnicze przez kuriera (tylko na tym tierze), 2 warsztaty.
Tier 2: 150 / 70 / 5 / możesz zostać wasalem, 3 warsztaty.
Tier 3: 350 / 95 / 6 / druga drużyna klanu.
Tier 4: 900 / 120 / 7 / własne królestwo.
Tier 5: 2 350 / 145 / 8 / trzecia drużyna.
Tier 6: 6 150 / 170 / 9.
Limit kompanów = tier klanu + 3; perki "We Pledge our Swords" (Przywództwo) i "Camaraderie" (Urok) dają po +1.
Zarządca kwatermistrza (lub Twój, gdy brak kwatermistrza) dodaje 0,25 miejsca za punkt. Perki: Authority (Przywództwo 75), Horde Leader (Taktyka 75, +10), Imposing Stature (Atletyka 75), Leader of the Masses (Przywództwo 125, więcej za każde miasto). Polityka Noble Retinues: +40 dla klanów tier 5+. Royal Guard: +60 dla drużyny władcy.
Drużyna ponad limitem traci 25% nadmiaru dziennie.`,["begin","grystew","kingdom"],"1.4.8 / 1.5.7"],

["party-food","Jedzenie, morale, dezercja","jedzenie żywność morale głód dezercja różnorodność bydło konie",
`(gra) 20 ludzi zjada 1 jednostkę jedzenia dziennie; jeniec liczy się jak pół człowieka.
Różnorodność: 1 rodzaj jedzenia -2 morale, 2 rodzaje -1, 3 neutralnie, każdy kolejny dodaje morale.
Głód: -30 morale od razu, potem -5 za każdy kolejny dzień. Dezercja zaczyna się przy morale 10 lub mniej, głównie wśród niskich tierów.
Bydło, owce i świnie to jedzenie, zabijane automatycznie przy braku. Konie juczne i wierzchowce tylko ręcznie.
Morale po bitwie: start 50, +20 za zwycięstwo, -20 za porażkę.
Perk Master of Planning (Zarządca 250): -40% jedzenia w obozie oblężniczym.`,["begin"],"1.4.8"],

["party-speed","Prędkość na mapie","prędkość mapa konie wierzchowce juczne przeciążenie las noc szybkość",
`(gra) Jeden koń wierzchowy na piechura: +15% prędkości. Cała drużyna konna: +30%. Deszcz obniża te premie o 30%.
Jedno dodatkowe zwierzę na człowieka (jucznie, bydło, zapasowy koń) jest bez kary; każde kolejne na człowieka to -30%, maks -80%.
Koń juczny niesie 100. Przeciążenie: -40% za każde 100% ponad udźwig.
Większa drużyna jest wolniejsza, las i brody -30%, noc -25%. Łatka 1.5: wszystkie drużyny +15%.
Battania: kara za las o połowę mniejsza. Aserajowie: brak spowolnienia na pustyni.`,["begin","p15"],"1.4.8 / 1.5.7"],

["recruit","Rekrutacja i żołd","rekrutacja notable miejsca relacja żołd wages awans koszt najemnicy karczma",
`(gra) Notable ma do 6 miejsc rekrutacji. Na poziomie realistycznym przy neutralnej relacji otwarte jest tylko pierwsze. Kolejne przy relacji 5, 10, 20, 40, 60. Osady własnego królestwa +1 miejsce, królestwa w wojnie z Tobą -1. Od 1.4.5 nie rekrutujesz ani nie handlujesz z wioskami wroga.
Rekrut tier 1: 20 denarów, 2 dziennie.
Żołd dzienny wg tieru: T1 2, T2 3, T3 5, T4 8, T5 12, T6 17. Konni bez dopłaty. Najemnicy z karczmy x1,5.
Awans: 15 denarów (T1 na T2), 25 (T2 na T3). Kawaleria wymaga konia w ekwipunku. XP liczy się na całą grupę danego typu; nadmiar ponad potrzebny do awansu wszystkich przepada.
Rekruci od właścicieli ziemskich z wiosek przy zamkach są szlachtą (tier 2).
Przykład: 42 ludzi T6 = 714 dziennie (z karczmy 1 050); 42 na T4 = 336; na T5 = 504.
Zniżki: Content Trades -50% w osadach; Frugal (Zarządca 25) -5%; Efficient Campaigner -25% w armii; Stiff Upper Lip -20% garnizony zamków; właściciel kultury Cesarstwa -20% garnizony.`,["begin","money"],"1.4.8"],

["culture","Premie kultur","kultura premia cesarstwo wlandia sturgia battania aserajowie huzajczycy nordowie bonus",
`(gra) Wlandia: +5% sławy z bitew, +15% dochodu najemniczego; wezwanie armii +20% droższe.
Aserajowie: karawany i konwoje -30%, żołd +5%, brak spowolnienia na pustyni.
Cesarstwo: +25% dziennych wpływów, gdy służysz w cudzej armii; garnizony -20% żołdu.
Huzajczycy: rekrutacja i awans konnych -10%, -20% podatku z własnych miast.
Battania: kara za las o połowę, +15% zasięgu wzroku w lesie.
Sturgia: +10% zboża we wsiach, -50% wpływów za zebranie armii. Tańsza piechota usunięta w 1.3.
Nordowie: +30% łupów z karawan i wsi, szybsze statki, -30% spójności armii lądowej.`,["begin"],"1.4.8"],

["early-plan","Plan na wczesną grę i typowe błędy","początek start plan błędy turnieje najemnik wasal pierwsze kroki",
`(gracze, poradnik) 1. Kup zboże i 2 do 3 inne rodzaje jedzenia. 2. Zwerbuj ok. 10 ludzi. 3. Daj piechocie konie (+15% prędkości). 4. Bij łupieżców tylko z przewagą, w szyku. 5. Awansuj od razu pełne paski XP. 6. Najpierw lekarz z Medycyną, potem kwatermistrz z Zarządcą. 7. Turnieje i zadania do 50 sławy. 8. Kontrakt najemniczy na tier 1, wasal na tier 2.
Błędy: Smoczy Sztandar ogłoszony za wcześnie; czekanie na kuriera po tierze 2 (wtedy idź do władcy osobiście); brak lekarza; jeden rodzaj jedzenia; za dużo zwierząt; warsztaty w królestwach, z którymi możesz walczyć; egzekucje lordów; brak ręcznego zapisu przed ryzykowną bitwą.
Turnieje: zakład maks 150 na rundę (300 z Deep Pockets), wypłata tylko za wygranie całego turnieju. Wygrana: 3 sławy i nagroda warta 1 600 do 5 000.`,["begin","money"],"1.4.8"],

/* ===== WALKA ===== */
["combat-armor","Pancerz: jak redukuje obrażenia","pancerz armor obrażenia cięcie kłucie obuch blunt cut pierce redukcja wzór",
`(gra) Wzór vanilla: obrażenia = (surowe - pancerz x soak) x (1 - pancerz/100 x redukcja).
Cięcie: soak 0,5, redukcja 1,0. Kłucie: soak 0,33, redukcja 0,65. Obuch: soak 0,25, redukcja 0,65.
Wniosek: przeciw ciężkiej zbroi kłucie i obuch tracą proporcjonalnie mniej niż cięcie; cięcie jest świetne na lekko opancerzonych.
Obrażenia bazowe (bez broni): miecze cięcie 40 + umiejętność x 0,53 + cięcie broni; topór jednoręczny 60 + umiejętność x 0,4; broń dwuręczna x1,3. Kłucie mieczem 50 + umiejętność x 0,46 + (kłucie broni x 10 x 0,2).
(gracze) Pancerz 50 i 120 nie różnią się tak bardzo, jak sugeruje liczba, bo część obrażeń zawsze przechodzi. Dlatego elita i tak ginie od strzał w masie.`,["armor","dmg"],"stałe"],

["combat-wounds","Ranni, zabici i lekarz","ranni zabici śmierć medycyna lekarz chirurg przeżycie obuch blunt",
`(gra) Obuch nigdy nie zabija: żołnierz trafiony obuchem jest tylko ranny.
Szansa przeżycia po powaleniu cięciem lub kłuciem: 1 - 1/(1 + 0,03 x c + 0,01 x s), gdzie s to Medycyna lekarza, a c to czynnik tieru żołnierza.
W praktyce: bez lekarza przeżywa ok. 1 na 10; Medycyna 60 ok. 4 na 10; Medycyna 100 trochę ponad 5 na 10. Żołnierze tier 3 przeżywają w 24% bez lekarza.
Wniosek: dobry lekarz to najtańszy sposób na zachowanie elity. Lekarz musi być w drużynie.`,["surgery","begin"],"stałe"],

["combat-auto","Automatyczna bitwa (wyślij wojsko)","automatyczna bitwa auto resolve symulacja taktyka straty elita",
`(gra) Silnik losuje żołnierza z jednej strony i zadaje jego "moc" jako obrażenia losowemu żołnierzowi drugiej strony. Różnica mocy między tierami jest mała, więc w symulacji elita ginie od rekrutów dużo częściej niż w prawdziwej walce.
Taktyka dodaje 0,1% na punkt do Twojej strony (10% przy 100). Premia jazdy w symulacji usunięta w 1.4.5.
W oblężeniu symulacja mocno liczy machiny i mury.
(gracze) Automatu używaj na bandytów i oczywiste przewagi. Każdą bitwę z elitą lub na styk prowadź sam. Taktykę trenuje się właśnie automatem przy podobnych siłach.`,["autocalc","begin","autores"],"stałe"],

["combat-field","Bitwa w polu: taktyka, która działa","taktyka bitwa pole formacje ściana tarcz wzgórze łucznicy jazda flanka kawaleria",
`(gracze, sprawdzone) Klasyka: piechota w ścianie tarcz na wzniesieniu, łucznicy za nią lub na skrzydle na wyższym terenie, jazda w odwodzie na flance.
Pozwól AI atakować pod górę pod ostrzał. Gdy wróg zwiąże się z piechotą, jazda uderza w plecy lub w jego łuczników.
Na huzajskich konnych łuczników: nie goń ich piechotą. Ciasny szyk, tarcze, własni łucznicy; jazda goni dopiero, gdy skończą im się strzały lub gdy podjadą blisko.
Piechota w kwadracie zatrzymuje szarżę. Jazda zjada łuczników najszybciej.
AI źle radzi sobie z konnymi łucznikami, stąd siła Huzajczyków w kampanii.`,["formation","tactics"],"stałe"],

/* ===== OBLĘŻENIA ===== */
["siege-reserve","Oblężenie: trik z rezerwą machin (cztery trebusze)","rezerwa reserve trebusz chowanie machin move to reserve cztery wystawić naraz",
`(gracze, sprawdzone) Machiny obrońców biorą na cel każdą Twoją nową machinę, gdy tylko się zbuduje. Trik: zakolejkuj wszystkie machiny, a każdą gotową od razu (z zatrzymanym czasem) przenieś do rezerwy (Move to Reserve). Machina w rezerwie nie strzela, ale też nie dostaje. Gdy masz komplet, wystaw wszystkie naraz na wolne miejsca: przytłaczają artylerię obrońców, zanim ta zniszczy je po kolei.
Szczegóły: nie da się schować machiny w budowie. Jeśli schowasz jedną i klikniesz budowę tej samej, gra wystawi tę z rezerwy, więc kolejkuj wszystko wcześniej.
Nie zaczynaj od katapulty: trebusz ma więcej wytrzymałości, a dwa trebusze dzielą ostrzał na pół. Po wyłomach najbardziej uszkodzoną machinę chowaj do rezerwy.
Taranu i wież nie da się uszkodzić na mapie, tylko w bitwie.
Minus: oblężenie trwa dłużej, a to zjada jedzenie i spójność armii oraz daje czas na odsiecz.`,["reserve","reserve2","howsiege","engmap"],"stałe"],

["siege-engines","Oblężenie: machiny i perki Inżynierii","machiny oblężnicze trebusz onager katapulta balista taran wieża ogniowe inżynieria perki inżynier",
`(gra) Balista i onager mają wersje ogniowe: dłużej się budują, mniej amunicji, ale dużo mocniej niszczą machiny wroga; onager ogniowy rani też obszarowo. Trebusz bije z bezpiecznej odległości i burzy blanki i mury.
Perki Inżynierii (muszą być u Inżyniera w drużynie albo u gubernatora): Scaffolds +10% budowy taranu i wież; Torsion Engines +10% budowy machin miotających; trafienia w machiny podczas ostrzału -25%; +10% wytrzymałości machin miotających; Siege Engineer i Stonecutters (150) pozwalają budować wersje ogniowe; Battlements (175) +1 gotowa balista w obozie; Camp Building (175) armia oblegająca traci 50% mniej spójności; -20% strat od bombardowania; +33 wytrzymałości taranu i wież.
(gracze) Kolejność: najpierw zniszcz machiny obrońców, potem dwa wyłomy, taran, wieże na końcu.`,["devblog","engperks","engperks2","engines"],"stałe"],

["siege-assault","Oblężenie: sam szturm","szturm mury wyłom drabiny brama taran piechota łucznicy odwód",
`(gracze) Z działającymi machinami obrońców szturm to rzeź. Najpierw je zniszcz.
Dwa wyłomy zmieniają szturm prawie w bitwę w polu: przez dziury wchodzi cała armia naraz.
Taran ściąga obrońców pod bramę, wtedy drabiny i wieże mają łatwiej.
Piechota z tarczami przodem, łucznicy na wzniesieniu poza zasięgiem łuków z murów, odwód dorzucaj tam, gdzie się przebijasz.
Na murach liczą się zabójstwa: gracz strzelający w głowy obrońców wyraźnie podnosi skuteczność armii.
Trik: zajmij odcinek nad bramą, zejdź i otwórz ją od środka.
Gdy obrońców jest mało lub to niskie tiery, a machiny są zniszczone, wystarczą drabiny.`,["engines","ladders","siege","siegeatk"],"stałe"],

["siege-defense","Obrona miasta lub zamku","obrona garnizon mury machiny obronne głód racjonowanie odsiecz wypad",
`(gracze) Mury robią robotę: mniejszy garnizon wytrzyma dużo większą armię. Nie wychodź z miasta bez potrzeby.
Machiny na murach niszczą wieże i taran. Najlepszych strzelców ustaw naprzeciw drabin i wież, piechotę w odwodzie przy bramie. Bij, gdy wchodzą po drabinach: wtedy są najbardziej bezbronni.
(gra) Perk Battlements gubernatora +1 gotowa katapulta i +100 miejsca w spichlerzu; Siege Engineer +30% wytrzymałości machin obronnych.
AI oblegające bywa ślepe na jedzenie i spójność: potrafi budować katapulty, aż mu się skończy, zamiast szturmować. Odsiecz z zewnątrz rozbija oblężenie najtaniej.`,["siegedef","ladderkill","engperks","aistall"],"stałe"],

["siege-starve","Oblężenie: głód, czas i alternatywy","głód zagłodzenie czas oblężenia spójność odsiecz konni łucznicy blokada",
`(gracze) Zamiast szturmu możesz zagłodzić miasto: garnizon słabnie, gdy kończy się jedzenie. Trwa to długo i zjada spójność armii.
Wariant graczy: oblężenie trzyma sama jazda, a gdy przyjdzie odsiecz, możesz odjechać albo rozbić odsiecz w polu.
(model apki) Doradca bitwy przyjmuje, że głód odbiera garnizonowi ok. 3,5% siły dziennie (najniżej 45%) i milicji 1,5% (najniżej 70%). To przybliżenie, nie wzór z gry.
(gra) Ostrożny charakter wydłuża przygotowanie oblężenia o 30%/60%, Wyrachowany przyspiesza budowę machin o 10%/20%.`,["starveha","howsiege","p15"],"stałe"],

/* ===== ARMIE ===== */
["army-cost","Armie: koszt zebrania i spójność","armia wezwanie spójność cohesion wpływy koszt lordowie rozpad",
`(gra) Własne drużyny klanu wzywasz za darmo. Inni lordowie kosztują więcej, im dalej są, im gorsza relacja, im silniejsza drużyna i im bardziej pusta względem limitu. Przykład: 12, 38 i 143 wpływów za trzech lordów.
Zniżki: Inspiring Leader -20% i Call To Arms -15% (dodają się, -35%), premia kulturowa mnoży: Sturgia -50% plus Inspiring Leader daje -60%. Wlandia +20%. Royal Commissions (władca) -30%.
Spójność: +10 kosztuje 10% kosztu wezwania lordów już w armii; Twoje drużyny nie zwiększają kosztu. Dla 3 do 4 przyjaznych lordów to poniżej 10, dla dziesięciu 25 do 40.
Więcej drużyn w armii to szybszy spadek spójności; przy zerze armia się rozpada. Camp Building: -50% utraty spójności podczas oblężenia. Nordowie: -30% spójności armii lądowej.
Wyjście z armii darmowe; porzucenie w czasie bitwy, oblężenia lub rajdu 2; rozwiązanie cudzej armii 30 (15 jako władca) plus relacje.`,["influence","cohesion","engperks"],"1.4.8"],

/* ===== WPŁYWY ===== */
["infl-earn","Wpływy: skąd je brać","wpływy influence zdobywanie bitwy jeńcy darowizna polityki władca",
`(gra) Wpływy są wspólne dla klanu. Bitwy, darowizny, zadania i turnieje wymagają roli w królestwie. Niezależny klan ma tylko Immortal Charm (+5 dziennie, Urok 275), stronników wśród notabli i sąd w swoim mieście.
Bitwa: wartość rośnie z siłą pokonanego wroga mniej więcej do potęgi 0,75; udział partii = udział w trafieniach x udział zabitych i rannych wrogów. Przykłady: 60 T3 na 30 łupieżców ok. 5; 80 T4 na lorda ze 100 T3 ok. 23; 350 na 300 z armią ok. 49 dla strony.
Mnożniki: Warlord (Urok) +30% (+15% na morzu), Military Coronae +20%, Pre Battle Maneuvers (Taktyka) +25%. Razem prawie x2.
Szturm na mury wart ok. 2x tyle co bitwa w polu. Zdobycie: miasto 30, zamek 10, +10 za wieś; Besieged +50%.
Służba w cudzej armii: ok. 0,5 dziennie za 60-osobową drużynę, ok. 1,8 za 200 weteranów.
Jeńcy oddani w cudzym zamku lub mieście królestwa: łupieżca 0,38, T2 0,54, T3 0,73, T5 1,75, T6 1,89; lord pomniejszy 4, głowa klanu 6,5, władca 9,8. 30 łupieżców ok. 11. W swoich osadach i u sojuszników nic.
Codziennie: król +3, Sacred Majesty +3, Senat +0,5, Feudal Inheritance +0,1 za osadę, Serfdom +0,2 za wieś, Bailiffs +1 za miasto z bezpieczeństwem ponad 60, sąd 0,2/0,5/1.`,["influence"],"1.4.8"],

["infl-spend","Wpływy: wydatki, głosy, wpływy ujemne","wpływy wydatki głosowanie overrule propozycja wojna pokój polityka ujemne",
`(gra) Propozycje płacone z góry, nawet gdy przegrają: wojna 200, pokój i polityka 100, wydalenie klanu 200, aneksja lenna 200, sojusz i umowa handlowa 200. Firebrand -25%.
Głos: 20, 60 lub 150 (lenna 20, 60, 100). Pełny koszt przy wygranej, połowa przy przegranej. Wstrzymanie się darmowe. Flexible Ethics -30%.
Władca nadpisujący większość: do 3 punktów różnicy ok. 150, 9 punktów ok. 570 (polityka) lub 380 (lenno); Royal Privilege x0,8.
Wsparcie innego klanu: 50 wpływów, +12 dla nich, +1 relacji.
Wpływy ujemne: nie zapłacisz za głosy, propozycje ani armie. Wrogie akcje wobec królestwa w pokoju: wymuszenie dóbr -50, rekrutów -100, rajd lub atak na karawanę ok. -300.
Utrata miasta -50, zamku -25. Wyjście z królestwa zeruje wpływy.
Najemnik: co dzień piąta część zapasu zamienia się w denary po stawce kontraktu (10 do 800 za punkt).`,["influence"],"1.4.8"],

["infl-fast","Wpływy: najszybsze sposoby","szybkie wpływy farma salvage jeńcy dromon strategia",
`(poradnik) Wcześnie: bandyci i oddawanie jeńców; pokonanie lorda równej siły i oddanie ludzi oraz lorda (ok. 65 do 70 za walkę); zadania Raid i Scout (+20/+10).
Późno: Salvage (War Sails, Bosman 225) daje 1% wytrzymałości kadłuba: lekka galera 100, dromon ok. 600; duże bitwy z dużym udziałem; zdobycia miast; władca ok. 11 dziennie.
Wasal: wstrzymuj się w głosach, które Cię nie obchodzą; trzymaj ok. 100 na głosowanie o lenno.
Władca: miej zapas 150 do 570 na nadpisanie głosu.`,["influence"],"1.4.8"],

/* ===== LOJALNOŚĆ ===== */
["loy-thresholds","Lojalność: progi i co oznaczają","lojalność progi 25 35 50 75 podatek budowa bunt buntowniczość",
`(gra, 1.5.7) Lojalność 0 do 100 liczona raz dziennie jako suma linii z podpowiedzi.
Do 25: brak podatku (przy równo 25 połowa), budowa staje, dobrobyt -1 dziennie, miasto może się zbuntować.
Ponad 25 do 35: podatek -50% do -30%, budowa -50% do -30%, buntownicze (milicja nie broni, warsztaty nic nie produkują).
Ponad 35 do 50: podatek do -30%, budowa -30% do 0.
50 do 75: normalnie. 75 do 100: podatek do +20%, budowa do 20% szybciej, dobrobyt +0,5 przy rosnącym jedzeniu.
Zamki płacą i budują tak samo, ale nigdy się nie buntują.
Po zdobyciu: Okaż litość zachowuje lojalność, Plądrowanie -15, Spustoszenie -30.`,["loyalty"],"1.5.7"],

["loy-math","Lojalność: matematyka punktu równowagi","lojalność dryf punkt równowagi resting point wzór kultura właściciela",
`(gra) Dryf ciągnie każdą osadę do 50 o 10% różnicy dziennie (+5 przy 0, -5 przy 100).
Punkt równowagi = 50 + 10 x (suma pozostałych linii). +0,1 dziennie podnosi go o 1. Połowa drogi w ok. tydzień, 90% w ok. 3 tygodnie.
Kultura właściciela inna niż osady: -3 dziennie, bez końca. Miasto innej kultury bez niczego innego spada do 20 (przy bezpieczeństwie 60) albo 7,5 (przy 30).
Bezpieczeństwo: 0 przy 60, -2,5 przy 0, +1 przy 100. Garnizon daje +0,0075 bezpieczeństwa dziennie na punkt siły (łucznicy +30%, jazda -10%); ok. +1 dziennie za 100 T3.
Utrzymanie 75 wymaga +2,5 dziennie z innych linii.`,["loyalty"],"1.5.7"],

["loy-fix","Lojalność: co działa najlepiej","lojalność naprawa festyn gubernator perki polityki forgiveness tribunes sąd parada",
`(poradnik, ranking) S: Festiwal i igrzyska +3 dziennie, gdy nic się nie buduje (w zamkach usunięty w 1.3). Forgiveness of Debts (+2, miasta i zamki) plus Tribunes of the People (+1, miasta) kasują -3 za kulturę. Okaż litość przy zdobyciu.
A: perki gubernatora do +4,5: Heroic Leader (Przywództwo 75) +1, Physician of People (Medycyna 200) +1, Durable (Atletyka 175) +1, Discipline (Łuk 150) +1, Well Strapped (Jazda 50) +0,5. Działają tylko, gdy gubernator jest w środku. Parada (Urok 225) +5 dziennie na bohatera w Twojej osadzie.
B: bezpieczeństwo ponad 60, stronnicy wśród notabli +0,5 każdy, sąd do +1, jedzenie ponad zero.
Pomiń: gubernator tej samej kultury (usunięte w 1.5.0), Citizenship -0,5 przy obcej kulturze, Debasement -1, Hunting Rights -0,2.
Plan po zdobyciu miasta (5 000 dobrobytu, 45 lojalności, 30 bezpieczeństwa): bez nic buntownicze w 3. dniu, bunt możliwy w 8. Z Forgiveness i Tribunes równowaga 77,5, dochodzi do 75 w 25 dni. Garnizon ok. 110 T3 na pierwszy miesiąc.`,["loyalty"],"1.5.7"],

["loy-revolt","Bunt miasta: dokładne zasady","bunt rebelia milicja garnizon 1.4 rzut 25% rebelianci",
`(gra, 1.5.7) Buntują się tylko miasta. Buntownicze przy lojalności 35 lub mniej, bunt możliwy przy 25 lub mniej.
Warunek siły: milicja musi mieć co najmniej 1,4 x (zdrowy garnizon + lordowie królestwa w środku). Wagi: T1 0,66, T3 1,30, T5 2,1, T6 2,56; bohaterowie x1,5.
Rzut 25% dziennie (Okrutny gubernator 20%, Sadystyczny 15%; Niepokoje 50%). Skumulowane: 58% w 3 dni, 87% w tydzień.
Brak rzutu, gdy jesteś w mieście (otwarte menu się liczy) albo trwa tam bitwa lub oblężenie.
100 żołnierzy T3 powstrzymuje do 181 milicji. Milicja rośnie +2 + 1 na 1 000 dobrobytu dziennie i traci 2,5% siebie.
Po buncie: klan "[Miasto] rebels" tier 3, trzy drużyny, połowa Twojego garnizonu w niewoli, reszta stracona. Po 30 dniach staje się zwykłym klanem.`,["loyalty"],"1.5.7"],

/* ===== PIENIĄDZE ===== */
["money-stages","Pieniądze: etapy i źródła","pieniądze zarabianie denary etapy karawana warsztat turnieje kryjówki jeńcy",
`(poradnik) Etap 1 (do 10 000): turnieje, nocne rajdy na kryjówki (Sneak in daje skrzynię towarów), sprzedaż jeńców, zadania. Etap 2: pierwsza karawana (15 000 plus kompan), handel, kontrakt najemniczy. Etap 3: warsztaty w bezpiecznych miastach, konwoje War Sails. Etap 4: miasta, okupy za lordów, polityki władcy.
Jeńcy u pośrednika: 25% kosztu rekruta, od 5 (łupieżca) do 275 (T6 jazda); Manhunter +20%. Jako najemnik lepiej ich oddać za wpływy, które zamienią się w denary.
Okup za lorda: oferta rodziny rośnie co tydzień, do ok. 3,4x ceny pośrednika po 5 do 9 tygodniach. Ransom Broker (Łotrostwo 200) +25%.
Podatek z miasta 0,35 x dobrobyt dziennie (ok. 595 do 1 960), zamek ok. 147 do 385.
Przegrana bitwa: -5% złota (maks 10 000).`,["money"],"1.4.8"],

["money-caravan","Karawany i warsztaty: wzory","karawana warsztat wzór dochód kapitał handel zysk",
`(gra) Karawana: 15 000 (20 do 29 strażników) lub 22 500 (lepsza ochrona); prowadzi kompan lub członek rodziny. Wypłaca 10% dziennie z kapitału ponad 10 000; poniżej 5 000 klan dopłaca. Pierwszy tydzień zwykle na minusie. W kraju w wojnie karawany giną masowo.
Warsztat: koszt = sprzęt + 4 x dobrobyt + 2 000. Wypłaca 20% dziennie z kapitału ponad 10 000. Limit: tier klanu + 1. Staje przy wojnie z właścicielem miasta (także cudzej, gdy jesteś najemnikiem) i przy lojalności 35 lub mniej. Wyrachowany +10%/+20%.
Handel: zysk dopiero, gdy sprzedaż jest ok. 12% powyżej zakupu (10% przy Handlu 100). Kupno i sprzedaż w tym samym mieście traci ok. 11%. Towary wahają się 0,1x do 10x wartości. Sprzedawaj w miastach, nie we wsiach.`,["money"],"1.4.8"],

/* ===== KRÓLESTWO ===== */
["king-create","Własne królestwo: wymagania i droga","królestwo założenie wymagania tier 4 gubernator 100 ludzi kultura proklamacja",
`(gra) Tier klanu 4 (900 sławy), co najmniej jedno miasto lub zamek (wsie się nie liczą), 100 zdrowych ludzi w garnizonach i drużynach klanu, niezależność (nie wasal i nie najemnik), gubernator będący kompanem lub dorosłym krewnym. Bez kosztu w złocie i wpływach.
Kultura królestwa ustala startowe prawa (np. Wlandia: Feudal Inheritance i Castle Charters; Battania: Cantons i Lawspeakers).
Drogi: (1) niezależny klan bierze lenno sam (najczystsza; AI nie wybiera klanu bez królestwa na cel wojny); (2) wasal odchodzi z lennami przyciskiem w ekranie królestwa: zachowanie lenn to wojna ze starym królestwem i -40 relacji z każdym jego lordem; oddanie lenn to pokój i -20.
(gracze) Popularna ścieżka: wasal, zbierz lenna, odejdź z nimi i wykup pokój złotem, zanim zostaniesz królem (potem pokój to już propozycja za 100 wpływów).
Zapas złota: komfortowo 3 do 5 mln, nie schodź dużo poniżej 1 mln.`,["kingdom","money"],"1.4.8 / 1.5.7"],

["king-policies","Królestwo: polityki na start","polityki prawa sacred majesty royal guard forgiveness tribunes lawspeakers senat",
`(gra) Póki jesteś jedynym klanem, polityki przechodzą od razu bez głosowania (100 wpływów każda). Zwerbowanie lorda, klanu kompana lub najemników kończy to okno, więc najpierw polityki.
Sacred Majesty: +3 wpływów dziennie dla Ciebie, -0,5 dla innych klanów. Royal Guard: +60 ludzi w Twojej drużynie, wasale -0,2 dziennie. Forgiveness of Debts: +2 lojalności w miastach i zamkach, warsztaty -5%. Tribunes of the People: +1 w miastach, podatek -5%. Castle Charters: budowa w zamkach x0,8. Noble Retinues: +40 miejsca dla klanów tier 5+, -1 wpływów. Trial by Jury: unikaj na start (-1 wpływów dziennie dla Ciebie).
Lawspeakers: +1 dziennie, gdy Urok przywódcy klanu ponad 100, inaczej -1. Senat, Council of the Commons i Feudal Inheritance zostaw, bo płacą wpływami.`,["kingdom","influence"],"1.4.8"],

["king-recruit","Werbowanie lordów do królestwa","werbowanie lordów przekonanie perswazja barter cena lord dołączenie klan",
`(gra) Rozmawiasz z głową klanu w innym królestwie, schodzisz na temat jego władcy, wygrywasz perswazję. Dołącza od razu albo prosi o wsparcie, wtedy dopłacasz w barterze.
Cena spada, gdy lord: nie ma miast ani zamków; ma niski Honor (przebiegli łatwiejsi); nie lubi swojego króla; ma dobre relacje z Tobą; dzieli kulturę Twojego królestwa. Małe królestwa są atrakcyjniejsze, ale premia maleje z każdym klanem.
Klan panujący zawsze odmawia. Imposing Stature (Atletyka) mnoży szansę perswazji x1,3. Lordowie z królestwa w wojnie z Tobą przychodzą z lennami; z królestwa w pokoju zostawiają je.
Pojmana głowa klanu: "dołącz do nas i bądź wolny"; jeniec w Twojej drużynie lub osadzie. Nie działa na klan władcy.
Łatka 1.5: po nieudanej perswazji czekasz porę roku, nie rok. Waśń rodowa blokuje przejście.
Klan kompana: 20 000 denarów, 500 wpływów i jedno miasto lub zamek; nowy klan bierze kulturę oddanego lenna.`,["kingdom","p15","plclans"],"1.4.8 / 1.5.7"],

["king-war","Wojna i pokój z AI, trybut","wojna pokój trybut AI wypowiedzenie granica 20 dni propozycja pokoju",
`(gra) Po założeniu królestwa nie ma okresu ochronnego. Królestwa AI z osadą graniczącą z Twoją głosują o wojnę chętniej, gdy jesteś słaby, masz bogate lenna, prowadzą mało innych wojen, Twoje lenna są ich kultury, a ich lordowie Cię nie lubią. Dobre relacje nie chronią, liczą się tylko złe.
Od 1.4.5 królestwo bez granicznego miasta lub zamku nie może Ci wypowiedzieć wojny. Po pokoju muszą odczekać co najmniej 20 dni.
Pokój jako król: propozycja 100 wpływów, może zostać odrzucona. Gdy wróg mocno prowadzi w wojnie młodszej niż 150 dni, jest zablokowana.
Trybut: strona przegrywająca płaci dziennie do 15% z 35% dobrobytu swoich lenn, przez 100 dni.
Abdykacja możliwa poza bitwą i oblężeniem. Królestwo gracza nie znika po utracie wszystkich lenn.`,["kingdom"],"1.4.8"],

/* ===== STRATEGIE GRACZY ===== */
["strat-players","Strategie graczy z forów","strategia gracze reddit steam opinie meta snowball ekspansja",
`(gracze) Najczęstsze sprawdzone ścieżki:
1. Wasal, zdobywaj lenna w głosowaniach (klan bez miasta i klan, który zdobył, dostają duży bonus), potem odejdź z lennami i wykup pokój złotem.
2. Dołączaj do armii i broń oblężeń: tani poziom, wpływy i sława.
3. Trebusze w rezerwie i wystawienie czterech naraz zanim ruszysz na mury.
4. Wypuszczaj lordów zamiast ich ścinać; po 1.5 egzekucje to jeszcze waśnie.
5. Lekarz z wysoką Medycyną i ręczne prowadzenie bitew z elitą; automat tylko na bandytów.
6. Pierwsze lenno: miasto z zamkiem obok, w rogu mapy z 1 lub 2 sąsiadami, w kulturze Twojego klanu.
7. Garnizon tańszy z polityką i kulturą Cesarstwa, perki gubernatora i Festiwal, by trzymać lojalność.
(gracze, krytyka) Automatyczna bitwa zabija elitę zbyt łatwo; AI oblegające potrafi stać pod murami, aż padnie z głodu.`,["kingdom","engines","reserve","autores","aistall"],"stałe"],

["strat-mastermind","Mastermind: jak liczyć przewagę","matematyka algorytm przewaga liczenie wzór optymalizacja tier moc strategia",
`(model apki) Doradca bitwy liczy moc żołnierza jako 1,4 do potęgi (tier - 1): T1 = 1, T3 ok. 1,96, T4 ok. 2,74, T6 ok. 5,38. Średni tier armii = 2,5 + 2,7 x udział elity. Szansa wygranej to sigmoid stosunku sił R: 1 / (1 + R^-3) w oblężeniach i R^-3,2 w polu. Mury mnożą obronę: 1,45 / 1,7 / 1,95 wg poziomu, wyłomy obniżają ten mnożnik. To moje przybliżenie oparte na mechanice i doświadczeniach graczy, nie wzór TaleWorlds.
(gra) Prawdziwe fakty, na których warto liczyć: żołd rośnie szybciej niż moc w automacie (T6 kosztuje 8,5x T1), za to w ręcznej bitwie elita z pancerzem i umiejętnościami jest wielokrotnie skuteczniejsza. Dlatego elita opłaca się w bitwach prowadzonych osobiście, a tania masa w garnizonach i automacie.
Wpływy z bitwy rosną z siłą wroga mniej więcej do potęgi 0,75: jedna duża bitwa daje mniej niż dwie połówki, ale udział w trafieniach decyduje, ile dostaje Twoja drużyna.`,["influence","begin","autocalc"],"model apki"]
];
