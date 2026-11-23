/* M&B Goat Guide: Banici i najemnicy, czyli wojsko spoza drzewek królestw.
   Wpis: [nazwa z gry (EN), po polsku, grupa (ban/mer/min), frakcja, tier (null = bd), rola (inf/rng/cav/ha),
          umiejętności [1R, 2R, Drzewce, Łuk, Kusza, Rzut, Jazda, Atletyka], ocena (ocena aplikacji),
          żołd (null = bd), awans do, uwaga, źródło]
   Umiejętności: GamerGuides (tabela wszystkich jednostek). Tiery i awanse: źródła przy grupach. */
const RB_GROUPS = {
  ban:{ n:"Bandyci", c:"var(--t-gules)", ic:"r_inf",
    how:"Bandytów nie zwerbujesz w osadzie. Pokonujesz ich bandę, bierzesz jeńców i po kilku dniach w niewoli możesz ich przyjąć do drużyny. Zbyt wielu bandytów obniża morale drużyny.", howSrc:"rb_mb" },
  mer:{ n:"Najemnicy z karczmy", c:"var(--t-or)", ic:"coin",
    how:"Najemników kupujesz w karczmach większości miast, czasem trafiają się też jako jeńcy. Płacisz im żołd półtora raza wyższy niż zwykłym żołnierzom.", howSrc:"rb_mb" },
  min:{ n:"Frakcje pomniejsze", c:"var(--t-purpure)", ic:"crown",
    how:"Każda linia ma trzy stopnie, od tieru 2 do 4. Jedyny sposób na pojedynczych żołnierzy: pokonać drużynę tej frakcji i wziąć jeńców. Zwykle po mapie jeździ tylko jedna ich drużyna, więc szukaj jej w encyklopedii. Jako władca możesz też wynająć cały klan jako najemników.", howSrc:"rb_minor" }
};
const RB = [
  /* ---- bandyci ---- */
  ["Looter","łupieżca","ban","Łupieżcy",1,"inf",[40,20,30,20,0,40,0,30],"D",null,"brak sensownego awansu","Rzucają kamieniami; mięso armatnie.","rb_stats"],
  ["Sea Raider","morski rabuś","ban","Morscy rabusie",2,"inf",[40,30,40,20,0,30,15,40],"D",null,"Sea Raider Warrior albo Sturgian Soldier","Najlepsze XP za zabicie wśród bandytów, ale rzucają oszczepami: lekarz obowiązkowy.","rb_paths"],
  ["Sea Raider Warrior","wojownik morskich rabusiów","ban","Morscy rabusie",3,"inf",[80,40,60,40,0,60,0,80],"C",5,"Sea Raider Chief albo Varyag Veteran (awans 100 denarów)","Tani i solidny jak na swój tier.","rb_srw"],
  ["Sea Raider Chief","herszt morskich rabusiów","ban","Morscy rabusie",4,"inf",[160,80,40,80,0,120,40,110],"A",null,"Sturgian Druzhinnik (szlachecka jazda)","1 ręka 160 i rzut 120: jeden z najmocniejszych piechurów spoza królestw. Gracze brali nim zamki.","rb_army"],
  ["Sea Raider Boss","szef morskich rabusiów","ban","Morscy rabusie",null,"inf",[140,150,50,50,20,60,80,130],"A",12,"nie awansuje","Świetny z bronią dwuręczną i w dobrej zbroi.","rb_srb"],
  ["Hillman","góral","ban","Bandyci górscy",2,"inf",[40,20,40,20,0,15,15,40],"D",null,"Brigand albo Vlandian Infantry","","rb_paths"],
  ["Brigand","zbój","ban","Bandyci górscy",3,"inf",[40,60,70,40,0,70,20,60],"C",null,"Vlandian Billman albo Highwayman","","rb_paths"],
  ["Highwayman","rozbójnik drogowy","ban","Bandyci górscy",4,"cav",[100,100,110,80,0,120,120,100],"A",null,"Vlandian Champion, potem Vlandian Banner Knight","Furtka do wlandzkich rycerzy bez szlacheckich rekrutów.","rb_trees2"],
  ["Mountain Bandit Boss","herszt górskich bandytów","ban","Bandyci górscy",null,"inf",[120,50,50,60,20,150,80,150],"A",null,"nie awansuje","Rzut 150 i atletyka 150.","rb_stats"],
  ["Bushwacker","leśny zasadzkowiec","ban","Bandyci leśni",2,"rng",[20,15,20,40,0,20,30,40],"D",null,"Freebooter albo Battanian Raider","","rb_paths"],
  ["Freebooter","wolny strzelec","ban","Bandyci leśni",3,"rng",[70,70,30,70,0,40,0,50],"C",null,"Forest Bandit albo Battanian Falxman","","rb_trees"],
  ["Forest Bandit","leśny bandyta","ban","Bandyci leśni",4,"rng",[120,80,80,150,0,80,0,110],"A",null,"Battanian Fian, potem Fian Champion","Łuk 150 już na tym etapie, a dalej najlepszy łucznik Battanii. Dla Twojego battańskiego klanu złoto.","rb_fians"],
  ["Forest Bandit Boss","herszt leśnych bandytów","ban","Bandyci leśni",null,"rng",[140,50,50,150,20,60,80,130],"A",null,"nie awansuje","Gracze: wyższe tiery leśnych bandytów mają jeden z najlepszych battańskich sprzętów.","rb_sea"],
  ["Bedouin Rover","beduiński włóczęga","ban","Bandyci pustynni",2,"inf",[30,10,40,20,0,0,20,20],"D",null,"Nomad Bandit albo Aserai Skirmisher","","rb_paths"],
  ["Nomad Bandit","koczowniczy bandyta","ban","Bandyci pustynni",null,"cav",[60,40,80,80,0,0,40,60],"C",null,"Aserai Mamluke Cavalry","","rb_blox"],
  ["Harami","harami, pustynny rozbójnik","ban","Bandyci pustynni",4,"cav",[100,80,120,40,0,100,80,100],"B",null,"Aserai Veteran Faris","Startuje od razu jako tier 4.","rb_paths"],
  ["Desert Bandit Boss","herszt pustynnych bandytów","ban","Bandyci pustynni",null,"cav",[160,50,130,50,20,60,80,130],"B",null,"nie awansuje","","rb_stats"],
  ["Steppe Bandit","stepowy bandyta","ban","Bandyci stepowi",2,"ha",[30,30,40,0,0,20,40,20],"D",null,"Marauder albo Khuzait Raider","","rb_paths"],
  ["Marauder","maruder","ban","Bandyci stepowi",3,"ha",[70,40,80,80,0,40,100,40],"C",null,"Raider albo Khuzait Lancer","","rb_paths"],
  ["Raider","stepowy grasant","ban","Bandyci stepowi",4,"ha",[110,50,100,100,0,60,100,60],"B",null,"Khuzait Kheshig","Konny łucznik z drogą do huzajskiej elity.","rb_paths"],
  ["Steppe Bandit Boss","herszt stepowych bandytów","ban","Bandyci stepowi",null,"ha",[80,40,140,160,20,60,100,80],"A",null,"nie awansuje","Łuk 160 z konia.","rb_stats"],
  ["Deserter","dezerter","ban","Inni",null,"inf",[40,10,20,15,0,30,30,40],"D",null,"bd","Słaby; wpada z zadań i bitew.","rb_stats"],
  ["Poacher","kłusownik","ban","Inni",null,"rng",[50,50,30,90,90,45,0,70],"C",null,"bd","Łuk i kusza po 90.","rb_stats"],

  /* ---- najemnicy ---- */
  ["Watchman","strażnik","mer","Drzewko najemników",2,"inf",[40,20,40,5,20,15,15,40],"D",3,"Mercenary Guard albo Mercenary Scout (25 denarów)","Początek drzewka najemników.","rb_watch"],
  ["Mercenary Guard","najemny wartownik","mer","Drzewko najemników",null,"inf",[70,40,40,30,30,70,20,60],"C",null,"bd","","rb_stats"],
  ["Mercenary Swordsman","najemny miecznik","mer","Drzewko najemników",null,"inf",[100,70,90,45,25,60,35,100],"B",null,"bd","","rb_stats"],
  ["Hired Blade","wynajęte ostrze","mer","Drzewko najemników",null,"inf",[130,80,100,60,40,20,130,130],"A",null,"bd","Wszechstronny piechur z jazdą 130.","rb_stats"],
  ["Mercenary Crossbowman","najemny kusznik","mer","Drzewko najemników",null,"rng",[90,45,45,15,110,60,60,100],"B",null,"bd","","rb_stats"],
  ["Hired Crossbow","wynajęty kusznik","mer","Drzewko najemników",null,"rng",[140,70,60,80,140,50,30,120],"A",null,"bd","Kusza 140 i mocny w walce wręcz.","rb_stats"],
  ["Mercenary Scout","najemny zwiadowca","mer","Drzewko najemników",null,"cav",[70,10,60,30,30,30,70,60],"C",null,"bd","","rb_stats"],
  ["Mercenary Horseman","najemny jeździec","mer","Drzewko najemników",null,"cav",[90,45,100,60,15,30,110,45],"B",null,"bd","","rb_stats"],
  ["Mercenary Cavalry","najemna jazda","mer","Drzewko najemników",null,"cav",[130,80,130,60,20,60,130,80],"A",null,"bd","Drzewce 130 i jazda 130.","rb_stats"],

  /* ---- frakcje pomniejsze (linie mają 3 stopnie, tier 2 do 4) ---- */
  ["Lake Rat Recruit","rekrut Jeziornych Szczurów","min","Jeziorne Szczury (Lake Rats, Sturgia)",2,"inf",[40,40,40,5,20,15,15,20],"D",3,"Lake Rat Veteran (50 denarów)","","rb_lakerec"],
  ["Lake Rat Veteran","weteran Jeziornych Szczurów","min","Jeziorne Szczury (Lake Rats, Sturgia)",3,"inf",[30,40,70,40,10,80,30,60],"C",null,"Lake Rat Wrecker","","rb_stats"],
  ["Lake Rat Wrecker","niszczyciel statków","min","Jeziorne Szczury (Lake Rats, Sturgia)",4,"inf",[100,60,110,45,15,110,30,55],"A",8,"szczyt linii","Drzewce 110 i rzut 110: walczą bronią drzewcową i miotaną, stąd oszczepy, które widziałeś. Wiki: jedna z najlepszych piechot frakcji pomniejszych, świetna zbroja.","rb_lake"],
  ["Triarii","triarius","min","Legion Zdradzonych (Legion of the Betrayed)",4,"inf",[100,50,100,45,15,80,45,90],"A",8,"szczyt linii","Gracze: najtańszy dobry garnizon, 8 denarów dziennie, świetna jedna ręka i tarcza.","rb_triarii"],
  ["Chosen Wolf","wybrany wilk","min","Wilcze Skóry (Wolfskins, Battania)",4,"rng",[110,50,30,130,15,15,25,120],"A",null,"szczyt linii","Łuk 130 i mocna walka wręcz.","rb_blox"],
  ["Jawwal Bedouin","beduin Dżawwal","min","Dżawwal (Jawwal, Aserajowie)",4,"cav",[80,60,130,40,20,140,80,130],"A",null,"szczyt linii","Rzut 140: najlepszy miotacz wśród frakcji pomniejszych.","rb_blox"],
  ["Beni Zilal Royal Guard","gwardia Beni Zilal","min","Beni Zilal (Aserajowie)",4,"cav",[60,15,110,25,15,95,110,65],"B",null,"szczyt linii","","rb_blox"],
  ["Ghulam","ghulam","min","Ghilman",4,"cav",[90,50,110,15,35,45,100,80],"B",null,"szczyt linii","","rb_stats"],
  ["Veteran Eleftheroi","weteran Eleftheroi","min","Eleftheroi",4,"cav",[100,60,100,45,15,60,100,45],"B",null,"szczyt linii","","rb_stats"],
  ["Karakhuzait Elder","starszy Karakhuzajtów","min","Karakhuzajci (Karakhergit)",4,"ha",[100,45,45,110,15,60,100,60],"B",null,"szczyt linii","Konny łucznik z łukiem 110.","rb_stats"],
  ["Boar Champion","czempion Złotego Dzika","min","Kompania Złotego Dzika (Golden Boar)",4,"rng",[100,60,45,45,100,100,15,60],"B",null,"szczyt linii","Kusza 100 i rzut 100.","rb_stats"],
  ["Skolder Veteran Broda","weteran Skolderów","min","Skolderbrotva",4,"inf",[110,60,110,40,15,100,30,60],"B",null,"szczyt linii","Podobny do Jeziornych Szczurów: drzewce i rzut.","rb_stats"],
  ["Redshank","redshank","min","Skene",4,"rng",[100,60,45,60,15,120,45,80],"B",null,"szczyt linii","Rzut 120.","rb_stats"],
  ["Blaze","płomień","min","Żar Płomienia (Embers of the Flame)",4,"inf",[130,45,45,70,15,60,60,100],"B",null,"szczyt linii","Najlepsza jedna ręka wśród frakcji pomniejszych (130).","rb_stats"],
  ["Puppeteer","lalkarz","min","Ukryta Dłoń (Hidden Hand)",4,"inf",[100,65,40,45,25,100,50,100],"B",null,"szczyt linii","","rb_stats"],
  ["Veteran Forester","weteran leśników","min","Leśnicy (Forester)",4,"rng",[90,45,45,100,15,60,60,110],"B",null,"szczyt linii","","rb_stats"],
  ["Veteran Guardian","weteran strażników","min","Strażnicy (Guardians)",4,"rng",[100,45,45,100,15,60,60,100],"B",null,"szczyt linii","","rb_stats"],
  ["Arboreal","arboreal","min","Bractwo Lasu (Brotherhood of the Woods)",4,"rng",[90,45,45,100,15,60,60,110],"B",null,"szczyt linii","","rb_stats"]
];

