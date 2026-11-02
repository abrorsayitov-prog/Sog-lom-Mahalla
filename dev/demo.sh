# Sog'lom Mahalla — lokal demo nazoratchisi.
# Funksiya serveri, doimiy nomli tunnel va budilnik uchisini birga ushlab turadi.
# Tunnel o'lib qolsa xuddi shu nom bilan qayta ochadi — manzil o'zgarmaydi.
#
#   setsid nohup bash dev/demo.sh >/dev/null 2>&1 &
#
# Bu fayl faqat lokal sinov uchun, chop etilmaydi.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
NODE=/home/lobodaed/.local/node-v22.23.4-linux-x64/bin/node
URL=https://soglim-mahalla.loca.lt
SUBDOMAIN=soglim-mahalla
LOG=/tmp/smh-demo.log

say() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >> "$LOG"; }

stop_all() {
  pkill -f 'dev/server[.]mjs' 2>/dev/null
  pkill -f 'localtunnel --port 8000' 2>/dev/null
  pkill -f 'cloudflared tunnel --url http://127[.]0[.]0[.]1:8000' 2>/dev/null
  pkill -f 'dev/tick-loop[.]sh' 2>/dev/null
  sleep 2
}

start_stack() {
  echo "$URL" > "$ROOT/dev/.tunnel-url"
  npx --yes localtunnel --port 8000 --subdomain "$SUBDOMAIN" > /tmp/smh-lt.log 2>&1 &
  for _ in $(seq 1 20); do
    grep -q "your url is" /tmp/smh-lt.log && break
    sleep 2
  done
  say "tunnel: $URL (log: /tmp/smh-lt.log)"

  ( set -a; . "$ROOT/.dev.vars"; set +a
    LOCAL_ORIGIN="$URL" "$NODE" "$ROOT/dev/server.mjs" 8000 >> /tmp/smh-server.log 2>&1 &
  )

  bash "$ROOT/dev/tick-loop.sh" >> /dev/null 2>&1 &
  say "server va budilnik uchi ishga tushdi"
}

say "nazoratchi ishga tushdi"
stop_all
start_stack
while true; do
  sleep 30
  if ! pgrep -f 'localtunnel --port 8000' > /dev/null; then
    say "tunnel o'lgan — shu nom bilan qayta ko'tariladi"
    stop_all
    start_stack
  fi
done
