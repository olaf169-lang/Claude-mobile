"""Wyciąganie treści artykułu ze strony HTML.

Bez ciężkich zależności: usuwamy nawigację i skrypty, a następnie szukamy
kontenera z największą masą akapitów. To wystarcza dla serwisów prasowych,
a jeśli nie zadziała — potok korzysta z zajawki z kanału RSS.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from bs4 import BeautifulSoup

from .textutil import clean

_DROP_TAGS = (
    "script", "style", "noscript", "nav", "aside", "footer", "header", "form",
    "iframe", "svg", "figure", "figcaption", "button", "video", "audio",
)
_DROP_HINT = re.compile(
    r"(comment|coment|related|recommend|newsletter|subscribe|paywall|promo|"
    r"advert|reklam|banner|social|share|udostepnij|tags?|breadcrumb|menu|"
    r"sidebar|popular|czytaj-tez|czytaj_tez|most-read|cookie|consent)",
    re.I,
)
_BOILERPLATE = re.compile(
    r"^(czytaj (także|też|więcej)|zobacz (też|także)|read more|advertisement|"
    r"reklama|share this|follow us|zdjęcie:|fot\.|źródło:|autor:|photograph:|"
    r"sign up|subscribe|copyright|wszelkie prawa|edited by|reviewed by|"
    r"written by|compiled by|editors have highlighted)",
    re.I,
)
#: Nagłówek strony sklejony w jeden akapit: autor, data, czas czytania.
#: Trafia na początek tekstu, czyli prosto w lead.
_METADATA = re.compile(
    r"(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}.{0,24}\d{1,2}:\d{2}"
    r"|\b\d{1,2}\s*(minut\w*|min\.|min read)\b"
    r"|\b(udostępnij|share|drukuj|print)\b.{0,30}$)",
    re.I,
)

#: Serwisy naukowe (Science X: Phys.org, Medical Xpress) doklejają do każdego
#: tekstu notę o procesie redakcyjnym. Trafiała prosto w lead — to nie jest news.
_EDITORIAL_NOTE = re.compile(
    r"(this article has been reviewed according to|editorial process and policies|"
    r"editors have highlighted the following attributes|while ensuring the content'?s "
    r"credibility|fact-checked|peer-reviewed publication|trusted source|proofread)",
    re.I,
)


@dataclass
class Article:
    text: str
    title: str = ""
    image: str | None = None
    paragraphs: tuple[str, ...] = ()

    def __bool__(self) -> bool:
        return len(self.text) >= 200


def _meta(soup: BeautifulSoup, *names: str) -> str | None:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            return tag["content"].strip()
    return None


def _paragraph_score(node) -> float:
    score = 0.0
    for p in node.find_all("p", recursive=True):
        text = clean(p.get_text(" "))
        if len(text) < 40:
            continue
        score += len(text) ** 0.75
    return score


def extract(html: str, *, base_url: str = "") -> Article:
    if not html or len(html) < 200:
        return Article("")
    soup = BeautifulSoup(html, "html.parser")

    title = _meta(soup, "og:title", "twitter:title") or (soup.title.string if soup.title else "") or ""
    image = _meta(soup, "og:image", "twitter:image")

    for tag in soup(list(_DROP_TAGS)):
        tag.decompose()
    for tag in soup.find_all(attrs={"class": _DROP_HINT}):
        tag.decompose()
    for tag in soup.find_all(attrs={"id": _DROP_HINT}):
        tag.decompose()

    candidates = soup.find_all(["article", "main", "div", "section"])
    best, best_score = None, 0.0
    for node in candidates:
        score = _paragraph_score(node)
        if score > best_score:
            best, best_score = node, score
    root = best or soup

    paragraphs: list[str] = []
    for p in root.find_all("p"):
        text = clean(p.get_text(" "))
        if len(text) < 40 or _BOILERPLATE.match(text) or _EDITORIAL_NOTE.search(text):
            continue
        # Metadane wykrywamy tylko w krótkich akapitach: w długim tekście data
        # z godziną jest zwykle treścią, nie stopką redakcyjną.
        if len(text) < 220 and _METADATA.search(text):
            continue
        if paragraphs and text == paragraphs[-1]:
            continue
        paragraphs.append(text)

    text = "\n\n".join(paragraphs)
    if base_url and image and image.startswith("/"):
        root_url = re.match(r"(https?://[^/]+)", base_url)
        if root_url:
            image = root_url.group(1) + image
    return Article(text=text, title=clean(title), image=image, paragraphs=tuple(paragraphs))
