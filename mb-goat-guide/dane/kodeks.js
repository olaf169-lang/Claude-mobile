/* M&B Goat Guide: Kodeks: źródła, poziomy, porady, kampania */
// Źródła
const SRC = {
 money:["GamerOfPassion: zarabianie, v1.4.8","https://gamerofpassion.com/bannerlord-make-money/"],
 workshops:["GamerOfPassion: warsztaty, v1.4.8","https://gamerofpassion.com/bannerlord-best-workshops/"],
 begin:["GamerOfPassion: poradnik na start, v1.4.8","https://gamerofpassion.com/bannerlord-beginner-guide/"],
 kingdom:["GamerOfPassion: własne królestwo, v1.4.8","https://gamerofpassion.com/bannerlord-create-kingdom/"],
 influence:["GamerOfPassion: wpływy","https://gamerofpassion.com/bannerlord-influence/"],
 loyalty:["GamerOfPassion: lojalność","https://gamerofpassion.com/bannerlord-loyalty/"],
 companions:["GamerOfPassion: kompani","https://gamerofpassion.com/bannerlord-companions/"],
 ships:["GamerOfPassion: statki War Sails","https://gamerofpassion.com/bannerlord-best-ships/"],
 execute:["GamerOfPassion: egzekucje i waśnie","https://gamerofpassion.com/bannerlord-execute-lords/"],
 smith:["GamerOfPassion: kowalstwo","https://gamerofpassion.com/bannerlord-smithing-guide/"],
 tier:["GamerOfPassion: ranking jednostek","https://gamerofpassion.com/bannerlord-troop-tier-list/"],
 nords:["GamerOfPassion: Nordowie","https://gamerofpassion.com/bannerlord-nords/"],
 p15:["AccountShark: łatka 1.5.7 i War Sails 1.3.7","https://accountshark.net/blog/mount-and-blade-2-bannerlord-v1-5-7-war-sails-v1-3-7-update-ferries-advanced-starting-options-mooring-blood-feuds"],
 wstips:["SlytherGames: 10 porad War Sails","https://www.slythergames.com/2026/01/03/10-best-mount-blade-2-war-sails-tips-and-tricks/"],
 naval:["CalradiaWar: walka na morzu","https://calradiawar.com/handbook/bannerlord-war-sails-naval-guide"],
 plclans:["Steam PL: werbowanie klanów","https://steamcommunity.com/app/261550/discussions/12/7204142836192097655"],
 pltribute:["Steam PL: lordowie bez wojska","https://steamcommunity.com/app/261550/discussions/12/4700161359556303946"],
 formation:["Steam: formacje i proporcje","https://steamcommunity.com/app/261550/discussions/0/764058696424760568/"],
 siegeatk:["Steam: szturm na mury","https://steamcommunity.com/app/261550/discussions/0/3824159062917769816"],
 siegedef:["SevenSwords: obrona w oblężeniu","https://sevenswords.uk/fight-sieges-defender-bannerlord/"],
 siege:["SevenSwords: oblężenia","https://sevenswords.uk/bannerlord-siege-guide/"],
 tactics:["GamerGuides: taktyka bitewna","https://gamerguides.com/mount-and-blade-ii-bannerlord/guide/introduction/useful-gameplay-tips/tactics"],
 console:["MP1st: łatki na konsole","https://mp1st.com/title-updates-and-patches/mount-blade-2-bannerlord-new-update-1-37-1-038"],
 trees:["Bloxodes: drzewka jednostek","https://bloxodes.com/wiki/bannerlord/troops"]
};

const LEVELS = [
 {n:"Giermek", d:"Podstawy, które musisz znać"},
 {n:"Rycerz", d:"Średni poziom, gdy masz już drużynę"},
 {n:"Baron", d:"Zaawansowane, gdy masz lenna"},
 {n:"Mistrz", d:"Liczby i mechanika dla freaków"}
];

