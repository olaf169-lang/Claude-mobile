# Turniej Pana Piąteczki, pamięć projektu

Badmintonowa liga wtorkowa czterech graczy. PWA, vanilla JS (moduły ES),
zero buildu, zero frameworka, jak reszta aplikacji w tym monorepo.
Pełny opis systemu i uzasadnienie każdej reguły: `README.md` obok.

## Gałęzie

- **`claude/pan-piateczki-badminton-k02uyh`**: gałąź robocza tej aplikacji.
- **`claude/przeglad-news-app-iqyboa`**: gałąź produkcyjna; dopiero po
  scaleniu tam GitHub Pages publikuje zmianę (workflow „Przegląd News -
  wydanie poranne”, krok „Dołóż Turniej Pana Piąteczki do strony”).
  **Nie pushuj tam bez wyraźnej zgody użytkownika.**
- Monorepo, poza `piateczka/` siedzą tu inne, niepowiązane projekty
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
(`localStorage`): wygląda, jakby działała, ale nic nie dolatuje do reszty
ekipy. Jeśli ruszasz reguły, przypomnij mu o tym wprost.

## Zasady, które nie są przypadkowe

- **WALUTĄ SĄ ZWYCIĘSTWA** (przebudowa 2026-09-15, decyzja użytkownika).
  Kolejność w tabeli: **wygrane mecze → wygrane sety → zdobyte punkty →
  mecz bezpośredni**. Punkty STRACONE nie liczą się do tabeli w ogóle:
  „przegranie seta 15-2 waży tak samo jak przegranie go 15-13”.
  Saldo i `BONUS_WYGRANEJ` zostały **skasowane**: nie przywracaj ich.
- **Singiel i debel to DWIE OSOBNE rozgrywki**: osobna tabela, osobne
  statystyki, osobne ELO. Tryb wynika z obsady (`trybMeczu()`), nic się
  dodatkowo nie wpisuje ani nie zapisuje w dokumencie. W tabelach pokazujemy
  tylko tych, którzy w danym trybie zagrali (`r.mecze > 0`): wyraźna prośba
  użytkownika. Wyjątek: wynik wieczoru i MVP liczą wszystkie mecze razem.
- **Rodzaj gry wybiera się NA STARCIE wieczoru**, nie chowa pod „Dograj mecz”
  (prośba użytkownika 2026-09-16). Karta „W co gracie?” stoi przed składem,
  a `ukladMeczow(sklad, przesuniecie, format, tryb)` układa albo trzy deble,
  albo single każdy z każdym (karuzela round-robin w `paryKazdyZKazdym`,
  więc nikt nie gra trzech meczów pod rząd). Przy mniej niż czterech debel
  i tak schodzi na singla. Drugi rodzaj dorzuca się potem „Dograj mecz”.
- **Debel = błękit, singiel = złoto** (`--tryb-debel` / `--tryb-singiel`,
  osobne w obu motywach). Te same barwy w wyborze rodzaju, na kartach meczów
  (pasek z lewej) i w przełącznikach na Tabeli i ELO: nie rozjeżdżaj tego.
- **Format jest zmienny**: `{ setow: 1|2, doIlu: N }`, per mecz, dziedziczony
  z wieczoru (`formatMeczu()`). Stare klucze tekstowe ('3x15') mapuje
  `normalizujFormat()` w `dane.js`: nie usuwaj tego, bo w bazie siedzą
  wieczory w starym kształcie. Domyślnie 2×15; przy remisie na styku
  zawsze przewaga dwóch punktów, bez limitu, więc pola przyjmują liczby
  znacznie powyżej granicy seta.
- **ELO liczy się samymi zwycięstwami.** `wartoscWyniku()`: 2:0 → 1,0,
  2:1 → 0,85, 1:2 → 0,15, 0:2 → 0,0. Punkty w setach nie wchodzą wcale.
  Osobny rating dla debla i singla (`przelicz(wieczory, tryb)`).
  Przy nazwisku seria zwycięstw `×3 🔥` od dwóch z rzędu (`znaczekSerii`).
- **Żadnych forów.** Wyraźna decyzja użytkownika (2026-09-13): nikt nigdy
  nie dostaje punktów na start ani innych ułatwień. ELO służy wyłącznie
  do pokazania FORMY, procentowych szans par na ekranie 🏸ELO🏸.
  Samo słowo „fora/fory” ma nie występować w interfejsie.
