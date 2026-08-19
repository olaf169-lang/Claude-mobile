"""Katalog źródeł: dziesięć segmentów Przeglądu News.

Każdy dział ma źródła polskie, bo temat bez polskiego artykułu przegrywa
w rankingu z takim, który go ma — przegląd jest do czytania po polsku.

Lista jest wynikiem prawdziwych przebiegów, nie zgadywania: kanały, które
odpowiedziały błędem, zostały wymienione na inne — z domen, które w tym samym
przebiegu działały. Każde wydanie niesie listę kanałów, które zawiodły
(`statystyki.niedziałające_kanały`), więc ubytki widać od razu.

Każdy segment miesza źródła polskie i zagraniczne. Polskie dają tekst po
polsku nawet bez modelu językowego, zagraniczne dają potwierdzenie tematu
z drugiej strony i szerszy kontekst. Martwy kanał nie psuje wydania —
jest tylko odnotowany w statystykach.
"""

from __future__ import annotations

from .model import Feed, Segment

PL = "pl"
EN = "en"


def _f(url: str, source: str, lang: str = PL, weight: float = 1.0, topical: bool = True) -> Feed:
    return Feed(url=url, source=source, lang=lang, weight=weight, topical=topical)


SEGMENTS: tuple[Segment, ...] = (
    Segment(
        id="polska",
        name="Polska",
        emoji="🇵🇱",
        blurb="polityka, gospodarka, handel, sprawy krajowe",
        feeds=(
            _f("https://www.rmf24.pl/fakty/polska/feed", "RMF24", weight=1.15),
            _f("https://www.polsatnews.pl/rss/polska.xml", "Polsat News", weight=1.05),
            _f("https://wiadomosci.onet.pl/.feed", "Onet Wiadomości", weight=1.0, topical=False),
            _f("https://fakty.interia.pl/feed", "Interia Fakty", weight=1.0, topical=False),
            _f("https://wiadomosci.gazeta.pl/pub/rss/wiadomosci.htm", "Gazeta.pl", weight=1.0, topical=False),
            _f("https://www.bankier.pl/rss/wiadomosci.xml", "Bankier.pl", weight=1.1),
            _f("https://businessinsider.com.pl/.feed", "Business Insider Polska", weight=1.05),
            _f("https://www.money.pl/rss/wszystkie.xml", "Money.pl", weight=1.0, topical=False),
            _f("https://notesfrompoland.com/feed/", "Notes from Poland", lang=EN, weight=0.9),
        ),
        boost=(
            "sejm", "senat", "rząd", "premier", "prezydent", "minister", "ustawa",
            "budżet", "nbp", "inflacja", "gus", "wybory", "koalicja", "opozycja",
            "trybunał", "prokuratura", "gospodarka", "eksport", "import", "cła",
            "energetyka", "podatki", "zus", "wzrost", "pkb", "strajk", "protest",
        ),
        block=("horoskop", "przepis na", "konkurs", "quiz", "loteria", "sonda"),
    ),
    Segment(
        id="swiat",
        name="Świat",
        emoji="🌍",
        blurb="polityka międzynarodowa, dyplomacja, handel globalny",
        feeds=(
            _f("https://www.rmf24.pl/fakty/swiat/feed", "RMF24 Świat", weight=1.05),
            _f("https://www.polsatnews.pl/rss/swiat.xml", "Polsat News Świat", weight=1.0),
            _f("https://wiadomosci.onet.pl/swiat.feed", "Onet Świat", weight=1.0),
            _f("https://feeds.bbci.co.uk/news/world/rss.xml", "BBC News", lang=EN, weight=1.35),
            _f("https://www.theguardian.com/world/rss", "The Guardian", lang=EN, weight=1.2),
            _f("https://www.aljazeera.com/xml/rss/all.xml", "Al Jazeera", lang=EN, weight=1.05),
            _f("https://rss.dw.com/rdf/rss-en-world", "Deutsche Welle", lang=EN, weight=1.05),
            _f("https://feeds.npr.org/1004/rss.xml", "NPR", lang=EN, weight=1.0),
            _f("https://www.politico.eu/feed/", "Politico Europe", lang=EN, weight=1.1),
            _f("https://feeds.bbci.co.uk/news/business/rss.xml", "BBC Business", lang=EN, weight=1.15),
        ),
        boost=(
            "ue", "nato", "onz", "sankcje", "cła", "tariff", "trade", "summit",
            "szczyt", "negocjacje", "traktat", "wojna", "war", "ceasefire",
            "rozejm", "wybory", "election", "president", "parlament", "embargo",
            "gospodarka", "recession", "central bank", "porozumienie", "umowa",
        ),
        block=("live blog", "relacja na żywo", "opinion", "obituary", "quiz"),
    ),
    Segment(
        id="sport-pl",
        name="Sport w Polsce",
        emoji="🏅",
        blurb="badminton, tenis, piłka nożna, siatkówka, lekkoatletyka i reszta",
        feeds=(
            _f("https://sportowefakty.wp.pl/rss.xml", "Sportowe Fakty", weight=1.15),
            _f("https://sport.interia.pl/feed", "Interia Sport", weight=1.05),
            _f("https://sport.onet.pl/.feed", "Onet Sport", weight=1.0),
            _f("https://weszlo.com/feed/", "Weszło", weight=0.9),
            _f("https://www.polsatsport.pl/rss/wszystkie.xml", "Polsat Sport", weight=1.0),
        ),
        boost=(
            "polska", "polak", "polka", "polacy", "reprezentacja", "ekstraklasa",
            "świątek", "hurkacz", "lewandowski", "zniolkowska", "badminton",
            "tenis", "siatkówka", "skoki", "lekkoatletyka", "puchar", "mistrzostwa",
            "medal", "złoto", "finał", "półfinał", "rekord", "kadra", "transfer",
        ),
        block=("typy bukmacherskie", "kursy bukmacherskie", "zakłady", "gdzie oglądać", "typer"),
    ),
    Segment(
        id="sport-swiat",
        name="Sport na świecie",
        emoji="🌐",
        blurb="wielkie ligi, turnieje i rekordy poza Polską",
        feeds=(
            _f("https://feeds.bbci.co.uk/sport/rss.xml", "BBC Sport", lang=EN, weight=1.3),
            _f("https://www.theguardian.com/sport/rss", "The Guardian Sport", lang=EN, weight=1.2),
            _f("https://feeds.bbci.co.uk/sport/football/rss.xml", "BBC Football", lang=EN, weight=1.1),
            _f("https://www.skysports.com/rss/12040", "Sky Sports", lang=EN, weight=1.0),
            _f("https://www.theguardian.com/football/rss", "The Guardian Football", lang=EN, weight=1.05),
            _f("https://sportowefakty.wp.pl/rss.xml", "Sportowe Fakty", weight=1.0),
            _f("https://sport.onet.pl/.feed", "Onet Sport", weight=1.0),
            _f("https://sport.interia.pl/feed", "Interia Sport", weight=1.0),
            _f("https://www.polsatsport.pl/rss/wszystkie.xml", "Polsat Sport", weight=0.95),
        ),
        boost=(
            "champions league", "premier league", "la liga", "nba", "nfl", "mlb",
            "formula 1", "grand prix", "wimbledon", "us open", "roland garros",
            "olympic", "igrzyska", "world cup", "mistrzostwa świata", "record",
            "final", "title", "medal", "championship",
        ),
        block=("betting", "odds", "how to watch", "live blog", "typy"),
    ),
    Segment(
        id="technologia",
        name="Technologia i nauka",
        emoji="🧪",
        blurb="AI, inżynieria, medycyna, biologia — co właśnie stało się możliwe",
        feeds=(
            _f("https://naukawpolsce.pl/rss.xml", "Nauka w Polsce", weight=1.2),
            _f("https://kopalniawiedzy.pl/rss.xml", "Kopalnia Wiedzy", weight=1.1),
            _f("https://www.crazynauka.pl/feed/", "Crazy Nauka", weight=0.95),
            _f("https://www.spidersweb.pl/feed", "Spider's Web", weight=1.0),
            _f("https://antyweb.pl/feed", "Antyweb", weight=0.9),
            _f("https://feeds.arstechnica.com/arstechnica/index", "Ars Technica", lang=EN, weight=1.25),
            _f("https://www.theverge.com/rss/index.xml", "The Verge", lang=EN, weight=1.05),
            _f("https://techcrunch.com/feed/", "TechCrunch", lang=EN, weight=1.0),
            _f("https://www.nature.com/nature.rss", "Nature", lang=EN, weight=1.3),
            _f("https://phys.org/rss-feed/technology-news/", "Phys.org Technology", lang=EN, weight=1.1),
            _f("https://www.newscientist.com/feed/home/", "New Scientist", lang=EN, weight=1.05),
            _f("https://www.sciencedaily.com/rss/top/science.xml", "ScienceDaily", lang=EN, weight=1.0),
            _f("https://spectrum.ieee.org/feeds/feed.rss", "IEEE Spectrum", lang=EN, weight=1.05),
        ),
        boost=(
            "badanie", "study", "naukowcy", "researchers", "odkrycie", "discovery",
            "sztuczna inteligencja", "artificial intelligence", "model", "chip",
            "kwantowy", "quantum", "lek", "terapia", "szczepionka", "genom",
            "przełom", "breakthrough", "prototyp", "opublikowano w", "published in",
        ),
        block=("deal", "promocja", "recenzja", "review:", "hands-on", "best of", "coupon"),
    ),
    Segment(
        id="fizyka",
        name="Fizyka",
        emoji="⚛️",
        blurb="cząstki, materia, energia, kwanty — świat na najgłębszym poziomie",
        feeds=(
            _f("https://phys.org/rss-feed/physics-news/", "Phys.org", lang=EN, weight=1.2),
            _f("https://www.sciencedaily.com/rss/matter_energy/physics.xml", "ScienceDaily Physics", lang=EN, weight=1.05),
            _f("https://phys.org/rss-feed/physics-news/quantum-physics/", "Phys.org Quantum", lang=EN, weight=1.2),
            _f("https://www.quantamagazine.org/feed/", "Quanta Magazine", lang=EN, weight=1.25),
            _f("https://www.sciencedaily.com/rss/matter_energy/quantum_physics.xml", "ScienceDaily Quantum", lang=EN, weight=1.05),
            _f("https://naukawpolsce.pl/rss.xml", "Nauka w Polsce", weight=1.15),
            _f("https://kopalniawiedzy.pl/rss.xml", "Kopalnia Wiedzy", weight=1.1),
        ),
        boost=(
            "kwant", "quantum", "cząstk", "particle", "neutrino", "boson", "kwark",
            "quark", "laser", "nadprzewodni", "superconduct", "entangle", "splątan",
            "termojądrow", "fusion", "plazma", "grawitacj", "gravitational",
            "lhc", "collider", "spin", "symetria", "relativity", "względności",
        ),
        block=("horoscope", "astrology", "opinion"),
    ),
    Segment(
        id="astronomia",
        name="Astronomia",
        emoji="🔭",
        blurb="kosmos, misje, teleskopy i to, co widać nad głową",
        feeds=(
            _f("https://www.urania.edu.pl/rss.xml", "Urania", weight=1.15),
            _f("https://kosmonauta.net/feed/", "Kosmonauta.net", weight=1.0),
            _f("https://astronet.pl/feed/", "AstroNET", weight=0.95),
            _f("https://kopalniawiedzy.pl/rss.xml", "Kopalnia Wiedzy", weight=1.05),
            _f("https://www.pulskosmosu.pl/feed/", "Puls Kosmosu", weight=0.9),
            _f("https://phys.org/rss-feed/space-news/astronomy/", "Phys.org Astronomy", lang=EN, weight=1.2),
            _f("https://www.nasa.gov/feed/", "NASA", lang=EN, weight=1.3),
            _f("https://www.esa.int/rssfeed/Our_Activities/Space_Science", "ESA", lang=EN, weight=1.2),
            _f("https://skyandtelescope.org/feed/", "Sky & Telescope", lang=EN, weight=1.1),
            _f("https://www.universetoday.com/feed/", "Universe Today", lang=EN, weight=1.0),
            _f("https://earthsky.org/feed/", "EarthSky", lang=EN, weight=0.95),
            _f("https://www.space.com/feeds/all", "Space.com", lang=EN, weight=1.0),
        ),
        boost=(
            "teleskop", "telescope", "galaktyk", "galaxy", "gwiazd", "star",
            "planeta", "planet", "egzoplanet", "exoplanet", "czarna dziura",
            "black hole", "kometa", "comet", "asteroid", "księżyc", "moon",
            "mars", "jowisz", "saturn", "sonda", "probe", "rakiet", "launch",
            "webb", "hubble", "supernowa", "supernova", "zaćmienie", "eclipse",
        ),
        block=("horoskop", "horoscope", "astrology", "ufo sighting"),
    ),
    Segment(
        id="geografia",
        name="Geografia",
        emoji="🗺️",
        blurb="Ziemia, klimat, oceany, wulkany, mapy i granice",
        feeds=(
            _f("https://earthobservatory.nasa.gov/feeds/earth-observatory.rss", "NASA Earth Observatory", lang=EN, weight=1.25),
            _f("https://eos.org/feed", "Eos (AGU)", lang=EN, weight=1.2),
            _f("https://news.mongabay.com/feed/", "Mongabay", lang=EN, weight=1.05),
            _f("https://phys.org/rss-feed/earth-news/", "Phys.org Earth", lang=EN, weight=1.15),
            _f("https://www.sciencedaily.com/rss/earth_climate.xml", "ScienceDaily Earth", lang=EN, weight=1.0),
            _f("https://www.theguardian.com/environment/rss", "The Guardian Environment", lang=EN, weight=1.05),
            _f("https://geoforum.pl/rss", "Geoforum", weight=1.0),
            _f("https://naukawpolsce.pl/rss.xml", "Nauka w Polsce", weight=1.1),
            _f("https://kopalniawiedzy.pl/rss.xml", "Kopalnia Wiedzy", weight=1.05),
        ),
        boost=(
            "wulkan", "volcano", "trzęsienie ziemi", "earthquake", "lodowiec",
            "glacier", "ocean", "rzeka", "river", "pustyni", "desert", "klimat",
            "climate", "mapa", "map", "granic", "border", "tektonik", "tectonic",
            "erozja", "erosion", "monsun", "prąd morski", "arktyk", "arctic",
            "antarktyd", "antarctic", "wyspa", "island", "delta", "jezioro",
        ),
        block=("opinion", "editorial", "quiz"),
    ),
    Segment(
        id="literatura",
        name="Literatura",
        emoji="📚",
        blurb="książki, nagrody, pisarze, rynek wydawniczy",
        feeds=(
            _f("https://booklips.pl/feed/", "Booklips", weight=1.1),
            _f("https://www.granice.pl/rss", "Granice.pl", weight=1.0),
            _f("https://xiegarnia.pl/feed/", "Xiegarnia", weight=1.0),
            _f("https://kultura.onet.pl/.feed", "Onet Kultura", weight=0.95),
            _f("https://www.theguardian.com/books/rss", "The Guardian Books", lang=EN, weight=1.25),
            _f("https://lithub.com/feed/", "Literary Hub", lang=EN, weight=1.1),
            _f("https://www.publishersweekly.com/pw/feeds/recent/index.xml", "Publishers Weekly", lang=EN, weight=1.0),
            _f("https://www.theguardian.com/books/booksblog/rss", "Guardian Books Blog", lang=EN, weight=1.0),
        ),
        boost=(
            "nagroda", "prize", "award", "nobel", "booker", "pulitzer", "nike",
            "powieść", "novel", "poeta", "poet", "poezja", "poetry", "wydawnictwo",
            "publisher", "debiut", "debut", "przekład", "translation", "księgarni",
            "bestseller", "biblioteka", "library", "manuskrypt", "manuscript",
        ),
        block=("gift guide", "10 książek na", "promocja", "deal"),
    ),
    Segment(
        id="popkultura",
        name="Popkultura",
        emoji="🎬",
        blurb="film, seriale, muzyka, gry i to, o czym mówi internet",
        feeds=(
            _f("https://www.filmweb.pl/rss/news", "Filmweb", weight=1.1),
            _f("https://kultura.onet.pl/.feed", "Onet Kultura", weight=1.0),
            _f("https://film.interia.pl/feed", "Interia Film", weight=0.95),
            _f("https://muzyka.interia.pl/feed", "Interia Muzyka", weight=0.9),
            _f("https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "BBC Kultura", lang=EN, weight=1.2),
            _f("https://www.theguardian.com/film/rss", "The Guardian Film", lang=EN, weight=1.15),
            _f("https://www.theguardian.com/music/rss", "The Guardian Music", lang=EN, weight=1.05),
            _f("https://pitchfork.com/feed/feed-news/rss", "Pitchfork", lang=EN, weight=1.05),
            _f("https://www.theguardian.com/culture/rss", "The Guardian Culture", lang=EN, weight=1.05),
        ),
        boost=(
            "premiera", "premiere", "oscar", "grammy", "emmy", "cannes", "berlinale",
            "box office", "netflix", "hbo", "disney", "album", "trasa", "tour",
            "reżyser", "director", "serial", "series", "season", "sequel", "gra",
            "studio", "rekord", "record", "zapowiedź", "trailer", "obsada", "cast",
        ),
        block=("gdzie obejrzeć", "ranking", "quiz", "gift guide", "deal", "horoskop"),
    ),
)

SEGMENTS_BY_ID = {s.id: s for s in SEGMENTS}


def all_feeds() -> list[tuple[str, Feed]]:
    """Unikalne pary (segment_id, feed) — jeden kanał może służyć kilku działom."""
    out: list[tuple[str, Feed]] = []
    for seg in SEGMENTS:
        for feed in seg.feeds:
            out.append((seg.id, feed))
    return out


def unique_feed_urls() -> list[str]:
    seen: list[str] = []
    for _, feed in all_feeds():
        if feed.url not in seen:
            seen.append(feed.url)
    return seen