// [tytuł, treść, źródło, wersja]
const TOPICS = [
{ id:"start", name:"Pierwsze kroki", sub:"Jedzenie, morale, werbunek, klan", tint:"--azure", icon:"helm",
 levels:[
 [
  ["Trzy rzeczy w pierwszym mieście","Kup co najmniej trzy rodzaje jedzenia, zwerbuj u notabli około 10 ludzi i atakuj bandytów tylko wtedy, gdy masz ich więcej niż oni. Pełne paski doświadczenia od razu zamieniaj na awanse.","begin","1.4.8"],
  ["Jedzenie i morale","Drużyna zjada 1 jedzenie dziennie na 20 ludzi, jeńcy liczą się za pół. Jeden rodzaj jedzenia daje −2 morale, dwa −1, trzy są neutralne, więcej daje bonus. Przy morale 10 i niżej ludzie zaczynają dezerterować.","begin","1.4.8"],
  ["Chirurg od pierwszego dnia","Bez Medycyny z powalonych rekrutów przeżywa mniej więcej co dziesiąty. Przy Medycynie 60 około 4 na 10, przy 100 nieco ponad połowa. Chirurg to pierwszy kompan, za którego warto zapłacić.","begin","1.4.8"],
  ["Konie przyspieszają","Każdy wierzchowiec na piechura daje +15% prędkości na mapie, a drużyna złożona z samej jazdy +30%. Za dużo zwierząt spowalnia: każde ponad jedno na człowieka to −30%, maksymalnie −80%.","begin","1.4.8"]
 ],[
  ["Sloty werbunku u notabli","Każdy notabl ma do 6 ochotników. Przy relacji neutralnej otwarty jest tylko pierwszy slot. Relacja 5, 10, 20, 40 i 60 otwiera kolejne. W osadach własnego królestwa masz +1 slot, wroga −1.","begin","1.4.8"],
  ["Poziomy klanu w liczbach","Renoma potrzebna na tier: 50, 150, 350, 900, 2 350, 6 150. Limit drużyny rośnie z 20 do 170, a limit kompanów z 3 do 9. Tier 4 to warunek własnego królestwa.","begin","1.4.8"],
  ["Najemnik od tieru 1, wasal od 2","Propozycje najemnictwa przychodzą kurierem tylko na tierze 1. Od tieru 2 trzeba osobiście poprosić władcę. Warunek: relacja z nim co najmniej −10 i brak własnych lenn.","begin","1.4.8"],
  ["Od 1.4.5 nie werbujesz u wroga","Nie zwerbujesz ludzi ani nie pohandlujesz w wioskach frakcji, z którą jesteś w wojnie. Werbunek planuj w swoich ziemiach i u neutralnych.","begin","1.4.5+"]
 ],[
  ["Najczęstsze błędy","Ogłoszenie Smoczego Sztandaru, zanim przetrwasz wojnę z kilkoma królestwami naraz. Brak chirurga. Jeden rodzaj jedzenia. Warsztaty w krainach, z którymi będziesz walczyć. Egzekucje jeńców. Poleganie tylko na autozapisie.","begin","1.4.8"],
  ["Reset perków","Perki zresetujesz u mistrza areny. Kosztuje to poziom umiejętności razy 40 denarów i wymaga co najmniej 25 w tej umiejętności.","begin","1.4.8"],
  ["Bonusy kultur","Wlandia: +15% żołdu najemnego. Aserajowie: karawany 30% taniej, ale żołd +5%. Cesarstwo: +25% wpływów na służbie i garnizony 20% taniej. Huzajczycy: jazda 10% taniej, ale podatki miast −20%. Battania: las mniej spowalnia. Sturgia: armie kosztują 50% mniej wpływów. Nordowie: +30% łupu z karawan, szybsze statki, ale −30% spójności armii na lądzie.","begin","1.4.8"]
 ],[
  ["Nadwyżka ponad limit","Gdy masz więcej ludzi niż limit drużyny, każdego dnia tracisz jedną czwartą nadwyżki. Głód to −30 morale od razu i −5 każdego dnia. Wygrana bitwa daje +20 morale, przegrana −20, startujesz z 50.","begin","1.4.8"],
  ["Taktyka w automatycznej bitwie","Każdy punkt Taktyki dowódcy daje Twojej stronie +0,1% w symulacji, czyli +10% przy 100 punktach.","begin","1.4.8"],
  ["Wspólny pasek doświadczenia","Doświadczenie zbiera cały stos jednego typu jednostki. Gdy wszyscy w stosie mogą już awansować, nadwyżka przepada, więc awansuj od razu.","begin","1.4.8"]
 ]
]},
{ id:"pieniadze", name:"Pieniądze", sub:"Karawany, warsztaty, podatki, kowalstwo", tint:"--or", icon:"coin",
 levels:[
 [
  ["Na start: turnieje i bandyci","Nagrodą turnieju jest przedmiot wart około 1 600 do 5 000. Zakład to maksymalnie 150 za rundę i wypłaca się tylko, gdy wygrasz cały turniej. Broń i zbroję sprzedasz za ćwierć do jednej trzeciej wartości, konia za około połowę.","money","1.4.8"],
  ["Jeńcy to gotówka","Handlarz jeńcami płaci ćwierć kosztu rekrutacji: od 5 denarów za szabrownika do 275 za jazdę tieru 6.","money","1.4.8"],
  ["Zadania, które się opłacają","Zasadzka na karawanę daje 1 300 do 4 000, eskorta karawany kupieckiej do 8 000, a zadanie z kryjówką od sołtysa dorzuca 3 000.","money","1.4.8"],
  ["Sprzedawaj w miastach","Wioski mają dużo gorsze ceny skupu. Kupcy w miastach mają ograniczone sakiewki, więc drogie rzeczy rozkładaj na kilka miast.","smith","1.4.8"]
 ],[
  ["Karawana","Kosztuje 15 000 (20 do 29 strażników) albo 22 500 z lepszym wojskiem i wymaga wolnego kompana lub członka rodziny. Aserajowie płacą 30% mniej. Wypłaca 10% dziennie z kapitału powyżej 10 000. Gdy jesteś niezależny i w pokoju, karawany to najlepszy start.","money","1.4.8"],
  ["Warsztat","Koszt to wyposażenie plus 4 razy dobrobyt plus 2 000. Wypłaca 20% dziennie z kapitału powyżej 10 000. Limit to tier klanu plus 1. Przestaje płacić, gdy lojalność miasta spadnie do 35, a przy wojnie z właścicielem miasta tracisz go za darmo. Kupuj tylko w bezpiecznych miastach swojej strony.","money","1.4.8"],
  ["Najlepsze typy warsztatów","W najlepszym przypadku dziennie: kuźnia około 1 325 (tylko przy kopalniach żelaza), tłocznia oliwy około 1 000, tkalnia lnu około 850, złotnik około 838, tkalnia wełny około 776. Dopasuj warsztat do surowców z okolicznych wiosek.","workshops","1.4.8"],
  ["Handel ręczny","Żeby zarobić, cena sprzedaży musi być około 12% wyższa niż zakupu (10% przy Handlu 100). Kupno i sprzedaż w tym samym mieście to strata około 11%.","money","1.4.8"]
 ],[
  ["Miasto zarabia na cłach","Podatek miasta to około 0,35 × dobrobyt dziennie. Łatka 1.3.0 podniosła prowizje handlowe miast pięciokrotnie, więc cła to duża część dochodu. Lojalność poniżej 25 to zero podatku, powyżej 75 do +20%.","money","1.3.0+"],
  ["Polityki dla skarbca","Debasement of the Currency: +100 dziennie za każde miasto i zamek, ale −1 lojalności. War Tax: 5% podatków osad. Crown Duty: 5% ceł. Land Tax: 5% dochodu wiosek innych klanów.","money","1.4.8"],
  ["Gdzie ucieka złoto","Żołd dzienny na tier: 2, 3, 5, 8, 12, 17. Najemnicy z tawerny +50%. Kompan kosztuje 2 + 2 za poziom. W ekranie klanu ustawisz limit żołdu garnizonu. Perk Stiff Upper Lip tnie koszt garnizonu zamku o 20%.","money","1.4.8"],
  ["Okupy za lordów","Król jest wart u handlarza około 14 do 23 tysięcy. Jeśli go przetrzymasz, oferty rodziny rosną nawet do 3,4 razy ceny handlarza po 5 do 9 tygodniach.","money","1.4.8"]
 ],[
  ["Kowalstwo w liczbach","Wykuta broń tieru 5 sprzedana bez perków daje około 21 do 28% wartości. Z Artisan Smith (musi go mieć lider drużyny) około 43%, z Handlem 300 i perkami do około 65%.","money","1.4.8"],
  ["Jak wbić kowalstwo","Najpierw węgiel drzewny z perkiem Efficient Charcoal Maker (około 45 XP na rafinację). Potem wykuwanie najdroższej broni i przetapianie jej. Zamówienia dają co najmniej 5 razy więcej XP. Wytrzymałość odnawia się tylko w osadzie.","smith","1.4.8"],
  ["Statki jako towar (War Sails)","Przechwycony statek sprzedasz za około 30% ceny stoczni minus naprawy, bez spadku ceny przy kolejnych: Dromon około 36 000, Corbita około 7 200. Konwój handlowy kosztuje 30 000 (45 000 uzbrojony). Na morzu żołd spada o 20%.","money","WS 1.2.8"],
  ["Umowy handlowe","Karawana z królestwa partnerskiego, która odwiedzi Twoje miasto, daje 500 denarów (konwój morski 1 000), dzielone między klany wasalne. Najemnicy nic z tego nie mają.","money","1.4.8"]
 ]
]},
{ id:"bitwa", name:"Bitwa w polu", sub:"Szyki, proporcje, młot i kowadło", tint:"--gules", icon:"swords",
 levels:[
 [
  ["Proporcje armii","Na wczesną i średnią grę: 40 do 50% piechoty, 25 do 35% strzelców, 10 do 20% jazdy i opcjonalnie 5 do 10% konnych łuczników.","formation","2026"],
  ["Ściana tarcz z przodu, strzelcy na górze","Piechota w ścianie tarcz trzyma linię, strzelcy stoją tuż za nią, najlepiej na wzniesieniu, a jazda czeka na skrzydle.","formation","2026"],
  ["Szyki w skrócie","Ściana tarcz chroni przed szarżą piechoty i jazdy. Luźny szyk zmniejsza straty od strzał, więc pasuje łucznikom i harcownikom.","tactics","1.x"]
 ],[
  ["Kwadrat przeciw jeździe","Gdy szarżuje jazda, przestaw piechotę w kwadrat, a gdy utknie, uderz. Przeciw łucznikom trzymaj tarcze, aż skończy im się amunicja. Cofanie się pozwala odzyskać amunicję i wytrzymałość tarcz.","formation","2026"],
  ["Młot i kowadło","Ciężka piechota z tarczami, na przykład Huskarlowie albo Legioniści, trzyma wroga w miejscu, a jazda uderza od tyłu. Huskarl według rankingu zabija powoli, więc najlepiej działa właśnie jako kowadło.","tier","1.4.8"],
  ["Nie dawaj wszystkim szarży","Na rozkaz szarży jednostki rozbiegają się i gonią jazdę na własną rękę. Szarżę dawaj dopiero, gdy wróg jest już związany walką.","tactics","1.x"]
 ],[
  ["Wpływy z bitwy","Wartość rośnie z siłą wroga, mniej więcej do potęgi 0,75. Twój udział zależy od tego, ile zadałeś trafień. Wróg, który ucieknie bez strat, zmniejsza wypłatę, więc warto go dobić.","influence","1.4.8"],
  ["Ile dostaniesz","60 żołnierzy tieru 3 przeciw 30 szabrownikom to około 5 wpływów. 80 żołnierzy tieru 4 przeciw lordowi z setką tieru 3 to około 23. Bitwa 350 na 300 to około 49 dla całej strony.","influence","1.4.8"]
 ],[
  ["Mnożniki wpływów","Warlord +30% (+15% na morzu), polityka Military Coronae +20%, perk Pre Battle Maneuvers +25%. Wszystkie się sumują.","influence","1.4.8"],
  ["Przegrana też kosztuje","Przegrana bitwa zabiera 5% Twojego złota, maksymalnie 10 000. Nie kosztuje natomiast wpływów.","money","1.4.8"]
 ]
]},
{ id:"oblezenia", name:"Oblężenia", sub:"Obrona murów i szturm", tint:"--sable", icon:"tower",
 levels:[
 [
  ["Obrona: mury robią robotę","Mniejszy garnizon wytrzyma dużo większą armię, jeśli dobrze wykorzysta mury. Nawet słabsi łucznicy zadają z murów duże straty.","siegedef","2025"],
  ["Obrona: kto gdzie stoi","Najlepszych łuczników ustaw naprzeciw drabin i wież oblężniczych, a piechotę trzymaj w odwodzie przy bramie.","siegedef","2025"],
  ["Szturm: najpierw machiny","Zniszcz machiny obrońców, postaw katapulty i trzymaj piechotę oraz łuczników z tyłu, dopóki artyleria ostrzeliwuje mury.","siegeatk","2023"],
  ["Trebusze przed wszystkim","Pierwsza machina w każdym oblężeniu to trebusz: bez niego machiny obrońców spalą Twoje wieże i taran. Gracze budują kilka, chowają gotowe w rezerwie i wystawiają razem.","engines","2026"]
 ],[
  ["Głodzenie","Jeśli masz czas, zagłodzenie garnizonu obniża jego siłę i morale, zanim w ogóle ruszysz na mury.","siege","2025"],
  ["Łucznicy w szturmie","Ustaw łuczników na wzniesieniu poza zasięgiem łuczników z murów i zdejmuj obrońców.","siege","2025"],
  ["Dwa wyłomy zamiast wież","Najpewniejsza metoda według graczy: trebuszami zrobić dwie dziury w murach. Wtedy szturm staje się prawie bitwą w polu i ginie mniej ludzi. Taran warto mieć, bo ściąga obrońców z murów pod bramę.","ramwalls","2020+"],
  ["Co dostajesz po zdobyciu","Wpływy: miasto 30, zamek 10, plus 10 za każdą wioskę, +50% gdy było oblężenie. Garnizon jest pusty, milicja rośnie o 90 do 108, a lojalność zostaje.","influence","1.4.8"]
 ],[
  ["Plądrować czy oszczędzić","Plądrowanie zabiera mieście 15 lojalności, dewastacja 30. Miłosierni kompani tracą relację przy dewastacji. Plądrowanie to bezpieczny środek.","loyalty","1.4.8"],
  ["Porty w zamkach (1.5)","Od łatki 1.5 nadmorskie zamki mają porty i obejmują je blokady. Przy oblężeniach będzie więcej bitew na morzu.","p15","1.5.7"]
 ],[
  ["Inżynieria w oblężeniu","Perki Scaffolds i Torsion Engines przyspieszają budowę o 10%. Foreman (125) poprawia celność mangoneli i trebuszy na mapie o 10%. Siege Engineer (150) odblokowuje zapalające wersje machin.","engperks","1.x"],
  ["Szturm daje podwójnie","Bitwa w szturmie jest warta mniej więcej dwa razy tyle wpływów co w polu, dopóki mury stoją.","influence","1.4.8"],
  ["Ostrożni dłużej się szykują","Od 1.5 cechy Cautious i Very Cautious wydłużają przygotowanie oblężenia o 30% i 60%. Calculating i Cerebral przyspieszają budowę machin.","p15","1.5.7"]
 ]
]},
{ id:"krolestwo", name:"Królestwo i lordowie", sub:"Werbunek lordów, wpływy, lojalność", tint:"--purpure", icon:"crown",
 levels:[
 [
  ["Warunki własnego królestwa","Tier klanu 4 (900 renomy), Twój zamek lub miasto, 100 zdrowych ludzi w garnizonach i drużynach klanu, brak służby u innego władcy i gubernator w lennie. Nie kosztuje złota ani wpływów.","kingdom","1.4.8"],
  ["Kogo werbować najpierw","Klany bez lenn i z wieloma członkami, lordowie o niskim honorze, ci, którzy nie lubią swojego króla, i ci z Twojej kultury. Im mniejsze Twoje królestwo, tym taniej, ale ten bonus maleje z każdym nowym klanem.","kingdom","1.4.8"],
  ["Gdy nie ma opcji rozmowy","Rozmowa o przejściu nie pojawi się, jeśli Ty albo lord jesteście w armii. Rozmawiaj z głową klanu, inni członkowie odeślą Cię do niego.","plclans","2024"],
  ["Rodu panującego nie przekonasz","Członkowie klanu panującego zawsze odmawiają. Jeśli lord mówi, że ani sakiewka, ani relacja nie wystarczą, cena jest dla Ciebie za wysoka.","kingdom","1.4.8"]
 ],[
  ["Lord z wojny przynosi ziemię","Lord z królestwa, z którym walczysz, przechodzi razem ze swoimi lennami. Lord z królestwa w pokoju zostawia je. Lorda w niewoli zwerbujesz ofertą: dołącz, a odzyskasz wolność.","kingdom","1.4.8"],
  ["Pierwsze polityki zanim przyjdzie lord","Dopóki jesteś jedynym klanem, każda polityka przechodzi od razu, bez głosowania. Pierwszy zwerbowany lord, klan kompana albo najemnicy kończą to okno.","kingdom","1.4.8"],
  ["Jak budować relacje","Wsparcie innego klanu kosztuje 50 wpływów: on dostaje +12, a Twoja relacja z nim rośnie o 1. Uwolnienie lorda z niewoli daje +4. Prezent w handlu, gdy dajesz i nic nie bierzesz, też podnosi relację.","influence","1.4.8"],
  ["Jak utrzymać wasali","Dawaj im lenna, nie płać trybutów (rozkładają się na całe królestwo i zubażają lordów), wygrywaj wojny. Zamożne klany nie odchodzą.","plclans","2024"]
 ],[
  ["Ceny w wpływach","Propozycja wojny 200, pokoju 100, polityki 100, sojuszu, umowy handlowej albo wezwania sojusznika 200. Przegłosowanie 9 punktów przewagi kosztuje około 570. Royal Privilege obniża to o 20%.","influence","1.4.8"],
  ["Obca kultura miasta","Gdy kultura Twojego klanu różni się od kultury miasta, tracisz 3 lojalności dziennie. Forgiveness of Debts (+2) i Tribunes of the People (+1) razem to znoszą. W zamkach działa tylko Forgiveness.","loyalty","1.4.8"],
  ["Bunt miasta (od 1.5)","Miasto staje się buntownicze przy lojalności 35, a może się zbuntować przy 25 i niżej, gdy milicja jest co najmniej 1,4 razy silniejsza od garnizonu. Wtedy 25% szans dziennie. Zamki nigdy się nie buntują, a miasto nie zbuntuje się, gdy w nim jesteś.","loyalty","1.5"],
  ["Kompan jako lord","Za 20 000 denarów, 500 wpływów i zamek lub miasto robisz z kompana nowy klan tieru 2. Przyjmuje kulturę lenna, więc rozwiązuje problem obcej kultury.","kingdom","1.4.8"]
 ],[
  ["Punkt spoczynku lojalności","Lojalność dąży do 50 + 10 × suma dziennych pozycji z podpowiedzi. Każdego dnia domyka 10% różnicy, więc połowę drogi przejdzie w tydzień.","loyalty","1.4.8"],
  ["Kiedy AI wypowie wojnę","Od 1.4.5 AI wypowiada wojnę tylko mając graniczące miasto lub zamek. Po pokoju to samo królestwo czeka 20 dni. Przegrany płaci do 15% z 35% dobrobytu swoich lenn dziennie przez 100 dni.","kingdom","1.4.5+"],
  ["Dług a najemne klany","Klany szlacheckie rzadko odchodzą od gracza. Klany najemne łatwiej, zwłaszcza gdy Twój klan jest winny królestwu pieniądze: trzymaj dług poniżej 10 000, inaczej najemnicy odejdą sami.","kingdom","1.4.8"],
  ["Egzekucja i waśń krwi","Egzekucja ustawia klan ofiary na −100 i zaczyna waśń krwi, reszta królestwa traci do 50. Rywal w waśni zawsze Cię zgładzi, jeśli złapie. Waśń zakończysz u handlarza jeńcami za 5 000 plus 50 000 za każdą dodatkową egzekucję.","execute","1.5.7"]
 ]
]},
{ id:"druzyna", name:"Drużyna i kompani", sub:"Role, limity, gubernatorzy", tint:"--vert", icon:"banner",
 levels:[
 [
  ["Ile kompanów","Limit to tier klanu plus 3. Perki We Pledge our Swords i Camaraderie (po 250 u lidera klanu) dają po +1, razem maksymalnie 11. Żona i dzieci się nie liczą.","companions","1.4.8"],
  ["Role w drużynie","Chirurg, zwiadowca, kwatermistrz, inżynier, a z War Sails także pierwszy oficer i nawigator. Rola działa tylko, gdy kompan jest w Twojej drużynie. Od 1.4.5 jedna osoba może pełnić dwie role.","companions","1.4.8"],
  ["Kogo szukać w tawernach","Za 2 denary karczmarz wskaże najlepszego wędrowca do danej roli. Chirurg: Surgeon (Cesarstwo, Medycyna 165 do 169). Kwatermistrz: Scholar (Cesarstwo). Zwiadowca: Wanderer, Tracker albo Swift. Inżynier: Engineer (Aserajowie).","companions","1.4.8"]
 ],[
  ["Większa drużyna","Limit zależy od tieru klanu, a kwatermistrz dodaje 0,25 miejsca za każdy punkt Zarządzania. Dokładają też perki Authority, Horde Leader, Imposing Stature i Leader of the Masses.","begin","1.4.8"],
  ["Kompani mają charakter","Miłosierni narzekają po grabieżach wiosek, Śmiali po porzuceniu wojsk przy ucieczce, Hojni gdy żołnierze głodują. Poniżej −10 relacji kompan odchodzi. Miłosiernych zostaw jako gubernatorów przed rajdem.","companions","1.4.8"],
  ["Gubernator w mieście","Perki lojalności gubernatora działają tylko, gdy siedzi w mieście: Heroic Leader +1, Physician of People +1, Durable +1, Discipline +1, Well Strapped +0,5. Od 1.5 jego kultura już nie ma znaczenia.","loyalty","1.5"]
 ],[
  ["Partie kompanów kosztują","Kompan z własną drużyną albo karawaną płaci żołd z jej sakiewki, ale skarbiec klanu dopłaca jej do 5 000. Kilka partii potrafi wydrenować kasę.","companions","1.4.8"],
  ["Armia za wpływy","Wezwanie partii własnego klanu jest darmowe. Inni lordowie kosztują więcej, im dalej są, im słabsza relacja i im silniejsza ich drużyna. +10 spójności kosztuje 10% kosztu wezwania.","influence","1.4.8"],
  ["Śmierć kompanów","Kompan może zginąć tylko przy włączonej śmierci bohaterów, po powaleniu cięciem lub pchnięciem, bazowo z szansą poniżej 2%. Perk chirurga Cheat Death zmniejsza ją o połowę.","companions","1.4.8"]
 ],[
  ["Losowanie nowych wędrowców","W świecie jest około 32 wędrowców (35 z War Sails). Gdy jest ich mniej, codziennie pojawia się nowy, a każdego dnia 10% szans, że jakiś niezatrudniony zniknie. Zatrudnij, rozbierz ze sprzętu i zwolnij, żeby przetasować pulę.","companions","1.4.8"],
  ["Uwaga na przydomki","Pięć przydomków występuje w dwóch kulturach z innymi statystykami: of the Hills, the Black, the Ragged, the Scholar, the Wanderer. Zawsze sprawdzaj kulturę wędrowca.","companions","1.4.8"]
 ]
]},
{ id:"morze", name:"Morze (War Sails)", sub:"Statki, wiatr, abordaż, flota", tint:"--khu", icon:"ship",
 levels:[
 [
  ["Pierwszy statek","Dostaniesz go za darmo w kampanii War Sails albo kupisz w stoczni portu, oznaczonego ikoną kotwicy przy nazwie.","wstips","WS"],
  ["Marynarze","Prawie każde nordyckie miasto i wieś werbuje wyłącznie marynarzy, gdzie indziej trafisz jednego, dwóch. Na morzu łucznicy są słabi, lepiej sprawdza się piechota.","wstips","WS"],
  ["Wiatr to wszystko","Wskaźnik wiatru w prawym dolnym rogu: zielona strefa łapie wiatr, czerwona zatrzymuje statek. Nie daj się zepchnąć w czerwone. Wiosła pozwalają obrócić się w miejscu i cofnąć.","naval","WS"],
  ["Ciężka zbroja tonie","Lekko opancerzeni żołnierze przeżyją w wodzie dłużej. W pełnej płycie topią się szybko.","naval","WS"]
 ],[
  ["Taran i abordaż","Uderz taranem w burtę z prędkością i pod kątem: zabija załogę, łamie morale, słabsze statki tonie. Potem abordaż, który tworzy wąskie przejścia na linach. Balisty mają mało amunicji.","naval","WS"],
  ["Ile statków","Do 3 statków flota płynie bez kary prędkości, od 4 zaczyna zwalniać. Limit dowodzenia to 3, perki dają do 6 na drużynę, a cała strona wystawia do 8.","ships","WS 1.2.8"],
  ["Najlepsze statki","Dromon: najlepszy ogólnie (120 000). Ghurab: prawie równy, tańszy w załodze. Drakkar: do abordażu, 106 ludzi na pokładzie. Liburna: najlepszy średni, jedyny z taranem. Lekki Longship: najlepszy lekki. Corbita: handlowy.","ships","WS 1.2.8"]
 ],[
  ["Burze","Statek ignoruje burzę, gdy jego dzielność morska jest większa niż 20 razy siła burzy (3, 6 albo 10). Otwarte morze zużywa kadłub, wybrzeże i rzeki nie.","ships","WS 1.2.8"],
  ["Ulepszenia","Cotton Sails daje +8% prędkości. Ulepszenie kupisz tylko w porcie tej samej kultury i z odpowiednią stocznią. Jest przypisane do statku i nie ma zwrotu. Porty nordyckie i sturgijskie nie sprzedają balist.","ships","WS 1.2.8"],
  ["Łapanie statków","Po wygranej każdy ocalały statek wroga ma 50% szans, że da się go przejąć. Perk Gilded Purse (Boatswain 100) zwiększa szanse o 25%.","ships","WS 1.2.8"]
 ],[
  ["Wpływy z wraków","Perk Salvage (Boatswain 225) daje 1% punktów kadłuba porzuconego statku jako wpływy. Naprawiony Dromon to około 600 wpływów, największe pojedyncze źródło w późnej grze.","influence","WS 1.2.8"],
  ["Prędkość floty","Otwarte morze +44,8%, rzeki +50%, wiatr w plecy do +69%. Prędkość floty to średnia wszystkich statków plus najwolniejszy, podzielona przez dwa.","ships","WS 1.2.8"],
  ["Morze w 1.5","39 nowych zdarzeń morskich, cumowanie w portach neutralnych i sojuszniczych, promy między wioskami. Perki spoza drzew morskich działają w bitwach na morzu o połowę słabiej.","p15","WS 1.3.7"]
 ]
]},
{ id:"wersje", name:"Wersje i łatki", sub:"Co masz na PS5 i co się zmieniło", tint:"--muted", icon:"scroll",
 levels:[
 [
  ["Twoja wersja na PS5","Masz już łatkę 1.5: widzisz zaawansowane opcje startu i możesz przeszukiwać pobojowiska. Na PC ta wersja (1.5.7 z War Sails 1.3.7) wyszła 11 listopada 2026, a wcześniej, w sierpniu, konsole dostały 1.4.8. Porady oznaczone 1.5 dotyczą więc Ciebie.","p15","PS5 1.5"],
  ["Stara kampania bez morza","Jeśli wczytałeś kampanię zaczętą przed dodatkiem i na mapie nie ma morza ani Nordów, grasz bez treści War Sails. W Wojskach zaznacz filtr „Gra podstawowa”. Dopiski o morzu w opisach perków to najpewniej opisy z zainstalowanego dodatku.","console","PS5"],
  ["Co dała 1.5","Bunt miast od lojalności 35 zamiast 25, waśnie krwi po egzekucjach, nowe opcje startu (król, wasal, najemnik, kupiec), +15% prędkości na mapie i łupy z pobojowisk.","p15","1.5.7"]
 ],[
  ["Cechy postaci od 1.5","Generous i Munificent: +25% albo +50% najemników, ale +10% jedzenia. Calculating i Cerebral: +10% albo +20% dochodu z warsztatów. Cruel i Sadistic: mniej buntów i +20% albo +40% łupu z rajdów.","p15","1.5.7"],
  ["Rozmowy z wrogiem","Od 1.5 możesz pertraktować z wrogimi drużynami, nie tylko z osadami. Nieudane przekonanie lorda ma blokadę na jedną porę roku zamiast roku.","p15","1.5.7"]
 ],[
  ["Ważne z 1.4.5","Brak werbunku i handlu w wioskach wroga, AI wypowiada wojny tylko przy wspólnej granicy, umowy handlowe tylko z sąsiadami, mniej metalu z przetapiania, Lawspeakers zaczęło działać.","kingdom","1.4.5"],
  ["Ważne z 1.3.0","Prowizje handlowe miast razy 5, podatki miast i zamków +130%, wiosek +30%. Doszły sojusze i umowy handlowe. Zamki straciły projekty podnoszące lojalność.","money","1.3.0"]
 ],[
  ["Starsze porady kłamią","Stare poradniki podają 10 lat na misję Smoczego Sztandaru (dziś 20) i nazywają Lawspeakers nieszkodliwym (od 1.4.5 zabiera wpływy klanom, których lider ma Charyzmę do 100). Patrz zawsze na datę i wersję.","kingdom","1.4.8"]
 ]
]}
];

