"""Tłumaczenie maszynowe obcojęzycznych tematów na polski.

Bez klucza API korzystamy z darmowego MyMemory. Jakość jest przyzwoita,
ale to nie jest poziom modelu językowego — z `ANTHROPIC_API_KEY` omówienia
powstają od razu po polsku i nie przechodzą przez ten moduł.

Zasada nadrzędna: **albo cała informacja po polsku, albo żadna jej część**.
Karta w połowie polska, w połowie angielska jest gorsza niż uczciwie
oznaczona angielska, więc każde niepowodzenie wycofuje całe tłumaczenie.
"""

from __future__ import annotations

import json
import logging
import os
import time
from urllib.parse import quote

import requests

from .net import get
from .textutil import sentences

log = logging.getLogger("przeglad.translate")

#: MyMemory przyjmuje krótkie zapytania — dzielimy tekst na kawałki.
MAX_CHUNK = 480
#: Dzienny limit MyMemory bez podania adresu e-mail to ok. 5000 znaków.
#: Trzymamy się poniżej: lepiej zostawić kartę po angielsku niż dostać
#: obcięty tekst w połowie wydania.
BUDGET_ANONIM = 4_500
#: Z własnym adresem w PRZEGLAD_TLUMACZ_EMAIL usługa daje 50 000 znaków dziennie.
BUDGET_Z_EMAILEM = 20_000
#: Odstęp między zapytaniami — nie zasypujemy darmowej usługi.
PAUSE = 0.25

_QUOTA_MARKERS = ("ALL AVAILABLE FREE TRANSLATIONS", "QUOTA", "TOO MANY REQUESTS")


class Translator:
    """Tłumacz z budżetem znaków i pamięcią powtórzeń."""

    def __init__(
        self,
        session: requests.Session,
        *,
        budget: int | None = None,
        email: str | None = None,
    ) -> None:
        self._session = session
        self._email = (email or "").strip()
        self._budget = budget if budget is not None else (
            BUDGET_Z_EMAILEM if self._email else BUDGET_ANONIM
        )
        self._cache: dict[str, str] = {}
        self._enabled = True
        self.used = 0
        self.engine = "MyMemory"

    @property
    def enabled(self) -> bool:
        return self._enabled and self._budget > 0

    def _chunks(self, text: str) -> list[str]:
        """Dzieli tekst na kawałki po granicach zdań, nie w środku wyrazu."""
        parts: list[str] = []
        buffer = ""
        for sentence in sentences(text) or [text]:
            if len(sentence) > MAX_CHUNK:
                # Zdanie dłuższe niż limit: tniemy po spacjach.
                if buffer:
                    parts.append(buffer)
                    buffer = ""
                words, line = sentence.split(), ""
                for word in words:
                    if len(line) + len(word) + 1 > MAX_CHUNK:
                        parts.append(line)
                        line = word
                    else:
                        line = f"{line} {word}".strip()
                if line:
                    parts.append(line)
                continue
            if len(buffer) + len(sentence) + 1 > MAX_CHUNK:
                parts.append(buffer)
                buffer = sentence
            else:
                buffer = f"{buffer} {sentence}".strip()
        if buffer:
            parts.append(buffer)
        return [p for p in parts if p.strip()]

    def _translate_chunk(self, chunk: str, source: str) -> str | None:
        if chunk in self._cache:
            return self._cache[chunk]
        if len(chunk) > self._budget:
            log.info("budżet tłumaczenia wyczerpany (%d znaków)", self.used)
            self._enabled = False
            return None

        # `de` to adres kontaktowy podnoszący dzienny limit. Podajemy go tylko
        # wtedy, gdy właściciel przeglądu sam go poda — zmyślony adres byłby
        # nieuczciwy wobec darmowej usługi.
        url = (
            "https://api.mymemory.translated.net/get"
            f"?q={quote(chunk)}&langpair={source}|pl"
        )
        if self._email:
            url += f"&de={quote(self._email)}"
        response = get(self._session, url, timeout=20, retries=1)
        if not response.ok:
            log.warning("tłumacz nie odpowiedział: %s", response.error)
            self._enabled = False
            return None

        try:
            data = json.loads(response.text)
        except ValueError:
            self._enabled = False
            return None

        details = str(data.get("responseDetails") or "").upper()
        if any(marker in details for marker in _QUOTA_MARKERS):
            log.warning("darmowy limit tłumaczeń wyczerpany na dziś")
            self._enabled = False
            return None

        translated = self._pick(data, chunk)
        if translated is None:
            log.info("brak wiarygodnego tłumaczenia dla fragmentu (%d znaków)", len(chunk))
            return None

        self._budget -= len(chunk)
        self.used += len(chunk)
        self._cache[chunk] = translated
        time.sleep(PAUSE)
        return translated

    @staticmethod
    def _pick(data: dict, source_text: str) -> str | None:
        """Wybiera wiarygodne tłumaczenie z odpowiedzi MyMemory.

        Usługa zwraca nie tylko tłumaczenie maszynowe, ale też dopasowania
        ze swojej pamięci tłumaczeniowej. Przy słabym dopasowaniu potrafi
        podstawić zupełnie inny tekst — tak w dziale o kryptonie pojawiła się
        definicja homofobii. Dlatego pierwszeństwo ma wpis oznaczony „MT!",
        czyli czyste tłumaczenie maszynowe, a wpisy z pamięci przechodzą tylko
        przy bardzo wysokim dopasowaniu.
        """
        kandydaci: list[str] = []

        for wpis in data.get("matches") or []:
            tekst = (wpis.get("translation") or "").strip()
            if not tekst:
                continue
            if str(wpis.get("created-by") or "").upper().startswith("MT"):
                kandydaci.append(tekst)
                break
            try:
                dopasowanie = float(wpis.get("match") or 0)
            except (TypeError, ValueError):
                dopasowanie = 0.0
            if dopasowanie >= 0.95:
                kandydaci.append(tekst)

        odpowiedz = data.get("responseData") or {}
        try:
            dopasowanie = float(odpowiedz.get("match") or 0)
        except (TypeError, ValueError):
            dopasowanie = 0.0
        tekst = (odpowiedz.get("translatedText") or "").strip()
        if tekst and dopasowanie >= 0.85:
            kandydaci.append(tekst)

        for kandydat in kandydaci:
            if kandydat.upper().startswith("MYMEMORY WARNING"):
                continue
            # Tłumaczenie krótsze o połowę albo dwa razy dłuższe od oryginału
            # to prawie zawsze podmieniony, niepowiązany tekst.
            stosunek = len(kandydat) / max(1, len(source_text))
            if 0.45 <= stosunek <= 2.2:
                return kandydat
        return None

    def text(self, value: str, source: str = "en") -> str | None:
        """Zwraca polski tekst albo None, gdy cokolwiek zawiodło."""
        value = (value or "").strip()
        if not value:
            return value
        if not self.enabled:
            return None
        out: list[str] = []
        for chunk in self._chunks(value):
            translated = self._translate_chunk(chunk, source)
            if translated is None:
                return None
            out.append(translated)
        return " ".join(out).strip() or None


