#!/usr/bin/env bash
# Przegląd News — jedno polecenie: zbierz wydanie i otwórz je w przeglądarce.
#
#   ./przeglad.sh              zbierz dzisiejsze wydanie (newsy z wczoraj) i pokaż
#   ./przeglad.sh --demo       pokaż przykładowe wydanie z fixture'ów (bez internetu)
#   ./przeglad.sh --tylko-zbierz   sam zbiór danych, bez serwera
#   ./przeglad.sh --lekarz     sprawdź, które kanały RSS jeszcze działają
set -euo pipefail

cd "$(dirname "$0")"
PORT="${PORT:-8080}"
PY="${PYTHON:-python3}"

if [ ! -d .venv ]; then
  echo "→ tworzę środowisko wirtualne (.venv)"
  "$PY" -m venv .venv
  ./.venv/bin/pip install --quiet --upgrade pip
  ./.venv/bin/pip install --quiet -r requirements.txt
fi
PY=./.venv/bin/python

case "${1:-}" in
  --lekarz)
    exec $PY -m collector.doctor "${@:2}"
    ;;
  --demo)
    $PY -m collector.build --fixtures tests/fixtures/manifest.json \
        --date "$(date +%F)" --no-llm --out web/data
    ;;
  --tylko-zbierz)
    exec $PY -m collector.build --out web/data "${@:2}"
    ;;
  *)
    $PY -m collector.build --out web/data "$@"
    ;;
esac

echo
echo "→ Przegląd News czeka na http://localhost:$PORT"
echo "  (Ctrl+C kończy serwer)"
exec $PY -m http.server "$PORT" --directory web