// Twoja kampania (stan z rozmowy, 19.11.2026)
const MYCAMP = [
 ["Oblężenie w toku","Twoje 1 050 na ich 620 to za mało na same drabiny. Otwórz Doradcę bitwy: wybierz szturm, wpisz szczegóły i zobacz, co da największy skok szans.","siege"],
 ["Ortyzja to miasto cesarskie","Twój klan jest battański, więc Ortyzja traci 3 lojalności dziennie. Forgiveness of Debts i Tribunes of the People razem to znoszą. Zamek w Taraktorze ratuje tylko Forgiveness.","loyalty"],
 ["Złotnik w Ortyzji","Złotnik to około 838 dziennie w najlepszym razie, ale tylko gdy w okolicy jest srebro. Warsztat przestaje płacić przy lojalności miasta 35 i niżej.","workshops"]
];

// Źródła Doradcy bitwy
Object.assign(SRC, {
 engines:["Steam: po co machiny oblężnicze","https://steamcommunity.com/app/261550/discussions/0/592885762520802883"],
 ramwalls:["Steam: taran, wieże i wyłomy","https://steamcommunity.com/app/261550/discussions/0/2264689848049689635"],
 ladders:["Steam: drabiny, taran, mury","https://steamcommunity.com/app/261550/discussions/0/3955910352557844117"],
 devblog:["TaleWorlds: dziennik twórców o machinach","https://www.taleworlds.com/en/Games/Bannerlord/Blog/53"],
 howsiege:["SevenSwords: jak działają oblężenia","https://sevenswords.uk/how-sieges-work-bannerlord/"],
 engperks:["GamerGuides: perki Inżynierii","https://gamerguides.com/mount-and-blade-ii-bannerlord/guide/perks/intelligence/engineering"],
 autores:["Steam: rozstrzyganie oblężeń","https://steamcommunity.com/app/261550/discussions/0/595144534553276353"],
 ration:["Steam: głód i racjonowanie w garnizonie","https://steamcommunity.com/app/261550/discussions/0/4509877188784177798"],
 ladderkill:["Steam: obrona przed szturmem","https://steamcommunity.com/workshop/filedetails/discussion/3496296180/595155000272057922"]
});

