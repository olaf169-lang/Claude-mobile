/* ==========================================================================
   Wykonawcy, od których zbieramy utwory do katalogu.
   --------------------------------------------------------------------------
   Po co w ogóle lista wykonawców, a nie lista piosenek: rok wydania to w tej
   grze mechanika, nie ozdoba („lata 80.” to filtr tematu rundy), a przepisywany
   z pamięci bywa o rok czy dwa obok. Nazwa zespołu i epoka, w której grał, to
   natomiast fakt trudny do pomylenia. Więc tutaj trzymamy wykonawców, a tytuły,
   lata i podglądy dociąga narzedzia/zbierz-kandydatow.mjs ze sklepu, stamtąd
   rok jest taki, jaki wydawca wpisał przy wydaniu.

   Listy mają dawać pokrycie WSZYSTKICH dekad w każdej kategorii, bo plan
   rozbudowy (narzedzia/plan-katalogu.mjs) dokłada utwory do koszyków
   dekada × kategoria, a nie do kategorii na raz. Dekada przy nazwiskach jest
   tylko wskazówką dla człowieka, przydział do koszyka robi rok ze sklepu.

   Kategorii specjalnych (Disney, Szybcy i wściekli, szanty) tu nie ma: to wąskie
   tematy, w których liczy się przypisanie do filmu czy nurtu, a nie dorobek
   wykonawcy. Rosną ręcznie. Tak samo „filmowa”, tam utwór musi mieć film,
   więc zbiera się ją osobnym trybem (po ścieżkach dźwiękowych).

   Kogo tu świadomie NIE MA, choć pasowałby do epoki: wykonawców, których
   dorobek w sklepie to niemal wyłącznie ponowne nagrania dawnych przebojów.
   Karin Stanek, Petula Clark, Anita Ward i Lulu wracały po każdej dosypce
   z nagraniami z lat 2005-2015 pod utwory z lat 60., czyli w złej dekadzie,
   a jedno „Lulu” w sklepie to w ogóle inna artystka. Ich dobre utwory są już
   w katalogu, pytanie o nich sklepu dokłada tylko śmieci.
   ========================================================================== */

