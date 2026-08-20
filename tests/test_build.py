import json

from collector.build import build_edition, write_edition

from .conftest import FIXTURES

WYDANIE = "2026-08-19"


def zbuduj():
    return build_edition(
        edition_date=WYDANIE,
        covers_date="2026-08-18",
        fixtures=FIXTURES / "manifest.json",
        use_llm=False,
    )


DZIALY = [
    "polska", "swiat", "sport-pl", "sport-swiat", "technologia",
    "fizyka", "astronomia", "geografia", "popkultura",
]


def test_wydanie_obejmuje_wszystkie_dzialy():
    wydanie = zbuduj()
    assert wydanie["braki"] == []
    kolejnosc = [p["dział"]["id"] for p in wydanie["pozycje"]]
    assert sorted(set(kolejnosc)) == sorted(DZIALY)
    # Działy trzymają się razem — aplikacja grupuje karty po kolejności.
    assert kolejnosc == sorted(kolejnosc, key=lambda d: DZIALY.index(d))


def test_dzial_dostaje_do_dwoch_tematow():
    wydanie = zbuduj()
    from collections import Counter

    ile = Counter(p["dział"]["id"] for p in wydanie["pozycje"])
    assert all(1 <= n <= 2 for n in ile.values()), ile
    assert any(n == 2 for n in ile.values()), "przy tym materiale któryś dział ma dwa tematy"
    for pozycja in wydanie["pozycje"]:
        assert pozycja["miejsce"] in (1, 2)


def test_kazda_pozycja_ma_naglowek_lead_i_segment():
    for pozycja in zbuduj()["pozycje"]:
        assert pozycja["nagłówek"].strip()
        assert pozycja["lead"].strip()
        assert pozycja["dział"]["nazwa"].strip()
        assert pozycja["źródło"]["url"].startswith("http")
        # Karta ma nieść coś ponad nagłówek. Sekcja „Co się stało" bywa pusta,
        # gdy źródło jest tak krótkie, że lead wyczerpuje jego treść — wtedy
        # rolę omówienia biorą liczby, inne spojrzenia albo tło.
        assert (
            pozycja["sekcje"] or pozycja["inne_spojrzenia"] or pozycja["liczby"]
        ), f"pusta karta w dziale {pozycja['dział']['id']}"
        assert isinstance(pozycja["emotki"], list)
        assert len(pozycja["emotki"]) <= 3


def test_zaden_temat_nie_powtarza_sie_miedzy_dzialami():
    adresy = [p["źródło"]["url"] for p in zbuduj()["pozycje"]]
    assert len(adresy) == len(set(adresy))


def test_wydanie_jest_serializowalne_do_json():
    tekst = json.dumps(zbuduj(), ensure_ascii=False)
    assert "nagłówek" in tekst


def test_zapis_tworzy_wydanie_biezace_i_archiwum(tmp_path):
    wydanie = zbuduj()
    write_edition(wydanie, tmp_path)

    assert (tmp_path / f"{WYDANIE}.json").exists()
    assert json.loads((tmp_path / "latest.json").read_text("utf-8"))["wydanie"] == WYDANIE

    indeks = json.loads((tmp_path / "index.json").read_text("utf-8"))
    assert indeks["wydania"][0]["wydanie"] == WYDANIE
    assert len(indeks["wydania"][0]["nagłówki"]) == len(wydanie["pozycje"])


def test_ponowny_zapis_nie_duplikuje_wpisu_w_archiwum(tmp_path):
    wydanie = zbuduj()
    write_edition(wydanie, tmp_path)
    write_edition(wydanie, tmp_path)
    indeks = json.loads((tmp_path / "index.json").read_text("utf-8"))
    assert len(indeks["wydania"]) == 1


def test_ograniczenie_do_wybranych_dzialow():
    from collector.sources import SEGMENTS_BY_ID

    wydanie = build_edition(
        edition_date=WYDANIE,
        covers_date="2026-08-18",
        fixtures=FIXTURES / "manifest.json",
        use_llm=False,
        segments=(SEGMENTS_BY_ID["fizyka"],),
    )
    assert wydanie["pozycje"], "dział fizyka ma materiał w fixture'ach"
    assert {p["dział"]["id"] for p in wydanie["pozycje"]} == {"fizyka"}


def test_wydanie_z_fixtures_jest_oznaczone_jako_demo():
    assert zbuduj()["demo"] is True
