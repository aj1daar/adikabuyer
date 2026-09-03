#!/usr/bin/env bash
#
# Seeds ~10 demo products (images + attributes) into a running stack via the admin API.
# Additive — run it once against a fresh DB. Images are generated locally and uploaded
# to the stack's media store.
#
#   scripts/seed-demo.sh [BASE_URL] [ADMIN_USER] [ADMIN_PASS]
#     defaults: https://localhost  admin  devpassword
#
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${1:-https://localhost}"
USER="${2:-admin}"
PASS="${3:-devpassword}"
C="curl -sk --max-time 30"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
PY="$(command -v python || command -v python3)"

echo "Logging in as $USER ..."
TOK=$($C -XPOST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
        -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOK" ] || { echo "login failed" >&2; exit 1; }
AUTH="Authorization: Bearer $TOK"

# --- generate solid-colour PNGs (no external tooling) --------------------------------
gen_png() { # $1=hex like 1b1b1f  $2=outfile
  "$PY" - "$1" "$2" <<'PYEOF'
import sys, struct, zlib
hexc, out = sys.argv[1], sys.argv[2]
r, g, b = (int(hexc[i:i+2], 16) for i in (0, 2, 4))
W = H = 900
raw = (b"\x00" + bytes((r, g, b)) * W) * H
def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(raw, 9))
png += chunk(b"IEND", b"")
open(out, "wb").write(png)
PYEOF
}

upload() { # $1=file -> prints media url
  $C -XPOST "$BASE/api/media/upload" -H "$AUTH" \
     -F "file=@-;type=image/png;filename=$(basename "$1")" < "$1" \
     | sed -n 's/.*"url":"\([^"]*\)".*/\1/p'
}

declare -A IMG
for name in midnight sunrise hoodie tee sneaker shopper bottle cap socks blanket \
            sw_black sw_white sw_pink sw_silver sw_blue sw_beige sw_grey; do
  case "$name" in
    midnight) hex=1b1b2f;; sunrise) hex=ffd9c0;; hoodie) hex=2b2b2b;; tee) hex=f2f2f2;;
    sneaker) hex=e8e8e8;; shopper) hex=d8c9a3;; bottle) hex=1e5fa8;; cap) hex=222222;;
    socks) hex=8a8a8a;; blanket) hex=c9b8c9;;
    sw_black) hex=111111;; sw_white) hex=fafafa;; sw_pink) hex=f6b8cf;; sw_silver) hex=c9ccd1;;
    sw_blue) hex=2e6fb0;; sw_beige) hex=d8c9a3;; sw_grey) hex=8f9195;;
  esac
  gen_png "$hex" "$WORK/$name.png"
  IMG[$name]=$(upload "$WORK/$name.png")
  echo "  uploaded $name -> ${IMG[$name]}"
done

create() { # $1 = product JSON
  printf '%s' "$1" > "$WORK/p.json"
  name=$(sed -n 's/.*"name":"\([^"]*\)".*/\1/p' "$WORK/p.json")
  for attempt in 1 2 3; do
    code=$($C -o "$WORK/resp.json" -w '%{http_code}' -XPOST "$BASE/api/catalog/products" \
             -H "$AUTH" -H 'Content-Type: application/json' --data-binary @"$WORK/p.json")
    [ "$code" = 201 ] && { echo "  + $name"; return; }
    sleep 1
  done
  echo "  ! $name -> $code $(cat "$WORK/resp.json")"
}

echo "Creating products ..."

