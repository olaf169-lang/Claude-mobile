"""Narzędzia tekstowe: normalizacja, tokenizacja, zdania, liczby.

Wszystko działa offline i bez zewnętrznych modeli — dzięki temu potok jest
przewidywalny i szybki, a testy nie potrzebują sieci.
"""

from __future__ import annotations

import html
import re
import unicodedata

STOPWORDS = frozenset(
    """
    a aby albo ale ani az aż bardzo bez biuro bo bowiem by byc być byl był byla była
    byli bylo było byly były co coraz coś czy czyli dla do gdy gdyz gdyż gdzie go
    i ich ile im inne iz iż ja jak jakie jako je jego jej jest jesli jeśli juz już
    kiedy kto ktora która ktore które ktorego którego ktorych których ktory który
    lat lecz lub ma maja mają mamy mi mial miał miedzy między mnie moze może mozna
    można na nad nam nas nasz nie niz niż no nowe o od oraz po pod podczas ponad
    poniewaz ponieważ potem powiedzial powiedział przed przez przy raz razem roku
    sa są sie się swoje ta tak takze także tam te tego tej temu ten teraz tez też
    to tu tych tylko tym u w we wedlug według wiec więc wszystko z za ze że zeby żeby
    the a an and or but of to in on for with at by from as is are was were be been
    being it its this that these those he she they we you i his her their our your
    have has had will would could should can may might not no so than then there
    here about after before during over under into out up down more most other some
    such only own same too very just also new says said say new news
    """.split()
)

_WORD_RE = re.compile(r"[0-9\w]+", re.UNICODE)
_SENT_SPLIT_RE = re.compile(r"(?<=[.!?…])[\s ]+(?=[\"'„»(\[]?[A-ZĄĆĘŁŃÓŚŹŻ0-9])")
_WS_RE = re.compile(r"[\s ]+")
_TAG_RE = re.compile(r"<[^>]+>")

# Liczby, które warto pokazać: kwoty, procenty, wielkie liczby, jednostki.
_NUMBER_RE = re.compile(
    r"(?<![\w.,])(?:[+-]?\d[\d  .,]*\d|\d)"
    r"(?:\s?(?:%|proc\.|procent\w*|mln|mld|tys\.|tysi\w+|milion\w*|miliard\w*|"
    r"million|billion|trillion|thousand|km/h|km|kg|ton\w*|mm|cm|°C|lat|godzin\w*|"
    r"dni|pkt|punkt\w*))?"
    r"(?:\s?(?:zł|PLN|EUR|USD|GBP|€|\$|£))?",
    re.IGNORECASE | re.UNICODE,
)

_ACRONYM_OK = frozenset(
    {"UE", "NATO", "ONZ", "USA", "PKB", "NBP", "GUS", "ESA", "NASA", "CERN", "AI",
     "GPU", "CPU", "LHC", "ISS", "WHO", "MFW", "OPEC", "PKW", "TSUE", "TK", "SN"}
)


def clean(text: str | None) -> str:
    """HTML -> czysty jednolinijkowy tekst."""
    if not text:
        return ""
    text = html.unescape(_TAG_RE.sub(" ", text))
    return _WS_RE.sub(" ", text).strip()


def strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def normalize(text: str) -> str:
    """Do porównań: bez ogonków, małymi literami, bez interpunkcji."""
    return _WS_RE.sub(" ", strip_accents(clean(text).lower())).strip()


def tokens(text: str, *, keep_stopwords: bool = False) -> list[str]:
    words = _WORD_RE.findall(normalize(text))
    if keep_stopwords:
        return words
    return [w for w in words if len(w) > 2 and w not in STOPWORDS]


def token_set(text: str) -> set[str]:
    """Zbiór rdzeni słów — obcięcie końcówek radzi sobie z polską fleksją."""
    out = set()
    for w in tokens(text):
        out.add(w[:6] if len(w) > 7 else w)
    return out


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def overlap(a: set[str], b: set[str]) -> float:
    """Pokrycie względem krótszego zbioru — lepsze dla tytułów różnej długości."""
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def sentences(text: str) -> list[str]:
    text = clean(text)
    if not text:
        return []
    parts = _SENT_SPLIT_RE.split(text)
    out: list[str] = []
    for p in parts:
        p = p.strip("  ")
        if len(p) >= 25:
            out.append(p)
    return out


def numbers_in(text: str) -> list[str]:
    found = []
    for m in _NUMBER_RE.finditer(text):
        s = m.group(0).strip()
        if len(s) > 1 and any(ch.isdigit() for ch in s):
            found.append(s)
    return found