def translate_item(item: dict, translator: Translator, *, source: str = "en") -> bool:
    """Tłumaczy gotową pozycję wydania w miejscu. Zwraca, czy się udało.

    Przy jakimkolwiek niepowodzeniu pozycja zostaje nietknięta — stąd praca
    na kopii i podmiana dopiero na końcu.
    """
    if not translator.enabled:
        return False

    kopia = json.loads(json.dumps(item, ensure_ascii=False))

    def przetlumacz(value: str) -> str | None:
        return translator.text(value, source)

    naglowek = przetlumacz(kopia.get("nagłówek", ""))
    if naglowek is None:
        return False
    lead = przetlumacz(kopia.get("lead", ""))
    if lead is None:
        return False

    kopia["nagłówek"], kopia["lead"] = naglowek, lead

    if kopia.get("dlaczego_to_ważne"):
        wynik = przetlumacz(kopia["dlaczego_to_ważne"])
        if wynik is None:
            return False
        kopia["dlaczego_to_ważne"] = wynik

    for sekcja in kopia.get("sekcje", []):
        # Tło z polskiej Wikipedii jest już po polsku — tłumaczenie go
        # z angielskiego potrafi zamienić hasło w coś zupełnie innego.
        if sekcja.get("język") == "pl":
            continue
        przetlumaczone: list[str] = []
        for tekst in sekcja.get("treść", []):
            wynik = przetlumacz(tekst)
            if wynik is None:
                return False
            przetlumaczone.append(wynik)
        sekcja["treść"] = przetlumaczone

    # „Jak piszą inni" to dodatek, a kosztuje jedną czwartą budżetu karty.
    # Przy skromnym darmowym limicie lepiej mieć trzy karty po polsku bez tej
    # sekcji niż dwie z nią i resztę po angielsku. Źródła zostają w wykazie.
    kopia["inne_spojrzenia"] = []

    kopia["oryginalny_nagłówek"] = item.get("nagłówek", "")
    kopia["tłumaczenie"] = {"z": source, "silnik": translator.engine}
    item.clear()
    item.update(kopia)
    return True


def make_translator(session: requests.Session) -> Translator | None:
    """Tłumacz włączony domyślnie; PRZEGLAD_TLUMACZ=0 go wyłącza.

    PRZEGLAD_TLUMACZ_EMAIL (twój własny adres) podnosi dzienny limit usługi
    z ok. 5000 do 50 000 znaków.
    """
    if os.environ.get("PRZEGLAD_TLUMACZ", "1").strip() in {"0", "off", "nie"}:
        return None
    return Translator(session, email=os.environ.get("PRZEGLAD_TLUMACZ_EMAIL"))
