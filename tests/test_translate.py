"""Testy tłumaczenia — bez sieci: odpowiedzi usługi są podstawiane."""

from __future__ import annotations

import json

import pytest

from collector import translate as T
from collector.net import Response


class FakeUsluga:
    """Udaje MyMemory: zwraca 'PL:' + oryginał albo wskazany błąd."""

    def __init__(self, *, awaria_po: int | None = None, limit: bool = False):
        self.zapytania: list[str] = []
        self.awaria_po = awaria_po
        self.limit = limit

    def __call__(self, session, url, **kwargs):
        from urllib.parse import parse_qs, unquote, urlparse

        q = parse_qs(urlparse(url).query).get("q", [""])[0]
        self.zapytania.append(unquote(q))
        if self.limit:
            return Response(True, url, 200, json.dumps({
                "responseData": {"translatedText": ""},
                "responseDetails": "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY",
            }).encode())
        if self.awaria_po is not None and len(self.zapytania) > self.awaria_po:
            return Response(False, url, 503, error="HTTP 503")
        return Response(True, url, 200, json.dumps({
            "responseData": {"translatedText": f"PL:{unquote(q)}", "match": 1},
            "responseDetails": "",
            "matches": [{"translation": f"PL:{unquote(q)}", "created-by": "MT!", "match": 1}],
        }).encode())


@pytest.fixture(autouse=True)
def bez_pauzy(monkeypatch):
    monkeypatch.setattr(T.time, "sleep", lambda _s: None)


def tlumacz(monkeypatch, usluga, **kwargs):
    monkeypatch.setattr(T, "get", usluga)
    return T.Translator(session=None, **kwargs)


def test_tlumaczy_krotki_tekst(monkeypatch):
    t = tlumacz(monkeypatch, FakeUsluga())
    assert t.text("Quantum computing gets a boost.") == "PL:Quantum computing gets a boost."


def test_dzieli_dlugi_tekst_na_kawalki_po_zdaniach(monkeypatch):
    usluga = FakeUsluga()
    t = tlumacz(monkeypatch, usluga)
    dlugie = " ".join(f"This is sentence number {i} about quantum physics research." for i in range(20))
    wynik = t.text(dlugie)
    assert wynik and wynik.startswith("PL:")
    assert len(usluga.zapytania) > 1, "długi tekst powinien pójść w kilku kawałkach"
    assert all(len(q) <= T.MAX_CHUNK for q in usluga.zapytania)
    # Żadne zdanie nie zostało przecięte w środku.
    assert all(q.strip().endswith(".") for q in usluga.zapytania)


def test_awaria_w_polowie_uniewaznia_caly_tekst(monkeypatch):
    t = tlumacz(monkeypatch, FakeUsluga(awaria_po=1))
    dlugie = " ".join(f"Sentence number {i} about the discovery." for i in range(40))
    assert t.text(dlugie) is None
    assert t.enabled is False, "po awarii tłumacz ma się wyłączyć do końca wydania"


def test_wyczerpany_limit_wylacza_tlumacza(monkeypatch):
    t = tlumacz(monkeypatch, FakeUsluga(limit=True))
    assert t.text("Anything at all here.") is None
    assert t.enabled is False


def test_budzet_ogranicza_liczbe_znakow(monkeypatch):
    t = tlumacz(monkeypatch, FakeUsluga(), budget=40)
    assert t.text("Short one.") is not None
    assert t.text("A considerably longer sentence that will not fit in the budget at all.") is None


def test_powtorzony_tekst_idzie_z_pamieci(monkeypatch):
    usluga = FakeUsluga()
    t = tlumacz(monkeypatch, usluga)
    t.text("Same sentence twice.")
    t.text("Same sentence twice.")
    assert len(usluga.zapytania) == 1


POZYCJA = {
    "nagłówek": "Krypton gas emerges as ingredient for quantum computing",
    "lead": "Manufacturers need better superconducting materials.",
    "dlaczego_to_ważne": "It could make chips cheaper.",
    "sekcje": [{"tytuł": "Co się stało", "rodzaj": "akapity", "treść": ["The team annealed samples."]}],
    "inne_spojrzenia": [{"źródło": "Nature", "ujęcie": "Results were published today.", "url": "x"}],
    "język_źródła": "en",
}


def test_tlumaczy_cala_pozycje(monkeypatch):
    t = tlumacz(monkeypatch, FakeUsluga())
    item = json.loads(json.dumps(POZYCJA))
    assert T.translate_item(item, t) is True
    assert item["nagłówek"].startswith("PL:")
    assert item["lead"].startswith("PL:")
    assert item["dlaczego_to_ważne"].startswith("PL:")
    assert item["sekcje"][0]["treść"][0].startswith("PL:")
    assert item["inne_spojrzenia"][0]["ujęcie"].startswith("PL:")
    assert item["tłumaczenie"] == {"z": "en", "silnik": "MyMemory"}
    assert item["oryginalny_nagłówek"] == POZYCJA["nagłówek"]
    # Tytuły sekcji są nasze i już polskie — nie idą do tłumaczenia.
    assert item["sekcje"][0]["tytuł"] == "Co się stało"


