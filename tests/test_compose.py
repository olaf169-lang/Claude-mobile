from collector.build import build_edition
from collector.compose import key_sentences
from collector.sources import SEGMENTS_BY_ID

from .conftest import FIXTURES


def pozycja(dzial: str) -> dict:
    wydanie = build_edition(
        edition_date="2026-08-19",
        covers_date="2026-08-18",
        fixtures=FIXTURES / "manifest.json",
        use_llm=False,
        segments=(SEGMENTS_BY_ID[dzial],),
    )
    return wydanie["pozycje"][0]


def test_liczby_nie_powtarzaja_tej_samej_wartosci():
    """„41" nic nie wnosi obok „41 lat"."""
    liczby = pozycja("astronomia")["liczby"]
    assert "41 lat" in liczby
    assert "41" not in liczby


def test_obcojezyczny_szczegol_dostaje_etykiete():
    astronomia = pozycja("astronomia")
    szczegoly = [s for s in astronomia["sekcje"] if s["tytuł"].startswith("Szczegóły")]
    assert szczegoly, "brak sekcji ze szczegółami"
    assert all(tekst.startswith("[en] ") for tekst in szczegoly[0]["treść"])


def test_kluczowe_zdania_pomijaja_zajawki_typu_czytaj_takze():
    tekst = (
        "Czytaj także: zupełnie inny tekst redakcji, dostatecznie długi, by udawać treść. "
        "Rada Polityki Pieniężnej obniżyła stopy procentowe o 25 punktów bazowych na wtorkowym posiedzeniu."
    )
    wybrane = key_sentences(tekst, SEGMENTS_BY_ID["polska"], limit=2)
    assert len(wybrane) == 1
    assert wybrane[0].startswith("Rada Polityki")


def test_inne_spojrzenia_nie_powtarzaja_glownego_zrodla():
    polska = pozycja("polska")
    zrodla = {p["źródło"] for p in polska["inne_spojrzenia"]}
    assert polska["źródło"]["nazwa"] not in zrodla
