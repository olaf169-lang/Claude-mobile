# MANTIS 🦗

Prosta, przyjazna gra mobilna dla dziecka około 5 do 6 lat. Sterujesz modliszką,
polujesz na owady, rośniesz przez kolejne stadia, przeżywasz wylinkę i dorastasz
do modliszki ze skrzydłami. Bez przemocy, bez kar, z minimalną ilością tekstu.

Gra jest oparta na prawdziwej biologii modliszek: osiem stadiów i siedem wylinek,
polowanie z zasadzki, wylinka głową w dół, skrzydła dopiero u dorosłej, ooteka na
końcu. Trzy gatunki to trzy prawdziwe modliszki, każda z własnym światem i sposobem
polowania.

## Jak zagrać

To zwykła strona (PWA), działa offline po pierwszym otwarciu, jak BANGladesz26.
Otwórz `index.html` w przeglądarce telefonu i dodaj do ekranu głównego.

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
    menu.js           ekran domowy, wybór modliszki, odblokowania
  narzedzia/
    podglad.html      podgląd rysunków do prac nad grafiką (dev)
  PROJEKT.md          projekt gry i podjęte decyzje
  brief-pierwotny.md  pierwotny brief
```

## Stan prac

Zrobione: M0 wygląd, M1 chodzenie, M2 owady i polowanie, M3 wylinka i zwycięstwo,
M4 ekran domowy i zapis, M5 trzy światy i style polowania.
Zostało: M6 oprawa (dźwięk, album ciekawostek, dopracowanie animacji, instalacja PWA
i pełne działanie offline).