// Źródła Zbrojowni (najlepszy sprzęt). Daty przy nazwach, bo liczby różnią się między wersjami gry.
Object.assign(SRC, {
  zb_blox_r:["Bloxodes: broń dystansowa (XI 2026)","https://bloxodes.com/wiki/bannerlord/ranged-weapons"],
  zb_blox_m:["Bloxodes: wierzchowce (XI 2026)","https://bloxodes.com/wiki/bannerlord/mounts"],
  zb_blox_w:["Bloxodes: broń biała (XI 2026)","https://bloxodes.com/wiki/bannerlord/melee-weapons"],
  zb_nl_arm:["Nerd Lodge: najlepsze zbroje (2022)","https://nerdlodge.com/bannerlord-best-armor"],
  zb_nl_horse:["Nerd Lodge: konie i zbroje koni (2022)","https://nerdlodge.com/best-horses-and-horse-armor-in-bannerlord"],
  zb_nl_wpn:["Nerd Lodge: najlepsza broń","https://nerdlodge.com/best-weapons-in-bannerlord"],
  zb_fx:["Fextralife Wiki: zbroje","https://mountandblade2bannerlord.wiki.fextralife.com/Armor"],
  zb_ge_arm:["GamerEmpire: najlepsza zbroja","https://gamerempire.net/mount-blade-2-bannerlord-what-is-the-best-armor/"],
  zb_ge_wpn:["GamerEmpire: najlepsza broń","https://gamerempire.net/mount-blade-2-bannerlord-what-are-the-best-weapons/"],
  zb_ge_horse:["GamerEmpire: najlepszy koń","https://gamerempire.net/mount-blade-2-bannerlord-what-is-the-best-horse/"],
  zb_gd_arm:["GamersDecide: najlepsze zbroje (2024)","https://gamersdecide.com/articles/mnb-bannerlord-best-armor"],
  zb_gd_arrow:["GamersDecide: najlepsze strzały","https://gamersdecide.com/articles/mount-and-blade-2-bannerlord-best-arrows"],
  zb_st_imp:["Steam: cesarskie rękawice i buty (2020)","https://steamcommunity.com/app/261550/discussions/0/2264689848043791206"],
  zb_st_shops:["Steam: sklepy a warsztaty w mieście","https://steamcommunity.com/app/261550/discussions/0/2264689848031111438"],
  zb_st_wife:["Steam: skąd brać sprzęt lordów","https://steamcommunity.com/app/261550/discussions/0/2144217924395373539"],
  zb_st_late:["Steam: kiedy w sklepach pojawia się tier 6","https://steamcommunity.com/app/261550/discussions/0/4233889679078844524"],
  zb_st_noble:["Steam: koń szlachecki a awans żołnierzy","https://steamcommunity.com/app/261550/discussions/0/604149013211534906"],
  zb_st_askar:["Steam: Askar i konie bojowe","https://steamcommunity.com/app/261550/discussions/0/3482997257350459038"],
  zb_st_glaive:["Steam: Long Glaive według graczy","https://steamcommunity.com/app/261550/discussions/0/2264690481983399323"],
  zb_st_armorguide:["Steam: poradnik wydawania na zbroje (2022)","https://steamcommunity.com/app/261550/discussions/0/3192490350133598944"]
});

