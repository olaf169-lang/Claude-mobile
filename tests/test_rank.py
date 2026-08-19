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
