# M&B Goat Guide

Kodeks **Mount & Blade II: Bannerlord** na telefon, pod łatkę 1.5 i dodatek War Sails.
Działa jako aplikacja z przeglądarki: instaluje się na ekranie telefonu, bez logowania
i bez sklepu, a po pierwszym otwarciu także bez internetu.

**Adres:** https://olaf169-lang.github.io/Claude-mobile/mb-goat-guide/

## Co jest w środku

| część | co robi |
|---|---|
| **Start** | sztandary do wszystkich działów i karta Twojej kampanii |
| **Kodeks** | 8 tematów, każdy na 4 poziomach (Giermek, Rycerz, Baron, Mistrz), ze źródłami |
| **Wojska** | 123 jednostki z nazwami PL i EN, oceny S do D, pancerz, umiejętności, porównywarka |
| **Drzewka** | ścieżki awansów 7 kultur z góry na dół, z ikoną roli przy każdej jednostce |
| **Narzędzia** | żołd, jedzenie, limit drużyny, lojalność miasta |
| **Doradca bitwy** | szturm, obrona miasta, bitwa w polu: szansa z przedziałem niepewności, co da największy skok, plan |
| **Czat** | pytania do Claude'a oparte na Biblii Bannerlorda (wzory, mechaniki, strategie graczy), tryb Mastermind |

## Czat

Czat ma dwa tryby połączenia i sam wybiera właściwy:

- **na claude.ai** (wersja jednoplikowa jako artefakt) korzysta z konta Claude, bez klucza;
- **tutaj, na GitHub Pages**, potrzebuje klucza API Anthropic. Klucz wkleja się w czacie
  (ikona klucza), zostaje tylko w pamięci telefonu i trafia wyłącznie do `api.anthropic.com`.
  Płaci się za zużycie z konta na console.anthropic.com. Tryb Zwykły używa modelu
  `claude-sonnet-5-5`, Mastermind `claude-opus-5-5` (stała `API_MODEL` w `js/czat.js`).

Model dostaje przy każdym pytaniu pasujące fragmenty Biblii i cztery narzędzia:
`search_kb`, `get_units`, `get_my_battle`, `battle_estimate`.

## Układ plików

```
mb-goat-guide/
├── index.html            szkielet strony, wczytuje skrypty w ustalonej kolejności
├── styles.css            cały wygląd
├── manifest.webmanifest  instalacja na telefonie
├── sw.js                 tryb offline (podbij POLKA przy każdej zmianie)
├── dane/
│   ├── jednostki.js      123 jednostki
│   ├── drzewka.js        drzewka awansów
│   ├── kodeks.js         źródła, poziomy, porady Kodeksu, karta kampanii
│   └── biblia.js         baza wiedzy dla czatu
├── js/
│   ├── app.js            widoki, nawigacja, Kodeks, Wojska, Drzewka, Narzędzia
│   ├── doradca.js        model bitwy i Doradca
│   ├── czat.js           czat (claude.ai albo klucz API)
│   └── start.js          uruchomienie i rejestracja service workera
├── icons/
└── narzedzia/
    ├── sprawdz.mjs       kontrola przed publikacją
    └── jeden-plik.mjs    skleja wszystko w dist/mb-goat-guide.html (wersja na claude.ai)
```

Bez frameworka i bez kroku budowania: zwykłe skrypty, które dzielą jedną przestrzeń
nazw, więc **kolejność w `index.html` ma znaczenie** (dane, potem rdzeń, potem reszta).

## Praca nad aplikacją

```bash
cd mb-goat-guide
node narzedzia/sprawdz.mjs     # składnia, lista plików w sw.js, dane, brak pauz
node narzedzia/jeden-plik.mjs  # opcjonalnie: wersja jednoplikowa do claude.ai
python3 -m http.server         # podgląd: http://localhost:8000/
```

Publikacja idzie razem z resztą repozytorium: workflow „Przegląd News, wydanie poranne”
dokłada ten katalog do GitHub Pages pod `/mb-goat-guide/`.

## Ważne zastrzeżenie

Szanse w Doradcy bitwy to model aplikacji: przybliżenie oparte na mechanice gry
i doświadczeniach graczy, nie wzór TaleWorlds. Dlatego wynik zawsze ma przedział,
który rośnie, gdy w danych jest więcej „nie wiem”.
