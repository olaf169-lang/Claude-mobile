from collector import textutil as t


def test_czysci_html_i_encje():
    assert t.clean("<p>Tekst &amp; <b>pogrubienie</b></p>") == "Tekst & pogrubienie"


def test_dzieli_na_zdania_i_pomija_okruchy():
    zdania = t.sentences("Sejm przyjął ustawę o cłach na stal. Senat zajmie się nią w przyszłym tygodniu. Tak.")
    assert len(zdania) == 2
    assert zdania[0].endswith("stal.")


def test_wyciaga_liczby_z_jednostkami():
    liczby = t.numbers_in("Wzrost o 25 proc., kontrakt na 3,4 mld zł i prędkość 120 km/h")
    assert "25 proc." in liczby
    assert "3,4 mld zł" in liczby
    assert "120 km/h" in liczby


def test_ngramy_lapia_polska_fleksje():
    a = t.ngrams("RPP obniżyła stopy procentowe")
    b = t.ngrams("RPP obniża stopy procentowe")
    assert t.overlap(a, b) > 0.5


def test_twarde_tokeny_przechodza_przez_tlumaczenie():
    pl = t.hard_tokens("Teleskop Webba wykrył parę wodną 41 lat świetlnych stąd")
    en = t.hard_tokens("Webb spots water vapour 41 light-years away")
    assert t.hard_overlap(pl, en) >= 2


def test_twarde_tokeny_pomijaja_lata():
    assert "2026" not in t.hard_tokens("Wydarzenie z 2026 roku")


def test_skracanie_nie_tnie_w_polowie_slowa():
    krotkie = t.shorten("Rada Polityki Pieniężnej obniżyła stopy procentowe", 30)
    assert krotkie.endswith("…")
    assert len(krotkie) <= 31
    assert not krotkie.rstrip("…").endswith(" ")


def test_deduplikacja_zdan():
    zdania = [
        "RPP obniżyła stopy procentowe o 25 punktów bazowych.",
        "RPP obniżyła stopy procentowe o 25 punktów bazowych dzisiaj.",
        "Złoty osłabił się wobec euro po decyzji Rady.",
    ]
    assert len(t.dedupe_sentences(zdania)) == 2
