# Siłka Piąteczki

Apka na siłownię dla Olafa: dwa treningi całego ciała (A i B na zmianę),
rozciąganie na 7 minut i rysunkowy koks, który rośnie razem z formą.

**Adres:** https://olaf169-lang.github.io/Claude-mobile/silka-piateczki/

## Instalacja na telefonie

1. Otwórz adres w Chrome na Androidzie.
2. Menu ⋮ → **Zainstaluj aplikację** (albo „Dodaj do ekranu głównego”).
3. Gotowe: ikona z koksem na ekranie, apka działa też bez zasięgu.

Na iPhonie: Safari → Udostępnij → „Do ekranu początkowego”.

## Co jest w środku

| ekran | co robi |
|---|---|
| **Koks** | siłacz rosnący z poziomem, sztanga z tarczami jako pasek XP, licznik dni od treningu (cel: przerwa najwyżej 5 dni) i seria treningów w terminie |
| **Trening** | plany A i B, odhaczanie serii, ciężar i powtórzenia podstawiane z ostatniego razu, podpowiedź „dołóż”, zamienniki, własne ćwiczenia, superserie, odliczanie przerwy |
| **Rozciąganie** | 6 pozycji, tryb prowadzony: sam odlicza, zmienia strony i daje sygnał |
| **Postępy** | odznaki, rekordy z wykresami, historia, ustawienia i kopia zapasowa |

### Nagrody

- **XP:** 10 za serię, 100 za trening, 50 za rekord, 50 za komplet serii,
  60 za trening po przerwie najwyżej 5 dni, 40 za rozciąganie.
- **Poziomy:** Patyczak, Świeżak, Bywalec, Twardziel, Kafar, Koks, Byk, Tur,
  Mamut, Legenda Piąteczki. Przy 1 do 2 treningach w tygodniu Legenda wypada
  mniej więcej po roku.
- **Koks** rośnie płynnie z każdym treningiem, nie tylko przy awansie.
  Dotknięcie koksa na ekranie głównym: pręży się.
- **Rekord** (większy ciężar, więcej powtórzeń tym samym ciężarem albo wyższy
  szacowany maks) odpala pełnoekranowe prężenie z tarczami lecącymi z góry.
  Pierwszy raz w danym ćwiczeniu to punkt startowy, nie rekord.

### Podpowiedź ciężaru

Podwójna progresja: gdy w ostatnim treningu każda seria doszła do górnej granicy
zakresu (np. 12 przy 8-12), apka podstawia ciężar o krok wyżej (hantle +2 kg,
reszta +2,5 kg) i dolną granicę powtórzeń.

### Zamiany

Każde ćwiczenie ma 2 do 4 zamienników na ten sam mięsień (gdy maszyna zajęta).
Przy zamianie w trakcie treningu wybierasz: tylko dziś albo na stałe w planie.
Można też wybrać z pełnej listy podzielonej na obszary albo wpisać własne
ćwiczenie, które zapisze się na stałe.

## Dane

Wszystko w `localStorage` telefonu (klucz `silka:v1`). Bez kont i serwera.
Kopia zapasowa: Postępy → Ustawienia → Zapisz kopię (plik JSON) / Wczytaj kopię.

## Pliki

```
index.html, styles.css, sw.js, manifest.webmanifest
js/
  app.js               przełączanie ekranów
  dane.js              ćwiczenia, plany, rozciąganie, poziomy, odznaki
  logika.js            rekordy, podpowiedzi, XP, serie (bez DOM, testowane w Node)
  magazyn.js           stan w localStorage, kopia zapasowa
  koks.js              rysowanie koksa i sztangi (SVG liczone z masy i pozy)
  swieto.js            pełnoekranowe nagrody
  ekran-*.js           cztery ekrany
  arkusze.js           szczegóły ćwiczenia, wybór zamiennika
  odpoczynek.js, wykres.js, ui.js
img/cw/                kadry ćwiczeń (start i koniec ruchu), webp
fonts/                 Barlow i Barlow Condensed (OFL), tylko znaki łacińskie z polskimi
narzedzia/
  sprawdz.mjs          kontrola: składnia, dane, offline, logika, brak pauz
  zasoby.py            przygotowanie zdjęć i czcionek
  zdjecia.txt          lista kadrów z free-exercise-db
```

## Źródła

- Zdjęcia ćwiczeń: [free-exercise-db](https://github.com/yuhonas/free-exercise-db),
  domena publiczna (Unlicense).
- Czcionki: [Barlow](https://github.com/google/fonts/tree/main/ofl/barlow), licencja OFL.
- Pomysły z otwartych apek treningowych: podwójna progresja (Liftosaur),
  odhaczanie serii jednym dotknięciem z automatycznym odpoczynkiem (LiftLog),
  XP, poziomy i serie (RepMax Tracker).
