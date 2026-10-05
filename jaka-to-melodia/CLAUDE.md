# Jaka to Melodia — pamięć projektu

Muzyczny quiz PWA (vanilla JS ES-modules, zero buildu, zero frameworka).
Ten plik wczytuje się automatycznie na starcie sesji Claude Code w tym
katalogu — to jedyny sposób, żeby nowa sesja (bez pamięci poprzedniej
rozmowy) wiedziała, gdzie jest i jak tu pracować. Aktualizuj go, gdy
kończysz większy kawałek pracy albo trafiasz na coś, co następna sesja
powinna wiedzieć od razu.

## Gałęzie — KRYTYCZNE

- **`claude/music-kahoot-game-app-2jgycd`** — gałąź robocza, tu się
  commituje.
- **`claude/przeglad-news-app-iqyboa`** — gałąź produkcyjna/domyślna,
  z niej GitHub Pages faktycznie publikuje stronę (przez workflow
  „Przegląd News — wydanie poranne”, NIE przez `jaka-to-melodia.yml`,
  które jest tylko testowe).
- Repo to monorepo — poza `jaka-to-melodia/` siedzą tu inne, niepowiązane
  projekty (`web/`, `android/`, `collector/`...). Nie ruszaj ich.

**Workflow po każdej zmianie:**
```
git fetch origin claude/music-kahoot-game-app-2jgycd
git checkout claude/music-kahoot-game-app-2jgycd
git pull origin claude/music-kahoot-game-app-2jgycd
# ...zmiany, testy, commit...
git push -u origin claude/music-kahoot-game-app-2jgycd

git fetch origin claude/przeglad-news-app-iqyboa
git checkout claude/przeglad-news-app-iqyboa
git pull origin claude/przeglad-news-app-iqyboa
git merge claude/music-kahoot-game-app-2jgycd --no-edit
# konflikt w jaka-to-melodia/dane/podglady.json prawie zawsze — to plik
# auto-generowany przez CI, zawsze bierz --theirs:
git checkout --theirs jaka-to-melodia/dane/podglady.json
git add jaka-to-melodia/dane/podglady.json
git commit --no-edit
git push -u origin claude/przeglad-news-app-iqyboa
```
Po pushu na gałąź produkcyjną poczekaj (Monitor + curl do GitHub Actions
API) aż workflow „Testy”, „Jaka to Melodia” i „Przegląd News — wydanie
poranne” będą `completed/success` — dopiero wtedy zmiana jest naprawdę
na żywo.

**Zasada bezpieczeństwa gita** (raz tu kosztowała utracone zmiany):
zawsze `git status` przed jakimkolwiek `checkout`/`reset` — jeśli są
niezacommitowane zmiany na złej gałęzi, `git stash push -u` PRZED
przełączeniem, nigdy `reset --hard` bez uprzedniego stasha.

## Testy

- `npm test` — jednostkowe (silnik gry, katalog, MQTT, narzędzia). Zawsze
  uruchamiaj przed commitem.
- `npm run test:przegladarka` — Playwright, ale w tym sandboksie trzeba
  wskazać przeglądarkę ręcznie:
  `JTM_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:przegladarka`
  (domyślna ścieżka Playwrighta tu nie istnieje). To pokrywa tryb
  wieloosobowy (prowadzacy.js/gracz.js) — **NIE pokrywa** Turnieju
  Piąteczki ani Gry turowej (wyzwanie.js), bo oba wymagają prawdziwego
  Firestore, a sandbox blokuje ruch do `gstatic.com`/Google (proxy
  odpowiada 403/connection reset). Do tamtych trybów: smoke-test przez
  Playwright sprawdzający strukturę DOM i brak `pageerror` (przykłady
  we wcześniejszych sesjach, wzorzec w `narzedzia/test-przegladarki.mjs`)
  + uważny code review, bo pełnego end-to-end nie da się tu zrobić.

## Mapa modułów (`js/`)

- `app.js` — wejście, routing po hashu, motyw, instalacja PWA,
  powiadomienia push (przełącznik w headerze), przycisk „Wróć do
  Turnieju Piąteczki”.
- `prowadzacy.js` / `gracz.js` — tryb na żywo, MQTT-over-WebSocket.
- `wyzwanie.js` — „Gra turowa”: asynchroniczna, solo, jeden link.
  Wszystkie rundy budowane RAZ przy tworzeniu (Firestore, create-once
  immutable). Temat wybiera się osobno dla KAŻDEJ rundy (ekran
  `wyzwanie-wybor-tematu`, sekwencyjnie podczas tworzenia — patrz niżej).
- `turniej.js` — „Turniej Piąteczki”: pojedynek 1v1, asynchroniczny,
  Firestore. Najbardziej rozbudowany moduł, patrz sekcja niżej.
