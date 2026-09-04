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

## Automatyczny Routine: rozbudowa katalogu

Cykliczny Routine (`trig_01EHMdcxLvA2YDSb82DCncZX`, co ~5h, cron
`18 */5 * * *`) sam dokłada utwory do `dane/utwory.js`, testuje,
commituje i merguje na produkcję — bez udziału bieżącej sesji. Cel:
2200 → 3000 → 4000 → 5000 utworów, priorytet na kategorie specjalne
(Disney, Szybcy i wściekli), potem Country & Folk, potem najchudsze
koszyki dekada×kategoria. Stan na 2026-09-04: **1543 utworów**.

⚠️ **Do sprawdzenia**: ostatni zaplanowany przebieg (2026-09-04
15:19 UTC) zgłosił się jako `SUCCEEDED` w ~3,5 minuty, ale katalog się
nie zmienił (wciąż 1543) i nie ma nowego commitu w logu. To podejrzanie
szybko jak na research+dopisanie+testy+push+merge. Warto sprawdzić
transkrypt tej sesji (`session_id: cse_011MsiyFFRp5qABeJHSWwZrZ`,
`get_session`) albo po prostu obejrzeć następny przebieg — jeśli katalog
dalej stoi w miejscu, coś w promptcie/środowisku Routine'a się zepsuło.

Można odpalić przebieg od razu (nie czekając na harmonogram) przez
`mcp__Claude_Code_Remote__fire_trigger` z tym `trigger_id` — opcjonalnie
z dodatkowym `text`, żeby np. zawęzić priorytet albo zmniejszyć rozmiar
porcji na to jedno uruchomienie (użytkownik czasem prosi o mniejszy
batch, żeby oszczędzić tokeny).

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
