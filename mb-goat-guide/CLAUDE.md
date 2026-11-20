# M&B Goat Guide, pamięć projektu

Kodeks Bannerlorda na telefon dla Olafa (PS5, łatka 1.5, War Sails zainstalowany,
ale gra starą kampanię bez morza: królestwo Bakalland, klan battański, Ortyzja, Taraktor).
Vanilla JS, zwykłe skrypty bez modułów, zero buildu. Opis plików w README.md.

## Zasady

- Wszystkie teksty po polsku, **bez pauz i półpauz** (U+2014, U+2013). Zakresy pisz „3 do 5”.
  `node narzedzia/sprawdz.mjs` to wyłapie.
- Liczby i mechaniki tylko ze źródłem (klucz w `SRC`, `dane/kodeks.js`). Wyliczenia
  aplikacji oznaczaj jako „model apki”, nie jako wzór z gry.
- Skrypty dzielą globalną przestrzeń nazw: nie twórz drugiej funkcji o tej samej nazwie
  (raz już `setMode` z czatu nadpisał przełącznik w Drzewkach).
- Po każdej zmianie plików podbij `POLKA` w `sw.js`, inaczej telefon może trzymać starą wersję.
- Edytuj pliki w tym katalogu. `dist/` to tylko wynik `jeden-plik.mjs`, nie commituj go.

## Gałęzie

Monorepo, inne katalogi (`web/`, `collector/`, `jaka-to-melodia/`...) to osobne projekty, nie ruszaj ich.
- `claude/mb-goat-guide`: gałąź robocza.
- `claude/przeglad-news-app-iqyboa`: produkcyjna, z niej publikuje się GitHub Pages.
  Po zmianach zmerguj roboczą do produkcyjnej i wypchnij.

## Wersja na claude.ai

Artefakt `3979a6db-15c3-4846-bca3-a20ab3bcbb1f` (ma zadeklarowaną możliwość `sample`).
Publikuje się plik `dist/mb-goat-guide.html` z `node narzedzia/jeden-plik.mjs`.
