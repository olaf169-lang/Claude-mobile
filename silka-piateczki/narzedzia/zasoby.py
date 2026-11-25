"""Przygotowuje zdjęcia ćwiczeń i czcionki dla Siłki Piąteczki.

Zdjęcia pochodzą z free-exercise-db (github.com/yuhonas/free-exercise-db,
domena publiczna). Każde ćwiczenie ma dwa kadry: pozycję startową (0)
i końcową (1). Apka przenika jeden w drugi, więc wygląda to jak ruch.

Użycie (z katalogu silka-piateczki):
    git clone --depth 1 --filter=blob:none --sparse \
        https://github.com/yuhonas/free-exercise-db /tmp/fedb
    cd /tmp/fedb && git sparse-checkout set --no-cone \
        $(sed 's#^#/exercises/#;s#$#/#' <ścieżka>/narzedzia/zdjecia.txt)
    python3 narzedzia/zasoby.py --zdjecia /tmp/fedb/exercises \
        --czcionki /ścieżka/do/google-fonts/ofl

Lista kadrów do pobrania siedzi w narzedzia/zdjecia.txt.
"""

import argparse
import pathlib

from PIL import Image

TU = pathlib.Path(__file__).resolve().parent.parent
SZEROKOSC = 560
JAKOSC = 64

CZCIONKI = {
    "barlow/Barlow-Regular.ttf": "barlow-400.woff",
    "barlow/Barlow-SemiBold.ttf": "barlow-600.woff",
    "barlowcondensed/BarlowCondensed-Bold.ttf": "barlow-condensed-700.woff",
    "barlowcondensed/BarlowCondensed-ExtraBold.ttf": "barlow-condensed-800.woff",
}
# Łacina z polskimi znakami, typografia i strzałki. Reszta odpada, więc
# plik waży ułamek oryginału.
ZNAKI = "U+0000-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+2190-2199,U+2212,U+2715,U+2713,U+00D7"


def zdjecia(zrodlo: pathlib.Path) -> None:
    cel = TU / "img" / "cw"
    cel.mkdir(parents=True, exist_ok=True)
    ids = (TU / "narzedzia" / "zdjecia.txt").read_text().split()
    for i in ids:
        for kadr in (0, 1):
            obraz = Image.open(zrodlo / i / f"{kadr}.jpg").convert("RGB")
            w, h = obraz.size
            obraz = obraz.resize((SZEROKOSC, round(h * SZEROKOSC / w)), Image.LANCZOS)
            obraz.save(cel / f"{i}-{kadr}.webp", "WEBP", quality=JAKOSC, method=6)
    print(f"zdjęcia: {len(ids)} ćwiczeń, {len(ids) * 2} kadrów")


def czcionki(zrodlo: pathlib.Path) -> None:
    from fontTools import subset

    cel = TU / "fonts"
    cel.mkdir(exist_ok=True)
    for wejscie, wyjscie in CZCIONKI.items():
        opcje = subset.Options()
        opcje.flavor = "woff"
        opcje.layout_features = ["*"]
        font = subset.load_font(str(zrodlo / wejscie), opcje)
        podzbior = subset.Subsetter(opcje)
        podzbior.populate(unicodes=subset.parse_unicodes(ZNAKI))
        podzbior.subset(font)
        subset.save_font(font, str(cel / wyjscie), opcje)
    print(f"czcionki: {len(CZCIONKI)} plików")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--zdjecia", type=pathlib.Path)
    p.add_argument("--czcionki", type=pathlib.Path)
    a = p.parse_args()
    if a.zdjecia:
        zdjecia(a.zdjecia)
    if a.czcionki:
        czcionki(a.czcionki)
