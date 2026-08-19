from collector.rank import cluster_entries, pick, rank
from collector.sources import SEGMENTS_BY_ID


def test_ten_sam_temat_z_trzech_redakcji_trafia_do_jednego_klastra(wpisy, okno):
    segment = SEGMENTS_BY_ID["polska"]
    najlepszy = rank(wpisy("polska"), segment, okno[1])[0]
    assert len(najlepszy.sources) == 3
    assert "stopy" in najlepszy.lead.title.lower()


def test_potwierdzenie_wielu_zrodel_wygrywa_z_pojedynczym_newsem(wpisy, okno):
    segment = SEGMENTS_BY_ID["polska"]
    posortowane = rank(wpisy("polska"), segment, okno[1])
    assert posortowane[0].score > posortowane[1].score
    assert len(posortowane[0].entries) > len(posortowane[1].entries)


def test_wspolne_pospolite_slowo_nie_scala_roznych_tematow(wpisy):
    """Trzy newsy o prezydencie to trzy różne tematy, nie jeden."""
    prezydenckie = [w for w in wpisy("polska") if w.title.startswith("Prezydent")]
    assert len(prezydenckie) == 3
    klastry = cluster_entries(prezydenckie)
    assert len(klastry) == 3


def test_scala_ten_sam_temat_po_polsku_i_angielsku(wpisy, okno):
    wybrany = pick(wpisy("literatura"), SEGMENTS_BY_ID["literatura"], okno[1])
    assert {"Booklips", "The Guardian Books"} == set(wybrany.sources)


def test_dzial_preferuje_swoj_jezyk(wpisy, okno):
    """W dziale astronomia lead ma być polski, choć NASA ma wyższą wagę."""
    wybrany = pick(wpisy("astronomia"), SEGMENTS_BY_ID["astronomia"], okno[1])
    assert wybrany.lead.lang == "pl"
    assert wybrany.lead.source == "Urania"


def test_temat_z_polskim_zrodlem_wygrywa_z_glosniejszym_obcym(wpisy, okno):
    """Przegląd jest do czytania po polsku — angielski lead to ostateczność."""
    segment = SEGMENTS_BY_ID["sport-swiat"]
    wybrany = pick(wpisy("sport-swiat"), segment, okno[1])
    assert any(e.lang == "pl" for e in wybrany.entries)


def test_bez_polskiego_zrodla_dzial_bierze_obce(wpisy, okno):
    """Lepszy angielski temat niż pusty dział."""
    segment = SEGMENTS_BY_ID["sport-swiat"]
    tylko_obce = [w for w in wpisy("sport-swiat") if w.lang == "en"]
    wybrany = pick(tylko_obce, segment, okno[1])
    assert wybrany is not None
    assert wybrany.lead.lang == "en"


def test_wykluczone_adresy_sa_pomijane(wpisy, okno):
    segment = SEGMENTS_BY_ID["polska"]
    pierwszy = pick(wpisy("polska"), segment, okno[1])
    bez = frozenset(e.url for e in pierwszy.entries)
    drugi = pick(wpisy("polska"), segment, okno[1], exclude_urls=bez)
    assert drugi is not None
    assert not (bez & {e.url for e in drugi.entries})


def test_ogolny_kanal_naukowy_nie_wpycha_medycyny_do_fizyki(wpisy, okno):
    """„Nauka po polsku" to nie to samo co fizyka — filtr działu musi to rozróżnić."""
    tytuly = [w.title for w in wpisy("fizyka")]
    assert not any("szczepionek" in t for t in tytuly)
    assert any("splątanie kwantowe" in t for t in tytuly)


def test_fizyka_wybiera_temat_z_wlasnej_dziedziny(wpisy, okno):
    """Niezależnie od języka — byle była to fizyka, a nie medycyna."""
    wybrany = pick(wpisy("fizyka"), SEGMENTS_BY_ID["fizyka"], okno[1])
    assert "szczepionek" not in wybrany.lead.title
    assert any(slowo in wybrany.lead.title.lower() for slowo in ("kwant", "quantum", "muon"))


def test_dwa_kanaly_jednej_redakcji_to_jedno_potwierdzenie():
    """Phys.org i Phys.org Quantum to ta sama redakcja, nie dwa niezależne źródła."""
    from collector.rank import cluster_entries

    klaster = cluster_entries([
        _wpis("Krypton boosts quantum computing", "Phys.org", "en"),
        _wpis("Krypton gas boosts quantum computing chips", "Phys.org Quantum", "en"),
    ])[0]
    # Ten sam host w obu adresach — jeden wydawca mimo dwóch nazw kanałów.
    klaster.entries[1].url = klaster.entries[0].url.rsplit("/", 1)[0] + "/inny"
    assert len(klaster.sources) == 2
    assert len(klaster.publishers) == 1


def test_ten_sam_kanal_bez_filtra_wpuszcza_medycyne_do_technologii(wpisy):
    """Dział „Technologia i nauka" jest szeroki — tam ta sama wiadomość ma sens."""
    tytuly = [w.title for w in wpisy("technologia")]
    assert any("szczepionek" in t for t in tytuly)


def _wpis(tytul, zrodlo, jezyk, waga=1.0, opis=""):
    from datetime import datetime, timezone
    from collector.model import Entry
    return Entry(
        title=tytul, url=f"https://{zrodlo}.example/{abs(hash(tytul)) % 9999}",
        source=zrodlo, lang=jezyk, weight=waga,
        published=datetime(2026, 8, 18, 12, tzinfo=timezone.utc),
        summary=opis or tytul,
    )


def test_slaby_polski_temat_ustepuje_mocnemu_obcemu(okno):
    """Notka branżowa z jednego serwisu nie może wygrać z odkryciem opisanym przez cztery."""
    segment = SEGMENTS_BY_ID["fizyka"]
    wpisy = [
        _wpis("Nowa przeglądarka plików pomiarowych dla laboratoriów", "Geoforum", "pl"),
        _wpis("Krypton gas emerges as ingredient for quantum computing", "Phys.org", "en", 1.2),
        _wpis("Krypton as a new quantum computing ingredient, researchers show", "Nature", "en", 1.3),
        _wpis("Quantum computing gets a krypton boost in new study", "New Scientist", "en", 1.05),
        _wpis("Researchers use krypton to improve quantum computing chips", "ScienceDaily", "en"),
    ]
    wybrany = pick(wpisy, segment, okno[1])
    assert wybrany.lead.lang == "en"
    assert len(wybrany.sources) == 4


def test_porownywalny_polski_temat_wygrywa(okno):
    """Przy zbliżonej wadze tematów przegląd zostaje przy polskim."""
    segment = SEGMENTS_BY_ID["fizyka"]
    wpisy = [
        _wpis("Polscy fizycy uzyskali splątanie kwantowe w temperaturze pokojowej", "Nauka w Polsce", "pl", 1.15),
        _wpis("Kwantowe splątanie bez chłodzenia. Przełom z Warszawy", "Crazy Nauka", "pl"),
        _wpis("Krypton gas emerges as ingredient for quantum computing", "Phys.org", "en", 1.2),
    ]
    wybrany = pick(wpisy, segment, okno[1])
    assert wybrany.lead.lang == "pl"
