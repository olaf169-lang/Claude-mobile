"""Warstwa sieciowa: jedna sesja, rozsądne limity, brak wyjątków na zewnątrz."""

from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass

import requests
from requests.adapters import HTTPAdapter

log = logging.getLogger("przeglad.net")

USER_AGENT = (
    "PrzegladNews/1.0 (+https://github.com/olaf169-lang/Claude-mobile; "
    "codzienny przegląd prasy, kontakt przez GitHub Issues)"
)
DEFAULT_TIMEOUT = 20
MAX_BYTES = 3_000_000


@dataclass
class Response:
    ok: bool
    url: str
    status: int = 0
    content: bytes = b""
    error: str = ""

    @property
    def text(self) -> str:
        if not self.content:
            return ""
        return self.content.decode("utf-8", "replace")


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pl,en;q=0.8",
        }
    )
    adapter = HTTPAdapter(pool_connections=16, pool_maxsize=16)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s


def get(session: requests.Session, url: str, *, timeout: int = DEFAULT_TIMEOUT, retries: int = 2) -> Response:
    """Pobiera URL. Nigdy nie rzuca — błąd wraca jako Response(ok=False)."""
    last = ""
    for attempt in range(retries + 1):
        try:
            r = session.get(url, timeout=timeout, allow_redirects=True, stream=True)
            content = b""
            for chunk in r.iter_content(65536):
                content += chunk
                if len(content) > MAX_BYTES:
                    break
            r.close()
            if r.status_code >= 400:
                last = f"HTTP {r.status_code}"
                # 4xx nie naprawi się przy ponowieniu (poza limitem zapytań).
                if r.status_code != 429 and r.status_code < 500:
                    return Response(False, url, r.status_code, error=last)
            else:
                return Response(True, r.url, r.status_code, content)
        except requests.RequestException as exc:  # timeout, DNS, TLS, reset
            last = type(exc).__name__
        if attempt < retries:
            time.sleep(1.5 * (attempt + 1) + random.random())
    log.debug("nie udało się pobrać %s (%s)", url, last)
    return Response(False, url, error=last or "nieznany błąd")
