"""Pobieranie kanałów i zamiana ich na znormalizowane wpisy."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, time as dtime, timedelta, timezone
from zoneinfo import ZoneInfo

import feedparser

from .model import Entry, Feed, Segment
from .net import Response, get, make_session
from .textutil import clean, normalize, shorten

log = logging.getLogger("przeglad.collect")

#: Wpisy bez daty publikacji wpuszczamy z ostrożnym marginesem.
GRACE_HOURS = 6


@dataclass
class FeedReport:
    ok: list[str] = field(default_factory=list)
    failed: dict[str, str] = field(default_factory=dict)

    @property
    def summary(self) -> dict[str, int]:
        return {"kanały_ok": len(self.ok), "kanały_błędne": len(self.failed)}


def day_window(day: str, tz: str = "Europe/Warsaw", grace_hours: int = GRACE_HOURS) -> tuple[datetime, datetime]:
    """Zakres UTC obejmujący cały dzień `day` (RRRR-MM-DD) w strefie `tz`.

    Margines z przodu i z tyłu łapie materiały opublikowane tuż przed północą
    oraz poranne aktualizacje wieczornych newsów.
    """
    zone = ZoneInfo(tz)
    d = datetime.strptime(day, "%Y-%m-%d").date()
    start = datetime.combine(d, dtime.min, tzinfo=zone) - timedelta(hours=grace_hours)
    end = datetime.combine(d, dtime.max, tzinfo=zone) + timedelta(hours=grace_hours)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc)


def _published(raw) -> datetime | None:
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        value = raw.get(key)
        if value:
            try:
                return datetime(*value[:6], tzinfo=timezone.utc)
            except (TypeError, ValueError):
                continue
    return None


def _image(raw) -> str | None:
    for media in raw.get("media_content", []) or []:
        if media.get("url"):
            return media["url"]
    for media in raw.get("media_thumbnail", []) or []:
        if media.get("url"):
            return media["url"]
    for link in raw.get("links", []) or []:
        if link.get("rel") == "enclosure" and str(link.get("type", "")).startswith("image"):
            return link.get("href")
    return None


def parse_feed(payload: bytes, feed: Feed) -> list[Entry]:
    """Bajty kanału -> wpisy. Uszkodzony XML daje pustą listę, nie wyjątek."""
    try:
        parsed = feedparser.parse(payload)
    except Exception as exc:  # feedparser bywa nieprzewidywalny przy śmieciach
        log.debug("nie udało się sparsować %s: %s", feed.url, exc)
        return []

    entries: list[Entry] = []
    for position, raw in enumerate(parsed.entries or []):
        title = clean(raw.get("title"))
        url = (raw.get("link") or "").strip()
        if not title or not url.startswith("http"):
            continue
        summary = clean(raw.get("summary") or raw.get("description") or "")
        if not summary and raw.get("content"):
            summary = clean(raw["content"][0].get("value", ""))
        entries.append(
            Entry(
                title=title,
                url=url.split("?utm_")[0],
                source=feed.source,
                lang=feed.lang,
                weight=feed.weight,
                published=_published(raw),
                summary=shorten(summary, 700),
                image=_image(raw),
                feed_position=position,
            )
        )
    return entries


def fetch_all(feeds: list[Feed], *, workers: int = 12) -> tuple[dict[str, list[Entry]], FeedReport]:
    """Pobiera każdy unikalny URL raz i zwraca wpisy per URL kanału."""
    session = make_session()
    by_url: dict[str, Feed] = {}
    for feed in feeds:
        by_url.setdefault(feed.url, feed)

    report = FeedReport()
    results: dict[str, list[Entry]] = {}

    def work(item: tuple[str, Feed]) -> tuple[str, Feed, Response]:
        url, feed = item
        return url, feed, get(session, url)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for url, feed, response in pool.map(work, by_url.items()):
            if not response.ok:
                report.failed[url] = response.error
                continue
            entries = parse_feed(response.content, feed)
            if not entries:
                report.failed[url] = "brak wpisów / nieznany format"
                continue
            report.ok.append(url)
            results[url] = entries

    log.info("kanały: %d ok, %d błędnych", len(report.ok), len(report.failed))
    return results, report


def matches_segment(entry: Entry, segment: Segment, *, require_boost: bool) -> bool:
    """Filtr słownikowy: blokady zawsze, słowa kluczowe tylko dla kanałów ogólnych."""
    haystack = normalize(f"{entry.title} {entry.summary}")
    for word in segment.block:
        if normalize(word) in haystack:
            return False
    if not require_boost or not segment.boost:
        return True
    return any(normalize(word) in haystack for word in segment.boost)


def entries_for_segment(
    segment: Segment,
    fetched: dict[str, list[Entry]],
    window: tuple[datetime, datetime],
) -> list[Entry]:
    """Wpisy kanałów segmentu, przefiltrowane po dacie i słowach kluczowych."""
    start, end = window
    out: list[Entry] = []
    seen_urls: set[str] = set()

    for feed in segment.feeds:
        for base in fetched.get(feed.url, []):
            if base.url in seen_urls:
                continue
            if base.published is not None and not (start <= base.published <= end):
                continue
            entry = Entry(
                title=base.title,
                url=base.url,
                source=feed.source,
                lang=feed.lang,
                weight=feed.weight,
                published=base.published,
                summary=base.summary,
                image=base.image,
                feed_position=base.feed_position,
                segment_id=segment.id,
            )
            if not matches_segment(entry, segment, require_boost=not feed.topical):
                continue
            seen_urls.add(entry.url)
            out.append(entry)
    return out
