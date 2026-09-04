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

upload() { # $1=file $2=mime -> prints media url
  $C -XPOST "$BASE/api/media/upload" -H "$AUTH" \
     -F "file=@-;type=${2:-image/png};filename=$(basename "$1")" < "$1" \
     | sed -n 's/.*"url":"\([^"]*\)".*/\1/p'
}

is_jpeg() { [ "$(head -c2 "$1" 2>/dev/null | od -An -tx1 | tr -d ' \n')" = "ffd8" ]; }

# a real 900x900 photo for the keyword; loremflickr -> picsum -> flat colour
photo() { # $1=slug $2=keyword $3=fallback-hex -> writes $WORK/$1, echoes mime
  if $C -fL --max-time 25 -o "$WORK/$1" "https://loremflickr.com/900/900/$2" && is_jpeg "$WORK/$1"; then
    echo image/jpeg; return
  fi
  if $C -fL --max-time 20 -o "$WORK/$1" "https://picsum.photos/seed/adika-$1/900" && is_jpeg "$WORK/$1"; then
    echo image/jpeg; return
  fi
  gen_png "$3" "$WORK/$1"; echo image/png
}

# N distinct photos for one product -> IMG[$1_1 .. $1_N]
photos() { # $1=slug-prefix $2=count $3=keyword $4=fallback-hex
  for i in $(seq 1 "$2"); do
    s="${1}_${i}"
    if $C -fL --max-time 25 -o "$WORK/$s" "https://loremflickr.com/900/900/$3?lock=$i" && is_jpeg "$WORK/$s"; then
      IMG[$s]=$(upload "$WORK/$s" image/jpeg)
    elif $C -fL --max-time 20 -o "$WORK/$s" "https://picsum.photos/seed/adika-$s/900" && is_jpeg "$WORK/$s"; then
      IMG[$s]=$(upload "$WORK/$s" image/jpeg)
    else
      gen_png "$4" "$WORK/$s"; IMG[$s]=$(upload "$WORK/$s" image/png)
    fi
    echo "  photo  $s -> ${IMG[$s]}"
  done
}

declare -A IMG
# product photos, keyword per product
for row in "midnight thermos,bottle 1b1b2f" "sunrise mug,coffee ffd9c0" \
           "tee tshirt f2f2f2" "sneaker sneakers e8e8e8" "shopper totebag d8c9a3" \
           "bottle waterbottle 1e5fa8" "cap baseballcap 222222" "socks socks 8a8a8a" "blanket blanket c9b8c9"; do
  set -- $row; slug=$1; kw=$2; hx=$3
  mime=$(photo "$slug" "$kw" "$hx")
  IMG[$slug]=$(upload "$WORK/$slug" "$mime")
  echo "  photo  $slug ($kw, $mime) -> ${IMG[$slug]}"
done
# the hoodie gets a proper gallery so the card image arrows have something to page
photos hoodie 4 "hoodie,sweatshirt" 2b2b2b
# colour swatches stay flat colour chips
for slug in sw_black sw_white sw_pink sw_silver sw_blue sw_beige sw_grey; do
  case "$slug" in
    sw_black) hx=111111;; sw_white) hx=fafafa;; sw_pink) hx=f6b8cf;; sw_silver) hx=c9ccd1;;
    sw_blue) hx=2e6fb0;; sw_beige) hx=d8c9a3;; sw_grey) hx=8f9195;;
  esac
  gen_png "$hx" "$WORK/$slug.png"
  IMG[$slug]=$(upload "$WORK/$slug.png" image/png)
  echo "  swatch $slug -> ${IMG[$slug]}"
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