def test_polowiczne_tlumaczenie_nie_trafia_do_wydania(monkeypatch):
    """Karta w połowie polska jest gorsza niż uczciwie oznaczona angielska."""
    t = tlumacz(monkeypatch, FakeUsluga(awaria_po=2))
    item = json.loads(json.dumps(POZYCJA))
    assert T.translate_item(item, t) is False
    assert item == POZYCJA, "pozycja miała zostać nietknięta"


# --- wybór tłumaczenia spośród odpowiedzi MyMemory --------------------------

def odpowiedz(matches=None, response=None, details=""):
    return {
        "responseData": response or {"translatedText": "", "match": 0},
        "responseDetails": details,
        "matches": matches or [],
    }


def test_wola_tlumaczenie_maszynowe_od_pamieci_spolecznosciowej():
    """To pamięć tłumaczeniowa podstawiła kiedyś definicję homofobii."""
    data = odpowiedz(
        matches=[
            {"translation": "Homofobia – negatywne postawy wobec homoseksualności i osób LGBT.",
             "created-by": "user", "match": 0.62},
            {"translation": "Jednorodne warstwy osadzono na krzemie.", "created-by": "MT!", "match": 0.85},
        ],
        response={"translatedText": "Homofobia – negatywne postawy wobec homoseksualności i osób LGBT.",
                  "match": 0.62},
    )
    wybor = T.Translator._pick(data, "Homogeneous films were deposited on silicon.")
    assert wybor == "Jednorodne warstwy osadzono na krzemie."


def test_odrzuca_slabe_dopasowanie_z_pamieci():
    data = odpowiedz(
        matches=[{"translation": "Zupełnie inny tekst.", "created-by": "user", "match": 0.55}],
        response={"translatedText": "Zupełnie inny tekst.", "match": 0.55},
    )
    assert T.Translator._pick(data, "Some sentence about quantum physics here.") is None


def test_odrzuca_tlumaczenie_o_absurdalnej_dlugosci():
    """Definicja encyklopedyczna w miejscu jednego zdania to podmiana, nie przekład."""
    dlugie = "Homofobia – negatywne postawy i uczucia wobec homoseksualności. " * 6
    data = odpowiedz(matches=[{"translation": dlugie, "created-by": "MT!", "match": 1}])
    assert T.Translator._pick(data, "Krypton helps here.") is None


def test_przyjmuje_bardzo_dobre_dopasowanie_z_pamieci():
    data = odpowiedz(
        matches=[{"translation": "Dobre tłumaczenie zdania.", "created-by": "user", "match": 0.98}],
        response={"translatedText": "Dobre tłumaczenie zdania.", "match": 0.98},
    )
    assert T.Translator._pick(data, "A good sentence translation.") == "Dobre tłumaczenie zdania."


def test_sekcja_po_polsku_nie_idzie_do_tlumaczenia(monkeypatch):
    """Tło z polskiej Wikipedii jest już po polsku."""
    t = tlumacz(monkeypatch, FakeUsluga())
    item = {
        "nagłówek": "Krypton gas", "lead": "Manufacturers need materials.",
        "sekcje": [
            {"tytuł": "Co się stało", "rodzaj": "akapity", "treść": ["The team annealed samples."]},
            {"tytuł": "Tło", "rodzaj": "akapity", "język": "pl",
             "treść": ["Krypton – pierwiastek chemiczny z grupy gazów szlachetnych."]},
        ],
        "inne_spojrzenia": [],
    }
    assert T.translate_item(item, t) is True
    assert item["sekcje"][0]["treść"][0].startswith("PL:")
    assert item["sekcje"][1]["treść"][0].startswith("Krypton – pierwiastek")


def test_bez_adresu_email_nie_wysylamy_parametru_de(monkeypatch):
    """Zmyślony adres kontaktowy byłby nieuczciwy wobec darmowej usługi."""
    zapytania: list[str] = []

    def zapisz(session, url, **kwargs):
        zapytania.append(url)
        return Response(True, url, 200, json.dumps({
            "responseData": {"translatedText": "PL", "match": 1},
            "matches": [{"translation": "PL", "created-by": "MT!", "match": 1}],
        }).encode())

    monkeypatch.setattr(T, "get", zapisz)
    T.Translator(session=None).text("Hello there friend.")
    assert "&de=" not in zapytania[0]


def test_wlasny_adres_email_trafia_do_zapytania_i_podnosi_budzet(monkeypatch):
    zapytania: list[str] = []

    def zapisz(session, url, **kwargs):
        zapytania.append(url)
        return Response(True, url, 200, json.dumps({
            "responseData": {"translatedText": "PL", "match": 1},
            "matches": [{"translation": "PL", "created-by": "MT!", "match": 1}],
        }).encode())

    monkeypatch.setattr(T, "get", zapisz)
    t = T.Translator(session=None, email="ja@example.com")
    t.text("Hello there friend.")
    assert "de=ja%40example.com" in zapytania[0]
    assert t._budget > T.BUDGET_ANONIM
