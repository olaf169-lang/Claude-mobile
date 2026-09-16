---
name: bez-pauzy
description: Zakaz pauzy (U+2014) i półpauzy (U+2013) w tekstach po polsku. Używaj, gdy piszesz cokolwiek po polsku: teksty w aplikacjach, instrukcje, opisy, komentarze w kodzie, commity, README i odpowiedzi na czacie.
---

# Bez pauzy

W tekstach po polsku **nie używamy pauzy (`U+2014`) ani półpauzy (`U+2013`)**.
Dotyczy to wszystkiego: interfejsu aplikacji, instrukcji, dokumentacji, komentarzy
w kodzie, opisów commitów i zwykłych odpowiedzi na czacie.

## Czym zastępować

Najpierw forma słowna, dopiero na końcu myślnik:

| Sytuacja | Napisz tak |
|---|---|
| wynikanie | `Nie grasz, to nie tracisz` |
| wyliczenie | `Tabela: zwycięstwa, sety, punkty` |
| doprecyzowanie | `Wygrałeś wszystko, minimum 3 mecze` |
| przeciwstawienie | `To ciekawostka, a nie waluta` |
| definicja | `ELO, czyli forma` |
| dwa zdania | `Zapisane. Wieczór zamknięty` |

Przydatne: `czyli`, `bo`, `więc`, `a`, `ale`, `to`, dwukropek, nawias, kropka
i nowe zdanie.

## Gdy naprawdę nie ma wyjścia

Jeśli po kilku próbach nic nie brzmi dobrze (wąska komórka tabeli, ciasny przycisk),
użyj **krótkiego myślnika `-`**, nigdy pauzy. Na „brak wartości” lepiej wygląda
`·` albo słowo `brak`.

## Kontrola przed oddaniem pracy

```bash
grep -rn "$(printf '\u2014\|\u2013')" <ścieżka>   # ma nic nie zwrócić
```
