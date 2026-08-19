"""Wspólne narzędzia testów — wszystko offline, żadnego ruchu sieciowego."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from collector.collect import day_window, entries_for_segment, parse_feed
from collector.model import Entry, Feed
from collector.sources import SEGMENTS_BY_ID

FIXTURES = Path(__file__).parent / "fixtures"
DZIEN = "2026-08-18"


@pytest.fixture(scope="session")
def manifest() -> dict:
    return json.loads((FIXTURES / "manifest.json").read_text("utf-8"))


@pytest.fixture(scope="session")
def fetched(manifest) -> dict[str, list[Entry]]:
    out: dict[str, list[Entry]] = {}
    for url, spec in manifest.items():
        feed = Feed(url=url, source=spec["źródło"], lang=spec["język"])
        out[url] = parse_feed((FIXTURES / spec["plik"]).read_bytes(), feed)
    return out


@pytest.fixture(scope="session")
def okno():
    return day_window(DZIEN)


@pytest.fixture
def wpisy(fetched, okno):
    def dla(segment_id: str) -> list[Entry]:
        return entries_for_segment(SEGMENTS_BY_ID[segment_id], fetched, okno)
    return dla