- `odtwarzacz.js` — odtwarzacz podglądów, z obejściami dla iOS (trzeba
  „rozgrzać” dotknięciem ekranu, inaczej `play()` się blokuje).
- `firebase.js` — inicjalizacja SDK, `baza()` zwraca `{app, db, f}`.
- `powiadomienia.js` — FCM: `wlaczPowiadomienia(ksywka)` działa nawet
  bez znanej ksywki (token cachuje się lokalnie, zapis do Firestore
  dopina się później, gdy ksywka jest już znana).
- `functions/` — Cloud Functions (Node, CommonJS) do wysyłki powiadomień
  push. **NIE da się wdrożyć z tego sandboksa** — wymaga
  `firebase deploy` z komputera użytkownika (ma już dostęp, plan Blaze
  włączony, klucz VAPID wklejony w `powiadomienia.js`). Jeśli dodajesz
  nową funkcję, powiedz użytkownikowi, że trzeba ponowić
  `firebase deploy --only functions,firestore:rules`.

## Turniej Piąteczki — mechanika (stan na dziś)

5 rund po 5 piosenek. P1 (zapraszający) układa rundy 2 i 4, gra je i
wysyła link. P2 gra WSZYSTKIE 5 rund (2 i 4 już gotowe, 1/3/5 układa
sam). P1 wraca i dogrywa 1/3/5. Limit: 5 pojedynków/tydzień/ksywka
(licznik w Firestore, transakcyjny).

**Temat rundy**: losuje się 4 kategorie i 3 dekady (z puli WSZYSTKICH,
łącznie ze specjalnymi Disney/F&F). Gracz MOŻE (nie musi) odrzucić po
jednej z każdej — kara **30 pkt** za odrzucenie (do 60 łącznie), widoczna
na ekranie jako kolorowy wskaźnik (zielony = bez kary, czerwony = kara).
Stałe: `LOSOWANYCH_KATEGORII`, `LOSOWANYCH_DEKAD`, `KARA_ODRZUCENIA`
w `turniej.js`.

**Powiadomienia**: automatyczne (Cloud Function `naRuchWTurnieju` po
zapisaniu ruchu) + ręczne (przycisk „Powiadom gracza” na ekranie
oczekiwania → zapis w `pojedynki/{id}/prosby` → Cloud Function
`naProsbePowiadomienia`). Adres w powiadomieniu liczy się względem
`self.registration.scope` w `sw.js` (NIE `self.location.origin` — to by
urwało ścieżkę `/Claude-mobile/jaka-to-melodia/`, kiedyś tak było i był
to realny bug).

**Wznawianie przerwanej gry**: `localStorage['jtm:aktywnyPojedynek']`
zapamiętuje id ostatniego pojedynku gracza; ekran startowy pokazuje
wtedy przycisk „Wróć do Turnieju Piąteczki”. Czyści się, gdy pojedynek
się kończy (dla nie-`readOnly` widza).

## Rozbudowa katalogu — jak to działa teraz (2026-10-05)

Cel: **~4000 utworów** z zachowaniem dzisiejszych proporcji dekada × kategoria.

**Sandbox NIE MA dostępu do API muzycznych.** iTunes, MusicBrainz i Deezer
odpowiadają `403 CONNECT` przez proxy — sprawdzone. Ale **CI na GitHubie ma**
(tak powstaje `podglady.json`), więc pobieranie musi iść przez workflow,
nie przez sesję. Nie próbuj tego obchodzić z sandboksa.

Łańcuch narzędzi:
1. `narzedzia/plan-katalogu.mjs` — liczy, ile dołożyć do każdego koszyka
   dekada × kategoria, żeby dojść do celu nie psując proporcji
   (`npm run plan`). Kategorie specjalne pokazuje osobno, bo ich się nie
   da pobrać po wykonawcach.
2. `dane/wykonawcy.js` — ~830 wykonawców w 7 kategoriach gatunkowych,
   z pokryciem wszystkich dekad. **To jest miejsce do rozbudowy**, gdy
   zabraknie utworów: dopisz wykonawców, nie tytuły.
3. `dane/filmy.js` — ~230 filmów pod kategorię filmową. Jej NIE da się
   zbierać po wykonawcach: odpowiedzią w pytaniu jest film, więc utwór musi
   mieć przypisany film. Tryb filmowy pyta o albumy ze ścieżkami i sprawdza
   rok ze sklepu rokiem filmu (ścieżka wychodzi razem z filmem, więc odstęp
   większy niż 2 lata = wznowienie albo inny album).
4. `narzedzia/zbierz-kandydatow.mjs` — pyta iTunes o dorobek każdego
   wykonawcy (`--tryb wykonawcy`) albo o ścieżki filmowe (`--tryb filmy`,
   `oba`). Tytuł, rok i podgląd biorą się ze sklepu, nie z pamięci modelu.
   Dwa zabezpieczenia na rok: najwcześniejsze wydanie danego tytułu + odsiew
   lat odstających od mediany wykonawcy (wznowienia).