def entities(text: str) -> list[str]:
    """Prosta heurystyka nazw własnych: wyrazy z wielkiej litery w środku zdania."""
    out: list[str] = []
    for sent in sentences(text) or [clean(text)]:
        words = sent.split()
        buf: list[str] = []
        for i, raw in enumerate(words):
            w = raw.strip("„”\"'()[],.;:!?—–-")
            if not w:
                continue
            first_word = i == 0
            capitalized = w[0].isupper() and (len(w) > 1 and not w.isupper() or w in _ACRONYM_OK)
            if capitalized and not first_word and w.lower() not in STOPWORDS:
                buf.append(w)
                continue
            if buf:
                out.append(" ".join(buf))
                buf = []
        if buf:
            out.append(" ".join(buf))
    return out


def entity_counts(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for ent in entities(text):
        if len(ent) < 3:
            continue
        counts[ent] = counts.get(ent, 0) + 1
    return counts


def top_entities(text: str, limit: int = 6) -> list[str]:
    ordered = sorted(entity_counts(text).items(), key=lambda kv: (-kv[1], -len(kv[0])))
    return [e for e, _ in ordered[:limit]]


def shorten(text: str, limit: int) -> str:
    text = clean(text)
    if len(text) <= limit:
        return text
    cut = text[: limit + 1]
    space = cut.rfind(" ")
    return (cut[:space] if space > limit * 0.6 else cut[:limit]).rstrip(" ,;:.") + "…"


def reading_time(text: str) -> int:
    words = len(_WORD_RE.findall(text))
    return max(1, round(words / 200))


def dedupe_sentences(items: list[str], threshold: float = 0.6) -> list[str]:
    """Usuwa zdania powtarzające tę samą treść (typowe przy wielu źródłach)."""
    kept: list[str] = []
    kept_sets: list[set[str]] = []
    for s in items:
        ts = token_set(s)
        if any(overlap(ts, prev) >= threshold for prev in kept_sets):
            continue
        kept.append(s)
        kept_sets.append(ts)
    return kept


def ngrams(text: str, n: int = 4) -> set[str]:
    """N-gramy znakowe — porównanie odporne na odmianę wyrazów."""
    s = normalize(text)
    if len(s) < n:
        return {s} if s else set()
    return {s[i : i + n] for i in range(len(s) - n + 1)}


_DIGITS_RE = re.compile(r"\d[\d  .,]*")


def hard_tokens(text: str) -> set[str]:
    """Tokeny przeżywające tłumaczenie: liczby i nazwy własne.

    Te same fakty w polskim i angielskim serwisie mają inne słowa, ale te same
    liczby („187 mln" / „187 million") i te same nazwiska czy nazwy własne.
    """
    out: set[str] = set()
    for match in _DIGITS_RE.finditer(text):
        digits = re.sub(r"[^\d]", "", match.group(0))
        if len(digits) >= 2 and not (len(digits) == 4 and digits.startswith(("19", "20"))):
            out.add(digits.lstrip("0") or digits)
    # Tu, inaczej niż w `entities`, bierzemy też pierwsze słowo zdania:
    # w nagłówkach nazwa własna zwykle stoi właśnie na początku
    # („Webb spots water vapour…"). Ryzyko fałszywego trafienia równoważy
    # wymóg dwóch wspólnych tokenów po obu stronach.
    for raw in clean(text).split():
        word = raw.strip("„”\"'()[],.;:!?—–-")
        if not word or not word[0].isupper():
            continue
        word = strip_accents(word.lower())
        if len(word) >= 4 and word not in STOPWORDS:
            out.add(word)
    return out


def hard_overlap(a: set[str], b: set[str]) -> int:
    """Ile „twardych" tokenów dzielą dwa teksty (odmiana nazwisk dopuszczalna).

    Liczby muszą zgadzać się dokładnie, nazwy własne wystarczy, że jedna jest
    przedrostkiem drugiej — „Webb" kontra „Webba", „Booker" kontra „Bookera".
    """
    numeric_a = {t for t in a if t.isdigit()}
    numeric_b = {t for t in b if t.isdigit()}
    hits = len(numeric_a & numeric_b)
    words_a = sorted(a - numeric_a)
    words_b = sorted(b - numeric_b)
    used: set[str] = set()
    for wa in words_a:
        for wb in words_b:
            if wb in used:
                continue
            if wa == wb or (len(wa) >= 4 and len(wb) >= 4 and (wa.startswith(wb) or wb.startswith(wa))):
                used.add(wb)
                hits += 1
                break
    return hits
