"""Tło encyklopedyczne z Wikipedii — kontekst, którego nie ma w newsie.

Najpierw polska Wikipedia (bo przegląd jest po polsku), potem angielska.
Brak wyniku nie jest błędem — sekcja tła po prostu się nie pojawi.
"""

from __future__ import annotations

import json
import logging
from urllib.parse import quote

import requests

from .net import get
from .textutil import shorten

log = logging.getLogger("przeglad.wiki")

LANGS = ("pl", "en")


def _search(session: requests.Session, lang: str, query: str) -> str | None:
    url = (
        f"https://{lang}.wikipedia.org/w/api.php?action=query&list=search"
        f"&srsearch={quote(query)}&srlimit=1&format=json&utf8=1"
    )
    response = get(session, url, timeout=12, retries=1)
    if not response.ok:
        return None
    try:
        hits = json.loads(response.text)["query"]["search"]
    except (ValueError, KeyError, TypeError):
        return None
    return hits[0]["title"] if hits else None


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


def background(session: requests.Session, candidates: list[str]) -> dict | None:
    """Pierwsze sensowne hasło dla listy kandydatów (od najważniejszego)."""
    for candidate in candidates[:4]:
        if len(candidate) < 3:
            continue
        for lang in LANGS:
            title = _search(session, lang, candidate)
            if not title:
                continue
            summary = _summary(session, lang, title)
            if summary:
                log.debug("tło z Wikipedii (%s): %s", lang, title)
                return summary
    return None
