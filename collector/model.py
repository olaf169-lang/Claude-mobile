"""Modele danych używane w całym potoku Przeglądu News."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class Feed:
    """Pojedynczy kanał RSS/Atom."""

    url: str
    source: str
    lang: str = "pl"
    weight: float = 1.0
    #: Kanał ogólny (np. "wszystkie wiadomości") wymaga filtrowania po słowach
    #: kluczowych segmentu, kanał tematyczny — nie.
    topical: bool = True


@dataclass(frozen=True)
class Segment:
    """Dział przeglądu — dokładnie jedna informacja dziennie."""

    id: str
    name: str
    emoji: str
    blurb: str
    feeds: tuple[Feed, ...]
    boost: tuple[str, ...] = ()
    block: tuple[str, ...] = ()
    #: Język, w którym dział ma być czytany. Temat bez źródła w tym języku
    #: przegrywa z tematem, który je ma — nawet jeśli jest głośniejszy.
    prefer_lang: str = "pl"


@dataclass
class Entry:
    """Wpis z kanału, po normalizacji."""

    title: str
    url: str
    source: str
    lang: str
    weight: float
    published: datetime | None = None
    summary: str = ""
    image: str | None = None
    feed_position: int = 0
    segment_id: str = ""
    #: Pełny tekst artykułu, dociągany leniwie tylko dla kandydatów.
    fulltext: str = ""

    @property
    def domain(self) -> str:
        m = re.match(r"https?://([^/]+)", self.url or "")
        return m.group(1).lower().removeprefix("www.") if m else ""

    @property
    def uid(self) -> str:
        return hashlib.sha1(self.url.encode("utf-8", "ignore")).hexdigest()[:12]


@dataclass
class Cluster:
    """Grupa wpisów z różnych źródeł opisujących to samo wydarzenie."""

    entries: list[Entry] = field(default_factory=list)
    score: float = 0.0
    score_parts: dict[str, float] = field(default_factory=dict)

    @property
    def sources(self) -> list[str]:
        """Nazwy kanałów — do wyświetlenia."""
        seen: list[str] = []
        for e in self.entries:
            if e.source not in seen:
                seen.append(e.source)
        return seen

    @property
    def publishers(self) -> list[str]:
        """Niezależni wydawcy, liczeni po domenie artykułu.

        „Phys.org" i „Phys.org Quantum" to dwa kanały jednej redakcji, tak samo
        jak siedem kanałów Guardiana. Liczone po nazwie kanału zawyżałyby
        potwierdzenie tematu, czyli najważniejszy sygnał w całym rankingu.
        """
        seen: list[str] = []
        for e in self.entries:
            key = e.domain or e.source
            if key not in seen:
                seen.append(key)
        return seen

    @property
    def lead(self) -> Entry:
        """Wpis reprezentatywny (ustalany przez ranking)."""
        return self.entries[0]


@dataclass
class Story:
    """Gotowa, pogłębiona informacja dla jednego segmentu."""

    segment: Segment
    cluster: Cluster
    headline: str
    dek: str
    sections: list[dict[str, Any]] = field(default_factory=list)
    why_it_matters: str = ""
    numbers: list[str] = field(default_factory=list)
    perspectives: list[dict[str, str]] = field(default_factory=list)
    background: dict[str, Any] | None = None
    glossary: list[dict[str, str]] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    emoji: list[str] = field(default_factory=list)
    mode: str = "extractive"
