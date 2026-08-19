"""Tło encyklopedyczne z Wikipedii — kontekst, którego nie ma w newsie.

Najpierw polska Wikipedia (bo przegląd jest po polsku), potem angielska.
Brak wyniku nie jest błędem — sekcja tła po prostu się nie pojawi.

Kluczowa jest tu trafność, nie kompletność. Wyszukiwanie pełnotekstowe
potrafi na zapytanie o materiał półprzewodnikowy zwrócić hasło „Homofobia",
bo gdzieś w treści zgadza się kilka słów. Dlatego bierzemy hasło tylko wtedy,
gdy jego tytuł faktycznie odpowiada szukanej nazwie.
"""

from __future__ import annotations

import json
import logging
from urllib.parse import quote

import requests

from .net import get
from .textutil import entity_counts, normalize, overlap, shorten, token_set

log = logging.getLogger("przeglad.wiki")

LANGS = ("pl", "en")
#: Jak bardzo tytuł znalezionego hasła musi pokrywać się z szukaną nazwą.
TITLE_MATCH = 0.6


def candidates_for(title: str, text: str, *, source: str = "", domain: str = "") -> list[str]:
    """Nazwy, o które warto zapytać Wikipedię — czyli temat, nie tło akapitu.

    Nazwa wspomniana raz na marginesie prowadzi donikąd: artykuł o obronie
    przed asteroidą przywoływał film „Armageddon", a wywiad z pisarzem imię
    „Lucy". Bierzemy więc to, co jest w nagłówku, oraz to, co w tekście wraca
    co najmniej dwa razy. Nazwa samej redakcji odpada zawsze — hasło
    „Phys.org" nie jest tłem żadnej wiadomości.
    """
    zakazane = {normalize(source)} | {normalize(domain.split(".")[0])} if source or domain else set()
    zakazane.discard("")

    def wolno(nazwa: str) -> bool:
        n = normalize(nazwa)
        return bool(n) and len(nazwa) >= 4 and not any(z and (z in n or n in z) for z in zakazane)

    w_naglowku = [e for e in entity_counts(title) if wolno(e)]
    liczniki = entity_counts(f"{title} {text}")
    powtorzone = [
        nazwa for nazwa, ile in sorted(liczniki.items(), key=lambda kv: (-kv[1], -len(kv[0])))
        if ile >= 2 and wolno(nazwa) and nazwa not in w_naglowku
    ]
    return (w_naglowku + powtorzone)[:4]


def _api(session: requests.Session, lang: str, params: str) -> dict | None:
    url = f"https://{lang}.wikipedia.org/w/api.php?format=json&utf8=1&{params}"
    response = get(session, url, timeout=12, retries=1)
    if not response.ok:
        return None
    try:
        return json.loads(response.text)
    except ValueError:
        return None


def _titles(session: requests.Session, lang: str, query: str) -> list[str]:
    """Kandydaci na hasło: najpierw trafienie w sam tytuł, potem pełen tekst."""
    found: list[str] = []
    for what in ("nearmatch", "text"):
        data = _api(
            session, lang,
            f"action=query&list=search&srwhat={what}&srlimit=3&srsearch={quote(query)}",
        )
        hits = ((data or {}).get("query") or {}).get("search") or []
        for hit in hits:
            title = hit.get("title")
            if title and title not in found:
                found.append(title)
        if what == "nearmatch" and found:
            break  # trafienie w tytuł jest pewne, nie trzeba szukać dalej
    return found


def _matches_query(title: str, query: str) -> bool:
    """Czy znalezione hasło to naprawdę to, o co pytaliśmy?"""
    tytul, szukane = token_set(title), token_set(query)
    if not tytul or not szukane:
        return False
    if tytul == szukane:
        return True
    return overlap(tytul, szukane) >= TITLE_MATCH


def _summary(session: requests.Session, lang: str, title: str) -> dict | None:
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(title.replace(' ', '_'))}"
    response = get(session, url, timeout=12, retries=1)
    if not response.ok:
        return None
    try:
        data = json.loads(response.text)
    except ValueError:
        return None
    extract = (data.get("extract") or "").strip()
    if len(extract) < 80 or data.get("type") == "disambiguation":
        return None
    return {
        "hasło": data.get("title") or title,
        "opis": data.get("description") or "",
        "tekst": shorten(extract, 900),
        "url": (data.get("content_urls", {}).get("desktop", {}) or {}).get("page")
        or f"https://{lang}.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}",
        "język": lang,
    }


#: Hasła zbyt ogólne, by cokolwiek wyjaśnić. Lista jest krótka i z założenia
#: niepełna — łapie to, co realnie wychodziło w wydaniach.
OGOLNIKI = frozenset({
    "science", "university", "research", "technology", "internet", "computer",
    "software", "engineering", "medicine", "history", "energy", "water",
    "nauka", "uniwersytet", "badania", "technologia", "medycyna", "historia",
    "energia", "woda", "czlowiek", "swiat", "kraj", "miasto", "rzad",
})

#: Ile słów poza samą nazwą musi łączyć hasło z artykułem, żeby uznać je za
#: tło tematu, a nie za przypadkową zbieżność nazwy.
MIN_WSPOLNYCH = 3


def _on_topic(extract: str, article: str, candidate: str) -> bool:
    """Czy hasło mówi o tym samym co artykuł, czy tylko nazywa się podobnie?

    Sprawdzenie samej nazwy nie wystarcza: artykuł o islandzkim pangenomie
    trafiał na hasło „Air Atlanta Icelandic", bo obie rzeczy są islandzkie.
    Liczymy więc słowa wspólne dla hasła i artykułu *poza* samą nazwą.
    """
    if not article:
        return True
    wspolne = (token_set(extract) & token_set(article)) - token_set(candidate)
    return len(wspolne) >= MIN_WSPOLNYCH


def background(
    session: requests.Session,
    candidates: list[str],
    *,
    article_text: str = "",
) -> dict | None:
    """Pierwsze *trafne* hasło dla listy kandydatów (od najważniejszego)."""
    for candidate in candidates[:4]:
        if len(candidate) < 4:
            continue
        for lang in LANGS:
            for title in _titles(session, lang, candidate):
                if not _matches_query(title, candidate):
                    log.debug("odrzucam hasło %r dla zapytania %r — nie o to pytaliśmy", title, candidate)
                    continue
                if normalize(title) in OGOLNIKI:
                    log.debug("odrzucam hasło %r — zbyt ogólne, nic nie wyjaśnia", title)
                    continue
                summary = _summary(session, lang, title)
                if not summary:
                    continue
                if not _on_topic(summary["tekst"], article_text, candidate):
                    log.debug("odrzucam hasło %r — zbieżna nazwa, inny temat", title)
                    continue
                log.debug("tło z Wikipedii (%s): %s", lang, title)
                return summary
    return None
