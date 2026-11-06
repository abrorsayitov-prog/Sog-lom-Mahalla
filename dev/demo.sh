# Sog'lom Mahalla — lokal demo nazoratchisi.
# Funksiya serveri, tunnel va budilnik uchisini birga ushlab turadi.
# Manzil tanlash tartibi: oxirgi ishlagan nom -> soglim-mahalla -> Cloudflare
# -> birinchi bo'sh lokal nom. Topilgan manzil dev/.tunnel-url fayliga va
# LOCAL_ORIGIN ga yoziladi — shunda server to'g'ri manzilni tan oladi.
#
#   setsid nohup bash dev/demo.sh >/dev/null 2>&1 &
#
# Bu fayl faqat lokal sinov uchun, chop etilmaydi.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
NODE=/home/lobodaed/.local/node-v22.23.4-linux-x64/bin/node
SUBDOMAIN=soglim-mahalla
FIXED=https://$SUBDOMAIN.loca.lt
LOG=/tmp/smh-demo.log
LT_LOG=/tmp/smh-lt.log
CF_LOG=/tmp/smh-cf.log
ACTIVE=/tmp/smh-active-url
NAMES=/tmp/smh-subdomains

say() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >> "$LOG"; }

ok200() {
  local code
  code=$(curl -s -m 20 -o /dev/null -w '%{http_code}' "${1%/}/admin" 2>/dev/null)
  [ "$code" = "200" ]
}

# Tunnelning ochilishi bir necha soniya oladi — bir marta emas, bir necha marta sinaymiz.
probe() {
  local tries=${2:-6} i
  for i in $(seq 1 "$tries"); do
    ok200 "$1" && return 0
    sleep 5
  done
  return 1
}

stop_server() {
  pkill -f 'dev/server[.]mjs' 2>/dev/null
  sleep 1
}

stop_all() {
  stop_server
  pkill -f 'localtunnel --port 8000' 2>/dev/null
  pkill -f 'cloudflared tunnel --url http://127[.]0[.]0[.]1:8000' 2>/dev/null
  pkill -f 'dev/tick-loop[.]sh' 2>/dev/null
  sleep 2
}

start_server() {
  ( set -a; . "$ROOT/.dev.vars"; set +a
    LOCAL_ORIGIN="$1" "$NODE" "$ROOT/dev/server.mjs" 8000 >> /tmp/smh-server.log 2>&1 &
  )
  sleep 2
}

start_localtunnel() {
  : > "$LT_LOG"
  npx --yes localtunnel --port 8000 --subdomain "$1" > "$LT_LOG" 2>&1 &
  for _ in $(seq 1 15); do
    grep -q "your url is" "$LT_LOG" && break
    sleep 2
  done
  grep -o 'https://[a-z0-9-]*\.loca\.lt' "$LT_LOG" | tail -1
}

start_cloudflare() {
  : > "$CF_LOG"
  cloudflared tunnel --url "http://127.0.0.1:8000" --no-autoupdate > "$CF_LOG" 2>&1 &
  for _ in $(seq 1 20); do
    local found
    found=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$CF_LOG" | tail -1)
    if [ -n "$found" ]; then echo "$found"; return; fi
    sleep 2
  done
  echo ""
}

# Avvalgi ishlagan nom birinchi sinovdan o'tadi — shunda manzil o'zgarmay qoladi.
wanted_names() {
  local last=$(tail -1 "$NAMES" 2>/dev/null)
  [ -n "$last" ] && echo "$last"
  echo "$SUBDOMAIN"
}

# Ishonchli manzilni tanlaydi: tanish nom, so'ng doimiy nom, so'ng Cloudflare.
choose_url() {
  local name url
  for name in $(wanted_names); do
    url=$(start_localtunnel "$name")
    if [ "$url" = "https://$name.loca.lt" ] && probe "$url" 4; then
      echo "$url"
      return
    fi
    say "\"$name\" band (${url:-hech qanday} chiqdi) - keyingisi sinab ko'riladi"
    pkill -f 'localtunnel --port 8000' 2>/dev/null
    sleep 2
  done

  url=$(start_cloudflare)
  if [ -n "$url" ] && probe "$url" 8; then
    echo "$url"
    return
  fi

  say "Cloudflare ham ishlamadi - birinchi bo'sh lokal nom olinadi"
  pkill -f 'cloudflared tunnel --url http://127[.]0[.]0[.]1:8000' 2>/dev/null
  sleep 2
  url=$(start_localtunnel "$SUBDOMAIN")
  echo "${url:-$FIXED}"
}

publish() {
  local url=$1 kind=$2
  echo "$url" > "$ACTIVE"
  echo "$url" > "$ROOT/dev/.tunnel-url"
  case "$url" in
    *loca.lt)
      local host=${url#https://}
      echo "${host%.loca.lt}" >> "$NAMES"
      ;;
  esac
  stop_server
  start_server "$url"
  bash "$ROOT/dev/tick-loop.sh" >> /dev/null 2>&1 &
  say "$kind tunnel: $url"
}

start_stack() {
  stop_all
  # Server oldin ko'tariladi: tunnel ochil-ochilmasini tekshirish shunga uriladi.
  start_server "$(cat "$ACTIVE" 2>/dev/null || echo "$FIXED")"
  publish "$(choose_url)" "tunnel"
}

tunnel_alive() {
  local url=$(cat "$ACTIVE" 2>/dev/null)
  [ -n "$url" ] || return 1
  case "$url" in
    *loca.lt) pgrep -f 'localtunnel --port 8000' > /dev/null ;;
    *) pgrep -f 'cloudflared tunnel --url http://127[.]0[.]0[.]1:8000' > /dev/null ;;
  esac
}

say "nazoratchi ishga tushdi"
start_stack
fails=0
while true; do
  sleep 30
  if tunnel_alive && ok200 "$(cat "$ACTIVE" 2>/dev/null)"; then
    fails=0
    continue
  fi
  # Bir marta chetda chiqib qolsa ham hammasini buzib tashlamaymiz — ikki marta kutamiz.
  fails=$((fails + 1))
  if [ "$fails" -ge 2 ]; then
    say "manzil ishlamayapti - qayta ko'tariladi"
    start_stack
    fails=0
  fi
done
