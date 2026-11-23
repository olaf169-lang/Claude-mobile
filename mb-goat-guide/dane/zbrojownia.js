/* M&B Goat Guide: Zbrojownia, najlepszy sprzęt w każdej kategorii i kultury, które go mają.
   Wpis przedmiotu: [nazwa z gry (EN), co to jest (PL), kultura (kod z CULT albo "any"), tier,
                     główna wartość (null = bd), dodatkowe parametry, uwaga, źródło]
   Liczby pochodzą z różnych lat i wersji gry; kolejność w kategorii jest pewniejsza niż pojedyncze wartości. */
const ARMORY = [
  { id:"helm", s:"Hełmy", n:"Hełmy", ic:"ghelm", grp:"Zbroja", champ:["stu","emp"], stat:"ochrona głowy",
    why:"Najmocniejsze hełmy robią Sturgia i Cesarstwo: zamknięte hełmy z goglami i hełmy katafraktów.",
    items:[
      ["Decorated Goggled Helmet","zdobiony hełm z goglami","stu",null,54,"waga 3,8; cena bazowa ok. 170 000","Najwyższa ochrona głowy wg zestawień graczy.","zb_nl_arm"],
      ["Goggled Cataphract Helmet","hełm katafrakty z goglami","emp",6,52,"tier 6","Praktycznie równy sturgijskiemu.","zb_fx"],
      ["Warlord Helmet over Mail","hełm wodza na kolczudze","bat",null,47,"waga 2,0","Dużo lżejszy; źródło podaje też 53 przy całym zestawie.","zb_nl_arm"],
      ["Imperial Guarded Lord Helmet","cesarski hełm lorda","emp",null,null,"bardzo drogi","Gracze wymieniają go wśród najlepszych, ale nie mam pewnej liczby dla 1.5.","zb_st_imp"]
    ], tip:"Hełm to najgorzej opłacalna część zbroi, ale najważniejsza dla piechoty. Gracze radzą wcześnie brać hełmy z turniejów, a za ok. 40 000 kupić hełm z ochroną 45.", tipSrc:"zb_st_armorguide" },

  { id:"body", s:"Korpus", n:"Zbroja na korpus", ic:"cuirass", grp:"Zbroja", champ:["emp"], stat:"ochrona korpusu",
    why:"Najgrubsze pancerze na korpus ma Cesarstwo, z łuską na kolczudze.",
    items:[
      ["Heavy Scale Armor over Mail Hauberk","ciężka łuska na kolczudze","emp",null,57,"ręce 16, nogi 16","Najwyższa ochrona korpusu w grze wg zestawień.","zb_nl_arm"],
      ["Mastercrafted Southern Scale over Chain Hauberk","mistrzowska południowa łuska","ase",6,51,"nogi 25, ręce 16","Wg innego źródła nogi 16, waga 18,7.","zb_ge_arm"],
      ["Brigandine over Mail","brygantyna na kolczudze","stu",6,50,"nogi 16, ręce 14, waga 19,7","Kultura wg graczy; polecana jeźdźcom.","zb_gd_arm"],
      ["Eastern Brass Lamellar over Mail","wschodnia lamelka z mosiądzu","khu",6,44,"nogi 16, ręce 16","Lżejsza opcja dla konnych łuczników.","zb_fx"]
    ], tip:"Zbroje tier 6 rzadko trafiają do sklepów i zwykle dopiero później w kampanii. Gracze podają, że koło połowy gry pojawiają się kolczugi z ochroną 30+.", tipSrc:"zb_st_late" },

  { id:"shoulder", s:"Naramienniki", n:"Naramienniki i peleryny", ic:"shield", grp:"Zbroja", champ:["ase","bat"], stat:"ochrona korpusu",
    why:"Najmocniejsze naramienniki mają Aserajowie, tuż za nimi battańskie naramienniki wodza.",
    items:[
      ["Reinforced Bronze Scale Shoulders","wzmocnione naramienniki z brązu","ase",null,20,"ręce 12, waga 5,8","Najmocniejsze i najcięższe.","zb_nl_arm"],
      ["Scaled Warlord Pauldrons","łuskowe naramienniki wodza","bat",null,20,"ręce 10, waga 4,0","Ta sama ochrona korpusu, lżejsze.","zb_nl_arm"],
      ["Brass Scale Shoulders","mosiężne naramienniki","stu",null,18,"ręce 4, waga 2,2","Najlepszy stosunek ochrony do wagi.","zb_nl_arm"]
    ] },

  { id:"hands", s:"Rękawice", n:"Rękawice", ic:"gauntlet", grp:"Zbroja", champ:["bat","emp"], stat:"ochrona rąk",
    why:"Rękawice to specjalność Battanii (zestaw wodza) i Cesarstwa.",
    items:[
      ["Scale Warlord Bracers","łuskowe karwasze wodza","bat",null,25,"waga 2,6","Najlepsze wg zestawienia z 2022.","zb_nl_arm"],
      ["Decorated Imperial Gauntlets","zdobione cesarskie rękawice","emp",null,28,"dane z 2020","Starsza liczba, po łatkach mogła spaść.","zb_st_imp"],
      ["Fian Bracers","karwasze fian","bat",null,18,"waga 0,5","Bardzo lekkie, dla strzelców.","zb_nl_arm"]
    ] },

  { id:"legs", s:"Buty", n:"Buty", ic:"boot", grp:"Zbroja", champ:["bat"], stat:"ochrona nóg",
    why:"Najlepsze buty to łuskowe buty z battańskiego zestawu wodza.",
    items:[
      ["Scaled Boots","łuskowe buty (zestaw wodza)","bat",null,26,"waga 2,9","Najwyższa ochrona nóg wg zestawienia z 2022.","zb_nl_arm"],
      ["Decorated Imperial Boots","zdobione cesarskie buty","emp",null,24,"dane z 2020","Starsza liczba.","zb_st_imp"],
      ["Reinforced Suede Boots","wzmocnione buty z zamszu","khu",null,20,"waga 1,0","Lekkie; w sklepach huzajskich.","zb_nl_arm"]
    ] },

  { id:"barding", s:"Zbroja konia", n:"Zbroje dla koni", ic:"horse", grp:"Zbroja", champ:["emp"], stat:"pancerz konia",
    why:"Najcięższe zbroje końskie sprzedają cesarskie miasta.",
    items:[
      ["Imperial Scale Barding","cesarska łuskowa zbroja konia","emp",null,75,"waga 30, najcięższa","W sklepach cesarskich miast.","zb_nl_horse"],
      ["Mail and Plate Barding","kolczuga z płytami","any",null,68,"waga 26,8","","zb_nl_horse"],
      ["Half Scale Barding","pół łuski","any",null,60,"waga 17","Lżejsza, mniej spowalnia.","zb_nl_horse"]
    ] },

  { id:"sword", s:"Jednoręczna", n:"Broń jednoręczna", ic:"sword", grp:"Broń", champ:["bat","nor"], stat:"cięcie",
    why:"Najmocniejsze miecze jednoręczne ma Battania; z War Sails wyprzedza ją nordycki miecz berserkera.",
    items:[
      ["Berserkr Sword","miecz berserkera","nor",6,105,"pchnięcie 63, długość 113, prowadzenie 85; 86 475","Tylko z War Sails.","zb_blox_w"],
      ["Engraved Backsword","grawerowany pałasz","bat",6,103,"pchnięcie 42, długość 111, prowadzenie 78; 67 115","Najlepszy bez War Sails.","zb_blox_w"],
      ["Decorated Broadsword","zdobiony miecz szeroki","bat",6,86,"długość 97, prowadzenie 97","Szybszy w ręku.","zb_blox_w"],
      ["Decorated Kaskara","zdobiona kaskara","ase",5,85,"pchnięcie 42, długość 104","Najlepszy aserajski.","zb_blox_w"],
      ["Lion Imprinted Saber","szabla z lwem","khu",6,81,"prowadzenie 90","Najlepsza huzajska.","zb_blox_w"],
      ["Cataphract Mace","buzdygan katafrakty","emp",5,71,"obuch, prowadzenie 89","Najlepszy obuch; obuch nie zabija, tylko rani (jeńcy!).","zb_blox_w"]
    ], tip:"Bronią z kuźni zrobisz więcej niż kupisz w sklepie: przy wysokim kowalstwie gracze robią miecze i glewie mocniejsze od sklepowych.", tipSrc:"zb_st_glaive" },

  { id:"twohand", s:"Dwuręczna", n:"Dwuręczna i drzewcowa", ic:"lance", grp:"Broń", champ:["bat","emp"], stat:"wybór graczy",
    why:"Tu nie mam pewnych liczb na 1.5, więc pokazuję wybór graczy z forów.",
    items:[
      ["Rhomphalia","romfaja","bat",null,null,"dwuręczna, noszą ją battańscy falksmeni","Opisywana jako najmocniejsza w czystej sile.","zb_nl_wpn"],
      ["Long Glaive","długa glewia","any",null,null,"zasięg i cięcie z konia","Na forum nazywana najlepszą bronią białą; najlepsze wersje z kuźni.","zb_st_glaive"],
      ["Menavlion","menavlion","emp",null,null,"jedno lub dwuręczny","Dobry na jazdę, na mury i z konia.","zb_nl_wpn"],
      ["Heavy Executioner Axe","ciężki topór kata","any",null,null,"topór dwuręczny","Wybór na rozbijanie obrony.","zb_ge_wpn"]
    ], tip:"Do szarży z kopią (couch) potrzebujesz broni drzewcowej z tą opcją; zwykła broń dwuręczna jej nie ma." , tipSrc:"zb_blox_w" },

  { id:"bow", s:"Łuki", n:"Łuki", ic:"r_rng", grp:"Strzelanie", champ:["ase","any"], stat:"obrażenia",
    why:"Najmocniejsze są szlacheckie łuki bez kultury; z kulturowych wygrywają Aserajowie, a z konia Huzajczycy.",
    items:[
      ["Noble Long Bow","szlachecki łuk długi","any",6,95,"celność 98, szybkość 91; nie z konia; 83 799","Najmocniejszy łuk w grze.","zb_blox_r"],
      ["Noble Bow","szlachecki łuk","any",6,80,"celność 100, szybkość 94; z konia","Najlepszy łuk z konia.","zb_blox_r"],
      ["Strong Tribesman Bow","mocny łuk plemienny","ase",5,79,"celność 95; nie z konia; 14 561","Najlepszy kulturowy, sporo tańszy.","zb_blox_r"],
      ["Yew Bow","łuk cisowy","vla",4,69,"celność 94; nie z konia","Najlepszy wlandzki.","zb_blox_r"],
      ["Woodland Longbow","leśny łuk długi","bat",3,64,"celność 94; nie z konia","Najlepszy battański.","zb_blox_r"],
      ["Steppe War Bow","stepowy łuk wojenny","khu",3,54,"celność 95; z konia","Tani i działa z siodła.","zb_blox_r"]
    ], tip:"Gracze twierdzą, że kultura miasta mniej się liczy niż warsztaty: lepsze łuki, kusze i strzały częściej są w miastach ze stolarnią.", tipSrc:"zb_st_shops" },

  { id:"xbow", s:"Kusze", n:"Kusze", ic:"crossbow", grp:"Strzelanie", champ:["vla"], stat:"obrażenia",
    why:"Kusze to specjalność Wlandii; Cesarstwo ma drugą najlepszą.",
    items:[
      ["Bound Crossbow","kusza wiązana","vla",6,100,"celność 100, przeładowanie 63; nie z konia; 50 319","Najmocniejsza kusza.","zb_blox_r"],
      ["Hickory Crossbow","kusza hikorowa","emp",5,93,"celność 99, przeładowanie 62","Najlepsza cesarska.","zb_blox_r"],
      ["Arbalest","arbalet","vla",5,89,"celność 98, przeładowanie 60","Tańsza od wiązanej.","zb_blox_r"],
      ["Fine Light Crossbow","lekka kusza mistrzowska","vla",5,85,"przeładowanie 80; przeładujesz na koniu","Najlepsza kusza z konia.","zb_blox_r"]
    ] },

  { id:"ammo", s:"Amunicja", n:"Strzały i bełty", ic:"arrows", grp:"Strzelanie", champ:["khu","vla"], stat:"premia obrażeń",
    why:"Najwięcej strzał w kołczanie dają Huzajczycy, najmocniejsze bełty Wlandia.",
    items:[
      ["Piercing Arrows","strzały przebijające","any",4,4,"23 w kołczanie","Najmocniejsze strzały.","zb_blox_r"],
      ["Stacked Bodkin Arrows","pełny kołczan grotów szydłowych","any",4,3,"32 w kołczanie","Kompromis siły i ilości.","zb_blox_r"],
      ["Stacked Steppe Arrows","pełny kołczan strzał stepowych","khu",4,2,"36 w kołczanie","Najwięcej strzał.","zb_blox_r"],
      ["Heavy Bolts","ciężkie bełty","vla",5,5,"18 w kołczanie","Najmocniejsze bełty.","zb_blox_r"]
    ] },

  { id:"throw", s:"Miotana", n:"Broń miotana", ic:"javelin", grp:"Strzelanie", champ:["ase","stu"], stat:"obrażenia",
    why:"Najmocniejszy oszczep ma Aserai, najtańszy mocny Sturgia.",
    items:[
      ["Jereed","dżirid","ase",6,121,"5 sztuk; 28 237","Najmocniejszy oszczep.","zb_blox_r"],
      ["Hooked Javelin","oszczep z hakiem","vla",4,117,"5 sztuk","Prawie tak mocny, sporo tańszy.","zb_blox_r"],
      ["Harpoon","harpun","stu",3,113,"5 sztuk; 2 421","Najlepszy stosunek ceny do siły.","zb_blox_r"],
      ["Balanced Nord Throwing Axe","wyważony nordycki topór do rzucania","nor",6,102,"cięcie, 5 sztuk","Tylko z War Sails.","zb_blox_r"]
    ] },

  { id:"horse", s:"Konie", n:"Konie", ic:"r_cav", grp:"Wierzchowce", champ:["ase","khu","vla"], stat:"szybkość",
    why:"Najszybszy jest aserajski Wadar Hotblood, najzwrotniejszy huzajski Asaligat, a najmocniej szarżuje wlandzki Royal Destrier.",
    items:[
      ["Wadar Hotblood","wadarski gorącokrwisty","ase",6,68,"zwrotność 78, szarża 24, HP 230, jazda 95","Najszybszy koń.","zb_blox_m"],
      ["Asaligat","asaligat","khu",6,63,"zwrotność 82, szarża 24, HP 245, jazda 90","Najzwrotniejszy, idealny do łuku.","zb_blox_m"],
      ["Pureblood","czystej krwi","any",6,65,"zwrotność 65, szarża 35, HP 270, jazda 75; 87 438","Mocny i wszechstronny, drogi.","zb_blox_m"],
      ["Royal Destrier","królewski destrier","vla",6,52,"zwrotność 73, szarża 36, HP 270, jazda 80","Najmocniejsza szarża.","zb_blox_m"],
      ["Cossian","kossian","emp",6,62,"zwrotność 71, szarża 31, HP 230, jazda 90","Najlepszy cesarski.","zb_blox_m"],
      ["Battanian Thoroughbred","battański pełnej krwi","bat",5,55,"zwrotność 72, szarża 26, HP 320","Najwięcej życia.","zb_blox_m"]
    ], tip:"Koni szlacheckich nie użyjesz do awansu żołnierzy na jazdę, do tego potrzebne są konie bojowe. Gracze polecają Askar, gdzie jest ich dużo.", tipSrc:"zb_st_noble" }
];

// Jak zdobyć najlepszy sprzęt: [tytuł, treść, źródło]
const ARMORY_HOW = [
  ["Cierpliwość w sklepach","Tier 6 trafia do sklepów rzadko i zwykle później w kampanii. Krąż po miastach kultury, która w danej kategorii wygrywa.","zb_st_late"],
  ["Miasta z warsztatami","Wg graczy lepszy sprzęt częściej jest tam, gdzie działa pasujący warsztat: stolarnia dla łuków i kusz, kuźnia dla ciężkich zbroi, garbarnia dla lekkich.","zb_st_shops"],
  ["Sprzęt rodziny","Żona lub mąż ze szlacheckiego rodu nosi sprzęt lorda. Gracze po ślubie po prostu przejmują go w ekwipunku.","zb_st_wife"],
  ["Kuźnia","Broń z kuźni przy wysokim kowalstwie bywa mocniejsza niż cokolwiek w sklepie.","zb_st_glaive"],
  ["Turnieje","Nagrodą bywa hełm albo broń warta kilka tysięcy. To najtańsze źródło dobrych hełmów na start.","zb_st_armorguide"]
];