create '{"name":"Термостакан «Полночь»","description":"Стакан с двойной вакуумной стенкой из нержавеющей стали 18/8: держит кофе горячим до 6 часов, а воду со льдом — до 12. Матовое soft-touch покрытие не скользит в руке и не собирает отпечатки пальцев. Герметичная крышка с силиконовым уплотнителем и сдвижным клапаном не протекает в сумке. Подходит под большинство автомобильных подстаканников, можно мыть в посудомоечной машине.","category":"Термостаканы","brand":"Adika","active":true,"labels":["Хит"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'","Серебристый":"'"${IMG[sw_silver]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","volume":"500"},"priceOverride":1290,"stockQuantity":24,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","volume":"750"},"priceOverride":1490,"stockQuantity":12,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","volume":"500"},"priceOverride":1390,"stockQuantity":8,"active":true,"imageUrls":["'"${IMG[midnight]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Термостакан «Рассвет»","description":"Пастельная серия для тех, кто берёт кофе навынос каждое утро. Двойная стенка удерживает тепло около 4 часов, крышка-непроливайка открывается одним движением большого пальца и закрывается со щелчком. Внутренняя колба из нержавейки не впитывает запахи, снаружи — мягкое матовое покрытие. Помещается в держатель на велосипеде и в боковой карман рюкзака.","category":"Термостаканы","brand":"Adika","active":true,"labels":["Новинка"],"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'","Розовый":"'"${IMG[sw_pink]}"'"},"variants":[
  {"attributes":{"color":"Белый","volume":"500"},"priceOverride":1250,"stockQuantity":15,"active":true,"imageUrls":["'"${IMG[sunrise]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Розовый","volume":"500"},"priceOverride":1250,"stockQuantity":9,"active":true,"imageUrls":["'"${IMG[sunrise]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Худи оверсайз","description":"Тяжёлый петлевой футер плотностью 340 г/м² с мягким начёсом внутри — держит форму после десятков стирок и не растягивается в горловине. Крой oversized: приспущенное плечо, объёмный капюшон в два слоя, широкая резинка по низу и на манжетах. Усиленные двойные боковые швы, металлические люверсы и круглый шнур с наконечниками. Унисекс: берите свой размер для чёткого силуэта или на размер больше для полного оверсайза.","category":"Одежда","brand":"Blank","active":true,"labels":["Limited"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'","Серебристый":"'"${IMG[sw_silver]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","size":"M"},"priceOverride":3990,"stockQuantity":10,"active":true,"imageUrls":["'"${IMG[hoodie_1]}"'","'"${IMG[hoodie_2]}"'","'"${IMG[hoodie_3]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","size":"L"},"priceOverride":3990,"stockQuantity":7,"active":true,"imageUrls":["'"${IMG[hoodie_1]}"'","'"${IMG[hoodie_2]}"'","'"${IMG[hoodie_3]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"M"},"priceOverride":3990,"stockQuantity":5,"active":true,"imageUrls":["'"${IMG[hoodie_4]}"'","'"${IMG[hoodie_2]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"L"},"priceOverride":3990,"stockQuantity":0,"active":true,"imageUrls":["'"${IMG[hoodie_4]}"'","'"${IMG[hoodie_2]}"'"],"status":"PRE_ORDER"}]}'

create '{"name":"Футболка базовая","description":"Джерси из чёсаного хлопка 100%, плотность 180 г/м² — не просвечивает и держит цвет после стирки. Прямой крой без бокового шва, аккуратная воротниковая резинка 2×2, которая не волнит со временем. База, которая одинаково хорошо садится под рубашку и работает соло; предусадочная обработка, размер не уплывает.","category":"Одежда","brand":"Blank","active":true,"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'","Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Белый","size":"S"},"priceOverride":1490,"stockQuantity":20,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"M"},"priceOverride":1490,"stockQuantity":18,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","size":"M"},"priceOverride":1490,"stockQuantity":14,"active":true,"imageUrls":["'"${IMG[tee]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Кроссовки «Ранэраунд»","description":"Лёгкие кроссовки для города и коротких пробежек: инженерная сетка сверху для вентиляции, бесшовные накладки в зонах износа, литая промежуточная подошва из EVA с ощутимым возвратом энергии. Вес одной пары в 42-м размере — около 240 г. Съёмная стелька с анатомическим профилем, светоотражающий логотип на пятке, шнурки в тон.","category":"Обувь","brand":"Runline","active":true,"labels":["Хит"],"colorSwatches":{"Белый":"'"${IMG[sw_white]}"'"},"variants":[
  {"attributes":{"color":"Белый","size":"40"},"priceOverride":5490,"stockQuantity":6,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"41"},"priceOverride":5490,"stockQuantity":9,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"42"},"priceOverride":5490,"stockQuantity":4,"active":true,"imageUrls":["'"${IMG[sneaker]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Шоппер «Сетка»","description":"Сумка-авоська из плотной хлопковой сетки: компактно сворачивается в карман, а раскрытая вмещает недельную продуктовую закупку и держит до 12 кг. Длинные ручки ложатся на плечо поверх верхней одежды. Стирается в машинке при 30°, не тянется под нагрузкой и не оставляет отпечатка на фруктах.","category":"Аксессуары","brand":"Adika","active":true,"variants":[
  {"attributes":{"color":"Белый","size":"One Size"},"priceOverride":790,"stockQuantity":30,"active":true,"imageUrls":["'"${IMG[shopper]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Бутылка спортивная","description":"Бутылка из ударопрочного тритана без BPA: прозрачные стенки с мерной шкалой до 1000 мл, чтобы отслеживать норму воды за день. Клапан-поилка открывается кнопкой под фиксатором от случайного нажатия в сумке. Широкое горло пропускает кубики льда и удобно моется ёршиком, крышка с петлёй под карабин.","category":"Бутылки","brand":"HydroKG","active":true,"labels":["Скидка"],"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","volume":"750"},"priceOverride":890,"stockQuantity":22,"active":true,"imageUrls":["'"${IMG[bottle]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Чёрный","volume":"1000"},"priceOverride":990,"stockQuantity":17,"active":true,"imageUrls":["'"${IMG[bottle]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Кепка классик","description":"Классическая шестипанельная кепка из плотного хлопкового твила с жёстким формованным козырьком. Прошитые люверсы для вентиляции, козырёк уже слегка подкручен, сзади — металлическая застёжка с фиксатором под любой обхват головы. Аккуратная объёмная вышивка спереди, подкладка по околышу впитывает влагу.","category":"Аксессуары","brand":"Blank","active":true,"colorSwatches":{"Чёрный":"'"${IMG[sw_black]}"'"},"variants":[
  {"attributes":{"color":"Чёрный","size":"One Size"},"priceOverride":1190,"stockQuantity":16,"active":true,"imageUrls":["'"${IMG[cap]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Белый","size":"One Size"},"priceOverride":1190,"stockQuantity":0,"active":true,"imageUrls":["'"${IMG[cap]}"'"],"status":"SOLD_OUT"}]}'

create '{"name":"Носки «Пак 3 шт»","description":"Набор из трёх пар высоких носков из чёсаного хлопка с добавлением эластана: усиленные мысок и пятка, плоский шов не давит на пальцы, широкая резинка держит голенище и не оставляет следов на коже. Нейтральные цвета, которые сочетаются со всем; выдерживают частую машинную стирку без потери формы.","category":"Одежда","brand":"Blank","active":true,"variants":[
  {"attributes":{"color":"Серебристый","size":"S"},"priceOverride":690,"stockQuantity":40,"active":true,"imageUrls":["'"${IMG[socks]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Серебристый","size":"L"},"priceOverride":690,"stockQuantity":35,"active":true,"imageUrls":["'"${IMG[socks]}"'"],"status":"IN_STOCK"}]}'

create '{"name":"Плед флисовый","description":"Плед из микрофибры-флиса плотностью 280 г/м² с двусторонним начёсом: лёгкий, согревает за минуту и почти не электризуется. Обработка антипиллинг — ворс не скатывается после стирок. Размер 150×200 см закрывает одного человека на диване целиком; края обработаны аккуратной декоративной строчкой в тон.","category":"Дом","brand":"Adika","active":true,"labels":["Уют"],"colorSwatches":{"Серебристый":"'"${IMG[sw_grey]}"'","Розовый":"'"${IMG[sw_pink]}"'"},"variants":[
  {"attributes":{"color":"Серебристый","size":"150x200"},"priceOverride":1990,"stockQuantity":11,"active":true,"imageUrls":["'"${IMG[blanket]}"'"],"status":"IN_STOCK"},
  {"attributes":{"color":"Розовый","size":"150x200"},"priceOverride":1990,"stockQuantity":6,"active":true,"imageUrls":["'"${IMG[blanket]}"'"],"status":"IN_STOCK"}]}'

echo
$C "$BASE/api/catalog/products?pageSize=100&includeArchived=true" \
  | "$PY" -c "import sys,json;d=json.load(sys.stdin);print('Catalog:',d['totalCount'],'products');[print('  -',p['name'],'|',p['category'],'|',len(p['variants']),'variants |',len(p.get('colorSwatches') or {}),'swatches') for p in d['items']]"
