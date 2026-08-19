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


def test_wydanie_ma_wszystkie_dziesiec_dzialow():
    wydanie = zbuduj()
    assert len(wydanie["pozycje"]) == 10
    assert wydanie["braki"] == []
    assert [p["dział"]["id"] for p in wydanie["pozycje"]] == [
        "polska", "swiat", "sport-pl", "sport-swiat", "technologia",
        "fizyka", "astronomia", "geografia", "literatura", "popkultura",
    ]


def test_kazda_pozycja_ma_naglowek_lead_i_segment():
    for pozycja in zbuduj()["pozycje"]:
        assert pozycja["nagłówek"].strip()
        assert pozycja["lead"].strip()
        assert pozycja["dział"]["nazwa"].strip()
        assert pozycja["źródło"]["url"].startswith("http")
        assert pozycja["sekcje"], f"brak sekcji w dziale {pozycja['dział']['id']}"


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
    assert len(indeks["wydania"][0]["nagłówki"]) == 10


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
    assert len(wydanie["pozycje"]) == 1
    assert wydanie["pozycje"][0]["dział"]["id"] == "fizyka"


def test_wydanie_z_fixtures_jest_oznaczone_jako_demo():
    assert zbuduj()["demo"] is True