- **Jedna definicja wygranej meczu** (sety, przy remisie różnica punktów)
  obowiązuje w tabeli, MVP i ELO. Jak ją zmieniasz, zmieniasz
  w `wynikMeczu()` i już.
- **Sezon startuje 2026-09-15** (pierwszy wtorek), nie w październiku, decyzja
  użytkownika 2026-09-14, chcą grać od razu. `SEZON.pierwszy` w `dane.js`.
- **Tytuł (Big Boss + odznaka) po JEDNYM wtorku.** `MIN_WIECZOROW_NA_TYTUL = 1`
  w `tytuly.js`. Lider bieżącego, jeszcze niezamkniętego miesiąca pokazuje się
  od razu z odznaką i plakietką „na żywo” (klasa `.plakietka-live`); tytuł
  twardnieje z końcem miesiąca. Nie podnoś tego progu z powrotem.
- **Head-to-head i rekordy sezonu** liczy `liczenie.js` (`przeciwnicy`
  w rekordzie gracza, `rekordySezonu()`): wyprowadzone z samych wyników
  setów, bez dodatkowego wpisywania.
- **Czcionka nagłówkowa: Space Grotesk** (był Outfit): `index.html` + zmienna
  `--naglowkowy` w `styles.css`.
- **Przydomki: 3 poziomy (brąz/srebro/złoto), per-gracz, na bieżąco.**
  Liczone z sezonowych statystyk (`przydomekGracza` / `przydomkiGraczy`
  w `tytuly.js`); zawsze nosisz najlepszy, na jaki się łapiesz, a w obrębie
  poziomu rotują z wieczorami. Gracz Miesiąca NIE ma osobnego znaczka ani
  4. poziomu, jego przydomek zostaje
  w swoim kolorze, dostaje tylko poświatę w tym kolorze + koronę (`reign` w
  `godlo()`). Godła to SVG z metalicznym gradientem wg poziomu. Nazwy poziomów
  w UI po polsku (Brąz/Srebro/Złoto); id w kodzie ascii (braz/srebro/zloto).
  Kolejność w katalogu: brąz→srebro→złoto. NIE dawaj forów/4. poziomu.
