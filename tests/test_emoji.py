"""Emotki tematyczne — mają mówić, o czym jest tekst, albo milczeć."""

from collector.emoji import topic_emoji


def test_dobiera_emotke_do_dziedziny():
    assert topic_emoji("Rada Polityki Pieniężnej obniżyła stopy procentowe",
                       "Inflacja spada, budżet zyska")[0] in {"🏛️", "💰"}
    assert "🎾" in topic_emoji("Świątek w finale US Open", "Tenisistka wygrała w dwóch setach")
    assert "🔭" in topic_emoji("Teleskop Webba sfotografował mgławicę", "Zdjęcie w podczerwieni")


def test_naglowek_wazy_wiecej_niz_tresc():
    """Słowo z akapitu nie może przebić tematu z tytułu."""
    emotki = topic_emoji(
        "Świątek wygrała turniej tenisowy",
        "Polka pokonała rywalkę",
        "Transmisję pokazał serial dokumentalny, a film o turnieju powstanie później.",
    )
    assert emotki[0] == "🎾"


def test_nie_zgaduje_gdy_nie_ma_tematu():
    assert topic_emoji("Zupełnie neutralny tytuł", "Bez rozpoznawalnej dziedziny") == []


def test_najwyzej_trzy_emotki():
    dlugi = ("Sejm, rząd i prezydent o podatkach, inflacji, eksporcie, wojnie, "
             "filmie, muzyce, tenisie i teleskopie")
    assert len(topic_emoji(dlugi, dlugi)) <= 3


def test_dopasowanie_od_poczatku_wyrazu():
    """„wygrała" to nie gra wideo, „premiera filmu" to nie polityka."""
    assert "🎮" not in topic_emoji("Polka wygrała mecz", "Wygrana w trzech setach")
    assert "🏛️" not in topic_emoji("Premiera filmu w kinach", "Nowy obraz reżysera")
