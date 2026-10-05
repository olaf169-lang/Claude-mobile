/* ==========================================================================
   Utwory, których NIE dopisujemy do katalogu, choć sklep je podaje.
   --------------------------------------------------------------------------
   Po co osobna lista: usunięcie wpisu z dane/utwory.js nie wystarcza. Kolejna
   dosypka pyta sklep o to samo i, skoro utworu już nie ma w katalogu, nie
   widzi dubla, więc wpisuje go z powrotem. Tak wróciły „Lulu: Let Go” (2024)
   i „Karin Stanek: Chłopiec Z Gitarą” (2009) dzień po tym, jak je usunąłem.

   Co tu trafia:
     - wznowienia i ponowne nagrania z rokiem wydania zamiast roku premiery
       (zespół z lat 80. z utworem „z 2025 roku”),
     - nagrania innego artysty o tej samej nazwie,
     - utwory, których po prostu nie da się rozpoznać ze słuchu.

   Czego tu NIE wpisywać: utworów, które są w katalogu i mają zostać. Ta lista
   jest sprawdzana przy wpisywaniu nowych, nie przy czytaniu katalogu.

   Porównanie idzie przez normalizuj() i z pominięciem nawiasów, więc wariant
   tytułu („… (Remastered)”) też się załapie.
   ========================================================================== */

export const ODRZUCONE = [
  // Wznowienia i ponowne nagrania w złej dekadzie.
  { wykonawca: 'Lombard', tytul: 'Diamentowa kula' },
  { wykonawca: 'Karin Stanek', tytul: 'Chłopiec Z Gitarą' },
  { wykonawca: 'Karin Stanek', tytul: 'O Jimmy Joe' },
  { wykonawca: 'Oddział Zamknięty', tytul: 'Party' },
  { wykonawca: 'Kobranocka', tytul: 'Tak Niewiele' },
  { wykonawca: 'Petula Clark', tytul: "You're the One (Un Mal Pour Un Bien)" },
  { wykonawca: 'Petula Clark', tytul: 'Sailor' },
  { wykonawca: 'C.C. Catch', tytul: 'Heal Me' },
  { wykonawca: 'C.C. Catch', tytul: "Soul Survivor '99" },
  { wykonawca: 'Modern Talking', tytul: "Brother Louie Mix '98" },
  { wykonawca: 'Queen', tytul: "Don't Stop Me Now (Queen Forever Revisited)" },
  // Scarface jest z 1983, a sklep podaje wydanie z 2022. Dodatkowo „Main
  // Title” to tytuł, po którym nikt niczego nie rozpozna.
  { wykonawca: 'Giorgio Moroder', tytul: 'Main Title' },
  { wykonawca: 'Irena Jarocka', tytul: 'Stare łzy' },

  // Inna artystka o tej samej nazwie niż ta z lat 60.
  { wykonawca: 'Lulu', tytul: '字字句句' },
  { wykonawca: 'Lulu', tytul: 'Let Go' },
  { wykonawca: 'Lulu', tytul: 'Baby Love' },
  { wykonawca: 'Lulu', tytul: 'Yesterdays' },
  { wykonawca: 'Sabrina', tytul: 'Taste' },
  { wykonawca: 'Sabrina', tytul: 'House Tour' },

  // Nie Nas, a Lil Nas X, sklep oddaje go przy haśle „Nas”.
  { wykonawca: 'Nas', tytul: 'INDUSTRY BABY' },

  // Płyty świąteczne: kolędę zna każdy, ale nikt nie zgadnie wykonawcy.
  { wykonawca: 'En Vogue', tytul: "That's What Christmas Means to Me" },
  { wykonawca: 'Kelly Clarkson', tytul: "Santa, Can't You Hear Me" },
];
