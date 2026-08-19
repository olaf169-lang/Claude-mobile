"""Wybór jednej, najważniejszej informacji w segmencie.

Pomysł: prawdziwie ważny temat pojawia się tego samego dnia u kilku
niezależnych redakcji. Grupujemy więc wpisy w klastry opisujące to samo
wydarzenie i punktujemy przede wszystkim liczbę niezależnych źródeł.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

from .model import Cluster, Entry, Segment
from .textutil import hard_overlap, hard_tokens, ngrams, normalize, overlap, token_set

#: Token uznajemy za wyróżniający, jeśli występuje w co najwyżej tej części puli.
DISTINCTIVE_DF = 0.15
#: Minimalne podobieństwo znakowe tytułów przy dwóch wspólnych tokenach.
NGRAM_FLOOR = 0.18
#: Podobieństwo znakowe, które samo w sobie wystarcza (tytuły prawie identyczne).
NGRAM_STRONG = 0.45
#: Ile tekstu wybranego artykułu wystarcza, by nie sięgać po kolejne źródła.
MIN_FULLTEXT = 900


class _Similarity:
    """Podobieństwo wpisów liczone w kontekście całej puli segmentu.

    Sama zbieżność słów nie wystarcza: „prezydent" w dziesięciu tytułach nie
    znaczy, że to jeden temat. Dlatego liczy się, ile *rzadkich* w tej puli
    tokenów dzielą dwa wpisy, wsparte podobieństwem znakowym tytułów (odporne
    na polską fleksję: „obniżyła" kontra „obniża").
    """

    def __init__(self, entries: list[Entry]) -> None:
        self._tokens: dict[str, set[str]] = {}
        self._ngrams: dict[str, set[str]] = {}
        self._rich: dict[str, set[str]] = {}
        self._hard: dict[str, set[str]] = {}
        self._lang: dict[str, str] = {}
        for entry in entries:
            self._tokens[entry.url] = token_set(entry.title)
            self._ngrams[entry.url] = ngrams(entry.title)
            self._rich[entry.url] = token_set(f"{entry.title} {entry.summary}")
            self._hard[entry.url] = hard_tokens(f"{entry.title} {entry.summary}")
            self._lang[entry.url] = entry.lang

        df: dict[str, int] = {}
        for bag in self._tokens.values():
            for token in bag:
                df[token] = df.get(token, 0) + 1
        limit = max(3, math.ceil(len(entries) * DISTINCTIVE_DF))
        self._distinctive = {token for token, count in df.items() if count <= limit}

    def distinctive_shared(self, a: Entry, b: Entry) -> set[str]:
        return self._tokens[a.url] & self._tokens[b.url] & self._distinctive

    def __call__(self, a: Entry, b: Entry) -> bool:
        if self._lang[a.url] != self._lang[b.url]:
            # Ponad barierą językową porównujemy tylko liczby i nazwy własne.
            return hard_overlap(self._hard[a.url], self._hard[b.url]) >= 2
        char_sim = overlap(self._ngrams[a.url], self._ngrams[b.url])
        if char_sim >= NGRAM_STRONG:
            return True
        shared = len(self.distinctive_shared(a, b))
        if shared >= 2 and char_sim >= NGRAM_FLOOR:
            return True
        # Ubogie tytuły ("Zamach w stolicy") porównujemy razem z zajawką.
        if min(len(self._tokens[a.url]), len(self._tokens[b.url])) <= 4:
            return overlap(self._rich[a.url], self._rich[b.url]) >= 0.55
        return False


def cluster_entries(entries: list[Entry]) -> list[Cluster]:
    """Zachłanne grupowanie po temacie (pule są małe, więc O(n²) wystarcza)."""
    similar = _Similarity(entries)
    clusters: list[Cluster] = []
    for entry in entries:
        for cluster in clusters:
            if any(similar(entry, member) for member in cluster.entries[:4]):
                cluster.entries.append(entry)
                break
        else:
            clusters.append(Cluster(entries=[entry]))
    return clusters


def _keyword_bonus(text: str, segment: Segment) -> float:
    haystack = normalize(text)
    hits = sum(1 for word in segment.boost if normalize(word) in haystack)
    return min(hits, 4) * 0.35


def _freshness(entry: Entry, window_end: datetime) -> float:
    """Materiały z końcówki dnia są zwykle podsumowaniem, nie migawką."""
    if entry.published is None:
        return 0.0
    hours_before_end = (window_end - entry.published).total_seconds() / 3600
    if hours_before_end < 0:
        return 0.0
    return max(0.0, 1.0 - hours_before_end / 48) * 0.6


def score_cluster(cluster: Cluster, segment: Segment, window_end: datetime) -> Cluster:
    entries = cluster.entries
    distinct_sources = len({e.source for e in entries})
    distinct_domains = len({e.domain for e in entries if e.domain})

    corroboration = (distinct_sources - 1) * 1.6 + (distinct_domains - 1) * 0.4
    authority = max(e.weight for e in entries) + 0.15 * (sum(e.weight for e in entries) - max(e.weight for e in entries))
    prominence = sum(max(0.0, 0.9 - 0.09 * e.feed_position) for e in entries[:5])
    keywords = max(_keyword_bonus(f"{e.title} {e.summary}", segment) for e in entries)
    freshness = max(_freshness(e, window_end) for e in entries)
    substance = min(1.0, max(len(e.summary) for e in entries) / 400) * 0.5
    language = 0.5 if any(e.lang == segment.prefer_lang for e in entries) else 0.0

    parts = {
        "potwierdzenia": round(corroboration, 3),
        "ranga_źródła": round(authority, 3),
        "eksponowanie": round(prominence, 3),
        "słowa_kluczowe": round(keywords, 3),
        "świeżość": round(freshness, 3),
        "treściwość": round(substance, 3),
        "język_działu": round(language, 3),
    }
    cluster.score_parts = parts
    cluster.score = round(sum(parts.values()), 3)
    return cluster


def _lead_key(entry: Entry, segment: Segment) -> tuple:
    """Artykuł reprezentatywny: preferowany język, mocne źródło, konkretna zajawka."""
    return (
        0 if entry.lang == segment.prefer_lang else 1,
        -entry.weight,
        -min(len(entry.summary), 600),
        entry.feed_position,
    )


def rank(entries: list[Entry], segment: Segment, window_end: datetime) -> list[Cluster]:
    """Zwraca klastry posortowane od najważniejszego."""
    clusters = [score_cluster(c, segment, window_end) for c in cluster_entries(entries)]
    for cluster in clusters:
        cluster.entries.sort(key=lambda e: _lead_key(e, segment))
    clusters.sort(key=lambda c: (-c.score, _lead_key(c.entries[0], segment)))
    return clusters


def pick(
    entries: list[Entry],
    segment: Segment,
    window_end: datetime | None = None,
    *,
    exclude_urls: frozenset[str] = frozenset(),
) -> Cluster | None:
    """Najważniejszy temat segmentu albo None, jeśli nie ma z czego wybierać."""
    window_end = window_end or datetime.now(timezone.utc)
    usable = [e for e in entries if e.url not in exclude_urls]
    if not usable:
        return None
    ranked = rank(usable, segment, window_end)
    return ranked[0] if ranked else None
