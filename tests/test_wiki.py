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


# --- dobór nazw, o które w ogóle pytamy Wikipedię ---------------------------

def test_pomija_nazwe_redakcji():
    """Hasło „Phys.org" nie jest tłem żadnej wiadomości."""
    nazwy = W.candidates_for(
        "A new approach to noise-resistant quantum sensors",
        "Researchers at Cornell built it. Phys.org reports the work. The Cornell team published it.",
        source="Phys.org", domain="phys.org",
    )
    assert "Phys.org" not in nazwy
    assert "Cornell" in nazwy


def test_pomija_nazwe_wspomniana_raz_na_marginesie():
    """Film przywołany w jednym zdaniu nie jest tematem artykułu."""
    nazwy = W.candidates_for(
        "Obrona planetarna po nowemu",
        "Czytelnicy pamiętają film Armageddon. Testy prowadzi Europejska Agencja Kosmiczna. "
        "Kolejną misję zaplanowała Europejska Agencja Kosmiczna.",
        source="Urania", domain="urania.edu.pl",
    )
    assert not any("Armageddon" in n for n in nazwy)
    assert any("Agencja Kosmiczna" in n for n in nazwy)


def test_nazwy_z_naglowka_maja_pierwszenstwo():
    nazwy = W.candidates_for(
        "Romanowski w Naddniestrzu? Poseł odpowiedział",
        "Sprawa ciągnie się od miesięcy. Prokuratura milczy. Prokuratura nie komentuje.",
        source="RMF24", domain="rmf24.pl",
    )
    assert nazwy and "Naddniestrzu" in nazwy[0]


def test_brak_sensownych_nazw_to_pusta_lista():
    assert W.candidates_for("krótki tytuł", "bez nazw własnych w tekście", source="X") == []


# --- hasło musi mówić o tym samym co artykuł --------------------------------

ARTYKUL_PANGENOM = (
    "Odniesienie do pangenomu islandzkiego. Naukowcy zsekwencjonowali genomy "
    "kilkudziesięciu tysięcy mieszkańców Islandii i złożyli z nich pangenom, "
    "czyli mapę zmienności genetycznej całej populacji."
)


def test_odrzuca_haslo_o_zbieznej_nazwie_ale_innym_temacie(monkeypatch):
    """Islandzka linia lotnicza nie jest tłem artykułu o islandzkim pangenomie."""
    linie = haslo("Air Atlanta Icelandic",
                  "Air Atlanta Icelandic to islandzka linia lotnicza czarterowa z siedzibą "
                  "w Kopavogur, obsługująca samoloty Boeing 747 w transporcie cargo.")
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Air Atlanta Icelandic"),
        "page/summary/Air_Atlanta_Icelandic": linie,
    }))
    assert W.background(session=None, candidates=["Air Atlanta Icelandic"],
                        article_text=ARTYKUL_PANGENOM) is None


def test_przyjmuje_haslo_faktycznie_o_temacie(monkeypatch):
    pangenom = haslo("Pangenom",
                     "Pangenom to zbiór wszystkich genomów populacji. Pangenom opisuje zmienność "
                     "genetyczną mieszkańców danego obszaru i uzupełnia genom referencyjny.")
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Pangenom"),
        "page/summary/Pangenom": pangenom,
    }))
    wynik = W.background(session=None, candidates=["Pangenom"], article_text=ARTYKUL_PANGENOM)
    assert wynik and wynik["hasło"] == "Pangenom"


def test_bez_tekstu_artykulu_sprawdzenie_tematu_nie_blokuje(monkeypatch):
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Tantal"),
        "page/summary/Tantal": haslo("Tantal"),
    }))
    assert W.background(session=None, candidates=["Tantal"]) is not None


def test_odrzuca_haslo_ogolnikowe(monkeypatch):
    """„Science" jako tło artykułu o czujnikach kwantowych nic nie wyjaśnia."""
    monkeypatch.setattr(W, "get", odpowiedzi({
        "srwhat=nearmatch": szukanie("Science"),
        "page/summary/Science": haslo("Science"),
    }))
    assert W.background(session=None, candidates=["Science"]) is None
