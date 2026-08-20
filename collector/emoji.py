"""Emotki opisujące tematykę karty.

Zamiast rzędu wyrwanych z tekstu liczb pod tytułem — jeden rzut oka mówiący,
o czym jest tekst: ⚽ 🏆 albo 🚀 🔭. Dobór jest słownikowy i celowo prosty:
lepszy pusty rząd niż emotka nie na temat.
"""

from __future__ import annotations

import re

from .textutil import normalize

#: Kolejność ma znaczenie — pierwsze dopasowania trafiają na kartę.
#: Każdy wpis: (emotka, przedrostki-wyzwalacze). Dopasowanie jest od początku
#: wyrazu, więc „kwant" złapie „kwantowy", ale „gra" nie złapie „wygrała".
REGULY: tuple[tuple[str, tuple[str, ...]], ...] = (
    # Najpierw dziedziny wąskie: one najwięcej mówią o temacie. Pieniądze
    # i polityka na końcu, bo pasują niemal wszędzie.

    # --- sport ---
    ("⚽", ("pilka nozna", "ekstraklasa", "premier league", "champions league", "bundesliga",
            "la liga", "serie a", "futbol", "bramk", "pilkar", "football", "fifa", "uefa",
            "gol$", "gola$", "gole$", "golem$", "hat-trick", "asysta", "napastnik")),
    ("🎾", ("tenis", "wimbledon", "roland garros", "us open", "atp", "wta", "tie-break")),
    ("🏐", ("siatkow", "volleyball", "siatkarz")),
    ("🏀", ("koszykow", "basketball", "nba", "lakers", "euroliga")),
    ("🏸", ("badminton", "lotka")),
    ("🥊", ("boks", "boxing", "mma", "ufc")),
    ("🏎️", ("formula 1", "formuly 1", "grand prix", "wyscig", "rajd")),
    ("🎿", ("skoki narciar", "narciar", "biathlon", "snowboard")),
    ("🏊", ("plywac", "plywak", "swimming", "basen")),
    ("🚴", ("kolarstw", "tour de france", "giro", "vuelta", "peleton")),
    ("🏅", ("igrzyska", "olimpij", "olympic", "mistrzostw", "medal", "puchar swiata")),

    # --- nauka i technika ---
    ("⚛️", ("kwant", "quantum", "czastk", "particle", "neutrino", "boson", "kwark")),
    ("🔭", ("teleskop", "telescope", "obserwatorium", "webb", "hubble")),
    ("🚀", ("rakiet", "launch", "misja kosmiczna", "sonda kosmiczna", "starship", "spacex")),
    ("🪐", ("planet", "mars", "jowisz", "saturn", "wenus", "egzoplanet", "uklad sloneczny")),
    ("🌌", ("galaktyk", "galaxy", "droga mleczna", "mglawic", "nebula", "czarna dziura", "supernow")),
    ("☄️", ("asteroid", "kometa", "meteor", "planetoid")),
    ("🧬", ("genom", "genetyk", "dna$", "pangenom", "sekwencjon", "komork")),
    ("💊", ("leku", "leki", "terapia", "szczepion", "pacjent", "badanie kliniczne", "nowotwor")),
    ("🤖", ("sztuczna inteligencja", "artificial intelligence", "model jezykowy",
            "chatgpt", "openai", "algorytm", "robot", "sieci neuronow")),
    ("💻", ("procesor", "chip", "komputer", "oprogramowanie", "software", "smartfon", "aplikacj")),
    ("🔋", ("bateri", "akumulator", "ogniwo", "magazyn energii")),
    ("🔬", ("naukowc", "researchers", "eksperyment", "laboratori", "odkrycie", "badacz")),

    # --- Ziemia i klimat ---
    ("🌋", ("wulkan", "volcano", "erupcj", "lawa")),
    ("🌊", ("ocean", "morz", "powodz", "tsunami", "jezior", "rzeka", "poziom wody")),
    ("🧊", ("lodowiec", "lodowc", "arktyk", "antarktyd", "glacier", "permafrost")),
    ("🌡️", ("klimat", "ocieplenie", "emisj", "susza", "upal", "co2")),
    ("🌳", ("las$", "lasy", "puszcz", "drzew", "torfowisk", "bagn", "bioroznorodn")),
    ("🗺️", ("mapa", "granic", "terytorium", "kartograf")),

    # --- kultura ---
    ("🎬", ("film", "kino$", "kinie", "kinach", "kinow", "serial", "rezyser", "oscar",
            "netflix", "box office", "animacj")),
    ("🎵", ("muzyk", "album", "piosenk", "koncert", "grammy")),
    ("🎮", ("gracz", "gier", "konsol", "playstation", "xbox", "gaming")),
    ("📖", ("ksiazk", "powiesc", "pisarz", "literatur", "wydawnictw", "booker", "nobel")),
    ("🎭", ("teatr", "spektakl", "aktor")),
    ("📺", ("telewizj", "transmisj", "polsat", "tvp$", "hbo")),

    # --- konflikt i wypadki ---
    ("⚔️", ("wojn", "front$", "ostrzal", "atak rakietowy", "wojsk", "armia")),
    ("🕊️", ("rozejm", "zawieszenie broni", "ceasefire", "traktat pokojowy", "rozmowy pokojowe")),
    ("🚑", ("wypadek", "ofiar", "ranny", "katastrof", "pozar")),

    # --- polityka i prawo ---
    ("🏛️", ("sejm", "senat", "parlament", "rzad", "premier$", "premiera rzadu",
            "prezydent", "minister", "ustaw")),
    ("🗳️", ("wybor", "referendum", "kampania wyborcza", "sondaz", "glosowani", "urna")),
    ("⚖️", ("sadu", "sady", "prokuratur", "trybunal", "wyrok", "sledztw", "zarzut")),
    ("🤝", ("porozumien", "umowa", "negocjacj", "szczyt", "traktat", "sojusz")),

    # --- gospodarka ---
    ("💰", ("budzet", "podatk", "pit$", "vat$", "inflacj", "stopy procent", "zloty$", "miliard")),
    ("🛒", ("handel", "clo$", "cla$", "tariff", "import", "eksport", "rynek")),
    ("📈", ("wzrost", "rekord", "zysk", "hossa")),
    ("📉", ("spadek", "kryzys", "recesj", "przecena", "strata")),
)

