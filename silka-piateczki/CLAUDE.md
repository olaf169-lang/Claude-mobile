# Siłka Piąteczki, pamięć projektu

Apka na siłownię dla Olafa. PWA, vanilla JS (moduły ES), zero buildu, zero
frameworka, jak reszta aplikacji w tym monorepo. Opis funkcji: `README.md`.

## Gałęzie

- `claude/silka-piateczki`: gałąź robocza.
- `claude/przeglad-news-app-iqyboa`: produkcyjna, z niej publikuje się GitHub Pages
  (workflow `przeglad.yml`, krok „Dołóż pozostałe aplikacje do strony”).
  Po zmianach zmerguj roboczą do produkcyjnej i wypchnij.
- Inne katalogi to osobne projekty, nie ruszaj ich.

## Zasady

- Teksty po polsku, **bez pauz i półpauz**. Zakresy powtórzeń z krótkim `-` (8-12).
  `node narzedzia/sprawdz.mjs` to wyłapie.
- Po każdej zmianie plików podbij `POLKA` w `sw.js`, inaczej telefon trzyma starą wersję.
- Nowe zdjęcie ćwiczenia: dopisz kadr do `narzedzia/zdjecia.txt`, uruchom
  `narzedzia/zasoby.py`, dopisz oba kadry do `ZDJECIA` w `sw.js`. Sprawdzarka pilnuje zgodności.
- Nowy plik w `js/` musi trafić do `SZKIELET` w `sw.js` (sprawdzarka też to pilnuje).
- Logika liczenia siedzi w `logika.js` bez DOM; testy w `narzedzia/sprawdz.mjs`.

## Decyzje użytkownika (2026-11-25)

- Plan: 1 do 2 treningów w tygodniu, każdy na całe ciało, przerwa najwyżej 5 dni.
  2 serie na ćwiczenie, 7 do 15 powtórzeń. Woli hantle niż sztangę.
- **Kontuzja kolana: żadnych przysiadów z obciążeniem ani martwego ciągu.** Nogi tylko
  izolowane maszyny i ruchy z bioder (hip thrust, uginanie, wyprosty). Nie dodawaj
  przysiadów, wykroków ani martwego ciągu do planów ani zamienników.
- Cele: środek i dół klatki, szerokie barki, plecy, ręce, tył uda, ustawienie miednicy
  (przodopochylenie), ruchomość bioder i łydek.
- Motywator: rosnący koks (nie mapa mięśni). Zapis: ciężar i powtórzenia przy każdej serii.
  Dane tylko w telefonie, z kopią do pliku.
- Rozciąganie: 5 do 7 minut, 3 razy w tygodniu, bo „nienawidzi tego”, więc tryb prowadzony.

## Przypomnienia push (od 2026-11-25, prośba użytkownika)

- Projekt Firebase `jaka-to-piosenka-8ca81` (wspólny z jaka-to-melodia i piateczka).
  Funkcja `silkaPrzypomnienie` i reguły `silkaPrzypomnienia` siedzą w `jaka-to-melodia/`
  (`functions/index.js`, `firestore.rules`), bo jeden projekt = jeden zestaw.
- **Nie da się ich wdrożyć z sandboksa.** Użytkownik musi raz puścić
  `firebase deploy --only functions,firestore:rules` z katalogu jaka-to-melodia.
  Jak ruszasz funkcję albo reguły, przypomnij mu o tym wprost.
- Ping po 4, 5 i 7 dniach o 17:00 Warszawa, potem cisza do kolejnego treningu.

## Wygląd

- Żeliwo i kreda: tło `#1F2329`, tekst `#EFECE6`. Kolory wyłącznie z tarcz olimpijskich
  i każdy coś znaczy: obszar mięśni (klatka czerwień, plecy błękit, barki żółć,
  pośladki i tył uda zieleń, ręce biel, brzuch chrom), zrobiona seria (zieleń).
- Czcionki: Barlow Condensed (nagłówki, liczby) i Barlow (tekst), lokalnie w `fonts/`,
  bo na siłowni bywa brak zasięgu.
- Koks składa się z osobnych brył z obrysem; całość liczona z `masa` (0..1) i `poza` (0..1).
  Gdy coś w nim poprawiasz, zrób zrzut dla masy 0, 0,5 i 1 w obu pozach.
