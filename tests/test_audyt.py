"""Audyt źródeł — bez sieci: odpowiedzi kanałów są podstawiane."""

from __future__ import annotations

import pytest

from collector import audyt as A
from collector.net import Response

KANAL = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>T</title>
<item><title>Swieza wiadomosc</title><link>https://x.pl/1</link>
<description>Opis wystarczajaco dlugi</description><pubDate>%s</pubDate></item>
</channel></rss>"""


def kanal(kiedy: str) -> bytes:
    return KANAL % kiedy.encode()


@pytest.fixture
def swiezy(monkeypatch):
    from email.utils import format_datetime
    from datetime import datetime, timezone
    teraz = format_datetime(datetime.now(timezone.utc))
    stary = format_datetime(datetime(2020, 1, 1, tzinfo=timezone.utc))
    return teraz, stary


def test_rozpoznaje_kanal_dzialajacy(monkeypatch, swiezy):
    teraz, _ = swiezy
    monkeypatch.setattr(A, "get", lambda s, u, **k: Response(True, u, 200, kanal(teraz)))
    w = A.sprawdz(None, "https://x.pl/rss", "X", "polska")
    assert w.dziala and not w.zastaly and w.wpisy == 1


def test_rozpoznaje_kanal_milczacy(monkeypatch):
    monkeypatch.setattr(A, "get", lambda s, u, **k: Response(False, u, 404, error="HTTP 404"))
    w = A.sprawdz(None, "https://x.pl/rss", "X", "polska")
    assert not w.dziala and w.powod == "HTTP 404"


def test_rozpoznaje_kanal_zastaly(monkeypatch, swiezy):
    _, stary = swiezy
    monkeypatch.setattr(A, "get", lambda s, u, **k: Response(True, u, 200, kanal(stary)))
    w = A.sprawdz(None, "https://x.pl/rss", "X", "polska")
    assert w.dziala and w.zastaly


def test_podmiana_wchodzi_do_pliku_zrodel(tmp_path, monkeypatch):
    plik = tmp_path / "sources.py"
    plik.write_text(
        'SEGMENTS = (\n'
        '            _f("https://martwy.pl/rss", "Martwy", weight=1.1),\n'
        '            _f("https://zywy.pl/rss", "Żywy", weight=1.0),\n'
        ')\n', "utf-8")
    monkeypatch.setattr(A, "SOURCES", plik)

    raport = A.Raport()
    martwy = A.Wynik("https://martwy.pl/rss", "Martwy", "fizyka", False, "HTTP 404")
    raport.martwe = [martwy]
    raport.podmiany = [(martwy, ("https://nowy.org/feed", "Nowy", "en", 1.2))]

    assert A.zastosuj(raport) == 1
    tresc = plik.read_text("utf-8")
    assert "martwy.pl" not in tresc
    assert '_f("https://nowy.org/feed", "Nowy", lang=EN, weight=1.2),' in tresc
    assert "zywy.pl" in tresc, "sprawne kanały mają zostać nietknięte"


def test_bez_zamiennika_kanal_jest_usuwany(tmp_path, monkeypatch):
    plik = tmp_path / "sources.py"
    plik.write_text(
        '            _f("https://martwy.pl/rss", "Martwy", weight=1.1),\n'
        '            _f("https://zywy.pl/rss", "Żywy", weight=1.0),\n', "utf-8")
    monkeypatch.setattr(A, "SOURCES", plik)

    raport = A.Raport()
    martwy = A.Wynik("https://martwy.pl/rss", "Martwy", "fizyka", False, "HTTP 404")
    raport.martwe = [martwy]
    raport.nieuzupelnione = [martwy]

    assert A.zastosuj(raport) == 1
    tresc = plik.read_text("utf-8")
    assert "martwy.pl" not in tresc and "zywy.pl" in tresc


def test_raport_mowi_wprost_gdy_wszystko_gra():
    raport = A.Raport(sprawdzone=[A.Wynik("u", "X", "polska", True, wpisy=5, wiek_h=2)])
    tekst = A.markdown(raport, naprawiono=True)
    assert "Nic do poprawy" in tekst
    assert raport.wszystko_gra


def test_raport_wymienia_podmiany():
    martwy = A.Wynik("https://stary.pl/rss", "Stary", "fizyka", False, "HTTP 404")
    raport = A.Raport(sprawdzone=[martwy], martwe=[martwy],
                      podmiany=[(martwy, ("https://nowy.org/feed", "Nowy", "en", 1.2))])
    tekst = A.markdown(raport, naprawiono=True)
    assert "Stary" in tekst and "Nowy" in tekst and "nowy.org" in tekst
    assert not raport.wszystko_gra
