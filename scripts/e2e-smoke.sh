#!/usr/bin/env bash
#
# End-to-end smoke test against a running full stack (docker-compose.prod.yml).
# Exercises the paths that unit tests can't: Flyway migrations, RabbitMQ round-trips,
# gateway routing, cross-service calls, Caddy headers.
#
# Usage: scripts/e2e-smoke.sh [BASE_URL] [ADMIN_USER] [ADMIN_PASS]
#   defaults: https://localhost  admin  devpassword
#
set -u
BASE="${1:-https://localhost}"
ADMIN_USER="${2:-admin}"
ADMIN_PASS="${3:-devpassword}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
C="curl -sk --max-time 15"

pass=0; fail=0
ok(){ echo "  ok   $1"; pass=$((pass+1)); }
no(){ echo "  FAIL $1"; fail=$((fail+1)); }
chk(){ [ "$1" = "$2" ] && ok "$3 ($1)" || no "$3 (got $1, want $2)"; }
nthid(){ echo "$1" | grep -o '"id":[0-9]*' | sed -n "${2}p" | grep -o '[0-9]*'; }
jstr(){ echo "$1" | sed -n "s/.*\"$2\":\"\([^\"]*\)\".*/\1/p"; }
RID="smoke$$x$RANDOM"

# a real 1x1 PNG
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' | base64 -d > "$WORK/px.png"

echo "== public catalog =="
chk "$($C -o "$WORK/p.json" -w '%{http_code}' "$BASE/api/catalog/products?pageSize=5")" 200 "GET /api/catalog/products"
grep -q '"items"' "$WORK/p.json" && ok "products payload shape" || no "products payload shape"
chk "$($C -o /dev/null -w '%{http_code}' "$BASE/api/catalog/categories")" 200 "GET /api/catalog/categories"

