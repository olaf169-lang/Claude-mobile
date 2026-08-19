"""Składanie gotowej informacji: tryb ekstrakcyjny i tryb modelu."""

from __future__ import annotations

from typing import Any

from .model import Cluster, Segment, Story
from .textutil import (
    dedupe_sentences,
    normalize,
    numbers_in,
    reading_time,
    sentences,
    shorten,
    top_entities,
)

_HEDGE = (
    "czytaj", "zobacz też", "read more", "advertisement", "reklama", "fot.", "źródło:",
    "edited by", "reviewed by", "editors have highlighted",
)
#: Nota o procesie redakcyjnym Science X — potrafi wejść w środek zdania.
_EDITORIAL_NOTE = (
    "this article has been reviewed according to",
    "editorial process and policies",
    "editors have highlighted the following attributes",
    "peer-reviewed publication",
)
_MEANING_MARKERS = (
    "oznacza", "skutk", "konsekwen", "wpłynie", "wpływ", "dzięki temu", "w praktyce",
    "to pierwszy", "po raz pierwszy", "means", "impact", "consequence", "for the first time",
    "could allow", "pozwoli", "umożliwi", "grozi", "ryzyk",
)


def _sentence_score(sentence: str, index: int, segment: Segment) -> float:
    lowered = normalize(sentence)
    if any(lowered.startswith(h) for h in _HEDGE):
        return -1.0
    if any(marker in lowered for marker in _EDITORIAL_NOTE):
        return -1.0

    score = 1.0 / (1.0 + index * 0.12)
    score += min(len(numbers_in(sentence)), 3) * 0.35
    score += min(len(top_entities(sentence, 5)), 3) * 0.12
    score += sum(0.25 for word in segment.boost if normalize(word) in lowered)
    if '"' in sentence or "„" in sentence or "”" in sentence:
        score += 0.2
    length = len(sentence)
    if 70 <= length <= 280:
        score += 0.35
    elif length > 400:
        score -= 0.3
    return score


def key_sentences(text: str, segment: Segment, limit: int = 5) -> list[str]:
    """Najbardziej treściwe zdania, zwrócone w kolejności występowania."""
    pool = sentences(text)
    if not pool:
        return []
    # Ujemna ocena to dyskwalifikacja (zajawki, stopki), nie tylko słabszy wynik.
    scored = [
        (score, i, s)
        for i, s in enumerate(pool)
        if (score := _sentence_score(s, i, segment)) > 0
    ]
    best = sorted(scored, key=lambda t: -t[0])[: limit * 2]
    chosen = dedupe_sentences([s for _, _, s in sorted(best, key=lambda t: t[1])])
    return chosen[:limit]


def _material_text(entry) -> str:
    return entry.fulltext or entry.summary or entry.title


def materials(cluster: Cluster, limit: int = 4) -> list[dict[str, Any]]:
    """Materiał źródłowy: po jednym wpisie na redakcję, najbogatsze najpierw."""
    per_source: dict[str, Any] = {}
    for entry in cluster.entries:
        current = per_source.get(entry.source)
        if current is None or len(_material_text(entry)) > len(_material_text(current)):
            per_source[entry.source] = entry
    ordered = sorted(per_source.values(), key=lambda e: -len(_material_text(e)))
    lead = cluster.lead
    ordered = [lead] + [e for e in ordered if e.url != lead.url]
    return [
        {
            "source": e.source,
            "lang": e.lang,
            "title": e.title,
            "url": e.url,
            "text": _material_text(e),
        }
        for e in ordered[:limit]
    ]


def _numbers(cluster: Cluster, limit: int = 6) -> list[str]:
    found: list[str] = []
    keys: list[str] = []
    for entry in cluster.entries:
        for number in numbers_in(_material_text(entry)):
            key = normalize(number)
            if len(key) < 2:
                continue
            # Same lata bez jednostki są mało ciekawe.
            if key.isdigit() and len(key) == 4 and key.startswith(("19", "20")):
                continue
            # „41" nic nie wnosi obok „41 lat" — zostawiamy bogatszy zapis.
            if any(key.startswith(k) or k.startswith(key) for k in keys):
                continue
            keys.append(key)
            found.append(number)
            if len(found) >= limit:
                return found
    return found


def _perspectives(cluster: Cluster, segment: Segment, used: list[str]) -> list[dict[str, str]]:
    used_norm = {normalize(u) for u in used}
    out: list[dict[str, str]] = []
    seen_sources: set[str] = set()
    for entry in cluster.entries[1:]:
        if entry.source in seen_sources:
            continue
        picks = key_sentences(_material_text(entry), segment, limit=2)
        pick = next((p for p in picks if normalize(p) not in used_norm), None)
        if not pick:
            continue
        seen_sources.add(entry.source)
        out.append({"źródło": entry.source, "ujęcie": shorten(pick, 320), "url": entry.url})
        if len(out) >= 3:
            break
    return out