create '{"name":"Термостакан «Полночь»","description":"Двойная стенка, держит тепло 6 часов. Матовое покрытие soft-touch.","category":"Термостаканы","brand":"Adika","active":true,"labels":["Хит"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'","Серебристый":"'"${IMG[sw_silver]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","volume":"500"},"priceOverride":1290,"stockQuantity":24,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","volume":"750"},"priceOverride":1490,"stockQuantity":12,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","volume":"500"},"priceOverride":1390,"stockQuantity":8,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Термостакан «Рассвет»","description":"Пастельная серия. Крышка-непроливайка, подходит для кофе навынос.","category":"Термостаканы","brand":"Adika","active":true,"labels":["Новинка"],"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'","Розовый":"'"${IMG[sw_pink]}"'"},"variants":[
  {"attributes":{"color":"Белый","volume":"500"},"priceOverride":1250,"stockQuantity":15,"active":true,"imageUrls":["'"${IMG[sunrise]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Розовый","volume":"500"},"priceOverride":1250,"stockQuantity":9,"active":true,"imageUrls":["'"${IMG[sunrise]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Худи оверсайз","description":"Плотный футер 340 г/м², приспущенное плечо, широкая резинка.","category":"Одежда","brand":"Blank","active":true,"labels":["Limited"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'","Серебристый":"'"${IMG[sw_silver]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","size":"M"},"priceOverride":3990,"stockQuantity":10,"active":true,"imageUrls":["'"${IMG[hoodie]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","size":"L"},"priceOverride":3990,"stockQuantity":7,"active":true,"imageUrls":["'"${IMG[hoodie]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"M"},"priceOverride":3990,"stockQuantity":5,"active":true,"imageUrls":["'"${IMG[hoodie]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"L"},"priceOverride":3990,"stockQuantity":0,"active":true,"imageUrls":["'"${IMG[hoodie]}"'"],"status":"PRE_ORDER"}]}'

create '{"name":"Футболка базовая","description":"Джерси 100% хлопок, 180 г/м². Прямой крой.","category":"Одежда","brand":"Blank","active":true,"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'","Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Белый","size":"S"},"priceOverride":1490,"stockQuantity":20,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"M"},"priceOverride":1490,"stockQuantity":18,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","size":"M"},"priceOverride":1490,"stockQuantity":14,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Кроссовки «Ранэраунд»","description":"Сетчатый верх, литая подошва EVA. Вес пары 240 г.","category":"Обувь","brand":"Runline","active":true,"labels":["Хит"],"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'"},"variants":[
  {"attributes":{"color":"Белый","size":"40"},"priceOverride":5490,"stockQuantity":6,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"41"},"priceOverride":5490,"stockQuantity":9,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"42"},"priceOverride":5490,"stockQuantity":4,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Шоппер «Сетка»","description":"Хлопковая сетка, длинные ручки, выдерживает до 12 кг.","category":"Аксессуары","brand":"Adika","active":true,"variants":[
  {"attributes":{"color":"Белый","size":"One Size"},"priceOverride":790,"stockQuantity":30,"active":true,"imageUrls":["'"${IMG[shopper]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Бутылка спортивная","description":"Tritan без BPA, клапан-поилка, мерная шкала.","category":"Бутылки","brand":"HydroKG","active":true,"labels":["Скидка"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","volume":"750"},"priceOverride":890,"stockQuantity":22,"active":true,"imageUrls":["'"${IMG[bottle]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","volume":"1000"},"priceOverride":990,"stockQuantity":17,"active":true,"imageUrls":["'"${IMG[bottle]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Кепка классик","description":"6 панелей, регулируемая застёжка, вышивка спереди.","category":"Аксессуары","brand":"Blank","active":true,"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","size":"One Size"},"priceOverride":1190,"stockQuantity":16,"active":true,"imageUrls":["'"${IMG[cap]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"One Size"},"priceOverride":1190,"stockQuantity":0,"active":true,"imageUrls":["'"${IMG[cap]}"'"],"status":"SOLD_OUT"}]}'

create '{"name":"Носки «Пак 3 шт»","description":"Хлопок с эластаном, усиленный мысок и пятка.","category":"Одежда","brand":"Blank","active":true,"variants":[
  {"attributes":{"color":"Серебристый","size":"S"},"priceOverride":690,"stockQuantity":40,"active":true,"imageUrls":["'"${IMG[socks]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"L"},"priceOverride":690,"stockQuantity":35,"active":true,"imageUrls":["'"${IMG[socks]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Плед флисовый","description":"Микрофибра 280 г/м², антипиллинг, размер 150×200 см.","category":"Дом","brand":"Adika","active":true,"labels":["Уют"],"colorSwatches":{"Серебристый":"'"${IMG[sw_grey]}"'","Розовый":"'"${IMG[sw_pink]}"'"},"variants":[
  {"attributes":{"color":"Серебристый","size":"150x200"},"priceOverride":1990,"stockQuantity":11,"active":true,"imageUrls":["'"${IMG[blanket]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Розовый","size":"150x200"},"priceOverride":1990,"stockQuantity":6,"active":true,"imageUrls":["'"${IMG[blanket]}"'"],"status":"IN_STOCK"}]}'

echo
$C "$BASE/api/catalog/products?pageSize=100&includeArchived=true" \
  | "$PY" -c "import sys,json;d=json.load(sys.stdin);print('Catalog:',d['totalCount'],'products');[print('  -',p['name'],'|',p['category'],'|',len(p['variants']),'variants |',len(p.get('colorSwatches') or {}),'swatches') for p in d['items']]"
