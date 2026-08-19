"""Budowanie wydania Przeglądu News.

    python -m collector.build                    # wydanie na dziś z newsów z wczoraj
    python -m collector.build --date 2026-08-19  # konkretne wydanie
    python -m collector.build --fixtures tests/fixtures/manifest.json  # bez sieci
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from . import llm
from .collect import FeedReport, day_window, entries_for_segment, fetch_all, parse_feed
from .compose import compose_extractive, compose_from_llm, materials, story_to_dict
from .extract import extract
from .model import Cluster, Entry, Segment
from .net import get, make_session
from .rank import MIN_FULLTEXT, pick
from .sources import SEGMENTS
from .translate import Translator, make_translator, translate_item
from .textutil import token_set, overlap
from .wiki import background as wiki_background
from .wiki import candidates_for as wiki_candidates

log = logging.getLogger("przeglad.build")

VERSION = "1.0.0"
DEFAULT_TZ = "Europe/Warsaw"
DEFAULT_OUT = Path("web/data")
#: Ile artykułów z klastra dociągamy w całości.
FULLTEXT_LIMIT = 4
#: Powyżej tego podobieństwa uznajemy, że dwa działy mówią o tym samym.
CROSS_SEGMENT_DUP = 0.6


# --------------------------------------------------------------------------- #
# Pobieranie treści
# --------------------------------------------------------------------------- #

def load_fixtures(manifest_path: Path) -> dict[str, list[Entry]]:
    """Tryb offline: kanały czytane z plików, zero ruchu sieciowego."""
    manifest = json.loads(manifest_path.read_text("utf-8"))
    base = manifest_path.parent
    fetched: dict[str, list[Entry]] = {}
    from .model import Feed

    for url, spec in manifest.items():
        path = base / spec["plik"]
        feed = Feed(url=url, source=spec.get("źródło", "Fixture"), lang=spec.get("język", "pl"))
        fetched[url] = parse_feed(path.read_bytes(), feed)
    return fetched


def hydrate(cluster: Cluster, session, *, limit: int = FULLTEXT_LIMIT) -> None:
    """Dociąga pełne teksty artykułów wybranego tematu (równolegle)."""
    targets: list[Entry] = []
    seen_sources: set[str] = set()
    for entry in cluster.entries:
        if entry.source in seen_sources:
            continue
        seen_sources.add(entry.source)
        targets.append(entry)
        if len(targets) >= limit:
            break

    def work(entry: Entry) -> None:
        response = get(session, entry.url, timeout=18, retries=1)
        if not response.ok:
            return
        article = extract(response.text, base_url=entry.url)
        if article:
            entry.fulltext = article.text
            entry.image = entry.image or article.image

    with ThreadPoolExecutor(max_workers=min(4, len(targets) or 1)) as pool:
        list(pool.map(work, targets))


# --------------------------------------------------------------------------- #
# Wydanie
# --------------------------------------------------------------------------- #

def _too_similar(cluster: Cluster, taken: list[set[str]]) -> bool:
    signature = token_set(" ".join(e.title for e in cluster.entries[:3]))
    return any(overlap(signature, other) >= CROSS_SEGMENT_DUP for other in taken)


def build_segment(
    segment: Segment,
    fetched: dict[str, list[Entry]],
    window: tuple[datetime, datetime],
    session,
    *,
    covers: str,
    use_llm: bool,
    used_urls: set[str],
    taken_signatures: list[set[str]],
    translator: Translator | None = None,
) -> dict[str, Any] | None:
    entries = entries_for_segment(segment, fetched, window)
    if not entries:
        log.warning("dział %s: brak materiałów w oknie czasowym", segment.id)
        return None

    cluster = None
    excluded = frozenset(used_urls)
    for _ in range(3):  # przy kolizji między działami bierzemy kolejny temat
        candidate = pick(entries, segment, window[1], exclude_urls=excluded)
        if candidate is None:
            break
        if not _too_similar(candidate, taken_signatures):
            cluster = candidate
            break
        excluded = excluded | {e.url for e in candidate.entries}
    if cluster is None:
        log.warning("dział %s: nie udało się wybrać tematu", segment.id)
        return None

    if session is not None:
        hydrate(cluster, session)

    background = None
    if session is not None:
        lead_text = cluster.lead.fulltext or cluster.lead.summary
        background = wiki_background(
            session,
            wiki_candidates(
                cluster.lead.title, lead_text,
                source=cluster.lead.source, domain=cluster.lead.domain,
            ),
        )

    story = None
    if use_llm:
        payload = materials(cluster)
        if background:
            payload[0]["background"] = background
        data = llm.synthesize(segment.name, segment.blurb, covers, payload)
        if data:
            story = compose_from_llm(cluster, segment, data, background)
    if story is None:
        story = compose_extractive(cluster, segment, background)

    used_urls.update(e.url for e in cluster.entries)
    taken_signatures.append(token_set(" ".join(e.title for e in cluster.entries[:3])))

    item = story_to_dict(story)
    # Temat obcojęzyczny przechodzi przez tłumacza; nieudane tłumaczenie
    # zostawia kartę w oryginale z etykietą „po angielsku".
    if translator is not None and story.mode != "llm" and cluster.lead.lang != "pl":
        if translate_item(item, translator, source=cluster.lead.lang):
            log.info("dział %-12s -> przetłumaczono z %s", segment.id, cluster.lead.lang)

    log.info(
        "dział %-12s -> %s (%d wyd., %s)",
        segment.id, item["nagłówek"][:60], len(cluster.publishers), story.mode,
    )
    return item


def build_edition(
    *,
    edition_date: str,
    covers_date: str,
    tz: str = DEFAULT_TZ,
    fixtures: Path | None = None,
    use_llm: bool | None = None,
    segments: tuple[Segment, ...] = SEGMENTS,
) -> dict[str, Any]:
    if use_llm is None:
        use_llm = llm.available()

    if fixtures is not None:
        fetched = load_fixtures(fixtures)
        report = FeedReport(ok=list(fetched))
        session = None
    else:
        feeds = []
        seen = set()
        for segment in segments:
            for feed in segment.feeds:
                if feed.url not in seen:
                    seen.add(feed.url)
                    feeds.append(feed)
        fetched, report = fetch_all(feeds)
        session = make_session()

    # Bez modelu językowego obcojęzyczne tematy tłumaczy MyMemory.
    translator = None if (session is None or use_llm) else make_translator(session)

    window = day_window(covers_date, tz)
    used_urls: set[str] = set()
    taken_signatures: list[set[str]] = []
    items: list[dict[str, Any]] = []
    missing: list[str] = []

    for segment in segments:
        item = build_segment(
            segment, fetched, window, session,
            covers=covers_date, use_llm=use_llm,
            used_urls=used_urls, taken_signatures=taken_signatures,
            translator=translator,
        )
        if item is None:
            missing.append(segment.id)
            continue
        items.append(item)

    return {
        "wersja": VERSION,
        "wydanie": edition_date,
        "dotyczy_dnia": covers_date,
        "wygenerowano": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "strefa": tz,
        "tryb": "llm" if use_llm else "ekstrakcyjny",
        "demo": fixtures is not None,
        "pozycje": items,
        "braki": missing,
        "statystyki": {
            **report.summary,
            "znaki_tłumaczone": translator.used if translator else 0,
            # Lista wprost w wydaniu: inaczej martwy kanał cicho ubywa z puli.
            "niedziałające_kanały": [
                {"url": url, "powód": powod} for url, powod in sorted(report.failed.items())
            ],
            "działy": len(items),
            "artykuły_w_oknie": sum(len(i["wszystkie_źródła"]) for i in items),
        },
    }


# --------------------------------------------------------------------------- #
# Zapis
# --------------------------------------------------------------------------- #

def write_edition(edition: dict[str, Any], out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    def dump(path: Path, payload: Any) -> None:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", "utf-8")
        written.append(path)

    dump(out_dir / f"{edition['wydanie']}.json", edition)
    dump(out_dir / "latest.json", edition)

    index_path = out_dir / "index.json"
    known: list[dict[str, Any]] = []
    if index_path.exists():
        try:
            known = json.loads(index_path.read_text("utf-8")).get("wydania", [])
        except ValueError:
            known = []
    known = [e for e in known if e.get("wydanie") != edition["wydanie"]]
    known.append(
        {
            "wydanie": edition["wydanie"],
            "dotyczy_dnia": edition["dotyczy_dnia"],
            "działy": len(edition["pozycje"]),
            "nagłówki": [i["nagłówek"] for i in edition["pozycje"]],
        }
    )
    known.sort(key=lambda e: e["wydanie"], reverse=True)
    dump(index_path, {"aktualizacja": edition["wygenerowano"], "wydania": known[:365]})
    return written


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="collector.build", description="Zbierz jedno wydanie Przeglądu News."
    )
    parser.add_argument("--date", help="data wydania RRRR-MM-DD (domyślnie: dziś)")
    parser.add_argument("--covers", help="dzień, z którego brać newsy (domyślnie: dzień wcześniej)")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"katalog wyjściowy (domyślnie {DEFAULT_OUT})")
    parser.add_argument("--tz", default=DEFAULT_TZ, help=f"strefa czasowa (domyślnie {DEFAULT_TZ})")
    parser.add_argument("--fixtures", type=Path, help="manifest kanałów offline zamiast sieci")
    parser.add_argument("--no-llm", action="store_true", help="wymuś tryb ekstrakcyjny")
    parser.add_argument("--only", help="ogranicz do działów po przecinku, np. polska,fizyka")
    parser.add_argument("--stdout", action="store_true", help="wypisz JSON zamiast zapisywać pliki")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )

    today = datetime.now(ZoneInfo(args.tz)).date()
    edition_date = args.date or today.isoformat()
    covers_date = args.covers or (date.fromisoformat(edition_date) - timedelta(days=1)).isoformat()

    segments = SEGMENTS
    if args.only:
        wanted = {s.strip() for s in args.only.split(",") if s.strip()}
        segments = tuple(s for s in SEGMENTS if s.id in wanted)
        if not segments:
            parser.error(f"nieznane działy: {', '.join(sorted(wanted))}")

    log.info("Przegląd News %s — wydanie %s z newsów z %s", VERSION, edition_date, covers_date)
    edition = build_edition(
        edition_date=edition_date,
        covers_date=covers_date,
        tz=args.tz,
        fixtures=args.fixtures,
        use_llm=False if args.no_llm else None,
        segments=segments,
    )

    if args.stdout:
        json.dump(edition, sys.stdout, ensure_ascii=False, indent=1)
        print()
    else:
        for path in write_edition(edition, args.out):
            log.info("zapisano %s", path)

    stats = edition["statystyki"]
    log.info(
        "gotowe: %d/%d działów, kanały %d ok / %d błędne, tryb %s",
        stats["działy"], len(segments), stats.get("kanały_ok", 0),
        stats.get("kanały_błędne", 0), edition["tryb"],
    )
    if edition["braki"]:
        log.warning("brak materiału w działach: %s", ", ".join(edition["braki"]))
    return 0 if edition["pozycje"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