MAX_EMOJI = 3


def _wzorzec(slowa: tuple[str, ...]) -> re.Pattern[str]:
    czesci = []
    for slowo in slowa:
        doslownie = slowo.endswith("$")
        rdzen = re.escape(normalize(slowo.rstrip("$")))
        czesci.append(rf"{rdzen}\b" if doslownie else rdzen)
    return re.compile(r"\b(?:" + "|".join(czesci) + r")", re.UNICODE)


_SKOMPILOWANE: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (emotka, _wzorzec(slowa)) for emotka, slowa in REGULY
)


#: Trafienie w nagłówku waży tyle, co kilka trafień w treści — tytuł mówi,
#: o czym jest tekst, a w akapitach da się znaleźć niemal wszystko.
WAGA_NAGLOWKA = 4


def topic_emoji(headline: str = "", lead: str = "", body: str = "",
                *, limit: int = MAX_EMOJI) -> list[str]:
    """Od jednej do trzech emotek opisujących temat. Brak dopasowania = pusto.

    Emotki dobieramy po sile dopasowania, nie po kolejności w tabeli: inaczej
    tekst o tenisie dostawał 🎬 tylko dlatego, że gdzieś w treści padło słowo
    „serial".
    """
    czolo = normalize(f"{headline} {lead}")
    tresc = normalize(body)
    punkty: list[tuple[float, int, str]] = []
    for kolejnosc, (emotka, wzorzec) in enumerate(_SKOMPILOWANE):
        w_czole = len(wzorzec.findall(czolo))
        w_tresci = len(wzorzec.findall(tresc))
        if not (w_czole or w_tresci):
            continue
        punkty.append((w_czole * WAGA_NAGLOWKA + w_tresci, kolejnosc, emotka))
    if not punkty:
        return []
    najlepsze = sorted(punkty, key=lambda t: (-t[0], t[1]))[:limit]
    # Próg jest stały, nie liczony od lidera: temat mocno obecny w tekście
    # wypychał wcześniej poprawną drugą emotkę (wypadek autokaru gubił 🚑,
    # bo „śledztwo" padało kilkanaście razy). Wystarczy jedno trafienie
    # w nagłówku albo trzy w treści; lider wchodzi zawsze.
    prog = min(WAGA_NAGLOWKA, 3)
    return [najlepsze[0][2]] + [e for waga, _, e in najlepsze[1:] if waga >= prog]
