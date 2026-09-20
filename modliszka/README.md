# MANTIS 🦗

Prosta, przyjazna gra mobilna dla dziecka około 5 do 6 lat. Sterujesz modliszką,
polujesz na owady, rośniesz przez kolejne stadia, przeżywasz wylinkę i dorastasz
do modliszki ze skrzydłami. Bez przemocy, bez kar, z minimalną ilością tekstu.

Gra jest oparta na prawdziwej biologii modliszek: osiem stadiów i siedem wylinek,
polowanie z zasadzki, wylinka głową w dół, skrzydła dopiero u dorosłej, ooteka na
końcu. Trzy gatunki to trzy prawdziwe modliszki, każda z własnym światem i sposobem
polowania.

## Jak zagrać

Najprościej: plik `mantis-jeden-plik.html` zawiera całą grę w jednym pliku,
działa offline bez serwera. Otwórz go w przeglądarce telefonu i dodaj do ekranu
głównego. Ten plik można też wysłać znajomym, nic więcej nie potrzebuje.

Wersja rozdzielona na pliki to `index.html` plus katalog `silnik/`. Działa tak
samo, wygodniejsza do dalszych prac nad kodem.

### Publikacja na GitHub Pages (na później)

Pages tego repozytorium jest przypięte do gałęzi domyślnej
(`claude/przeglad-news-app-iqyboa`), bo środowisko `github-pages` puszcza
wdrożenia tylko z niej. Żeby wystawić MANTIS pod stałym adresem, trzeba katalog
`modliszka/` dołożyć do publikacji na gałęzi domyślnej (tak jak dokładany jest
tam `bangladesz26/`), albo założyć osobne repozytorium tylko na grę. To decyzja
do podjęcia świadomie, dlatego nie ma tu workflow, który publikuje z gałęzi
roboczej (taki i tak byłby odrzucany przez to środowisko).

## Sterowanie

Dotknij owada, modliszka podejdzie i go złapie. Dotknij pustego miejsca, pójdzie
w tamtą stronę. Podchodź wolno do czujnych owadów, bo szybki ruch je płoszy.

## Trzy modliszki

| gatunek | świat | polowanie |
|---|---|---|
| modliszka zwyczajna (*Mantis religiosa*) | letnia łąka | skradanie |
| modliszka duchowa (*Phyllocrania paradoxa*) | jesienna ściółka | kamuflaż |
| modliszka storczykowa (*Hymenopus coronatus*) | kwiat o zmierzchu | wabienie owadów |

Ukończenie jednej odblokowuje następną.

## Struktura

```
modliszka/
  index.html          ekran domowy plus gra
  silnik/
    modliszka.js      rysunek modliszki (części, stadia, wylinka)
    owad.js           rysunek i typy owadów
    swiat.js          trzy światy (palety, tło, cząsteczki)
    gra.js            pętla gry, kamera, polowanie, wzrost, wylinka
    zapis.js          zapis lokalny (localStorage)
    menu.js           ekran domowy, wybór modliszki, odblokowania, album
    dzwiek.js         dźwięki w Web Audio (chód, jedzenie, wzrost, wylinka)
    album.js          album ciekawostek (karty i fakty)
  ikony/              ikona aplikacji (192, 512)
  manifest.webmanifest, sw.js   instalacja jako aplikacja i offline
  narzedzia/
    podglad.html      podgląd rysunków do prac nad grafiką (dev)
  PROJEKT.md          projekt gry i podjęte decyzje
  brief-pierwotny.md  pierwotny brief
```

## Stan prac

Zrobione: M0 wygląd, M1 chodzenie, M2 owady i polowanie, M3 wylinka i zwycięstwo,
M4 ekran domowy i zapis, M5 trzy światy i style polowania, M6 oprawa (dźwięk chodu
i jedzenia, album ciekawostek, ikona, manifest i service worker do instalacji jako
aplikacja i działania offline).
