#!/usr/bin/env python3
"""Rysuje komplet ikon „Jakiej to Melodii” — nutę na dyskotekowym gradiencie.

    python3 narzedzia/ikony.py

Zapisuje do jaka-to-melodia/icons/: favicon.png, icon-192.png, icon-512.png,
maskable-192.png, maskable-512.png i podglad.png (karta linku 1200×630).
Rysujemy w czterokrotnym powiększeniu i zmniejszamy — najtańszy antyaliasing,
jaki jest.
"""

from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFont

KATALOG = pathlib.Path(__file__).resolve().parent.parent / "icons"
SS = 4                                    # krotność nadpróbkowania

TLO = (10, 7, 20)
MAGENTA = (255, 77, 157)
FIOLET = (154, 123, 255)
LAZUR = (56, 225, 214)
TUSZ = (18, 10, 34)

CZCIONKI = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def czcionka(rozmiar: int) -> ImageFont.FreeTypeFont:
    for sciezka in CZCIONKI:
        if pathlib.Path(sciezka).exists():
            return ImageFont.truetype(sciezka, rozmiar)
    return ImageFont.load_default()


def gradient(rozmiar: tuple[int, int]) -> Image.Image:
    """Ukośne przejście magenta → fiolet → lazur, jak w interfejsie."""
    szerokosc, wysokosc = rozmiar
    plotno = Image.new("RGB", rozmiar, TLO)
    piksele = plotno.load()
    for y in range(wysokosc):
        for x in range(szerokosc):
            # Kąt zbliżony do 112° z arkusza stylów.
            t = (x / max(1, szerokosc - 1)) * 0.78 + (y / max(1, wysokosc - 1)) * 0.22
            if t < 0.54:
                u = t / 0.54
                barwa = tuple(round(MAGENTA[i] + (FIOLET[i] - MAGENTA[i]) * u) for i in range(3))
            else:
                u = (t - 0.54) / 0.46
                barwa = tuple(round(FIOLET[i] + (LAZUR[i] - FIOLET[i]) * u) for i in range(3))
            piksele[x, y] = barwa
    return plotno


def nuta(plotno: Image.Image, srodek: tuple[int, int], wysokosc: int, kolor) -> None:
    """Ósemka: główka, ogonek i chorągiewka. Rysowana wprost, bez czcionki —
    znak ♪ w różnych systemach wygląda za każdym razem inaczej."""
    rysownik = ImageDraw.Draw(plotno)
    # Nuta nie jest symetryczna: główka wystaje w lewo, chorągiewka w prawo,
    # a ogonek w górę. Przesuwamy punkt odniesienia tak, żeby wyśrodkowany był
    # obrys znaku, a nie ogonek.
    sx = srodek[0] + round(wysokosc * 0.04)
    sy = srodek[1] - round(wysokosc * 0.035)
    gruboscOgonka = max(2, round(wysokosc * 0.085))
    promienGlowki = round(wysokosc * 0.19)

    dolOgonka = sy + round(wysokosc * 0.30)
    goraOgonka = sy - round(wysokosc * 0.42)
    xOgonka = sx

    rysownik.rounded_rectangle(
        [xOgonka - gruboscOgonka // 2, goraOgonka, xOgonka + gruboscOgonka // 2, dolOgonka],
        radius=gruboscOgonka // 2, fill=kolor,
    )
    rysownik.ellipse(
        [xOgonka - promienGlowki * 2, dolOgonka - promienGlowki,
         xOgonka, dolOgonka + promienGlowki],
        fill=kolor,
    )
    # Chorągiewka — łuk w prawo od góry ogonka.
    rysownik.polygon(
        [
            (xOgonka, goraOgonka),
            (xOgonka + round(wysokosc * 0.30), goraOgonka + round(wysokosc * 0.16)),
            (xOgonka + round(wysokosc * 0.28), goraOgonka + round(wysokosc * 0.34)),
            (xOgonka + gruboscOgonka, goraOgonka + round(wysokosc * 0.20)),
        ],
        fill=kolor,
    )


def ikona(bok: int, maskowalna: bool = False) -> Image.Image:
    dolny = bok * SS
    tlo = gradient((dolny, dolny))
    warstwa = Image.new("RGBA", (dolny, dolny), (0, 0, 0, 0))

    # Maskowalna ikona musi znieść przycięcie do koła — stąd mniejsza nuta.
    skala = 0.46 if maskowalna else 0.60
    nuta(warstwa, (dolny // 2, dolny // 2), round(dolny * skala), TUSZ + (255,))

    obraz = tlo.convert("RGBA")
    obraz.alpha_composite(warstwa)

    if not maskowalna:
        # Zwykła ikona dostaje zaokrąglenie; maskowalną przycina system.
        maska = Image.new("L", (dolny, dolny), 0)
        ImageDraw.Draw(maska).rounded_rectangle(
            [0, 0, dolny - 1, dolny - 1], radius=round(dolny * 0.22), fill=255,
        )
        obraz.putalpha(maska)

    return obraz.resize((bok, bok), Image.LANCZOS)


def podglad() -> Image.Image:
    """Karta 1200×630 do podglądu linku w komunikatorach."""
    dolny = (1200 * 2, 630 * 2)
    obraz = Image.new("RGBA", dolny, TLO + (255,))
    pasek = gradient((dolny[0], round(dolny[1] * 0.14)))
    obraz.paste(pasek, (0, dolny[1] - pasek.height))

    warstwa = Image.new("RGBA", dolny, (0, 0, 0, 0))
    nuta(warstwa, (round(dolny[0] * 0.17), round(dolny[1] * 0.44)), round(dolny[1] * 0.46), MAGENTA + (255,))
    obraz.alpha_composite(warstwa)

    rysownik = ImageDraw.Draw(obraz)
    rysownik.text((round(dolny[0] * 0.30), round(dolny[1] * 0.30)),
                  "Jaka to Melodia", font=czcionka(round(dolny[1] * 0.14)), fill=(242, 238, 255))
    rysownik.text((round(dolny[0] * 0.30), round(dolny[1] * 0.50)),
                  "Muzyczny quiz na imprezę", font=czcionka(round(dolny[1] * 0.07)), fill=(173, 163, 200))
    return obraz.resize((1200, 630), Image.LANCZOS)


def main() -> None:
    KATALOG.mkdir(parents=True, exist_ok=True)
    ikona(64).save(KATALOG / "favicon.png")
    ikona(192).save(KATALOG / "icon-192.png")
    ikona(512).save(KATALOG / "icon-512.png")
    ikona(192, maskowalna=True).save(KATALOG / "maskable-192.png")
    ikona(512, maskowalna=True).save(KATALOG / "maskable-512.png")
    podglad().save(KATALOG / "podglad.png")
    for plik in sorted(KATALOG.iterdir()):
        print(f"{plik.name}: {plik.stat().st_size // 1024} kB")


if __name__ == "__main__":
    main()