// Źródła działu Banici i najemnicy
Object.assign(SRC, {
  rb_stats:["GamerGuides: statystyki wszystkich jednostek","https://gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/overview/all-troop-stats-overview"],
  rb_mb:["GamerGuides: najemnicy i bandyci","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/overview/mercenaries-and-bandits"],
  rb_minor:["GamerGuides: frakcje pomniejsze","https://gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/overview/minor-faction-troops"],
  rb_blox:["Bloxodes: jednostki (XI 2026)","https://bloxodes.com/wiki/bannerlord/troops"],
  rb_lake:["Wiki: Jeziorne Szczury (Lake Rats)","https://mountandblade.fandom.com/wiki/Lake_Rats"],
  rb_wrecker:["GamerGuides: Lake Rat Wrecker","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/lake-rat-troop-tree/lake-rat-wrecker"],
  rb_lakerec:["GamerGuides: Lake Rat Recruit","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/lake-rat-troop-tree"],
  rb_watch:["GamerGuides: Watchman","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/mercenaries/watchman"],
  rb_srw:["GamerGuides: Sea Raider Warrior","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/bandits/sea-raider-warrior"],
  rb_srb:["GamerGuides: Sea Raider Boss","https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/troop-types/bandits/sea-raider-boss"],
  rb_paths:["Poradnik wideo: rekrutacja bandytów i ich awanse","https://www.letsplayindex.com/video/bandit-recruitment-ultimate-guide-tips-and-tricks-types-FAwCLPxP2Jk"],
  rb_trees:["SegmentNext: drzewka jednostek z bandytami","https://segmentnext.com/2020/04/03/mount-and-blade-2-bannerlord-troop-trees-guide"],
  rb_trees2:["GameWatcher: drzewka jednostek","https://www.gamewatcher.com/news/mount-and-blade-2-bannerlord-troop-trees"],
  rb_disc:["Prima Games: bandyci i perk Disciplinarian","https://primagames.com/gaming/mount-blade-ii-bannerlord-the-best-units-and-how-to-recruit-them"],
  rb_sea:["Steam: morscy rabusie jako cel","https://steamcommunity.com/app/261550/discussions/0/2144217924383224974"],
  rb_duel:["Steam: pojedynek z hersztem w kryjówce","https://steamcommunity.com/app/261550/discussions/0/4035853516563511166"],
  rb_army:["Steam: armia z hersztów i leśnych bandytów","https://steamcommunity.com/app/261550/discussions/0/2792747297861430174"],
  rb_fians:["Steam: z leśnych bandytów fianowie","https://steamcommunity.com/app/261550/discussions/0/2264689848053748013"],
  rb_triarii:["GamersDecide: najlepszy garnizon (Triarii)","https://gamersdecide.com/articles/mount-and-blade-2-bannerlord-best-garrison-troops"],
  rb_minorsteam:["Steam: jak zdobyć jednostki frakcji pomniejszych","https://steamcommunity.com/app/261550/discussions/0/2144217924386981767"]
});
