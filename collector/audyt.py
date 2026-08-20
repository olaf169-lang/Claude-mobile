"""Comiesięczny audyt źródeł: sprawdź, wymień, zdaj raport.

    python -m collector.audyt                # tylko sprawdzenie i raport
    python -m collector.audyt --napraw       # dodatkowo podmiana w sources.py
    python -m collector.audyt --raport plik  # raport w Markdown do pliku

Serwisy zmieniają adresy kanałów bez uprzedzenia i robią to cicho: przegląd
nadal wychodzi, tylko coraz uboższy. Audyt wyłapuje takie ubytki i zasklepia
je kandydatem z `kandydaci.py` — ale dopiero po sprawdzeniu, że kandydat
naprawdę odpowiada i ma świeże wpisy.
"""

from __future__ import annotations

import argparse
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .collect import parse_feed
from .kandydaci import dla_dzialu
from .model import Feed
from .net import get, make_session
from .sources import SEGMENTS

SOURCES = Path(__file__).with_name("sources.py")
#: Kanał bez wpisu od tylu godzin uznajemy za zastały.
ZASTALY_PO_H = 96


@dataclass
class Wynik:
    url: str
    zrodlo: str
    dzial: str
    dziala: bool
    powod: str = ""
    wpisy: int = 0
    wiek_h: float | None = None

    @property
    def zastaly(self) -> bool:
        return self.dziala and self.wiek_h is not None and self.wiek_h > ZASTALY_PO_H


@dataclass
class Raport:
    sprawdzone: list[Wynik] = field(default_factory=list)
    martwe: list[Wynik] = field(default_factory=list)
    zastale: list[Wynik] = field(default_factory=list)
    podmiany: list[tuple[Wynik, tuple[str, str, str, float]]] = field(default_factory=list)
    nieuzupelnione: list[Wynik] = field(default_factory=list)

    @property
    def wszystko_gra(self) -> bool:
        return not self.martwe and not self.zastale


def sprawdz(session, url: str, zrodlo: str, dzial: str, lang: str = "pl") -> Wynik:
    odpowiedz = get(session, url, timeout=20, retries=1)
    if not odpowiedz.ok:
        return Wynik(url, zrodlo, dzial, False, odpowiedz.error)
    wpisy = parse_feed(odpowiedz.content, Feed(url, zrodlo, lang))
    if not wpisy:
        return Wynik(url, zrodlo, dzial, False, "brak wpisów / nie RSS")
    daty = [w.published for w in wpisy if w.published]
    wiek = (datetime.now(timezone.utc) - max(daty)).total_seconds() / 3600 if daty else None
    return Wynik(url, zrodlo, dzial, True, "", len(wpisy), wiek)


def zbadaj_katalog(session) -> Raport:
    zadania = [(s.id, f) for s in SEGMENTS for f in s.feeds]
    raport = Raport()
    with ThreadPoolExecutor(max_workers=12) as pool:
        raport.sprawdzone = list(pool.map(
            lambda z: sprawdz(session, z[1].url, z[1].source, z[0], z[1].lang), zadania
        ))
    for w in raport.sprawdzone:
        if not w.dziala:
            raport.martwe.append(w)
        elif w.zastaly:
            raport.zastale.append(w)
    return raport


def znajdz_zamienniki(session, raport: Raport) -> None:
    """Dla każdego martwego kanału szuka działającego kandydata z rezerwy."""
    obecne = {f.url for s in SEGMENTS for f in s.feeds}
    zajete: set[str] = set()
    for martwy in raport.martwe:
        wybrany = None
        for kandydat in dla_dzialu(martwy.dzial, obecne | zajete):
            url, nazwa, lang, _waga = kandydat
            wynik = sprawdz(session, url, nazwa, martwy.dzial, lang)
            if wynik.dziala and not wynik.zastaly:
                wybrany = kandydat
                zajete.add(url)
                break
        if wybrany:
            raport.podmiany.append((martwy, wybrany))
        else:
            raport.nieuzupelnione.append(martwy)


def zastosuj(raport: Raport) -> int:
    """Wpisuje podmiany do sources.py. Zwraca liczbę zmienionych linii."""
    tekst = SOURCES.read_text("utf-8")
    zmiany = 0
    for martwy, (url, nazwa, lang, waga) in raport.podmiany:
        wzorzec = re.compile(
            r'^(\s*)_f\("' + re.escape(martwy.url) + r'".*?\),\s*$', re.MULTILINE
        )
        jezyk = "" if lang == "pl" else ", lang=EN"
        nowa = rf'\1_f("{url}", "{nazwa}"{jezyk}, weight={waga}),'
        tekst, ile = wzorzec.subn(nowa, tekst, count=1)
        zmiany += ile
    for martwy in raport.nieuzupelnione:
        # Bez zamiennika usuwamy martwy kanał: nie ma po co go odpytywać.
        wzorzec = re.compile(
            r'^\s*_f\("' + re.escape(martwy.url) + r'".*?\),\s*\n', re.MULTILINE
        )
        tekst, ile = wzorzec.subn("", tekst, count=1)
        zmiany += ile
    if zmiany:
        SOURCES.write_text(tekst, "utf-8")
    return zmiany


def markdown(raport: Raport, naprawiono: bool) -> str:
    linie = [
        f"## Audyt źródeł — {datetime.now(timezone.utc):%Y-%m-%d}",
        "",
        f"Sprawdzono **{len(raport.sprawdzone)}** kanałów: "
        f"{len(raport.sprawdzone) - len(raport.martwe)} odpowiada, "
        f"{len(raport.martwe)} milczy, {len(raport.zastale)} bez świeżych wpisów.",
        "",
    ]
    if raport.podmiany:
        linie += ["### Podmienione na sprawdzone zamienniki", ""]
        linie += [
            f"- **{m.zrodlo}** ({m.powod}) → **{k[1]}** — `{k[0]}`"
            for m, k in raport.podmiany
        ]
        linie.append("")
    if raport.nieuzupelnione:
        linie += ["### Usunięte, bo zabrakło zamiennika", ""]
        linie += [f"- **{m.zrodlo}** w dziale `{m.dzial}` ({m.powod})" for m in raport.nieuzupelnione]
        linie.append("")
    if raport.zastale:
        linie += ["### Odpowiadają, ale bez świeżych wpisów", ""]
        linie += [
            f"- **{w.zrodlo}** (`{w.dzial}`) — najnowszy wpis sprzed {w.wiek_h:.0f} h"
            for w in raport.zastale
        ]
        linie.append("")
    if raport.wszystko_gra:
        linie += ["Wszystkie kanały działają i mają świeże wpisy. Nic do poprawy.", ""]
    elif not naprawiono:
        linie += ["_Tryb kontrolny — katalog nie został zmieniony._", ""]
    return "\n".join(linie)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="collector.audyt", description="Audyt katalogu źródeł.")
    parser.add_argument("--napraw", action="store_true", help="podmień martwe kanały w sources.py")
    parser.add_argument("--raport", type=Path, help="zapisz raport w Markdown do pliku")
    args = parser.parse_args(argv)

    session = make_session()
    raport = zbadaj_katalog(session)
    if args.napraw and raport.martwe:
        znajdz_zamienniki(session, raport)
        zastosuj(raport)

    tekst = markdown(raport, naprawiono=args.napraw)
    print(tekst)
    if args.raport:
        args.raport.write_text(tekst, "utf-8")
    # Kod wyjścia 1 sygnalizuje, że katalog wymaga uwagi.
    return 0 if raport.wszystko_gra else 1


if __name__ == "__main__":
    raise SystemExit(main())
