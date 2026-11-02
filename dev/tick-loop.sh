# Budilnik uchi: har 60 soniyada /api/tick ni chaqiradi.
# Manzilni dev/.tunnel-url faylidan oladi — tunnel yangilansa, bu ham yangilanadi.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
while true; do
  URL=$(cat "$ROOT/dev/.tunnel-url" 2>/dev/null)
  if [ -n "$URL" ]; then
    set -a; . "$ROOT/.dev.vars"; set +a
    curl -s -m 15 -X POST "$URL/functions/v1/app/api/tick" \
      -H "x-tick-token: $APP_TICK_TOKEN" -H "origin: $URL" \
      -w " tick [%{http_code}]\n" >> /tmp/smh-tick.log 2>&1
  fi
  sleep 60
done
