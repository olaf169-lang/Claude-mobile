"""Opcjonalna synteza przez Claude.

Bez klucza API potok działa w trybie ekstrakcyjnym (cytuje zdania źródeł).
Z kluczem ANTHROPIC_API_KEY ten sam materiał trafia do modelu, który pisze
pogłębione omówienie po polsku — również wtedy, gdy źródła są angielskie.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

log = logging.getLogger("przeglad.llm")

MODEL = os.environ.get("PRZEGLAD_MODEL", "claude-opus-5")
MAX_TOKENS = 8000
#: Ile znaków materiału źródłowego wysyłamy na jedną informację.
SOURCE_BUDGET = 14000

SYSTEM = """Jesteś redaktorem „Przeglądu News" — codziennego, pogłębionego \
przeglądu prasy dla ciekawego świata czytelnika z Polski.

Twoje zadanie: na podstawie materiałów z kilku niezależnych źródeł napisać \
JEDNO rzetelne omówienie tematu dnia w danym dziale.

Zasady:
- Piszesz WYŁĄCZNIE po polsku, także gdy źródła są angielskie.
- Opierasz się tylko na dostarczonym materiale. Nie zmyślasz faktów, nazwisk \
  ani liczb. Jeśli czegoś nie ma w materiale, nie piszesz tego.
- Jeśli źródła się różnią, mówisz o tym wprost.
- Tłumaczysz kontekst: dlaczego to się stało, co było wcześniej, co z tego \
  wynika. Czytelnik ma się czegoś nauczyć, a nie tylko dowiedzieć, że coś się \
  wydarzyło.
- Ton: rzeczowy, konkretny, bez ozdobników i bez sensacji.
- Nie zaczynasz zdań od „W dzisiejszym artykule" ani podobnych zapowiedzi."""

SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "naglowek": {
            "type": "string",
            "description": "Nagłówek po polsku, rzeczowy, maks. 90 znaków.",
        },
        "lead": {
            "type": "string",
            "description": "2–3 zdania streszczające istotę wydarzenia.",
        },
        "co_sie_stalo": {
            "type": "array",
            "items": {"type": "string"},
            "description": "3–5 akapitów opisujących wydarzenie i jego szczegóły.",
        },
        "dlaczego_to_wazne": {
            "type": "string",
            "description": "Akapit o konsekwencjach i znaczeniu.",
        },
        "kontekst": {
            "type": "string",
            "description": "Akapit tła: co było wcześniej, jak do tego doszło.",
        },
        "warto_wiedziec": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2–4 ciekawostki lub fakty poszerzające temat.",
        },
        "liczby": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "wartosc": {"type": "string"},
                    "opis": {"type": "string"},
                },
                "required": ["wartosc", "opis"],
                "additionalProperties": False,
            },
            "description": "0–4 kluczowe liczby z materiału.",
        },
        "pojecia": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "termin": {"type": "string"},
                    "wyjasnienie": {"type": "string"},
                },
                "required": ["termin", "wyjasnienie"],
                "additionalProperties": False,
            },
            "description": "0–3 pojęcia warte wyjaśnienia czytelnikowi.",
        },
        "tagi": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2–5 krótkich tagów tematycznych.",
        },
    },
    "required": [
        "naglowek", "lead", "co_sie_stalo", "dlaczego_to_wazne",
        "kontekst", "warto_wiedziec", "liczby", "pojecia", "tagi",
    ],
    "additionalProperties": False,
}


def available() -> bool:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        log.warning("ANTHROPIC_API_KEY jest ustawiony, ale brakuje pakietu 'anthropic'")
        return False
    return True


def _prompt(segment_name: str, segment_blurb: str, covers_date: str, materials: list[dict]) -> str:
    parts = [
        f"DZIAŁ: {segment_name} ({segment_blurb})",
        f"DZIEŃ, KTÓREGO DOTYCZY PRZEGLĄD: {covers_date}",
        "",
        "MATERIAŁ ŹRÓDŁOWY:",
    ]
    budget = SOURCE_BUDGET
    for i, material in enumerate(materials, 1):
        body = material["text"][: max(1200, budget // max(1, len(materials)))]
        parts.append(
            f"\n--- Źródło {i}: {material['source']} ({material['lang']}) ---\n"
            f"Tytuł: {material['title']}\n"
            f"URL: {material['url']}\n"
            f"Treść:\n{body}"
        )
        budget -= len(body)
        if budget <= 0:
            break
    if any(m.get("background") for m in materials):
        bg = next(m["background"] for m in materials if m.get("background"))
        parts.append(f"\n--- Tło encyklopedyczne (Wikipedia: {bg['hasło']}) ---\n{bg['tekst']}")
    parts.append(
        "\nNapisz omówienie zgodnie ze schematem odpowiedzi. Pamiętaj: tylko fakty "
        "z powyższego materiału, całość po polsku."
    )
    return "\n".join(parts)


def synthesize(
    segment_name: str,
    segment_blurb: str,
    covers_date: str,
    materials: list[dict],
) -> dict | None:
    """Zwraca słownik zgodny ze SCHEMA albo None, gdy model niedostępny/błąd."""
    if not materials or not available():
        return None

    import anthropic

    client = anthropic.Anthropic()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM,
            thinking={"type": "adaptive"},
            output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
            messages=[
                {
                    "role": "user",
                    "content": _prompt(segment_name, segment_blurb, covers_date, materials),
                }
            ],
        )
    except anthropic.APIStatusError as exc:
        log.warning("Claude odmówił/zwrócił błąd (%s) dla działu %s", exc.status_code, segment_name)
        return None
    except anthropic.APIConnectionError as exc:
        log.warning("problem z połączeniem do API (%s) dla działu %s", exc, segment_name)
        return None

    if response.stop_reason == "refusal":
        log.warning("model odmówił opracowania działu %s", segment_name)
        return None

    text = next((b.text for b in response.content if b.type == "text" and b.text), "")
    if not text:
        return None
    try:
        return json.loads(text)
    except ValueError:
        log.warning("odpowiedź modelu nie jest poprawnym JSON-em (dział %s)", segment_name)
        return None
