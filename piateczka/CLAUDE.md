# Turniej Pana Piąteczki — pamięć projektu

Badmintonowa liga wtorkowa czterech graczy. PWA, vanilla JS (moduły ES),
zero buildu, zero frameworka — jak reszta aplikacji w tym monorepo.
Pełny opis systemu i uzasadnienie każdej reguły: `README.md` obok.

## Gałęzie

- **`claude/pan-piateczki-badminton-k02uyh`** — gałąź robocza tej aplikacji.
- **`claude/przeglad-news-app-iqyboa`** — gałąź produkcyjna; dopiero po
  scaleniu tam GitHub Pages publikuje zmianę (workflow „Przegląd News —
  wydanie poranne”, krok „Dołóż Turniej Pana Piąteczki do strony”).
  **Nie pushuj tam bez wyraźnej zgody użytkownika.**
- Monorepo — poza `piateczka/` siedzą tu inne, niepowiązane projekty
  (`web/`, `collector/`, `jaka-to-melodia/`...). Nie ruszaj ich, z jednym
  wyjątkiem niżej.

## Wyjątek: reguły Firestore leżą w cudzym katalogu

Aplikacja korzysta z **tego samego projektu Firebase** co „Jaka to Melodia”
(`jaka-to-piosenka-8ca81`), bo jeden sezon to kilkadziesiąt dokumentów.
Jeden projekt = jeden zestaw reguł, więc sekcja dla kolekcji
`piateczkaWieczory` siedzi na dole `jaka-to-melodia/firestore.rules`.

**Reguł nie da się wdrożyć z tego sandboksa.** Użytkownik musi raz puścić
`firebase deploy --only firestore:rules` ze swojego komputera. Dopóki tego
nie zrobi, zapisy są odbijane i aplikacja siedzi w trybie lokalnym
(`localStorage`) — wygląda, jakby działała, ale nic nie dolatuje do reszty
ekipy. Jeśli ruszasz reguły, przypomnij mu o tym wprost.

## Zasady, które nie są przypadkowe

- **Format: do dwóch wygranych setów, sety do 15, przy 15:15 na przewagę
  dwóch punktów** (17:15, 21:19, bez górnego limitu) — decyzja użytkownika
  (2026-09-13), podjęta świadomie mimo mojej uwagi o nieprzewidywalnym
  czasie w hali. Nie „poprawiaj” tego z powrotem. Krótsze warianty
  zostają w menu jako opcje. Pola na wynik MUSZĄ przyjmować liczby
  znacznie powyżej 15.
- **Saldo = różnica punktów + 3 za wygrany mecz** (`BONUS_WYGRANEJ`
  w `liczenie.js`). Bonus dostaje każdy z wygranej pary w całości,
  przegrani nie tracą nic ponad różnicę. Świadoma decyzja użytkownika
  z 2026-09-13: samo saldo za słabo premiowało zwycięstwo.
  **Uwaga:** to łamie dawną własność „saldo sumuje się do zera
  w każdym wieczorze”, na której opierała się część pierwotnych
  uzasadnień. Argument „nieobecność nic nie kosztuje” nadal stoi
  (nie grasz → saldo stoi w miejscu), ale nie pisz już nigdzie,
  że salda bilansują się do zera — bo nie.
- **Bonus NIE wchodzi do ELO.** Rating mierzy siłę gry, nie punkty
  w tabeli. `wynikMeczu().saldo` zostaje surową różnicą punktów właśnie
  po to; bonus jedzie osobno jako `bonusA`/`bonusB`.
- **Żadnych forów.** Wyraźna decyzja użytkownika (2026-09-13): nikt nigdy
  nie dostaje punktów na start ani innych ułatwień. ELO służy wyłącznie
  do pokazania FORMY — procentowych szans par na ekranie 🏸ELO🏸.
  Samo słowo „fora/fory” ma nie występować w interfejsie.
- **Jedna definicja wygranej meczu** (sety, przy remisie różnica punktów)
  obowiązuje w tabeli, MVP i ELO. Jak ją zmieniasz, zmieniasz
  w `wynikMeczu()` i już.
- **Sezon startuje 2026-09-15** (pierwszy wtorek), nie w październiku — decyzja
  użytkownika 2026-09-14, chcą grać od razu. `SEZON.pierwszy` w `dane.js`.
- **Tytuł (Big Boss + odznaka) po JEDNYM wtorku.** `MIN_WIECZOROW_NA_TYTUL = 1`
  w `tytuly.js`. Lider bieżącego, jeszcze niezamkniętego miesiąca pokazuje się
  od razu z odznaką i plakietką „na żywo” (klasa `.plakietka-live`); tytuł
  twardnieje z końcem miesiąca. Nie podnoś tego progu z powrotem.
- **Head-to-head i rekordy sezonu** liczy `liczenie.js` (`przeciwnicy`
  w rekordzie gracza, `rekordySezonu()`) — wyprowadzone z samych wyników
  setów, bez dodatkowego wpisywania.
- **Czcionka nagłówkowa: Space Grotesk** (był Outfit) — `index.html` + zmienna
  `--naglowkowy` w `styles.css`.
