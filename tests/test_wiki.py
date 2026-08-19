"""Testy tła encyklopedycznego — odpowiedzi Wikipedii są podstawiane."""

from __future__ import annotations

import json

import pytest

from collector import wiki as W
from collector.net import Response


def odpowiedzi(mapa: dict[str, dict]):
    """Buduje atrapę `get` zwracającą JSON dla fragmentu adresu."""

    def fake(session, url, **kwargs):
        for fragment, payload in mapa.items():
            if fragment in url:
                return Response(True, url, 200, json.dumps(payload).encode())
        return Response(False, url, 404, error="HTTP 404")

    return fake


def szukanie(*tytuly):
    return {"query": {"search": [{"title": t} for t in tytuly]}}


def haslo(tytul, tekst="Opis wystarczająco długi, żeby przejść próg minimalnej długości hasła encyklopedycznego."):
    return {"title": tytul, "extract": tekst, "description": "opis", "content_urls": {"desktop": {"page": "u"}}}


def test_bierze_haslo_o_tej_samej_nazwie(monkeypatch):
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Tantal"),
        "page/summary/Tantal": haslo("Tantal"),
    }))
    wynik = W.background(session=None, candidates=["Tantal"])
    assert wynik and wynik["hasło"] == "Tantal"
    assert wynik["język"] == "pl"


def test_odrzuca_niepowiazane_haslo_z_wyszukiwania_pelnotekstowego(monkeypatch):
    """Zapytanie o materiał nie może skończyć się definicją homofobii."""
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": {"query": {"search": []}},
        "srwhat=text": szukanie("Homofobia"),
        "page/summary/Homofobia": haslo("Homofobia"),
    }))
    assert W.background(session=None, candidates=["Homogeniczne warstwy"]) is None


def test_wyszukiwanie_pelnotekstowe_dziala_gdy_tytul_pasuje(monkeypatch):
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": {"query": {"search": []}},
        "srwhat=text": szukanie("Rada Polityki Pieniężnej"),
        "page/summary/Rada_Polityki_Pieni": haslo("Rada Polityki Pieniężnej"),
    }))
    wynik = W.background(session=None, candidates=["Rada Polityki Pieniężnej"])
    assert wynik and wynik["hasło"] == "Rada Polityki Pieniężnej"


def test_pomija_strone_ujednoznaczniajaca(monkeypatch):
    strona = haslo("Merkury")
    strona["type"] = "disambiguation"
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Merkury"),
        "page/summary/Merkury": strona,
    }))
    assert W.background(session=None, candidates=["Merkury"]) is None


def test_pomija_zbyt_krotkie_kandydaty(monkeypatch):
    wywolania = []

    def licz(session, url, **kwargs):
        wywolania.append(url)
        return Response(False, url, 404, error="HTTP 404")

    monkeypatch.setattr(W, "get", licz)
    assert W.background(session=None, candidates=["UE", "AI"]) is None
    assert wywolania == [], "nazwy krótsze niż cztery znaki nie mają sensu jako hasło"


def test_brak_wynikow_to_nie_blad(monkeypatch):
    monkeypatch.setattr(W, "get", odpowiedzi({}))
    assert W.background(session=None, candidates=["Cokolwiek"]) is None