echo "== auth =="
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"username":"admin","password":"nope"}')" 401 "login wrong password"
TOK=$($C -XPOST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
TOK=$(jstr "$TOK" token)
[ -n "$TOK" ] && ok "admin login returns token" || { no "admin login (no token)"; echo "RESULT: $pass ok / $fail FAIL"; exit 1; }
H="Authorization: Bearer $TOK"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/catalog/products" -H 'Content-Type: application/json' -d '{}')" 401 "write without token -> 401"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/catalog/products" -H "Authorization: Bearer ${TOK%????}zzzz" -H 'Content-Type: application/json' -d '{}')" 401 "tampered token -> 401"

echo "== product CRUD (Flyway + JPA) =="
PROD="{\"name\":\"$RID\",\"description\":\"smoke\",\"category\":\"SMOKE\",\"active\":true,\"brand\":\"B\",\"labels\":[\"L\"],\"variants\":[{\"sku\":\"$RID-A\",\"attributes\":{\"color\":\"c\",\"size\":\"M\"},\"priceOverride\":1200,\"stockQuantity\":5,\"active\":true,\"imageUrls\":[],\"status\":\"IN_STOCK\"}]}"
R=$($C -XPOST "$BASE/api/catalog/products" -H "$H" -H 'Content-Type: application/json' -d "$PROD")
PID=$(nthid "$R" 1); VID=$(nthid "$R" 2)
[ -n "$PID" ] && ok "create product id=$PID variant=$VID" || no "create product ($R)"
echo "$R" | grep -q '"basePrice":1200' && ok "basePrice derived from variant" || no "basePrice"
chk "$($C -o /dev/null -w '%{http_code}' "$BASE/api/catalog/products/$PID")" 200 "GET product by id"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/catalog/products" -H "$H" -H 'Content-Type: application/json' -d '{"name":"","category":"x","active":true,"variants":[]}')" 400 "validation rejects blank name"
chk "$($C -o "$WORK/pr.json" -w '%{http_code}' "$BASE/api/catalog/variants/pricing?ids=$VID")" 200 "GET /api/catalog/variants/pricing"
grep -q "\"unitPrice\":1200" "$WORK/pr.json" && ok "pricing endpoint returns unit price" || no "pricing endpoint ($(cat "$WORK/pr.json"))"

echo "== media upload =="
# @- reads the file from stdin so the path stays a shell path (portable across git-bash/Linux)
R=$($C -XPOST "$BASE/api/media/upload" -H "$H" -F 'file=@-;type=image/png;filename=px.png' < "$WORK/px.png")
MURL=$(jstr "$R" url); KEY=$(echo "$MURL" | sed 's#.*/adikabuyer-media/##')
[ -n "$MURL" ] && ok "PNG upload accepted" || no "PNG upload ($R)"
printf '<svg xmlns="http://www.w3.org/2000/svg"><script>x</script></svg>' > "$WORK/x.svg"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/media/upload" -H "$H" -F 'file=@-;type=image/svg+xml;filename=x.svg' < "$WORK/x.svg")" 400 "SVG upload rejected"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/media/upload" -F 'file=@-;type=image/png;filename=px.png' < "$WORK/px.png")" 401 "media upload without token -> 401"
if [ -n "$KEY" ]; then
  CD=$($C -I "$BASE/media/adikabuyer-media/$KEY")
  echo "$CD" | grep -qiE '^HTTP.* 200' && ok "media served via Caddy" || no "media via Caddy"
  echo "$CD" | grep -qi 'content-disposition: *attachment' && ok "media Content-Disposition: attachment" || no "media CD header"
fi

echo "== checkout (cross-service re-pricing) =="
CART="{\"customerName\":\"Smoke\",\"customerPhone\":\"+996700000000\",\"region\":\"Osh\",\"items\":[{\"variantId\":$VID,\"productName\":\"Free iPhone\",\"sku\":\"STOLEN\",\"attributes\":{},\"unitPrice\":1,\"quantity\":2}]}"
R=$($C -XPOST "$BASE/api/orders/checkout" -H 'Content-Type: application/json' -d "$CART")
OID=$(jstr "$R" orderId)
[ -n "$OID" ] && ok "checkout -> $OID" || no "checkout ($R)"
echo "$R" | grep -q '"itemsTotal":2400' && ok "server re-prices to catalog 1200x2=2400 (ignores client price)" || no "re-pricing ($R)"
echo "$R" | grep -q '"deliveryFee":500' && ok "non-Bishkek delivery fee 500" || no "delivery fee"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/orders/checkout" -H 'Content-Type: application/json' -d '{"customerName":"x","customerPhone":"x","region":"Osh","items":[{"variantId":999999,"productName":"x","sku":"x","attributes":{},"unitPrice":1,"quantity":1}]}')" 400 "checkout unknown variant -> 400"
chk "$($C -o /dev/null -w '%{http_code}' -XPOST "$BASE/api/orders/checkout" -H 'Content-Type: application/json' -d "{\"customerName\":\"x\",\"customerPhone\":\"x\",\"region\":\"Osh\",\"items\":[{\"variantId\":$VID,\"productName\":\"x\",\"sku\":\"x\",\"attributes\":{},\"unitPrice\":1,\"quantity\":99999}]}")" 409 "checkout over-stock -> 409"

echo "== inventory deduction (RabbitMQ round-trip) =="
STK=""
for _ in $(seq 1 20); do
  STK=$($C "$BASE/api/catalog/products/$PID" | grep -o '"stockQuantity":[0-9]*' | head -1 | grep -o '[0-9]*')
  [ "$STK" = "3" ] && break
  sleep 2
done
chk "$STK" 3 "stock 5 -> 3 after order of 2 (OrderPlacedEvent consumed)"

echo "== orders admin =="
chk "$($C -o /dev/null -w '%{http_code}' "$BASE/api/orders")" 401 "GET /api/orders without token -> 401"
O=$($C "$BASE/api/orders" -H "$H")
echo "$O" | grep -q "$OID" && ok "new order in admin list" || no "order not in admin list"
echo "$O" | grep -q "\"productName\":\"$RID\"" && ok "order line uses catalog product name, not client's" || no "order productName ($(echo "$O" | head -c 200))"

echo "== cleanup =="
chk "$($C -o /dev/null -w '%{http_code}' -XDELETE "$BASE/api/catalog/products/$PID" -H "$H")" 204 "DELETE product -> 204"
[ -n "$OID" ] && chk "$($C -o /dev/null -w '%{http_code}' -XDELETE "$BASE/api/orders/$OID" -H "$H")" 200 "DELETE order -> 200"

echo "== SPA + security headers =="
chk "$($C -o "$WORK/idx.html" -w '%{http_code}' "$BASE/")" 200 "GET / (SPA)"
grep -q 'id="root"' "$WORK/idx.html" && ok "index.html served" || no "index.html body"
chk "$($C -o /dev/null -w '%{http_code}' "$BASE/admin")" 200 "GET /admin (SPA fallback)"
HD=$($C -I "$BASE/")
for h in content-security-policy x-content-type-options x-frame-options strict-transport-security referrer-policy permissions-policy; do
  echo "$HD" | grep -qi "^$h:" && ok "header $h present" || no "header $h missing"
done
echo "$HD" | grep -qi '^server:' && no "Server header leaked" || ok "Server header suppressed"

echo "== error envelope =="
$C "$BASE/api/catalog/products/999999" -o "$WORK/e.json"
grep -q '"message":"Product not found' "$WORK/e.json" && ok "404 returns clean message" || no "404 envelope"
grep -qiE 'exception|at com\.adikabuyer|Caused by' "$WORK/e.json" && no "404 leaks internals" || ok "404 hides internals"

echo
echo "RESULT: $pass ok / $fail FAIL"
[ "$fail" = 0 ]
