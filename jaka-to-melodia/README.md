# Jaka to Melodia

Muzyczny quiz na wieczór. Jeden telefon prowadzi i puszcza trzydziestosekundowe
fragmenty, reszta zgaduje ze swoich — kto szybciej kliknie, ten ma więcej punktów.
Bez instalowania czegokolwiek: goście skanują kod QR i już grają.

**→ [olaf169-lang.github.io/Claude-mobile/jaka-to-melodia](https://olaf169-lang.github.io/Claude-mobile/jaka-to-melodia/)**

| | | |
|---|---|---|
| <img src="docs/ekran-lobby.png" width="240" alt="Lobby z kodem QR i listą graczy"> | <img src="docs/ekran-runda-prowadzacy.png" width="240" alt="Runda na ekranie prowadzącego"> | <img src="docs/ekran-koniec.png" width="240" alt="Podium na koniec gry"> |
| Lobby: kod QR i kto już jest | Runda: zegar i cztery odpowiedzi | Koniec: podium i tabela |

## Jak się gra

1. **Prowadzący** wybiera kategorie i dekady, ustawia czas na odpowiedź i otwiera
   pokój. Jego telefon warto podpiąć do głośnika — to z niego leci muzyka.
2. **Goście** skanują kod QR albo wchodzą na tę samą stronę i wpisują czteroznakowy
   kod pokoju oraz swoją ksywkę.
3. Leci fragment, na telefonach pojawiają się cztery odpowiedzi. Zegar tyka.
4. Po czasie prowadzący pokazuje, co to było, kto trafił i jak wygląda tabela.

Miejsca jest na **20 telefonów**, wygodnie gra się do czternastu. Każdy potrzebuje
internetu, ale niekoniecznie tego samego wi-fi — telefony spotykają się przez
publiczny broker w sieci, nie przez lokalną sieć.

## Punkty

Maksimum za rundę to **100 punktów** i dostaje je tylko ten, kto klika
natychmiast. Im dłużej się zastanawiasz, tym mniej zostaje — na sam koniec
czasu trafiona odpowiedź jest warta 50. Zła odpowiedź albo brak odpowiedzi to zero.

```
punkty = 100 × (1 − ½ × czas / limit)
```

Czas mierzy telefon gracza, od chwili gdy pytanie faktycznie pojawi się na jego
ekranie. Wolniejsze łącze nie zabiera więc punktów.

Opcjonalny **bonus za serię** dokłada +10 za każde kolejne trafienie z rzędu,
maksymalnie +50.

## Skąd bierze się muzyka

Z trzydziestosekundowych fragmentów, które sklepy muzyczne udostępniają publicznie
do przesłuchania — w pierwszej kolejności **iTunes Search API**, a gdy tam czegoś
nie ma, **Deezer**. Żaden z nich nie wymaga konta ani klucza.

Adresy nagrań nie są szukane w trakcie imprezy. Raz w miesiącu (i po każdej zmianie
katalogu) workflow `jaka-to-melodia.yml` przechodzi cały katalog na serwerze GitHuba,
dopasowuje utwory i zapisuje wynik w `dane/podglady.json`. Aplikacja tylko go czyta,
więc runda rusza od razu. Wyszukiwanie w locie zostało jako zapas dla utworów
dopisanych po ostatnim przebiegu.

Wyszukiwarka iTunes przepuszcza około **dwudziestu zapytań na minutę z jednego
adresu** i nie da się tego obejść ponawianiem — trzeba pytać wolniej. Skrypt ma
więc bramkę pilnującą stałego odstępu, a workflow dzieli katalog na pięć części
i puszcza je równolegle na osobnych maszynach: pięć adresów, pięć limitów, całość
poniżej dziesięciu minut zamiast godziny. Potem `narzedzia/scal-podglady.mjs`
składa części z powrotem w jeden plik.

Dopasowanie nie jest naiwne: zapytanie „Queen Radio Ga Ga” zwraca też karaoke,
składanki coverów i wersje koncertowe. `js/dopasowanie.js` odrzuca podejrzane
dopiski, wymaga zgodnego wykonawcy i premiuje nagranie z roku wydania singla.

**Wolisz puszczać swoje?** Wyłącz „Muzykę z aplikacji” w ustawieniach. Gra pokazuje
wtedy tylko pytanie, zegar i odpowiedzi, a za dźwięk odpowiada prowadzący.

## Katalog

493 utwory w sześciu kategoriach i pięciu dekadach:

| dekada | Pop | Rock | Rap | Dance | R&B / soul | Polskie |
|---|---:|---:|---:|---:|---:|---:|
| lata 80. | 22 | 21 | 10 | 16 | 10 | 15 |
| lata 90. | 13 | 21 | 15 | 25 | 12 | 21 |
| lata 2000. | 16 | 23 | 16 | 20 | 15 | 14 |
| lata 2010. | 24 | 19 | 19 | 23 | 12 | 19 |
| lata 2020. | 20 | 12 | 10 | 11 | 10 | 9 |

„Polskie” to osobna kategoria, bez dzielenia na gatunki — pozostałe pięć obejmuje
kawałki anglojęzyczne. Każdy polski wpis ma jednak w tle pole `styl`, dzięki
któremu do polskiego rocka nie podstawi się disco polo.

### Dopisanie piosenki

Jedna linijka w [`dane/utwory.js`](dane/utwory.js), w sekcji właściwej dekady
i kategorii:

```js
{ tytul: 'Mój dom', wykonawca: 'Kortez', rok: 2015, gatunek: 'polskie', styl: 'pop' },
```

Potem `node narzedzia/sprawdz-dane.mjs` (wyłapie duble i literówki w polach), a przy
najbliższym pushu workflow sam znajdzie nagranie. Utwór, do którego nagrania nie ma,
po prostu nie wejdzie do losowania — nazwa trafi na listę braków w podsumowaniu
przebiegu, więc od razu widać, co poprawić.

### Skąd biorą się złe odpowiedzi

Nie z losowania po całym katalogu. Kandydaci są punktowani za podobieństwo do
poprawnej odpowiedzi: inny kawałek tego samego wykonawcy, ta sama kategoria, ta sama
dekada, zbliżony rok. Do pytania trafiają najwyżej ocenieni. Przy pytaniu „kto
śpiewa” dodatkowo pilnujemy, żeby obok siebie nie stanęli „Taco Hemingway”
i „Dawid Podsiadło & Taco Hemingway”.

## Ustawienia

| | |
|---|---|
| **Kategorie i dekady** | Dowolne połączenie; licznik od razu pokazuje, ile utworów zostaje w puli. |
| **Czas na odpowiedź** | 5, 7, 10, 15 albo 20 sekund. |
| **Liczba rund** | Od 5 do 25. Jeśli pula jest mniejsza, gra po prostu się skróci. |
| **O co pytamy** | O tytuł, o wykonawcę, albo raz o to, raz o to. |
| **Muzyka z aplikacji** | Wyłącz, jeśli puszczasz z własnego źródła. |
| **Losowy moment** | Fragment zaczyna się za każdym razem gdzie indziej — trudniej. |
| **Bonus za serię** | +10 za każde kolejne trafienie, do +50. |

Ustawienia zapamiętują się na telefonie prowadzącego.

## Jak to jest zrobione

Statyczna strona — HTML, CSS i moduły ES, bez budowania i bez frameworka. Wszystko
w [`js/`](js):

| plik | za co odpowiada |
|---|---|
| `katalog.js` | wspólne rozumienie utworu: identyfikator, dekada, porównywanie nazw |
| `gra.js` | silnik: losowanie rund, dobór złych odpowiedzi, punktacja, tabela |
| `mqtt.js` | mini-klient MQTT 3.1.1 po WebSocket (~200 linii zamiast biblioteki) |
| `siec.js` | pokój: kod, kod QR, protokół prowadzący ↔ gracze, wracanie po zerwaniu |
| `podglady.js` | skąd wziąć nagranie: plik z repozytorium, pamięć telefonu, sklep |
| `dopasowanie.js` | wybór właściwego nagrania spośród karaoke i wznowień |
| `odtwarzacz.js` | odtwarzanie z obejściami dla iOS-a, doczytywanie następnego utworu |
| `prowadzacy.js` / `gracz.js` | dwa tryby aplikacji, doczytywane dopiero po wyborze roli |

### Bez własnego serwera

Telefony rozmawiają przez publiczny broker MQTT (EMQX, w razie czego HiveMQ albo
Mosquitto) na dwóch tematach: `jtm/<KOD>/h` od prowadzącego i `jtm/<KOD>/g` od graczy.
Prowadzący jest jedynym źródłem prawdy — telefony niczego nie rozstrzygają.

Stan rundy jest nadawany co 1,2 sekundy, a nie raz. Dzięki temu telefon, który
dołączył w połowie albo na chwilę stracił zasięg, dostraja się sam. Poprawna
odpowiedź nie leci w eter przed odsłoną, więc nie da się jej podejrzeć
w podglądzie ruchu sieciowego.

Kod pokoju ma cztery znaki z alfabetu bez `O`, `0`, `I` i `1` — żeby dało się go
podyktować przez pokój.

### iPhone i Android

- Pierwsze odtworzenie musi wyjść z dotknięcia ekranu, więc przy „Zaczynamy”
  rozgrzewamy odtwarzacz ciszą. Kolejne rundy ruszają już same.
- Safari na iPhonie ignoruje ustawianie głośności z kodu — sprawdzamy to raz
  i tam, gdzie się nie da, po prostu nie wyciszamy płynnie.
- Ekran nie gaśnie w trakcie gry (Screen Wake Lock, gdzie jest dostępny).
- Dwa elementy `<audio>` na zmianę: jeden gra, drugi doczytuje następny utwór.

### Testy

```bash
npm install          # aedes, ws, playwright — tylko do testów
npm test             # katalog, silnik, połączenie, dobieranie nagrań
npm run test:przegladarka   # pełna rozgrywka: prowadzący i pięć telefonów
```

Test przeglądarkowy stawia własny broker i własny serwer plików, otwiera sześć
kart i przechodzi grę od lobby do podium. Sprawdza między innymi, czy szybsza
odpowiedź daje więcej punktów, czy telefon wchodzący w środku rundy dostaje resztę
czasu i czy poprawna odpowiedź nie pojawia się w eterze przed odsłoną.

## Gdy coś nie działa

**„Nie ma takiego pokoju”** — prowadzący musi mieć otwarte lobby. Sprawdź też, czy
kod jest przepisany dokładnie; w kodach nie występują `O`, `0`, `I` ani `1`.

**Nikt nie może dołączyć** — w ustawieniach jest przycisk *Sprawdź połączenie*.
Pokaże, który z trzech brokerów odpowiada. Warto go kliknąć przed imprezą,
zwłaszcza w obcej sieci.

**Cisza zamiast muzyki** — na iPhonie zdarza się, gdy gra ruszyła bez dotknięcia
ekranu. Wyjdź do lobby i naciśnij „Zaczynamy” jeszcze raz. Jeśli konkretny utwór
nie chce zagrać, przycisk *Pomiń* wyrzuca go z tej gry.

**Sieć blokuje publiczne brokery** — można wskazać własny, dopisując do adresu
`?serwer=wss://twoj.broker/mqtt`. Parametr zostaje w linku do dołączenia, więc
wystarczy ustawić go raz, u prowadzącego.

## O prywatności

Broker jest publiczny i nieszyfrowany na poziomie treści: kto zna czteroznakowy kod
pokoju, może podejrzeć ruch. W eterze są tylko ksywki, pytania i punkty — nic, czego
nie widać na ekranie. Poprawna odpowiedź jedzie dopiero na odsłonie, więc nawet
podglądanie nie pomoże wygrać.

## Licencja

Kod aplikacji — jak reszta repozytorium. Generator kodów QR w `vendor/` pochodzi
z pakietu `qrcode-generator` (Kazuhiko Arase, MIT) i leży tam bez zmian; szczegóły
w [`vendor/CZYTAJ.md`](vendor/CZYTAJ.md).