5. `narzedzia/wpisz-kandydatow.mjs` — **bramka na duble**. Kandydat, którego
   `idUtworu` już jest w katalogu, jest odrzucany z podaniem powodu. Bez tego
   `przebuduj-katalog.mjs` po cichu podmieniłby istniejący wpis nowym
   (zostaje późniejszy) — tak kiedyś zniknęło „See You Again” z rapu. Tu też
   pilnowane są limity koszyków, bo zbieranie dzieli się na 5 części i żadna
   nie wie, co wzięły pozostałe.
6. Workflow `.github/workflows/katalog-rozbudowa.yml` — tylko z ręki
   (`workflow_dispatch`), 5 równoległych części, wejście `na_probe: tak`
   pokazuje wynik bez zapisu, `maks` ogranicza porcję.

**Ile utworów na wykonawcę**: limit (`MAKS_NA_WYKONAWCE`, dziś 8) liczy się
GLOBALNIE — razem z tym, co już jest w katalogu. Kiedy liczył się osobno
w każdym przebiegu, po trzech rundach John Williams miał 23 utwory, a Madonna
19, i to już nie przeboje, bo te weszły w rundzie pierwszej. Punkt odniesienia:
pierwotny, ręcznie dobrany katalog miał **średnio 1,81 utworu na wykonawcę**
i tylko jednego powyżej dwunastu. Kategorii filmowej limit nie dotyczy — tam
każdy wpis to inny film, więc więcej utworów jednego kompozytora znaczy więcej
różnych pytań (John Williams ma ich ~39 i to jest w porządku).

**`dane/odrzucone.js`** — utwory, których nie dopisujemy, choć sklep je podaje.
Samo usunięcie wpisu z katalogu NIE WYSTARCZA: następna dosypka nie widzi już
dubla i wpisuje go z powrotem (tak wróciły „Lulu — Let Go” i „Karin Stanek —
Chłopiec Z Gitarą” dzień po usunięciu). Lista porównuje się po PEŁNYM tytule —
przy porównaniu bez nawiasów wpis o wariancie „Don't Stop Me Now (…Revisited)”
zablokował też oryginał z 1978 i ten wypadł z katalogu.

**Sprzątanie nie rusza wpisów ręcznie dobranych.** Przy każdym porządkowaniu
odfiltruj to, co było w katalogu przed dosypkami (`git show <commit>^:...`) —
inaczej limit skasuje świadome decyzje (np. 14 szant Banana Boat).

**Dwie rzeczy, których NIE WOLNO zepsuć** (jedna już raz zepsuta):
- **Kolejności nagrań ze sklepu się nie sortuje.** Sklep oddaje je od
  najpopularniejszych, a w tej grze utwór trzeba ROZPOZNAĆ. Pierwszy
  przebieg sortował po roku rosnąco i zebrał 345 nieznanych kawałków sprzed
  popularności artystów („Tom Jones — The Vaults of Heaven”, „Kool & The Gang
  — Kools Back Again”). Po poprawce ci sami wykonawcy dali „Sexbomb”
  i „Everybody Hurts”. Test w `test-narzedzi.mjs` tego pilnuje.
- **Kandydatów przeplata się wykonawcami** (`naPrzemianWykonawcami`), bo
  koszyki przestają przyjmować po osiągnięciu planu — inaczej koszyk
  zapełniłoby po osiem kawałków kilku pierwszych wykonawców z listy.

**Jak odczytać wynik przebiegu z tego sandboksa**: logi zadań i artefakty są
nieosiągalne (host logów i Azure blob odrzucają połączenie). Czytelne są
**adnotacje**: narzędzia wypisują podsumowanie przez `::notice::`, a odbiera
się je przez `gh api repos/.../check-runs/<id>/annotations`. Dlatego
podsumowanie zawiera próbkę utworów z latami — po samej liczbie nie widać,
czy rok się zgadza.

**Zabezpieczenie przed „niby się pobrało”** (poprzedni Routine raportował
SUKCES, a w repo nic nie zostawało):
- workflow kończy się BŁĘDEM, jeśli katalog nie urósł, jeśli plik się nie
  zmienił, albo jeśli commit nie wszedł na zdalną gałąź — nie ma drogi do
  zielonego bez faktycznej zmiany w repozytorium;
- `narzedzia/sprawdz-wdrozenie.mjs` (`npm run wdrozenie`) przechodzi cały
  łańcuch: zacommitowane → wypchnięte → wmergowane w produkcyjną → ta sama
  liczba utworów na produkcji. **Odpalaj to zawsze, zanim powiesz
  użytkownikowi, że coś jest w aplikacji.**

