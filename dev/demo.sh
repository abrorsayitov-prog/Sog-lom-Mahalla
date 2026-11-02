# Sog'lom Mahalla — lokal demo nazoratchisi.
# Server + Cloudflare tunnel + budilnik uchisini birga ushlab turadi:
# tarmoq uzilib qolsa tunnelni qayta ochadi, yangi manzilni .tunnel-url
# fayliga yozadi va serverni shu manzil bilan qayta ishga tushiradi.
#
#   setsid nohup bash dev/demo.sh >/dev/null 2>&1 &
#
# Bu fayl faqat lokal sinov uchun, chop etilmaydi.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
NODE=/home/lobodaed/.local/node-v22.23.4-linux-x64/bin/node
CLOUDFLARED=/home/lobodaed/.local/bin/cloudflared
URL_FILE="$ROOT/dev/.tunnel-url"
LOG=/tmp/smh-demo.log

say() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >> "$LOG"; }

stop_all() {
  pkill -f "node dev/server.mjs" 2>/dev/null
  pkill -f "node $ROOT/dev/server.mjs" 2>/dev/null
  pkill -f "cloudflared tunnel --url http://127.0.0.1:8000" 2>/dev/null
  pkill -f "dev/tick-loop.sh" 2>/dev/null
  sleep 2
}

start_stack() {
  : > /tmp/smh-tunnel.log
  "$CLOUDFLARED" tunnel --url http://127.0.0.1:8000 --no-autoupdate >> /tmp/smh-tunnel.log 2>&1 &
  local url=""
  for _ in $(seq 1 25); do
    url=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/smh-tunnel.log | tail -1)
    [ -n "$url" ] && break
    sleep 2
  done
  if [ -z "$url" ]; then say "tunnel ochilmadi — qayta uriniladi"; return 1; fi
  echo "$url" > "$URL_FILE"
  say "tunnel: $url"

  ( set -a; . "$ROOT/.dev.vars"; set +a
    LOCAL_ORIGIN="$url" "$NODE" "$ROOT/dev/server.mjs" 8000 >> /tmp/smh-server.log 2>&1 &
  )

  bash "$ROOT/dev/tick-loop.sh" >> /dev/null 2>&1 &
  say "server va budilnik uchi ishga tushdi"
  return 0
}

say "nazoratchi ishga tushdi"
stop_all
start_stack
while true; do
  sleep 30
  if ! pgrep -f "cloudflared tunnel --url http://127.0.0.1:8000" > /dev/null; then
    say "tunnel o'lgan — qayta ko'tariladi"
    stop_all
    start_stack
  fi
done