// Ścieżki od bandyty do elity królestwa: [skąd, przez, dokąd (nazwa jednostki w aplikacji), opis, źródło]
const RB_PATHS = [
  ["Forest Bandit","","Battanian Fian Champion","Leśny bandyta awansuje na Fiana, najlepszego łucznika Battanii.","rb_trees"],
  ["Highwayman","Vlandian Champion","Vlandian Banner Knight","Rozbójnik drogowy prowadzi do wlandzkich rycerzy chorągwi.","rb_trees2"],
  ["Sea Raider Chief","","Sturgian Druzhinnik Champion","Herszt morskich rabusiów prowadzi do sturgijskiej drużyny.","rb_trees2"],
  ["Raider","","Khuzait Kheshig","Stepowy grasant awansuje na kheshiga.","rb_paths"],
  ["Harami","","Aserai Veteran Faris","Harami prowadzi do aserajskiego farisa.","rb_blox"],
  ["Corsair Chief","","Aserai Bahriyyah","Korsarze z War Sails prowadzą do aserajskich żołnierzy morskich.","rb_blox"]
];

// Porady: [tytuł, treść, źródło]
const RB_TIPS = [
  ["Pojedynek z hersztem","W kryjówce wygraj pojedynek z hersztem: wszyscy bandyci, którzy za nim stoją, trafiają do Ciebie jako jeńcy.","rb_duel"],
  ["Awans na żołnierzy królestwa","Starsze poradniki podają, że do awansu bandytów na zwykłe jednostki potrzebny jest perk Disciplinarian (Przywództwo 125). Sprawdź w grze, czy w 1.5 nadal tak jest.","rb_disc"],
  ["Herszt nie awansuje","Szefowie i herszci band (Boss) są mocni od razu, ale nie da się ich już ulepszyć.","rb_paths"],
  ["Morale","Zbyt wielu bandytów w drużynie obniża morale, więc dorzucaj ich z umiarem.","rb_mb"]
];
