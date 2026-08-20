"""Rezerwowe kanały RSS — zaplecze comiesięcznego audytu źródeł.

Gdy kanał z katalogu przestaje odpowiadać, audyt sięga tutaj po zamiennik
z tego samego działu, sprawdza go na żywo i dopiero wtedy wprowadza do
`sources.py`. Dzięki temu dziura po martwym źródle zasklepia się sama,
a decyzja opiera się na tym, że kandydat naprawdę działa — nie na nadziei.

Kandydaci są celowo z innych wydawców niż kanały już obecne w dziale:
zamiana jednego feedu Guardiana na drugi nie zwiększa niezależności źródeł.
"""

from __future__ import annotations

#: dział -> lista (adres, nazwa, język, waga)
REZERWA: dict[str, tuple[tuple[str, str, str, float], ...]] = {
    "polska": (
        ("https://www.rp.pl/rss/1019", "Rzeczpospolita", "pl", 1.1),
        ("https://wyborcza.pl/pub/rss/wyborcza.xml", "Wyborcza", "pl", 1.05),
        ("https://www.wnp.pl/rss/serwis_rss.xml", "WNP", "pl", 0.95),
        ("https://www.tokfm.pl/pub/rss/tokfm_najnowsze.htm", "TOK FM", "pl", 1.0),
    ),
    "swiat": (
        ("https://feeds.bbci.co.uk/news/world/europe/rss.xml", "BBC Europe", "en", 1.15),
        ("https://www.euronews.com/rss?level=theme&name=news", "Euronews", "en", 1.0),
        ("https://apnews.com/index.rss", "Associated Press", "en", 1.2),
        ("https://www.spiegel.de/international/index.rss", "Der Spiegel International", "en", 1.05),
    ),
    "sport-pl": (
        ("https://www.meczyki.pl/rss", "Meczyki", "pl", 0.95),
        ("https://sportowefakty.wp.pl/rss/pilka-nozna.xml", "Sportowe Fakty Piłka", "pl", 0.9),
        ("https://www.tvpsport.pl/rss", "TVP Sport", "pl", 1.0),
    ),
    "sport-swiat": (
        ("https://feeds.bbci.co.uk/sport/tennis/rss.xml", "BBC Tennis", "en", 1.05),
        ("https://www.theguardian.com/sport/formulaone/rss", "Guardian F1", "en", 1.0),
        ("https://www.skysports.com/rss/11095", "Sky Sports Football", "en", 1.0),
    ),
    "technologia": (
        ("https://www.wired.com/feed/rss", "WIRED", "en", 1.1),
        ("https://spectrum.ieee.org/rss/fulltext", "IEEE Spectrum", "en", 1.05),
        ("https://www.newscientist.com/subject/technology/feed/", "New Scientist Tech", "en", 1.0),
        ("https://bezprawnik.pl/feed/", "Bezprawnik", "pl", 0.85),
    ),
    "fizyka": (
        ("https://physicsworld.com/feed/", "Physics World", "en", 1.2),
        ("https://www.sciencedaily.com/rss/matter_energy.xml", "ScienceDaily Matter", "en", 1.0),
        ("https://www.livescience.com/feeds/all", "Live Science", "en", 0.95),
    ),
    "astronomia": (
        ("https://www.astronomy.com/feed/", "Astronomy Magazine", "en", 1.05),
        ("https://skyandtelescope.org/astronomy-news/feed/", "Sky & Telescope News", "en", 1.05),
        ("https://blogs.nasa.gov/feed/", "NASA Blogs", "en", 1.0),
    ),
    "geografia": (
        ("https://www.usgs.gov/news/feed", "USGS", "en", 1.05),
        ("https://phys.org/rss-feed/earth-news/earth-sciences/", "Phys.org Earth Sciences", "en", 1.05),
        ("https://www.carbonbrief.org/feed/", "Carbon Brief", "en", 1.0),
    ),
    "popkultura": (
        ("https://www.avclub.com/rss", "The A.V. Club", "en", 1.0),
        ("https://consequence.net/feed/", "Consequence", "en", 0.95),
        ("https://www.polygon.com/rss/index.xml", "Polygon", "en", 0.95),
        ("https://natemat.pl/rss/all.xml", "naTemat", "pl", 0.85),
    ),
}


def dla_dzialu(segment_id: str, pomijane: set[str]) -> list[tuple[str, str, str, float]]:
    """Kandydaci dla działu, z pominięciem adresów już obecnych w katalogu."""
    return [k for k in REZERWA.get(segment_id, ()) if k[0] not in pomijane]