export const WYKONAWCY = {
  pop: [
    // lata 60.
    'The Beach Boys', 'The Supremes', 'Dusty Springfield',     'The Monkees', 'Frankie Valli', 'Tom Jones', 'Cilla Black',
    "Herman's Hermits", 'The Mamas & the Papas', 'Sandie Shaw',     'Gene Pitney', 'Bobby Vinton', 'Connie Francis', 'Paul Anka',
    'Neil Sedaka', 'Roy Orbison', 'The Turtles', 'The Hollies',
    // lata 70.
    'ABBA', 'Bee Gees', 'Elton John', 'Carpenters', 'Olivia Newton-John',
    'Barry Manilow', 'Neil Diamond', 'Cat Stevens', 'Carole King', '10cc',
    'Leo Sayer', 'Gilbert O’Sullivan', 'Chicago', 'America',
    // lata 80.
    'Madonna', 'Cyndi Lauper', 'Wham!', 'George Michael', 'Lionel Richie',
    'Tiffany', 'Debbie Gibson', 'Belinda Carlisle', 'Rick Astley',
    'Kim Wilde', 'Bananarama', 'a-ha', 'Spandau Ballet', 'Culture Club',
    'Howard Jones', 'Nik Kershaw', 'Paul Young', 'Billy Ocean',
    // lata 90.
    'Mariah Carey', 'Backstreet Boys', 'Spice Girls', 'Celine Dion',
    'Boyzone', 'Take That', 'All Saints', 'Savage Garden', 'Robbie Williams',
    'Natalie Imbruglia', 'Christina Aguilera', 'Jennifer Lopez',
    'Ricky Martin', 'Steps', '*NSYNC', 'Hanson',
    // lata 2000.
    'Kylie Minogue', 'Pink', 'Avril Lavigne', 'Kelly Clarkson',
    'Justin Timberlake', 'Nelly Furtado', 'Gwen Stefani', 'James Blunt',
    'Maroon 5', 'Sugababes', 'Girls Aloud', 'Leona Lewis', 'Mika',
    'Natasha Bedingfield', 'Daniel Powter', 'KT Tunstall',
    // lata 2010.
    'Taylor Swift', 'Ed Sheeran', 'Adele', 'Bruno Mars', 'Sam Smith',
    'Ariana Grande', 'Shawn Mendes', 'Dua Lipa', 'Charlie Puth', 'Halsey',
    'Camila Cabello', 'Zara Larsson', 'Troye Sivan', 'Lorde', 'Sia',
    'Meghan Trainor', 'Ellie Goulding', 'Jess Glynne', 'Years & Years',
    // lata 2020.
    'Olivia Rodrigo', 'Harry Styles', 'Doja Cat', 'Billie Eilish', 'Lizzo',
    'Tate McRae', 'Sabrina Carpenter', 'Chappell Roan', 'Benson Boone',
    'Gracie Abrams', 'Conan Gray', 'Lewis Capaldi', 'Teddy Swims',
    'Noah Kahan', 'Role Model',
  ],

  rock: [
    // lata 60.
    'The Rolling Stones', 'The Who', 'The Kinks', 'The Doors',
    'The Jimi Hendrix Experience', 'Cream', 'The Animals',
    'Creedence Clearwater Revival', 'The Byrds', 'Jefferson Airplane',
    'Buffalo Springfield', 'The Yardbirds', 'The Troggs', 'Steppenwolf',
    'The Beatles', 'Small Faces',
    // lata 70.
    'Led Zeppelin', 'Pink Floyd', 'Deep Purple', 'Black Sabbath', 'Queen',
    'Aerosmith', 'Fleetwood Mac', 'Eagles', 'Lynyrd Skynyrd', 'David Bowie',
    'T. Rex', 'Thin Lizzy', 'Rush', 'Boston', 'Kansas', 'Styx', 'Foreigner',
    'Bad Company', 'AC/DC', 'The Clash', 'Ramones', 'Sex Pistols',
    'Blue Öyster Cult', 'ZZ Top', 'Supertramp', 'Electric Light Orchestra',
    // lata 80.
    'Bon Jovi', "Guns N' Roses", 'Def Leppard', 'Van Halen', 'Metallica',
    'Iron Maiden', 'Scorpions', 'Europe', 'Journey', 'Toto', 'The Police',
    'U2', 'R.E.M.', 'The Cure', 'Dire Straits', 'Bryan Adams', 'Survivor',
    'Twisted Sister', 'Mötley Crüe', 'Whitesnake', 'Poison',
    'Tears for Fears', 'INXS', 'Talking Heads', 'The Smiths', 'Simple Minds',
    // lata 90.
    'Nirvana', 'Pearl Jam', 'Soundgarden', 'Alice in Chains',
    'Red Hot Chili Peppers', 'Oasis', 'Blur', 'Radiohead',
    'The Smashing Pumpkins', 'Green Day', 'The Offspring',
    'Rage Against the Machine', 'Bush', 'Stone Temple Pilots', 'Weezer',
    'Foo Fighters', 'Garbage', 'No Doubt', 'Collective Soul',
    'Marilyn Manson', 'Korn', 'Deftones', 'Alanis Morissette', 'The Cranberries',
    // lata 2000.
    'Linkin Park', 'Coldplay', 'Muse', 'The Killers', 'Arctic Monkeys',
    'The White Stripes', 'Franz Ferdinand', 'Kings of Leon',
    'System of a Down', 'Evanescence', 'Nickelback', 'Three Days Grace',
    'My Chemical Romance', 'Fall Out Boy', 'Paramore', 'Panic! at the Disco',
    'Audioslave', 'Queens of the Stone Age', 'Interpol', 'The Strokes',
    'Snow Patrol', 'Keane', 'Placebo', 'Sum 41', 'Good Charlotte',
    // lata 2010.
    'Imagine Dragons', 'Twenty One Pilots', 'Royal Blood', 'alt-J',
    'The 1975', 'Of Monsters and Men', 'Bastille', 'Greta Van Fleet',
    'Nothing But Thieves', 'Arcade Fire', 'Vampire Weekend',
    'Mumford & Sons', 'Florence + the Machine', 'Kaleo', 'Cage the Elephant',
    'The Black Keys',
    // lata 2020.
    'Måneskin', 'Wet Leg', 'Turnstile', 'IDLES', 'Fontaines D.C.',
    'Sleep Token', 'Bad Omens', 'Spiritbox', 'Yungblud', 'Inhaler',
  ],

  rap: [
    // lata 80.
    'Run-DMC', 'Beastie Boys', 'Public Enemy', 'LL Cool J',
    'Grandmaster Flash & The Furious Five', 'Eric B. & Rakim', 'Salt-N-Pepa',
    'Kurtis Blow', 'Boogie Down Productions', 'N.W.A', 'Big Daddy Kane',
    'Slick Rick', 'De La Soul', 'Rob Base & DJ E-Z Rock',
    // lata 90.
    '2Pac', 'The Notorious B.I.G.', 'Nas', 'Wu-Tang Clan', 'Dr. Dre',
    'Snoop Dogg', 'A Tribe Called Quest', 'Cypress Hill', 'Busta Rhymes',
    'Method Man', 'Gang Starr', 'Mobb Deep', 'Bone Thugs-n-Harmony',
    'Coolio', 'Naughty by Nature', 'House of Pain', 'Warren G', 'Ice Cube',
    'Fugees', 'Lauryn Hill', 'Missy Elliott', 'DMX', 'JAY-Z', 'OutKast',
    'Eminem', 'Redman', 'Nate Dogg',
    // lata 2000.
    '50 Cent', 'Kanye West', 'Ludacris', 'Nelly', 'T.I.', 'Lil Wayne',
    'The Game', 'Young Jeezy', 'Chamillionaire', 'Fat Joe', 'Fabolous',
    'Common', 'Talib Kweli', 'Mos Def', 'Clipse', 'Three 6 Mafia',
    'Chingy', 'Twista', 'Lupe Fiasco', 'Rick Ross', 'Flo Rida', 'Akon',
    // lata 2010.
    'Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Future',
    'Big Sean', 'A$AP Rocky', 'Tyler, The Creator', 'Chance the Rapper',
    'Migos', '21 Savage', 'Post Malone', 'Logic', 'Macklemore',
    'Wiz Khalifa', 'Meek Mill', '2 Chainz', 'ScHoolboy Q', 'Joey Bada$$',
    'Danny Brown', 'Vince Staples', 'Childish Gambino', 'Nicki Minaj',
    'Cardi B', 'Lil Uzi Vert', 'Rae Sremmurd',
    // lata 2020.
    'Lil Baby', 'Jack Harlow', 'Roddy Ricch', 'Pop Smoke', 'Lil Nas X',
    'Megan Thee Stallion', 'Latto', 'GloRilla', 'Central Cee', 'Dave',
    'Ice Spice', 'Playboi Carti', 'Don Toliver', 'Gunna', 'Metro Boomin',
    'Baby Keem', 'Doechii',
  ],

  dance: [
    // lata 70., disco
    'Donna Summer', 'CHIC', 'Giorgio Moroder', 'Village People',
    'Sister Sledge', 'KC & The Sunshine Band', 'Boney M.', 'Gloria Gaynor',
    'The Trammps', 'Baccara', 'Silver Convention',
    'Amii Stewart', 'Tavares', 'Kraftwerk', 'Hot Chocolate',
    // lata 80.
    'New Order', 'Pet Shop Boys', 'Depeche Mode', 'Erasure', 'Soft Cell',
    'Yazoo', 'Dead or Alive', 'Technotronic', 'Black Box', 'Modern Talking',
    'C.C. Catch', 'Sabrina', 'Samantha Fox', 'Laura Branigan',
    'Bronski Beat', 'Frankie Goes to Hollywood', 'The Human League',
    'Information Society', 'Lime',
    // lata 90.
    'Snap!', '2 Unlimited', 'Haddaway', 'Ace of Base', 'La Bouche',
    'Robert Miles', 'Faithless', 'The Prodigy', 'The Chemical Brothers',
    'Fatboy Slim', 'Daft Punk', 'Underworld', 'Darude', 'ATB', 'Sash!',
    'Scooter', 'Culture Beat', 'Corona', 'Eiffel 65', 'Vengaboys', 'Aqua',
    'Alice Deejay', 'Mr. President', 'DJ BoBo', 'Paul van Dyk', 'Moby',
    // lata 2000.
    'David Guetta', 'Basshunter', 'Benny Benassi', 'Bob Sinclar',
    'Armin van Buuren', 'deadmau5', 'Eric Prydz', 'Tiësto',
    'Ian Van Dahl', 'Milk Inc.', 'Lasgo', 'Fragma', 'Safri Duo',
    'Cascada', 'Groove Coverage', 'Infernal', 'Sandra',
    // lata 2010.
    'Avicii', 'Calvin Harris', 'Martin Garrix', 'Zedd', 'Skrillex',
    'Major Lazer', 'Alesso', 'Afrojack', 'Hardwell', 'Robin Schulz',
    'Kygo', 'Marshmello', 'The Chainsmokers', 'Alan Walker', 'DJ Snake',
    'Galantis', 'Clean Bandit', 'Disclosure', 'Duke Dumont', 'Jonas Blue',
    'Swedish House Mafia',
    // lata 2020.
    'Fred again..', 'Peggy Gou', 'John Summit', 'Dom Dolla', 'Joel Corry',
    'MEDUZA', 'Regard', 'Purple Disco Machine', 'Sofi Tukker', 'FISHER',
    'Acraze',
  ],

  rnb: [
    // lata 60., soul
    'Aretha Franklin', 'Otis Redding', 'Marvin Gaye', 'Sam Cooke',
    'Wilson Pickett', 'James Brown', 'Stevie Wonder', 'The Temptations',
    'Four Tops', 'Smokey Robinson & The Miracles', 'Ben E. King',
    'Percy Sledge', 'Solomon Burke', 'Etta James', 'Mary Wells',
    'Martha Reeves & The Vandellas', "Booker T. & the M.G.'s",
    'Jackie Wilson', 'Ray Charles', 'The Impressions', 'Carla Thomas',
    'Eddie Floyd', 'Sam & Dave',
    // lata 70.
    'Al Green', 'Barry White', 'Bill Withers', 'The Isley Brothers',
    'Earth, Wind & Fire', 'Kool & The Gang', "The O'Jays", 'Commodores',
    'Teddy Pendergrass', 'Gladys Knight & The Pips', 'Diana Ross',
    'Minnie Riperton', 'Roberta Flack', 'Tower of Power', 'Parliament',
    'Funkadelic', 'Chaka Khan', 'The Jackson 5', 'The Spinners',
    // lata 80.
    'Luther Vandross', 'Anita Baker', 'Freddie Jackson',
    'Alexander O’Neal', 'Cameo', 'The S.O.S. Band', 'The Gap Band',
    'Rick James', 'Prince', 'Sade', 'Janet Jackson', 'New Edition',
    'Cheryl Lynn', 'Chaka Demus',
    // lata 90.
    'Boyz II Men', 'TLC', 'En Vogue', 'SWV', 'Mary J. Blige', 'R. Kelly',
    'Toni Braxton', 'Brandy', 'Monica', 'Aaliyah', 'Blackstreet', 'Jodeci',
    'Dru Hill', 'Erykah Badu', "D'Angelo", 'Maxwell', "Destiny's Child",
    '112', 'Ginuwine', 'Montell Jordan',
    // lata 2000.
    'Alicia Keys', 'Beyoncé', 'Usher', 'John Legend', 'Ne-Yo',
    'Chris Brown', 'Mario', 'Omarion', 'Keyshia Cole', 'Amerie', 'Ashanti',
    'Jill Scott', 'Musiq Soulchild', 'India.Arie', 'Trey Songz', 'Craig David',
    // lata 2010.
    'Frank Ocean', 'The Weeknd', 'Miguel', 'SZA', 'Daniel Caesar', 'H.E.R.',
    'Khalid', 'Jhené Aiko', 'Bryson Tiller', 'Kehlani',
    'Anderson .Paak', 'Leon Bridges', 'Solange', 'Janelle Monáe',
    'Tinashe', 'Alina Baraz',
    // lata 2020.
    'Giveon', 'Summer Walker', 'Lucky Daye', 'Victoria Monét',
    'Muni Long', 'Coco Jones', 'Brent Faiyaz', 'Steve Lacy', 'Tems',
    'Ari Lennox', 'Cleo Sol',
  ],

  country: [
    // lata 60.
    'Johnny Cash', 'Patsy Cline', 'Buck Owens', 'Loretta Lynn',
    'Marty Robbins', 'Jim Reeves', 'George Jones', 'Tammy Wynette',
    'Glen Campbell', 'Roger Miller', 'Bob Dylan', 'Simon & Garfunkel',
    'Joan Baez', 'Peter, Paul and Mary',
    // lata 70.
    'Dolly Parton', 'Willie Nelson', 'Waylon Jennings', 'Kenny Rogers',
    'Charlie Rich', 'Crystal Gayle', 'Emmylou Harris', 'Conway Twitty',
    'Merle Haggard', 'John Denver', 'Linda Ronstadt', 'Joni Mitchell',
    'James Taylor', 'Gordon Lightfoot', 'Jim Croce',
    // lata 80.
    'Alabama', 'George Strait', 'Randy Travis', 'Reba McEntire',
    'Ricky Skaggs', 'The Judds', 'Hank Williams Jr.', 'Dwight Yoakam',
    'Earl Thomas Conley', 'Rosanne Cash',
    // lata 90.
    'Garth Brooks', 'Alan Jackson', 'Shania Twain', 'Faith Hill',
    'Tim McGraw', 'Brooks & Dunn', 'Vince Gill', 'Trisha Yearwood',
    'Martina McBride', 'Clint Black', 'The Chicks', 'Toby Keith',
    'LeAnn Rimes', 'Mary Chapin Carpenter',
    // lata 2000.
    'Keith Urban', 'Carrie Underwood', 'Brad Paisley', 'Rascal Flatts',
    'Kenny Chesney', 'Sugarland', 'Dierks Bentley', 'Miranda Lambert',
    'Lady A', 'Josh Turner', 'Gretchen Wilson', 'Big & Rich',
    'Alison Krauss', 'Gillian Welch',
    // lata 2010.
    'Luke Bryan', 'Jason Aldean', 'Florida Georgia Line', 'Blake Shelton',
    'Chris Stapleton', 'Kacey Musgraves', 'Sam Hunt', 'Thomas Rhett',
    'Maren Morris', 'Old Dominion', 'Zac Brown Band', 'Eric Church',
    'Little Big Town', 'Dan + Shay', 'The Lumineers', 'Fleet Foxes',
    'Bon Iver', 'Iron & Wine',
    // lata 2020.
    'Morgan Wallen', 'Luke Combs', 'Zach Bryan', 'Lainey Wilson',
    'Jelly Roll', 'Megan Moroney', 'Bailey Zimmerman', 'Cody Johnson',
    'Ashley McBryde', 'Tyler Childers',
  ],

  // Polskie mają dodatkowo „styl”, to on dobiera błędne odpowiedzi wewnątrz
  // kategorii (patrz podobienstwo() w js/gra.js), bo sama etykieta „polskie”
  // zbiera i rock, i rap, i disco polo.
  polskie: [
    // lata 60.
    { nazwa: 'Czerwone Gitary', styl: 'rock' },
    { nazwa: 'Niebiesko-Czarni', styl: 'rock' },
    { nazwa: 'Skaldowie', styl: 'rock' },
    { nazwa: 'Czesław Niemen', styl: 'rock' },
    { nazwa: 'Breakout', styl: 'rock' },
    { nazwa: 'Trubadurzy', styl: 'pop' },
    { nazwa: 'Filipinki', styl: 'pop' },
    { nazwa: 'Helena Majdaniec', styl: 'pop' },
    { nazwa: 'Katarzyna Sobczyk', styl: 'pop' },
    { nazwa: 'Jerzy Połomski', styl: 'pop' },
    { nazwa: 'Violetta Villas', styl: 'pop' },
    { nazwa: 'Ewa Demarczyk', styl: 'pop' },
    { nazwa: 'Kalina Jędrusik', styl: 'pop' },
    // lata 70.
    { nazwa: 'SBB', styl: 'rock' },
    { nazwa: 'Budka Suflera', styl: 'rock' },
    { nazwa: 'Anna Jantar', styl: 'pop' },
    { nazwa: 'Maryla Rodowicz', styl: 'pop' },
    { nazwa: 'Andrzej Dąbrowski', styl: 'pop' },
    { nazwa: 'Krzysztof Krawczyk', styl: 'pop' },
    { nazwa: 'Halina Frąckowiak', styl: 'pop' },
    { nazwa: 'Zdzisława Sośnicka', styl: 'pop' },
    { nazwa: 'Irena Jarocka', styl: 'pop' },
    { nazwa: '2 plus 1', styl: 'pop' },
    { nazwa: 'Vox', styl: 'pop' },
    { nazwa: 'Alibabki', styl: 'pop' },
    { nazwa: 'Zbigniew Wodecki', styl: 'pop' },
    { nazwa: 'Krzak', styl: 'rock' },
    { nazwa: 'Exodus', styl: 'rock' },
    // lata 80.
    { nazwa: 'Perfect', styl: 'rock' },
    { nazwa: 'Maanam', styl: 'rock' },
    { nazwa: 'Lady Pank', styl: 'rock' },
    { nazwa: 'Republika', styl: 'rock' },
    { nazwa: 'Lombard', styl: 'rock' },
    { nazwa: 'TSA', styl: 'rock' },
    { nazwa: 'Kombi', styl: 'pop' },
    { nazwa: 'Oddział Zamknięty', styl: 'rock' },
    { nazwa: 'Kult', styl: 'rock' },
    { nazwa: 'Dżem', styl: 'rock' },
    { nazwa: 'Turbo', styl: 'rock' },
    { nazwa: 'Bajm', styl: 'pop' },
    { nazwa: 'Papa Dance', styl: 'dance' },
    { nazwa: 'Kobranocka', styl: 'rock' },
    { nazwa: 'Brygada Kryzys', styl: 'rock' },
    { nazwa: 'Aya RL', styl: 'rock' },
    { nazwa: 'Urszula', styl: 'pop' },
    { nazwa: 'Izabela Trojanowska', styl: 'pop' },
    { nazwa: 'Big Cyc', styl: 'rock' },
    { nazwa: 'Armia', styl: 'rock' },
    { nazwa: 'Siekiera', styl: 'rock' },
    { nazwa: 'Sztywny Pal Azji', styl: 'rock' },
    { nazwa: 'Klaus Mitffoch', styl: 'rock' },
    // lata 90.
    { nazwa: 'Hey', styl: 'rock' },
    { nazwa: 'Varius Manx', styl: 'pop' },
    { nazwa: 'Wilki', styl: 'rock' },
    { nazwa: 'Myslovitz', styl: 'rock' },
    { nazwa: 'Edyta Bartosiewicz', styl: 'rock' },
    { nazwa: 'Kasia Kowalska', styl: 'pop' },
    { nazwa: 'Justyna Steczkowska', styl: 'pop' },
    { nazwa: 'Edyta Górniak', styl: 'pop' },
    { nazwa: 'Natalia Kukulska', styl: 'pop' },
    { nazwa: 'Golden Life', styl: 'rock' },
    { nazwa: 'Illusion', styl: 'rock' },
    { nazwa: 'Acid Drinkers', styl: 'rock' },
    { nazwa: 'Kazik', styl: 'rock' },
    { nazwa: 'Elektryczne Gitary', styl: 'rock' },
    { nazwa: 'O.N.A.', styl: 'rock' },
    { nazwa: 'Chłopcy z Placu Broni', styl: 'rock' },
    { nazwa: 'Róże Europy', styl: 'rock' },
    { nazwa: 'Kaliber 44', styl: 'rap' },
    { nazwa: 'Liroy', styl: 'rap' },
    { nazwa: 'Paktofonika', styl: 'rap' },
    { nazwa: 'Molesta Ewenement', styl: 'rap' },
    { nazwa: 'Formacja Nieżywych Schabuff', styl: 'rock' },
    // lata 2000.
    { nazwa: 'Ich Troje', styl: 'pop' },
    { nazwa: 'Łzy', styl: 'pop' },
    { nazwa: 'Feel', styl: 'pop' },
    { nazwa: 'Virgin', styl: 'pop' },
    { nazwa: 'Sistars', styl: 'rnb' },
    { nazwa: 'Ania Dąbrowska', styl: 'pop' },
    { nazwa: 'Kayah', styl: 'pop' },
    { nazwa: 'Mezo', styl: 'rap' },
    { nazwa: 'Sidney Polak', styl: 'rock' },
    { nazwa: 'Pidżama Porno', styl: 'rock' },
    { nazwa: 'Strachy na Lachy', styl: 'rock' },
    { nazwa: 'Lao Che', styl: 'rock' },
    { nazwa: 'Coma', styl: 'rock' },
    { nazwa: 'Hunter', styl: 'rock' },
    { nazwa: 'Peja', styl: 'rap' },
    { nazwa: 'O.S.T.R.', styl: 'rap' },
    { nazwa: 'Pezet', styl: 'rap' },
    { nazwa: 'Fisz Emade Tworzywo', styl: 'rap' },
    { nazwa: 'Afromental', styl: 'pop' },
    { nazwa: 'Zakopower', styl: 'pop' },
    { nazwa: 'Raz Dwa Trzy', styl: 'pop' },
    { nazwa: 'Grzegorz Turnau', styl: 'pop' },
    { nazwa: 'Andrzej Piaseczny', styl: 'pop' },
    { nazwa: 'Patrycja Markowska', styl: 'rock' },
    { nazwa: 'Blue Café', styl: 'pop' },
    // lata 2010.
    { nazwa: 'Dawid Podsiadło', styl: 'pop' },
    { nazwa: 'Taco Hemingway', styl: 'rap' },
    { nazwa: 'Kortez', styl: 'pop' },
    { nazwa: 'Sarsa', styl: 'pop' },
    { nazwa: 'Mrozu', styl: 'pop' },
    { nazwa: 'Natalia Nykiel', styl: 'pop' },
    { nazwa: 'Rasmentalism', styl: 'rap' },
    { nazwa: 'Quebonafide', styl: 'rap' },
    { nazwa: 'Bedoes', styl: 'rap' },
    { nazwa: 'Kwiat Jabłoni', styl: 'pop' },
    { nazwa: 'Daria Zawiałow', styl: 'pop' },
    { nazwa: 'Organek', styl: 'rock' },
    { nazwa: 'LemON', styl: 'pop' },
    { nazwa: 'Enej', styl: 'pop' },
    { nazwa: 'Łąki Łan', styl: 'rock' },
    { nazwa: 'Brodka', styl: 'pop' },
    { nazwa: 'Król', styl: 'rock' },
    { nazwa: 'Bitamina', styl: 'rap' },
    { nazwa: 'Ralph Kaminski', styl: 'pop' },
    { nazwa: 'Krzysztof Zalewski', styl: 'rock' },
    { nazwa: 'Happysad', styl: 'rock' },
    { nazwa: 'Łona i Webber', styl: 'rap' },
    { nazwa: 'PRO8L3M', styl: 'rap' },
    { nazwa: 'Margaret', styl: 'pop' },
    { nazwa: 'Cleo', styl: 'pop' },
    // lata 2020.
    { nazwa: 'sanah', styl: 'pop' },
    { nazwa: 'Mata', styl: 'rap' },
    { nazwa: 'Vito Bambino', styl: 'pop' },
    { nazwa: 'Oki', styl: 'rap' },
    { nazwa: 'Young Leosia', styl: 'rap' },
    { nazwa: 'Smolasty', styl: 'rap' },
    { nazwa: 'Białas', styl: 'rap' },
    { nazwa: 'Szczył', styl: 'rap' },
    { nazwa: 'Guzior', styl: 'rap' },
    { nazwa: 'Otsochodzi', styl: 'rap' },
    { nazwa: 'Natalia Szroeder', styl: 'pop' },
    { nazwa: 'Roksana Węgiel', styl: 'pop' },
    { nazwa: 'Michał Szpak', styl: 'pop' },
    { nazwa: 'Igo', styl: 'pop' },
    { nazwa: 'Julia Wieniawa', styl: 'pop' },
  ],
};

/** Lista w jednym kształcie, niezależnie od tego, czy wpis to napis czy obiekt. */
export const wykonawcyKategorii = (kategoria) =>
  (WYKONAWCY[kategoria] || []).map((wpis) =>
    (typeof wpis === 'string' ? { nazwa: wpis } : wpis));

export const KATEGORIE_ZBIERANE = Object.keys(WYKONAWCY);
