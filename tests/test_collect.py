from datetime import timezone

from collector.collect import day_window, matches_segment, parse_feed
from collector.model import Feed
from collector.sources import SEGMENTS_BY_ID

from .conftest import FIXTURES


def test_parsuje_kanal_rss():
    wpisy = parse_feed((FIXTURES / "pl_rmf.xml").read_bytes(), Feed("http://x", "RMF24"))
    assert len(wpisy) == 4
    pierwszy = wpisy[0]
    assert pierwszy.title.startswith("Rada Polityki Pieniężnej")
    assert pierwszy.published.tzinfo == timezone.utc
    assert pierwszy.domain == "rmf24.pl"
    assert "<p>" not in pierwszy.summary


def test_smieci_zamiast_kanalu_nie_wywracaja_potoku():
    assert parse_feed((FIXTURES / "broken.xml").read_bytes(), Feed("http://x", "X")) == []


def test_okno_dnia_obejmuje_cala_dobe_z_marginesem():
    start, koniec = day_window("2026-08-18", "Europe/Warsaw")
    assert start.isoformat() == "2026-08-17T16:00:00+00:00"
    assert koniec.hour == 3 and koniec.day == 19


def test_filtr_odrzuca_slowa_zablokowane(wpisy):
    tytuly = [w.title for w in wpisy("polska")]
    assert not any("Horoskop" in t for t in tytuly)


def test_filtr_odrzuca_material_spoza_dnia(wpisy):
    tytuly = [w.title for w in wpisy("polska")]
    assert not any("sprzed tygodnia" in t for t in tytuly)


def test_kanal_ogolny_wymaga_slowa_kluczowego():
    segment = SEGMENTS_BY_ID["polska"]
    wpisy = parse_feed((FIXTURES / "pl_agencja.xml").read_bytes(), Feed("http://x", "Gazeta.pl"))
    budzet = next(w for w in wpisy if "budżetu" in w.title)
    assert matches_segment(budzet, segment, require_boost=True)
