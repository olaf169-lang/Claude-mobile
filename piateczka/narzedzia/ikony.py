#!/usr/bin/env python3
"""Rysuje komplet ikon Turnieju Pana Piąteczki — złotą rakietę na granacie.

    python3 narzedzia/ikony.py

Zapisuje do piateczka/icons/: icon-192.png, icon-512.png, icon-maskable.png
oraz podglad.png (karta linku 1200x630).

Bez Pillow — w tym środowisku go nie ma, więc rasteryzujemy ręcznie
(funkcje odległości + nadpróbkowanie 3x) i zapisujemy własnym, minimalnym
zapisem PNG. Kształty są proste, więc to naprawdę wystarcza.
"""

from __future__ import annotations

import math
import pathlib
import struct
import zlib

KATALOG = pathlib.Path(__file__).resolve().parent.parent / "icons"
SS = 3                                   # krotność nadpróbkowania

GRANAT = (0x0A, 0x16, 0x28)
GLEBIA = (0x06, 0x0E, 0x1C)
ZLOTO = (0xD9, 0xA4, 0x41)
ZLOTO_JASNE = (0xE8, 0xC7, 0x7A)


def mieszaj(spod, wierzch, alfa):
    return tuple(round(s + (w - s) * alfa) for s, w in zip(spod, wierzch))


def odleglosc_odcinka(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    dlugosc = dx * dx + dy * dy
    t = 0.0 if dlugosc == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / dlugosc))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def rysuj(bok: int, margines: float, zaokraglenie: float | None) -> list[list[tuple[int, int, int]]]:
    """Zwraca bitmapę bok x bok. `zaokraglenie` w pikselach albo None (pełny kwadrat)."""
    duzy = bok * SS
    piksele = [[GRANAT for _ in range(duzy)] for _ in range(duzy)]

    # Delikatna poświata od góry, żeby tło nie było płaskie.
    for y in range(duzy):
        for x in range(duzy):
            t = ((x / duzy) * 0.35 + (1 - y / duzy) * 0.65)
            piksele[y][x] = mieszaj(GLEBIA, GRANAT, min(1.0, 0.35 + t * 0.75))

    srodek = duzy / 2
    skala = duzy * (1 - 2 * margines) / 100.0

    def na(x, y):
        return srodek + (x - 50) * skala, srodek + (y - 50) * skala

    # Rakieta: główka (elipsa obrócona), trzonek i siatka naciągu.
    kat = math.radians(-38)
    cos_k, sin_k = math.cos(kat), math.sin(kat)
    gx, gy = na(40, 38)
    ra, rb = 26 * skala, 33 * skala
    grubosc = 5.2 * skala / 2

    trzonek = (na(57, 57), na(74, 80))
    nasada = (na(74, 80), na(82, 89))

    for y in range(duzy):
        for x in range(duzy):
            # główka rakiety — pierścień
            lx, ly = x - gx, y - gy
            ex = (lx * cos_k + ly * sin_k) / ra
            ey = (-lx * sin_k + ly * cos_k) / rb
            r = math.hypot(ex, ey)
            pokrycie = 0.0
            if abs(r - 1.0) * min(ra, rb) < grubosc:
                pokrycie = 1.0
                kolor = ZLOTO
            elif r < 1.0:
                # naciąg — cienkie linie wewnątrz główki
                sx, sy = ex * ra, ey * rb
                krok = 7.2 * skala
                blisko = min(abs(sx % krok - krok / 2), abs(sy % krok - krok / 2))
                if blisko < 0.55 * skala:
                    pokrycie = 0.42
                    kolor = ZLOTO_JASNE

            if pokrycie == 0.0:
                for (ax, ay), (bx, by), g in ((trzonek[0], trzonek[1], 4.6), (nasada[0], nasada[1], 6.4)):
                    if odleglosc_odcinka(x, y, ax, ay, bx, by) < g * skala / 2:
                        pokrycie, kolor = 1.0, ZLOTO
                        break

            if pokrycie > 0:
                piksele[y][x] = mieszaj(piksele[y][x], kolor, pokrycie)

    # Zaokrąglone rogi (dla ikony „any”; maskable zostaje kwadratem).
    if zaokraglenie:
        pr = zaokraglenie * SS
        for y in range(duzy):
            for x in range(duzy):
                dx = max(pr - x, x - (duzy - pr), 0)
                dy = max(pr - y, y - (duzy - pr), 0)
                if math.hypot(dx, dy) > pr:
                    piksele[y][x] = None

    # Zejście z nadpróbkowania.
    wynik = []
    for y in range(bok):
        rzad = []
        for x in range(bok):
            suma, ile = [0, 0, 0], 0
            for dy in range(SS):
                for dx in range(SS):
                    p = piksele[y * SS + dy][x * SS + dx]
                    if p is None:
                        continue
                    for i in range(3):
                        suma[i] += p[i]
                    ile += 1
            rzad.append(tuple(s // ile for s in suma) if ile else GLEBIA)
        wynik.append(rzad)
    return wynik


def zapisz_png(sciezka: pathlib.Path, piksele) -> None:
    wysokosc = len(piksele)
    szerokosc = len(piksele[0])
    surowe = b"".join(
        b"\x00" + b"".join(struct.pack("BBB", *p) for p in rzad) for rzad in piksele
    )

    def kawalek(typ: bytes, dane: bytes) -> bytes:
        return (struct.pack(">I", len(dane)) + typ + dane
                + struct.pack(">I", zlib.crc32(typ + dane) & 0xFFFFFFFF))

    naglowek = struct.pack(">IIBBBBB", szerokosc, wysokosc, 8, 2, 0, 0, 0)
    sciezka.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + kawalek(b"IHDR", naglowek)
        + kawalek(b"IDAT", zlib.compress(surowe, 9))
        + kawalek(b"IEND", b"")
    )
    print(f"  {sciezka.name}  {szerokosc}x{wysokosc}")


def podglad() -> None:
    """Karta linku 1200x630 — ikona po lewej, granatowe tło."""
    szer, wys = 1200, 630
    ikona = rysuj(360, 0.10, None)
    piksele = []
    for y in range(wys):
        rzad = []
        for x in range(szer):
            t = (x / szer) * 0.4 + (1 - y / wys) * 0.6
            rzad.append(mieszaj(GLEBIA, GRANAT, min(1.0, 0.3 + t * 0.8)))
        piksele.append(rzad)
    ox, oy = 120, (wys - 360) // 2
    for y in range(360):
        for x in range(360):
            piksele[oy + y][ox + x] = ikona[y][x]
    zapisz_png(KATALOG / "podglad.png", piksele)


if __name__ == "__main__":
    KATALOG.mkdir(parents=True, exist_ok=True)
    print("Rysuję ikony…")
    zapisz_png(KATALOG / "icon-192.png", rysuj(192, 0.14, 42))
    zapisz_png(KATALOG / "icon-512.png", rysuj(512, 0.14, 112))
    zapisz_png(KATALOG / "icon-maskable.png", rysuj(512, 0.24, None))
    podglad()
    print("Gotowe.")