## Pytania filmowe — reguła „bez odpowiedzi w treści" (2026-10-05)

Pytanie filmowe pokazuje tytuł ALBO wykonawcę i każe zgadnąć film. Przy
utworze „Theme from Jaws” pokazanie tytułu dawało pytanie, które odpowiada
samo sobie — tak było z 53 wpisami na 155. `zdradzaFilm()` w `js/katalog.js`
rozstrzyga, czy podpowiedź nie zawiera nazwy filmu; silnik wybiera tylko
uczciwą podpowiedź, a utwór, w którym zdradzają OBA pola, odpada z puli
i jest błędem w `sprawdz-dane.mjs`. Reguła celowo bywa nadwrażliwa — koszt
fałszywego trafienia to pokazanie wykonawcy zamiast tytułu, czyli nic.
Dotyczy to też utworów pobieranych automatycznie (`wpisz-kandydatow.mjs`).

## Automatyczny Routine: rozbudowa katalogu — WYŁĄCZONY (2026-09-06)

Był cykliczny Routine (`trig_01EHMdcxLvA2YDSb82DCncZX`, co ~5h) sam
dokładający utwory do `dane/utwory.js`. **Użytkownik poprosił o jego
trwałe zatrzymanie** (zużywał limit sesji przy każdym odnowieniu) —
usunięty przez `mcp__Claude_Code_Remote__delete_trigger` 2026-09-06.
Potwierdzone: `list_triggers` z `enabled:true` zwraca pustą listę.

**Nie twórz go ponownie bez wyraźnej prośby użytkownika.** Jeśli
użytkownik poprosi o wznowienie rozbudowy katalogu — zapytaj, czy chce
z powrotem cykliczny Routine, czy wolałby raczej ręczne, jednorazowe
odpalanie na żądanie.

Stan katalogu na dzień wyłączenia: **1543 utworów** (cel z czasów
Routine'a: 2200 → 3000 → 4000 → 5000, priorytet: kategorie specjalne
Disney/Szybcy i wściekli, potem Country & Folk, potem najchudsze koszyki
dekada×kategoria — te priorytety nadal obowiązują, gdyby ktoś kiedyś
wracał do tego ręcznie).

**2026-09-07, ręczna dogrywka na żądanie użytkownika** (bez Routine'a):
+23 utwory „Szybcy i wściekli" (teraz 32 łącznie), +21 Disney (teraz 32
łącznie), nowa kategoria specjalna **Szanty** (17 utworów — Zejman i
Garkumpel, Banana Boat, Perły i Łotry; cel był ~30, ale nie dało się
bezpiecznie zweryfikować więcej — słabo udokumentowane roki wydania
polskich szant, ten sam problem co już wcześniej zgłaszał Routine).
Katalog: 1595 utworów. Uwaga z tej sesji: `narzedzia/przebuduj-katalog.mjs`
przy dodawaniu utworów **cicho kasuje duble tytuł+wykonawca, zostawiając
PÓŹNIEJSZE wystąpienie** — złapało to raz nowy wpis „See You Again" (Wiz
Khalifa), który nadpisał istniejący wpis w kategorii `rap` nowym w
`furious`; zawsze grepuj nowe tytuły przed dodaniem i czytaj uważnie
wynik przebuduj-katalog.mjs pod kątem „Usunięte duble".

⚠️ Zanim wyłączono Routine, jego ostatnie zaplanowane przebiegi (m.in.
2026-09-04 15:19 UTC) zgłaszały `SUCCEEDED`, ale katalog się nie zmieniał
i nie było nowych commitów — coś w tym mechanizmie faktycznie szwankowało
(prawdopodobnie sesje kończyły się w stanie wymagającym przeglądu, a nie
faktycznie commitowały). Gdyby ktoś kiedyś odpalał to ponownie, warto to
najpierw zdiagnozować, zamiast zakładać, że po prostu zadziała.

## Preferencje użytkownika

- Rozmowa po polsku.
- Wyraźnie ceni oszczędność tokenów — krótkie statusy przy czekaniu na
  CI, bez zbędnej narracji, nie dublować pracy (np. nie odpalać ręcznie
  dużego batcha katalogu, skoro Routine i tak to robi w tle).
- Realnie testuje appkę na swoich urządzeniach (iOS + PC) i zgłasza
  konkretne, często cenne bugi — traktuj jego zgłoszenia jako priorytet
  nad hipotetycznymi usprawnieniami.
- Przy niejasnych/podyktowanych (voice-to-text, czasem urwane/pomieszane)
  prośbach dotyczących większej zmiany mechaniki — dopytaj (AskUserQuestion)
  zamiast zgadywać, zwłaszcza gdy błędna interpretacja kosztowałaby dużo
  pracy do przerobienia.
