"""Kontrola źródeł: które kanały żyją, a które trzeba wymienić.

    python -m collector.doctor              # wszystkie kanały
    python -m collector.doctor --only fizyka
    python -m collector.doctor --tylko-bledy

Serwisy zmieniają adresy kanałów bez uprzedzenia. To narzędzie mówi, co
naprawić, zanim zauważysz dziurę w porannym wydaniu.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from .collect import parse_feed
from .model import Feed
from .net import get, make_session
from .sources import SEGMENTS


def sprawdz(session, feed: Feed) -> dict:
    response = get(session, feed.url, timeout=20, retries=1)
    if not response.ok:
        return {"feed": feed, "ok": False, "info": response.error, "wpisy": 0, "wiek": None}

    entries = parse_feed(response.content, feed)
    if not entries:
        return {"feed": feed, "ok": False, "info": "brak wpisów / nie RSS", "wpisy": 0, "wiek": None}

    daty = [e.published for e in entries if e.published]
    wiek = None
    if daty:
        wiek = (datetime.now(timezone.utc) - max(daty)).total_seconds() / 3600
    return {"feed": feed, "ok": True, "info": "", "wpisy": len(entries), "wiek": wiek}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="collector.doctor", description="Sprawdź kondycję kanałów RSS.")
    parser.add_argument("--only", help="ogranicz do działów po przecinku")
    parser.add_argument("--tylko-bledy", action="store_true", help="pokaż wyłącznie problemy")
    args = parser.parse_args(argv)

    wanted = {s.strip() for s in args.only.split(",")} if args.only else None
    zadania: list[tuple[str, Feed]] = []
    widziane: set[str] = set()
    for segment in SEGMENTS:
        if wanted and segment.id not in wanted:
            continue
        for feed in segment.feeds:
            if feed.url in widziane:
                continue
            widziane.add(feed.url)
            zadania.append((segment.id, feed))

    session = make_session()
    with ThreadPoolExecutor(max_workers=12) as pool:
        wyniki = list(pool.map(lambda z: (z[0], sprawdz(session, z[1])), zadania))

    zle = [w for _, w in wyniki if not w["ok"]]
    stare = [w for _, w in wyniki if w["ok"] and w["wiek"] is not None and w["wiek"] > 72]

    biezacy = None
    for segment_id, wynik in wyniki:
        if args.tylko_bledy and wynik["ok"] and wynik not in stare:
            continue
        if segment_id != biezacy:
            print(f"\n[{segment_id}]")
            biezacy = segment_id
        feed = wynik["feed"]
        if not wynik["ok"]:
            znak, opis = "✗", wynik["info"]
        elif wynik["wiek"] is not None and wynik["wiek"] > 72:
            znak, opis = "!", f"{wynik['wpisy']} wpisów, najnowszy sprzed {wynik['wiek']:.0f} h"
        elif wynik["wiek"] is None:
            znak, opis = "?", f"{wynik['wpisy']} wpisów, brak dat publikacji"
        else:
            znak, opis = "✓", f"{wynik['wpisy']} wpisów, najnowszy sprzed {wynik['wiek']:.0f} h"
        print(f"  {znak} {feed.source:<26} {opis}")
        if not wynik["ok"]:
            print(f"      {feed.url}")

    print(
        f"\nRazem {len(wyniki)} kanałów: {len(wyniki) - len(zle)} działa, "
        f"{len(zle)} nie odpowiada, {len(stare)} bez świeżych wpisów."
    )
    return 1 if zle else 0


if __name__ == "__main__":
    raise SystemExit(main())
