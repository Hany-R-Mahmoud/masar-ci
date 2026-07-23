#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$ROOT/web"
BIN="$WEB/node_modules/.bin"
COMMAND="${1:-dev}"
shift || true

if [[ ! -x "$BIN/next" ]]; then
  echo "Missing web dependencies. Install them in web/ first." >&2
  exit 1
fi

cd "$WEB"

case "$COMMAND" in
  dev) exec "$BIN/next" dev "$@" ;;
  test) exec "$BIN/vitest" run "$@" ;;
  typecheck) exec "$BIN/tsc" --noEmit "$@" ;;
  build) exec "$BIN/next" build "$@" ;;
  check)
    "$BIN/tsc" --noEmit
    "$BIN/vitest" run
    "$BIN/next" build
    ;;
  preview) exec python3 -m http.server "${PORT:-3000}" --directory "$WEB/out" ;;
  *)
    echo "Usage: ./run.sh [dev|test|typecheck|build|check|preview]" >&2
    exit 2
    ;;
esac