- **Przydomki: 3 poziomy (brąz/srebro/złoto), per-gracz, na bieżąco.** Każdy
  gracz ZAWSZE ma przydomek liczony z sezonowych statystyk (`przydomekGracza`
  / `przydomkiGraczy` w `tytuly.js`); zdobywane awansują nad startowe, w obrębie
  poziomu rotują z tygodniami. Na starcie każdy dostaje inny startowy. Gracz
  Miesiąca NIE ma osobnego znaczka ani 4. poziomu — jego przydomek zostaje
  w swoim kolorze, dostaje tylko poświatę w tym kolorze + koronę (`reign` w
  `godlo()`). Godła to SVG z metalicznym gradientem wg poziomu. Nazwy poziomów
  w UI po polsku (Brąz/Srebro/Złoto); id w kodzie ascii (braz/srebro/zloto).
  Kolejność w katalogu: brąz→srebro→złoto. NIE dawaj forów/4. poziomu.
- **Zmiana ksywek: świadomie NIE robiona.** Zostają Jacek/Tomek/Kafaar/
  Piąteczka na sztywno w `GRACZE` (dane.js); zmiana na życzenie = edycja w
  kodzie, bez edytora w apce (decyzja użytkownika 2026-09-15).
- **Złoto tylko przy zaszczytach.** Pierwsze miejsce, MVP, Big Boss, Puchar.
  Jak zacznie być wszędzie, przestanie cokolwiek znaczyć.
- **Kolory serii na wykresach są przypisane do gracza, nie do miejsca**
  w tabeli, i przeszły walidację kontrastu i daltonizmu. Nie podmieniaj
  ich bez ponownego sprawdzenia.

## Mapa modułów

| plik | za co odpowiada |
|---|---|
| `js/dane.js` | skład, formaty, kalendarz sezonu — same stałe |
| `js/liczenie.js` | rotacja par, saldo, klasyfikacja, MVP |
| `js/elo.js` | rating i szanse par (żadnych forów — patrz niżej) |
| `js/tytuly.js` | Gracz Miesiąca, przydomki (3 poziomy, per-gracz), godła SVG z gradientem |
| `js/pomoc.js` | **wszystkie** teksty regulaminu |
| `js/wykresy.js` | iskry w tabeli, wykres ELO, paleta serii |
| `js/baza.js` | Firestore + kopia w localStorage + tryb offline |
| `js/pochwal.js` | udostępnianie wieczoru (Web Share + fallback schowek) |
| `js/ekran-podsumowanie.js` | laurka wieczoru pod link `#/podsumowanie/<data>` |
| `js/ekran-*.js` | po jednym module na ekran, każdy eksportuje `render()` |
| `narzedzia/ikony.py` | generator ikon PWA (bez Pillow — własny zapis PNG) |

### Podpowiedzi i instrukcja to jeden plik

`js/pomoc.js` jest jedynym źródłem prawdy. Te same hasła lecą do dymków ⓘ
przy nagłówkach kart **i** składają się na ekran „Zasady”. Dopisując regułę:
hasło do `POMOC`, klucz do `SEKCJE`, `dymek('klucz')` przy karcie. Nic więcej
— i nie pisz tekstu regulaminu bezpośrednio w ekranie, bo się rozjedzie.

## Testowanie w tym sandboksie

Firestore jest **nieosiągalny** (proxy blokuje `gstatic.com`), więc każdy test
przeglądarkowy leci w trybie lokalnym. To nie jest usterka — tak ma być.

```sh
# serwer
python3 -m http.server 8099 --bind 127.0.0.1     # z katalogu repo

# logika, bez przeglądarki
node --input-type=module -e "import('/home/user/Claude-mobile/piateczka/js/liczenie.js')..."

# render + błędy JS + przepełnienia w poziomie na 360 px
# (wzorzec: iframe 360 px w stronie pomocniczej, obejście minimum 500 px
#  szerokości okna w headless Chromium)
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --no-sandbox \
  --disable-gpu --window-size=500,1600 --virtual-time-budget=6000 \
  --screenshot=out.png 'http://127.0.0.1:8099/piateczka/#/tabela'
```

Dane testowe wsiewa się przez `localStorage['pp:wieczory']` (tablica wieczorów
w tym samym kształcie co dokumenty Firestore) — najprościej stroną pomocniczą,
która to zapisuje, odpaloną w tym samym profilu przeglądarki.

**Uwaga z pierwszej sesji:** podmiany w plikach przez `str.replace` w Pythonie
potrafią cicho nie trafić (jeden znak różnicy w cytowanym fragmencie) i wtedy
`node --check` niczego nie wykryje, bo plik jest po prostu stary. Po każdej
takiej podmianie sprawdź `grep`-em, że nowy tekst faktycznie jest w pliku.

## Preferencje użytkownika

- Rozmowa po polsku.
- Ceni oszczędność tokenów: krótkie statusy, bez narracji.
- Testuje realnie na swoich urządzeniach (iOS + PC) i zgłasza konkretne bugi.
- Przy większych zmianach mechaniki dopytaj (AskUserQuestion), zamiast zgadywać.