- **Kolory godeł siedzą w CSS, nie w JS** (`--metal-1`/`--metal-2` na klasach
  `.godlo-braz|srebro|zloto|puste`, osobny komplet dla motywu jasnego).
  Powód: wcześniej były na sztywno w `tytuly.js` i górny stop srebra
  (#EDF3FB) miał na białej karcie kontrast **1,12:1**: odznaka była
  niewidoczna. Jak ruszasz metale, przelicz kontrast (min. 3:1 na białym).
- **Gradient godeł MUSI mieć `gradientUnits="userSpaceOnUse"`.** Domyślnie SVG
  liczy gradient względem ramki KAŻDEGO kształtu z osobna, a ramka pojedynczej
  pionowej albo poziomej kreski ma zerową szerokość lub wysokość, taki kształt
  zostaje niepomalowany i po prostu znika. Siedziało to cicho w 13 ścieżkach
  w 8 godłach (m.in. przednie skrzydło bolidu, nóżka pucharu, tułów ludka
  z Formy Kwincioka, cały gwóźdź w „Masz Wbite"). Nie wracaj do domyślnych
  jednostek; jak rysujesz prostą kreskę, sprawdź, że widać ją na zrzucie.
- **Zero pauz w tekstach.** Pauza (`U+2014`) i półpauza (`U+2013`) nie mają prawa
  pojawić się nigdzie: ani w interfejsie, ani w instrukcjach, ani w komentarzach
  czy dokumentacji. Zamiast nich idzie forma słowna (`czyli`, `bo`, `więc`, `a`,
  `to`), dwukropek, nawias albo nowe zdanie. Absolutna ostateczność to krótki
  myślnik `-`, a na pustą wartość `·`. Pełne zasady:
  `.claude/skills/bez-pauzy/SKILL.md`. Kontrola:
  `grep -rn "$(printf '\u2014')" piateczka` ma nic nie zwracać.
- **Glify rysujemy bryłą + obrysem**, nie samym cienkim konturem: wypełnienie
  gradientem na 0,18 do 0,3 krycia plus stroke 2,6, a najważniejszy detal
  (iskra, żar, oko) solidny. Sam kontur przy 56 px znikał.
- **Jeden przedmiot pod kątem bije każdą scenkę.** „Masz Wbite" przeszło przez
  młotek z gwoździem, deską, iskrami i smugami ruchu, wychodziła kamera na
  statywie albo stempel. Skończyło się na trzech kształtach: obuch, jaśniejsze
  czoło, trzonek, całość w `<g transform="rotate(45 32 32)">` (gradient jest
  `userSpaceOnUse`, więc obraca się razem z bryłą i nic nie znika). Jak glif
  nie czyta się po dwóch poprawkach, wyrzucaj elementy, nie dorzucaj.
- **Fala: asymetria i piana, bez zdobników.** Symetryczny łuk czytał się jak
  tęcza, ciasno zawinięta grzywa jak ślimak, domknięty obrys jak liść.
  Działa wzór z infografik: stroma ściana z lewej, grzywa zawinięta w prawo,
  długi ogon i osobna smuga wody pod spodem, dwie bryły, zero kresek.
- **Zwierzę składaj z osobnych brył, nie z jednej sylwetki.** Pies z „Psim
  Swędem" jako jeden ciągły kształt wyszedł żółwiem. Czytelny jest dopiero
  z kółka-łba, kufy-klina, walca-tułowia i czterech nóg osobno, wtedy widać
  szyję i opuszczony łeb (czyli węszenie).
- **Zapisany wieczór jest zamknięty.** `wieczor.zamkniety === true` po
  naciśnięciu „Zapisz wieczór”; odblokowanie wymaga kodu administratora
  (`js/zamek.js`, SHA-256). Reguły Firestore przepuszczają zapis do
  zamkniętego dokumentu TYLKO gdy zdejmuje zamek i niesie prawidłowy skrót.
  **Zmiana kodu = podmiana skrótu w DWÓCH miejscach**: `js/zamek.js`
  i sekcja `piateczkaWieczory` w `jaka-to-melodia/firestore.rules`.
  Jawny kod nigdy nie trafia do repozytorium. To nie sejf i tak jest
  opisane w apce, nie udawaj, że to zabezpieczenie kryptograficzne.
- **Dopisane osoby (goście) żyją tylko w swoim wieczorze**:
  `wieczor.goscie = { gosc1: 'Michał' }`, imię czyta `imieW(wieczor, id)`.
  Poza tabelą i poza ELO. `gracz()` bez kontekstu wieczoru zwraca dla nich
  ogólne „Gość”: nigdy surowego id.
- **Przydomki: NIKT nie startuje z przydomkiem.** Poprzednia wersja dawała
  każdemu startowy, użytkownik to skasował 2026-09-15. `przydomekGracza`
  i `przydomkiGraczy` zwracają `null`, gdy nic nie pasuje; `godlo(null)`
  rysuje pustą tarczę. Katalog: 16 pozycji, brąz = pocieszne (za pech),
  srebro = solidne, złoto = wyczyn.
- **`liderId` wymaga choć jednej wygranej.** Bez tego „Hounter" (pokonałeś
  lidera) dawał się zdobyć na kimś, kto nie wygrał nic, wystarczyło, że
  reszta zagrała po jednym meczu i wypadła spod progu. Ta sama pułapka
  siedziała w przydomku za 1. miejsce w singlu, dlatego „Samotny Wilk"
  liczy się dziś z procentów (≥60% w singlu, ≤35% w deblu), a nie z miejsca
  w tabeli. Złapane testem 2026-09-16; `pasujacePrzydomki(id, wieczory)`
  pokazuje WSZYSTKIE trafione warunki, nie tylko zwycięski, bez tego
  słabszy trafiony warunek jest niewidoczny i takie wpadki przechodzą.
- **Nazwy w UI: „Gra” i „Forma”.** Ekran wpisywania to w menu i w tytule „Gra”
  (nie „Wieczór”), a rating to „Forma” (nie „ELO”), decyzja użytkownika
  2026-09-16. W tekstach widocznych piszemy Gra/Forma. ALE trasy (`#/wieczor`,
  `#/elo`), nazwy modułów (`ekran-wieczor.js`, `ekran-elo.js`, `elo.js`),
  klucze pomocy (`elo`, `wieczor`) i komentarze techniczne (to wciąż rating
  Elo) zostają, żeby nic nie popsuć. Słowo „wieczór” jako SESJA gry
  (np. „Zapisz wieczór”, „wynik wieczoru”, „wieczór towarzyski”) też zostaje,
  bo to co innego niż pozycja menu.
- **Noszony przydomek można wybrać ręcznie i jest to WSPÓLNE.** Gdy gracz łapie
  się na kilka, sam wskazuje, który nosi (karta gracza na „Tytuły” i wiersz
  w tabeli, komponent `js/wybor-przydomka.js`). Wybór leci do wszystkich przez
  nowy dokument `piateczkaUstawienia/przydomki` (mapa id gracza -> id przydomka),
  obsługiwany w `baza.js` (`wybory()`, `zapiszWybor()`), z kopią w localStorage.
  `wybierz()` w `tytuly.js` respektuje wybór TYLKO gdy dany przydomek nadal się
  łapie, inaczej spada na automat (najlepszy). „Auto” czyści wybór.
  **To wymaga wdrożenia reguł Firestore** (nowy `match /piateczkaUstawienia`),
  do tego czasu wybór działa lokalnie na jednym urządzeniu i zsynchronizuje się
  po `firebase deploy --only firestore:rules`.
- **Hasła przydomków zawierają DOSŁOWNE cytaty użytkownika.** „Robisz strzał
  i miażdżysz przeciwników”, „Spaliłeś się dziś smyku za mocno”, „Forma top,
  rozjebałbyś Kwintę”, „Zapierdalasz, ale formą w dół”, „Nie pykło, ale nie
  łam się, #NiePłakał”. Wyraźna prośba, nie łagodź ich i nie parafrazuj.
- **Zmiana ksywek: świadomie NIE robiona.** Zostają Jacek/Tomek/Kafaar/
  Piąteczka na sztywno w `GRACZE` (dane.js); zmiana na życzenie = edycja w
  kodzie, bez edytora w apce (decyzja użytkownika 2026-09-15).
- **Złoto tylko przy zaszczytach.** Pierwsze miejsce, MVP, Gracz Miesiąca,
  seria zwycięstw, Puchar.
  Jak zacznie być wszędzie, przestanie cokolwiek znaczyć.
- **Kolory serii na wykresach są przypisane do gracza, nie do miejsca**
  w tabeli, i przeszły walidację kontrastu i daltonizmu. Nie podmieniaj
  ich bez ponownego sprawdzenia.

- **Tryb sędziego liczy zagrania, ale NIC nie waży.** `mecz.zagrania` to lista
  `{k, kto}` z sześcioma rodzajami (`ZDARZENIA` w `sedzia.js`). Świadomie poza
  tabelą i poza ELO (decyzja użytkownika 2026-09-16): nie każdy mecz będzie
  sędziowany, więc porównywanie tych liczb byłoby nieuczciwe.
  **Sprawdzone na żywo:** pole siedzi WEWNĄTRZ `mecze.<nr>`, a reguły Firestore
  ograniczają tylko klucze najwyższego poziomu, dopisanie go nie wymagało
  wdrażania reguł od nowa. Jak dokładasz kolejne pola do meczu, masz tę samą
  swobodę; pola na poziomie dokumentu wymagają już zmiany `hasOnly`.
- **Parser transkrypcji nigdy nie zapisuje po cichu.** `parsujTranskrypcje`
  zwraca `{ zdarzenia, nierozumiane }`, ekran pokazuje jedno i drugie, a zapis
  idzie dopiero po zatwierdzeniu. Rozpoznawanie mowy (`SpeechRecognition`)
  działa na Androidzie/Chrome; na iPhonie zostaje mikrofon z klawiatury i to
  jest w apce napisane wprost. Pliku audio nie przerobi ani apka, ani model.

## Mapa modułów

| plik | za co odpowiada |
|---|---|
| `js/dane.js` | skład, formaty, kalendarz sezonu, same stałe |
| `js/liczenie.js` | rotacja par, tryby, klasyfikacja, MVP |
| `js/elo.js` | rating osobno dla debla i singla, seria zwycięstw, szanse par |
| `js/zamek.js` | kod administratora do zapisanych wieczorów |
| `js/sedzia.js` | katalog zdarzeń, bilanse zagrań, parser polskiej transkrypcji |
| `js/ekran-sedzia.js` | ekran sędziego: klikanie, dyktowanie, podgląd parsera |
| `js/tytuly.js` | Gracz Miesiąca, przydomki (3 poziomy, per-gracz), godła SVG z gradientem |
| `js/wybor-przydomka.js` | wspólny wybór noszonego przydomka (lista + podpięcie) |
| `js/pomoc.js` | **wszystkie** teksty regulaminu |
| `js/wykresy.js` | iskry w tabeli, wykres ELO, paleta serii |
| `js/baza.js` | Firestore + kopia w localStorage + tryb offline |
| `js/pochwal.js` | udostępnianie wieczoru (Web Share + fallback schowek) |
| `js/ekran-podsumowanie.js` | laurka wieczoru pod link `#/podsumowanie/<data>` |
| `js/ekran-*.js` | po jednym module na ekran, każdy eksportuje `render()` |
| `narzedzia/ikony.py` | generator ikon PWA (bez Pillow, własny zapis PNG) |

### Ton instrukcji

Rzeczowo i krótko. Zasada, a uzasadnienie tylko tam, gdzie bez niego reguła
wygląda na przypadkową. **Żadnych „dzięki temu jest fajnie", „i o to chodzi",
„nie będzie tak źle"**: wyraźna uwaga użytkownika z 2026-09-16, że ekran
„Zasady" tłumaczył za dużo. Przy dopisywaniu hasła: sprawdź, czy da się je
skrócić o połowę bez utraty treści; zwykle da się.

### Wyróżnione hasła w instrukcji

`kluczowe: true` przy haśle w `POMOC` sprawia, że ekran „Zasady” rysuje je
w złotym boksie z plakietką „Najważniejsze” (`.haslo-klucz`): tym samym,
co karta „W 20 sekund” (`.karta-esencja`). To jeden język wizualny dla
„to musisz przeczytać”; nie rozmnażaj wariantów.

### Podpowiedzi i instrukcja to jeden plik

`js/pomoc.js` jest jedynym źródłem prawdy. Te same hasła lecą do dymków ⓘ
przy nagłówkach kart **i** składają się na ekran „Zasady”. Dopisując regułę:
hasło do `POMOC`, klucz do `SEKCJE`, `dymek('klucz')` przy karcie. Nic więcej
- i nie pisz tekstu regulaminu bezpośrednio w ekranie, bo się rozjedzie.

## Testowanie w tym sandboksie

Firestore jest **nieosiągalny** (proxy blokuje `gstatic.com`), więc każdy test
przeglądarkowy leci w trybie lokalnym. To nie jest usterka, tak ma być.

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
w tym samym kształcie co dokumenty Firestore): najprościej stroną pomocniczą,
która to zapisuje, odpaloną w tym samym profilu przeglądarki.

Szybki test logiki bez przeglądarki siedzi w scratchpadzie sesji
(`test2.mjs`): sprawdza werdykty, obie tabele, MVP, ELO, format i przydomki.
Do testów klikalnych (arkusz formatu, „Dograj mecz”, zapis + odblokowanie
kodem) używałem strony pomocniczej w iframe, która steruje apką z zewnątrz
i zbiera log, wzorzec wart odtworzenia, bo inaczej nie da się sprawdzić
arkuszy.

**Uwaga z pierwszej sesji:** podmiany w plikach przez `str.replace` w Pythonie
potrafią cicho nie trafić (jeden znak różnicy w cytowanym fragmencie) i wtedy
`node --check` niczego nie wykryje, bo plik jest po prostu stary. Po każdej
takiej podmianie sprawdź `grep`-em, że nowy tekst faktycznie jest w pliku.

## Preferencje użytkownika

- Rozmowa po polsku.
- Ceni oszczędność tokenów: krótkie statusy, bez narracji.
- Testuje realnie na swoich urządzeniach (iOS + PC) i zgłasza konkretne bugi.
- Przy większych zmianach mechaniki dopytaj (AskUserQuestion), zamiast zgadywać.