def compose_extractive(cluster: Cluster, segment: Segment, background: dict | None) -> Story:
    """Omówienie zbudowane z najlepszych zdań źródeł (tryb bez modelu)."""
    lead = cluster.lead
    body = _material_text(lead)
    core = key_sentences(body, segment, limit=6)
    dek = shorten(" ".join(core[:2]) or lead.summary or lead.title, 320)

    why = next(
        (s for s in core if any(m in normalize(s) for m in _MEANING_MARKERS)),
        "",
    )
    narrative = [s for s in core if s != why]

    sections: list[dict[str, Any]] = []
    if narrative:
        sections.append({"tytuł": "Co się stało", "rodzaj": "akapity", "treść": narrative[:5]})

    # Najpierw źródła w języku głównego artykułu — mieszanie polskiego
    # z angielskim w jednej sekcji czyta się źle. Obcojęzyczne wchodzą
    # dopiero, gdy brakuje materiału, i z widoczną etykietą.
    swoje: list[str] = []
    obce: list[str] = []
    for entry in cluster.entries[1:]:
        for sentence in key_sentences(_material_text(entry), segment, limit=3):
            if not numbers_in(sentence):
                continue
            if entry.lang == lead.lang:
                swoje.append(sentence)
            else:
                obce.append(f"[{entry.lang}] {sentence}")
    extra = dedupe_sentences([s for s in swoje + obce if s not in narrative])[:4]
    if extra:
        sections.append({"tytuł": "Szczegóły i liczby", "rodzaj": "punkty", "treść": extra})

    if background:
        sections.append(
            {
                "tytuł": "Tło",
                "rodzaj": "akapity",
                "treść": [background["tekst"]],
                "przypis": f"Wikipedia: {background['hasło']}",
                "url": background["url"],
            }
        )

    return Story(
        segment=segment,
        cluster=cluster,
        headline=lead.title,
        dek=dek,
        sections=sections,
        why_it_matters=shorten(why, 400),
        numbers=_numbers(cluster),
        perspectives=_perspectives(cluster, segment, narrative + extra),
        background=background,
        tags=[t for t in top_entities(f"{lead.title} {body}", 4)],
        mode="extractive",
    )


def compose_from_llm(
    cluster: Cluster,
    segment: Segment,
    data: dict[str, Any],
    background: dict | None,
) -> Story:
    """Omówienie napisane przez model, uzupełnione o dane z potoku."""
    sections: list[dict[str, Any]] = []
    paragraphs = [p for p in data.get("co_sie_stalo", []) if p.strip()]
    if paragraphs:
        sections.append({"tytuł": "Co się stało", "rodzaj": "akapity", "treść": paragraphs})
    if data.get("kontekst"):
        section = {"tytuł": "Tło i kontekst", "rodzaj": "akapity", "treść": [data["kontekst"]]}
        if background:
            section["przypis"] = f"Wikipedia: {background['hasło']}"
            section["url"] = background["url"]
        sections.append(section)
    facts = [f for f in data.get("warto_wiedziec", []) if f.strip()]
    if facts:
        sections.append({"tytuł": "Warto wiedzieć", "rodzaj": "punkty", "treść": facts})

    numbers = [
        f"{n['wartosc']} — {n['opis']}"
        for n in data.get("liczby", [])
        if n.get("wartosc") and n.get("opis")
    ] or _numbers(cluster)

    return Story(
        segment=segment,
        cluster=cluster,
        headline=shorten(data.get("naglowek") or cluster.lead.title, 140),
        dek=data.get("lead") or "",
        sections=sections,
        why_it_matters=data.get("dlaczego_to_wazne", ""),
        numbers=numbers,
        perspectives=_perspectives(cluster, segment, paragraphs),
        background=background,
        glossary=[
            {"termin": g["termin"], "wyjaśnienie": g["wyjasnienie"]}
            for g in data.get("pojecia", [])
            if g.get("termin") and g.get("wyjasnienie")
        ],
        tags=[t for t in data.get("tagi", []) if t][:5],
        mode="llm",
    )


def story_to_dict(story: Story) -> dict[str, Any]:
    lead = story.cluster.lead
    full_text = " ".join(
        part
        for section in story.sections
        for part in section["treść"]
    )
    return {
        "dział": {
            "id": story.segment.id,
            "nazwa": story.segment.name,
            "emoji": story.segment.emoji,
            "opis": story.segment.blurb,
        },
        "nagłówek": story.headline,
        "lead": story.dek,
        "język_źródła": lead.lang,
        "opublikowano": lead.published.isoformat() if lead.published else None,
        "źródło": {"nazwa": lead.source, "url": lead.url, "domena": lead.domain},
        "obraz": lead.image,
        "sekcje": story.sections,
        "dlaczego_to_ważne": story.why_it_matters,
        "liczby": story.numbers,
        "inne_spojrzenia": story.perspectives,
        "pojęcia": story.glossary,
        "tło": story.background,
        "tagi": story.tags,
        "wszystkie_źródła": [
            {"nazwa": e.source, "tytuł": e.title, "url": e.url}
            for e in story.cluster.entries
        ],
        "liczba_źródeł": len(story.cluster.sources),
        "czas_czytania_min": reading_time(full_text) if full_text else 1,
        "tryb": story.mode,
        "ranking": {"wynik": story.cluster.score, "składowe": story.cluster.score_parts},
    }
