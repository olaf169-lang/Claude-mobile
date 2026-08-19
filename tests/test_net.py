import requests

from collector.net import USER_AGENT, get, make_session


def test_naglowki_sa_kodowalne_w_latin1():
    """Nagłówki HTTP idą po drucie jako latin-1 — jedno „ą" wywraca każde żądanie."""
    for nazwa, wartosc in make_session().headers.items():
        wartosc.encode("latin-1")
        nazwa.encode("latin-1")
    USER_AGENT.encode("ascii")


def test_get_nigdy_nie_rzuca(monkeypatch):
    session = make_session()

    def wybuchnij(*_args, **_kwargs):
        raise UnicodeEncodeError("latin-1", "ą", 0, 1, "poza zakresem")

    monkeypatch.setattr(session, "get", wybuchnij)
    odpowiedz = get(session, "https://example.invalid/feed", retries=0)
    assert odpowiedz.ok is False
    assert odpowiedz.error == "UnicodeEncodeError"


def test_get_zwraca_blad_zamiast_wyjatku_przy_awarii_sieci(monkeypatch):
    session = make_session()

    def bez_sieci(*_args, **_kwargs):
        raise requests.ConnectionError("brak trasy do hosta")

    monkeypatch.setattr(session, "get", bez_sieci)
    odpowiedz = get(session, "https://example.invalid/feed", retries=0)
    assert odpowiedz.ok is False
    assert odpowiedz.error == "ConnectionError"
