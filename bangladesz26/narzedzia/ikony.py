#!/usr/bin/env python3
"""Rysuje komplet ikon BANGladesz26 — maskotkę-globus w gradiencie aplikacji.

    python3 narzedzia/ikony.py

Zapisuje do bangladesz26/icons/: favicon.png, icon-192.png, icon-512.png,
maskable-192.png, maskable-512.png oraz podglad.png (karta linku 1200×630).
Rysujemy w czterokrotnym powiększeniu i zmniejszamy — to najtańszy antyaliasing.
"""

from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

KATALOG = pathlib.Path(__file__).resolve().parent.parent / "icons"
SS = 4                                   # krotność nadpróbkowania

TLO = (11, 15, 34)
SAKURA = (255, 143, 200)
FIOLET = (138, 123, 255)
CYJAN = (125, 216, 255)
TUSZ = (18, 19, 43)

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
    """Ukośny gradient sakura → fiolet → cyjan, ten sam co w CSS."""
    szer, wys = rozmiar
    plotno = Image.new("RGB", rozmiar)
    piksele = plotno.load()
    for y in range(wys):
        for x in range(szer):
            t = (x / max(szer - 1, 1)) * 0.72 + (y / max(wys - 1, 1)) * 0.28
            if t < 0.52:
                u = t / 0.52
                para = (SAKURA, FIOLET)
            else:
                u = (t - 0.52) / 0.48
                para = (FIOLET, CYJAN)
            a, b = para
            piksele[x, y] = tuple(round(a[i] + (b[i] - a[i]) * u) for i in range(3))
    return plotno


def globus(bok: int) -> Image.Image:
    """Maskotka: kula w gradiencie, oczy, rumieńce, uśmiech — z przezroczystym tłem."""
    b = bok * SS
    maska = Image.new("L", (b, b), 0)
    ImageDraw.Draw(maska).ellipse((0, 0, b - 1, b - 1), fill=255)

    kula = gradient((b, b)).convert("RGBA")
    kula.putalpha(maska)
    rysuj = ImageDraw.Draw(kula)

    # Południki i równoleżniki — delikatne, żeby nie zjadły twarzy.
    lad = (9, 12, 30, 70)
    grubosc = max(2, round(b * 0.024))
    rysuj.arc((b * 0.05, b * 0.09, b * 0.95, b * 0.33), 195, 345, fill=lad, width=grubosc)
    rysuj.arc((b * 0.05, b * 0.71, b * 0.95, b * 0.95), 195, 345, fill=lad, width=grubosc)
    rysuj.arc((b * 0.30, b * 0.02, b * 0.70, b * 0.98), 100, 260, fill=lad, width=grubosc)

    # Twarz.
    rumieniec = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    r = ImageDraw.Draw(rumieniec)
    for cx in (0.245, 0.755):
        r.ellipse((b * (cx - 0.105), b * 0.545, b * (cx + 0.105), b * 0.645),
                  fill=SAKURA + (205,))
    rumieniec = rumieniec.filter(ImageFilter.GaussianBlur(b * 0.02))
    kula.alpha_composite(rumieniec)

    oko = b * 0.058
    for cx in (0.375, 0.625):
        rysuj.ellipse((b * cx - oko, b * 0.47 - oko, b * cx + oko, b * 0.47 + oko), fill=TUSZ + (255,))
    rysuj.arc((b * 0.38, b * 0.50, b * 0.62, b * 0.72), 20, 160,
              fill=TUSZ + (255,), width=max(2, round(b * 0.035)))

    return kula.resize((bok, bok), Image.LANCZOS)


def zaokraglony(bok: int, promien_wzgl: float, kolor: tuple[int, int, int]) -> Image.Image:
    b = bok * SS
    plotno = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    ImageDraw.Draw(plotno).rounded_rectangle(
        (0, 0, b - 1, b - 1), radius=int(b * promien_wzgl), fill=kolor + (255,)
    )
    return plotno.resize((bok, bok), Image.LANCZOS)


def ikona(bok: int, *, maskowalna: bool) -> Image.Image:
    tlo = zaokraglony(bok, 0.001 if maskowalna else 0.22, TLO)
    # Poświata pod kulą, żeby ikona nie była płaska.
    poswiata = Image.new("RGBA", (bok, bok), (0, 0, 0, 0))
    ImageDraw.Draw(poswiata).ellipse(
        (bok * 0.10, bok * 0.12, bok * 0.90, bok * 0.92), fill=FIOLET + (110,)
    )
    tlo.alpha_composite(poswiata.filter(ImageFilter.GaussianBlur(bok * 0.10)))

    udzial = 0.58 if maskowalna else 0.74     # maskowalna musi zmieścić się w bezpiecznym kole
    kula = globus(round(bok * udzial))
    odstep = (bok - kula.width) // 2
    tlo.alpha_composite(kula, (odstep, odstep))
    return tlo


def podglad() -> Image.Image:
    """Karta linku do komunikatorów — 1200×630."""
    szer, wys = 1200, 630
    plotno = Image.new("RGBA", (szer, wys), TLO + (255,))

    for srodek, kolor, promien in (((150, 40), SAKURA, 520), ((1080, 90), CYJAN, 460), ((600, 720), FIOLET, 560)):
        warstwa = Image.new("RGBA", (szer, wys), (0, 0, 0, 0))
        ImageDraw.Draw(warstwa).ellipse(
            (srodek[0] - promien, srodek[1] - promien, srodek[0] + promien, srodek[1] + promien),
            fill=kolor + (70,),
        )
        plotno.alpha_composite(warstwa.filter(ImageFilter.GaussianBlur(120)))

    kula = globus(230)
    plotno.alpha_composite(kula, (86, 200))

    rysuj = ImageDraw.Draw(plotno)
    lewy, prawy = 360, szer - 60

    def linia(tekst: str, y: int, rozmiar: int, kolor: tuple[int, int, int, int]) -> None:
        """Zmniejsza stopień, dopóki wiersz nie zmieści się w karcie."""
        font = czcionka(rozmiar)
        while rysuj.textlength(tekst, font=font) > prawy - lewy and rozmiar > 12:
            rozmiar -= 2
            font = czcionka(rozmiar)
        rysuj.text((lewy, y), tekst, font=font, fill=kolor)

    linia("BANGladesz26", 208, 96, (238, 241, 251, 255))
    linia("Wylosuj miasto, do którego warto pojechać", 332, 38, (169, 178, 212, 255))
    linia("430 miast  ·  6 kontynentów  ·  litera do wyboru", 396, 30, (125, 216, 255, 255))
    return plotno.convert("RGB")


def main() -> None:
    KATALOG.mkdir(parents=True, exist_ok=True)
    plany = [
        ("favicon.png", ikona(64, maskowalna=False)),
        ("icon-192.png", ikona(192, maskowalna=False)),
        ("icon-512.png", ikona(512, maskowalna=False)),
        ("maskable-192.png", ikona(192, maskowalna=True)),
        ("maskable-512.png", ikona(512, maskowalna=True)),
        ("podglad.png", podglad()),
    ]
    for nazwa, obraz in plany:
        sciezka = KATALOG / nazwa
        obraz.save(sciezka, optimize=True)
        print(f"{sciezka.relative_to(KATALOG.parent)}  {sciezka.stat().st_size // 1024} kB")


if __name__ == "__main__":
    main()
