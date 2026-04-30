#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ZenApp AI Endpoint Test Script
#
# Prerequisites:
#   1. Docker containers running:  docker-compose -f docker-compose.local.yml up
#   2. DB seeded:                  docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed.sql
#
# Usage:
#   chmod +x test.sh
#   ./test.sh            # run all tests
#   ./test.sh precall    # run one test by name
# ─────────────────────────────────────────────────────────────────────────────

BASE_URL="http://localhost:3001"
TEST=${1:-all}   # pass a test name as arg to run just that one

# Colours
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

run_test() {
  local name=$1
  local method=$2
  local url=$3
  local body=$4

  if [ "$TEST" != "all" ] && [ "$TEST" != "$name" ]; then
    return
  fi

  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}TEST: $name${NC}"
  echo -e "${CYAN}$method $url${NC}"
  if [ -n "$body" ]; then
    echo "Body: $body"
  fi
  echo ""

  if [ "$method" = "GET" ]; then
    curl -s "$url" | jq .
  else
    curl -s -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$body" | jq .
  fi
}

# ── Health check ──────────────────────────────────────────────────────────────
run_test "health" \
  GET \
  "$BASE_URL/health"

# ── DCR: Create a new report ──────────────────────────────────────────────────
run_test "dcr-create" \
  POST \
  "$BASE_URL/api/dcr" \
  '{"user_id":"mr_rahul_001","name":"Dr. Anil Mehta","date":"'"$(date +%Y-%m-%d)"'","product":"Derise 10mg","samples":[{"id":1,"name":"Derise 10mg","quantity":2}],"callSummary":"Follow-up visit. Discussed allergy management progress. Dr. Anil Mehta reporting good patient tolerance.","doctor_feedback":"Patients showing improved compliance with once-daily dosing."}'

# ── DCR: Fetch all reports ────────────────────────────────────────────────────
run_test "dcr-list" \
  GET \
  "$BASE_URL/api/dcr"

# ── AI 1: Pre-call briefing ───────────────────────────────────────────────────
# Rahul preparing to visit Dr. Anil Mehta (4 past visits, pending side-effect question)
run_test "precall" \
  POST \
  "$BASE_URL/api/ai/precall-briefing" \
  '{"user_id":"mr_rahul_001","doctor_name":"Dr. Anil Mehta"}'

# ── AI 1b: Pre-call briefing for a cold doctor ───────────────────────────────
# Rahul preparing to visit Dr. Sunita Verma (going cold, low engagement)
run_test "precall-cold" \
  POST \
  "$BASE_URL/api/ai/precall-briefing" \
  '{"user_id":"mr_rahul_001","doctor_name":"Dr. Sunita Verma"}'

# ── AI 2: Territory gap — Rahul ───────────────────────────────────────────────
# Dr. Sunita Verma not visited 40 days, Dr. Pradeep Joshi is new but promising
run_test "territory-rahul" \
  GET \
  "$BASE_URL/api/ai/territory-gap/mr_rahul_001?threshold_days=30"

# ── AI 2b: Territory gap — Priya ─────────────────────────────────────────────
# Dr. Rajesh Kapoor cold for 50 days despite previously being high potential
run_test "territory-priya" \
  GET \
  "$BASE_URL/api/ai/territory-gap/mr_priya_002?threshold_days=30"

# ── AI 3: Manager query — team overview ───────────────────────────────────────
run_test "manager-query-overview" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"Which MR had the most doctor visits with concerns or negative feedback?","user_ids":["mr_rahul_001","mr_priya_002","mr_robert_003"]}'

# ── AI 3b: Manager query — product specific ───────────────────────────────────
run_test "manager-query-product" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"How is Derise performing across the team? Are there common objections?","user_ids":["mr_rahul_001","mr_priya_002","mr_robert_003"]}'

# ── AI 3c: Manager query — date filtered ─────────────────────────────────────
run_test "manager-query-recent" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"What happened in the last 30 days? Summarise key wins and concerns.","user_ids":["mr_rahul_001","mr_priya_002","mr_robert_003"],"from_date":"'"$(date -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)"'","to_date":"'"$(date +%Y-%m-%d)"'"}'

# ── AI 4: Product signals — all products ─────────────────────────────────────
run_test "product-signals" \
  GET \
  "$BASE_URL/api/ai/product-signals"

# ── AI 4b: Product signals — date filtered ───────────────────────────────────
run_test "product-signals-recent" \
  GET \
  "$BASE_URL/api/ai/product-signals?from_date=$(date -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)&to_date=$(date +%Y-%m-%d)"

# ── Tour Plans (auth-required, uses JWT) ─────────────────────────────────────
# These tests obtain a JWT for `rahul` (MR) and `manager1` (Manager), then drive
# the full lifecycle: list → create → submit → manager review → list.
# Skipped if the auth login fails (e.g. seed_users hasn't been applied).

if [ "$TEST" = "all" ] || [[ "$TEST" == tour-plans* ]]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Tour Plans lifecycle (auth-aware)${NC}"
  echo ""

  MR_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rahul","password":"password123"}' | jq -r '.token // empty')
  MGR_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager1","password":"password123"}' | jq -r '.token // empty')

  if [ -z "$MR_TOKEN" ] || [ -z "$MGR_TOKEN" ]; then
    echo "⚠  Skipping tour-plans tests — login failed. Have you seeded users?"
  else
    echo "MR token  : ${MR_TOKEN:0:20}..."
    echo "MGR token : ${MGR_TOKEN:0:20}..."

    # List as MR (sees own only)
    echo ""
    echo -e "${CYAN}GET /api/tour-plans  (as MR)${NC}"
    curl -s "$BASE_URL/api/tour-plans" -H "Authorization: Bearer $MR_TOKEN" | jq '.data | length as $n | "found \($n) plans"'

    # Create draft
    echo ""
    echo -e "${CYAN}POST /api/tour-plans  (create draft)${NC}"
    PLAN_DATE="$(date -d '+5 days' +%Y-%m-%d 2>/dev/null || date -v+5d +%Y-%m-%d)"
    NEW_PLAN=$(curl -s -X POST "$BASE_URL/api/tour-plans" \
      -H "Authorization: Bearer $MR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"plan_date":"'"$PLAN_DATE"'","type_of_tour":"field_work","station":"Mumbai","start_time":"09:00","end_time":"17:00","notes":"E2E test plan","visits":[{"doctor_id":1,"doctor_name":"Dr. Anil Mehta","visit_order":1,"notes":"Discuss new product"}]}')
    echo "$NEW_PLAN" | jq '{id: .data.id, status: .data.status, visits: (.data.visits | length)}'
    PLAN_ID=$(echo "$NEW_PLAN" | jq -r '.data.id')

    # Submit
    echo ""
    echo -e "${CYAN}POST /api/tour-plans/$PLAN_ID/submit  (MR submits)${NC}"
    curl -s -X POST "$BASE_URL/api/tour-plans/$PLAN_ID/submit" \
      -H "Authorization: Bearer $MR_TOKEN" | jq '{status: .data.status, submitted_at: .data.submitted_at}'

    # Manager: pending count
    echo ""
    echo -e "${CYAN}GET /api/tour-plans/stats  (manager — pending count)${NC}"
    curl -s "$BASE_URL/api/tour-plans/stats" -H "Authorization: Bearer $MGR_TOKEN" | jq .

    # Manager approves
    echo ""
    echo -e "${CYAN}PATCH /api/tour-plans/$PLAN_ID/review  (manager approves)${NC}"
    curl -s -X PATCH "$BASE_URL/api/tour-plans/$PLAN_ID/review" \
      -H "Authorization: Bearer $MGR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"approved","review_notes":"E2E approval"}' \
      | jq '{status: .data.status, reviewed_by: .data.reviewed_by}'

    # Get final state
    echo ""
    echo -e "${CYAN}GET /api/tour-plans/$PLAN_ID  (final state with visits)${NC}"
    curl -s "$BASE_URL/api/tour-plans/$PLAN_ID" -H "Authorization: Bearer $MR_TOKEN" \
      | jq '{id: .data.id, status: .data.status, review_notes: .data.review_notes, visit_count: (.data.visits | length)}'
  fi
fi

# ── Expense Claims (auth-required, uses JWT) ────────────────────────────────
# Lifecycle: login → create → add line items → submit → manager review.
# Skipped if login fails (e.g., users not seeded).

if [ "$TEST" = "all" ] || [[ "$TEST" == expenses* ]]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Expense Claims lifecycle (auth-aware)${NC}"
  echo ""

  MR_TOKEN=${MR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rahul","password":"password123"}' | jq -r '.token // empty')}
  MGR_TOKEN=${MGR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager1","password":"password123"}' | jq -r '.token // empty')}

  if [ -z "$MR_TOKEN" ] || [ -z "$MGR_TOKEN" ]; then
    echo "⚠  Skipping expenses tests — login failed."
  else
    echo ""
    echo -e "${CYAN}GET /api/expenses  (as MR — should see own only)${NC}"
    curl -s "$BASE_URL/api/expenses" -H "Authorization: Bearer $MR_TOKEN" | jq '.data | length as $n | "found \($n) claims"'

    echo ""
    echo -e "${CYAN}POST /api/expenses  (create draft with mixed line types)${NC}"
    PERIOD_START="$(date +%Y-%m-01)"
    PERIOD_END="$(date -d 'last day of this month' +%Y-%m-%d 2>/dev/null || date -v+1m -v1d -v-1d +%Y-%m-%d)"
    NEW=$(curl -s -X POST "$BASE_URL/api/expenses" \
      -H "Authorization: Bearer $MR_TOKEN" -H "Content-Type: application/json" \
      -d '{
        "period_start":"'"$PERIOD_START"'","period_end":"'"$PERIOD_END"'","notes":"E2E test claim",
        "line_items":[
          {"claim_type":"local_conveyance","expense_date":"'"$(date +%Y-%m-%d)"'","amount":120,"conveyance_mode":"bike","distance_km":20,"rate_per_km":6,"from_place":"Office","to_place":"Hospital"},
          {"claim_type":"general_expense","expense_date":"'"$(date +%Y-%m-%d)"'","amount":500,"description":"Stationery"}
        ]
      }')
    echo "$NEW" | jq '{id: .data.id, status: .data.status, total: .data.total_amount, line_count: (.data.line_items | length)}'
    CLAIM_ID=$(echo "$NEW" | jq -r '.data.id')

    echo ""
    echo -e "${CYAN}POST /api/expenses/$CLAIM_ID/submit  (MR submits)${NC}"
    curl -s -X POST "$BASE_URL/api/expenses/$CLAIM_ID/submit" \
      -H "Authorization: Bearer $MR_TOKEN" | jq '{status: .data.status, submitted_at: .data.submitted_at}'

    echo ""
    echo -e "${CYAN}GET /api/expenses/stats  (manager — pending count + total)${NC}"
    curl -s "$BASE_URL/api/expenses/stats" -H "Authorization: Bearer $MGR_TOKEN" | jq .

    echo ""
    echo -e "${CYAN}PATCH /api/expenses/$CLAIM_ID/review  (manager approves)${NC}"
    curl -s -X PATCH "$BASE_URL/api/expenses/$CLAIM_ID/review" \
      -H "Authorization: Bearer $MGR_TOKEN" -H "Content-Type: application/json" \
      -d '{"status":"approved","review_notes":"E2E approval"}' \
      | jq '{status: .data.status, reviewed_by: .data.reviewed_by}'
  fi
fi

# ── Leaves (auth-required, uses JWT) ────────────────────────────────────────
# Lifecycle: apply → list → manager review → balance check.

if [ "$TEST" = "all" ] || [[ "$TEST" == leaves* ]]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Leaves lifecycle (auth-aware)${NC}"
  echo ""

  MR_TOKEN=${MR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rahul","password":"password123"}' | jq -r '.token // empty')}
  MGR_TOKEN=${MGR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager1","password":"password123"}' | jq -r '.token // empty')}

  if [ -z "$MR_TOKEN" ] || [ -z "$MGR_TOKEN" ]; then
    echo "⚠  Skipping leaves tests — login failed."
  else
    echo ""
    echo -e "${CYAN}GET /api/leaves/balances  (MR's current-year ledger)${NC}"
    curl -s "$BASE_URL/api/leaves/balances" -H "Authorization: Bearer $MR_TOKEN" \
      | jq '.data.balances | map({type: .leave_type, alloc: .allocated_days, used: .used_days, remaining: .remaining_days})'

    echo ""
    echo -e "${CYAN}POST /api/leaves  (apply for half-day sick leave, session_1)${NC}"
    LEAVE_DATE="$(date -d '+10 days' +%Y-%m-%d 2>/dev/null || date -v+10d +%Y-%m-%d)"
    NEW=$(curl -s -X POST "$BASE_URL/api/leaves" \
      -H "Authorization: Bearer $MR_TOKEN" -H "Content-Type: application/json" \
      -d '{"leave_type":"sick_leave","from_date":"'"$LEAVE_DATE"'","to_date":"'"$LEAVE_DATE"'","from_session":"session_1","to_session":"session_1","reason":"E2E test","contact_details":"+91-9999999999"}')
    echo "$NEW" | jq '{id: .data.id, type: .data.leave_type, days: .data.total_days, status: .data.status}'
    LEAVE_ID=$(echo "$NEW" | jq -r '.data.id')

    echo ""
    echo -e "${CYAN}GET /api/leaves/stats  (manager — pending count)${NC}"
    curl -s "$BASE_URL/api/leaves/stats" -H "Authorization: Bearer $MGR_TOKEN" | jq .

    echo ""
    echo -e "${CYAN}PATCH /api/leaves/$LEAVE_ID/review  (manager approves)${NC}"
    curl -s -X PATCH "$BASE_URL/api/leaves/$LEAVE_ID/review" \
      -H "Authorization: Bearer $MGR_TOKEN" -H "Content-Type: application/json" \
      -d '{"status":"approved","review_notes":"E2E approval"}' \
      | jq '{status: .data.status, reviewed_by: .data.reviewed_by, days: .data.total_days}'

    echo ""
    echo -e "${CYAN}GET /api/leaves/balances  (MR ledger after approval — used should bump)${NC}"
    curl -s "$BASE_URL/api/leaves/balances" -H "Authorization: Bearer $MR_TOKEN" \
      | jq '.data.balances | map(select(.leave_type=="sick_leave")) | map({alloc: .allocated_days, used: .used_days, remaining: .remaining_days})'
  fi
fi

# ── Orders (auth-required, uses JWT) ────────────────────────────────────────
# Lifecycle: list → create → status transition → fulfilled.

if [ "$TEST" = "all" ] || [[ "$TEST" == orders* ]]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Orders lifecycle (auth-aware)${NC}"
  echo ""

  MR_TOKEN=${MR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rahul","password":"password123"}' | jq -r '.token // empty')}
  MGR_TOKEN=${MGR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager1","password":"password123"}' | jq -r '.token // empty')}

  if [ -z "$MR_TOKEN" ] || [ -z "$MGR_TOKEN" ]; then
    echo "⚠  Skipping orders tests — login failed."
  else
    echo ""
    echo -e "${CYAN}GET /api/orders  (MR sees own only)${NC}"
    curl -s "$BASE_URL/api/orders" -H "Authorization: Bearer $MR_TOKEN" \
      | jq '.data | map({id, customer_type, customer_name, status, total: (.total_amount | tonumber)})'

    echo ""
    echo -e "${CYAN}POST /api/orders  (MR creates a new order to a doctor)${NC}"
    NEW=$(curl -s -X POST "$BASE_URL/api/orders" \
      -H "Authorization: Bearer $MR_TOKEN" -H "Content-Type: application/json" \
      -d '{"customer_type":"doctor","customer_id":1,"notes":"E2E test order","line_items":[{"product_id":1,"product_name":"Derise 10mg","quantity":50,"unit_price":8.00},{"product_id":2,"product_name":"Derise 20mg","quantity":25,"unit_price":14.00}]}')
    echo "$NEW" | jq '{id: .data.id, status: .data.status, total: .data.total_amount, lines: (.data.line_items | length)}'
    OID=$(echo "$NEW" | jq -r '.data.id')

    echo ""
    echo -e "${CYAN}GET /api/orders/stats  (manager view)${NC}"
    curl -s "$BASE_URL/api/orders/stats" -H "Authorization: Bearer $MGR_TOKEN" | jq .

    echo ""
    echo -e "${CYAN}PATCH /api/orders/$OID/status  (manager fulfills the order)${NC}"
    curl -s -X PATCH "$BASE_URL/api/orders/$OID/status" \
      -H "Authorization: Bearer $MGR_TOKEN" -H "Content-Type: application/json" \
      -d '{"status":"fulfilled"}' \
      | jq '{status: .data.status, total: .data.total_amount}'
  fi
fi

# ── Samples (auth-required, uses JWT) ──────────────────────────────────────
# Lifecycle: list stock → allocate (manager) → return → adjust → audit trail.

if [ "$TEST" = "all" ] || [[ "$TEST" == samples* ]]; then
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Samples lifecycle (auth-aware)${NC}"
  echo ""

  MR_TOKEN=${MR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rahul","password":"password123"}' | jq -r '.token // empty')}
  MGR_TOKEN=${MGR_TOKEN:-$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager1","password":"password123"}' | jq -r '.token // empty')}

  if [ -z "$MR_TOKEN" ] || [ -z "$MGR_TOKEN" ]; then
    echo "⚠  Skipping samples tests — login failed."
  else
    echo ""
    echo -e "${CYAN}GET /api/samples/stock  (MR sees own stock only)${NC}"
    curl -s "$BASE_URL/api/samples/stock" -H "Authorization: Bearer $MR_TOKEN" \
      | jq '.data | map({product_name, lot_number, quantity, expiry_date})'

    echo ""
    echo -e "${CYAN}POST /api/samples/allocate  (manager allocates new lot)${NC}"
    curl -s -X POST "$BASE_URL/api/samples/allocate" \
      -H "Authorization: Bearer $MGR_TOKEN" -H "Content-Type: application/json" \
      -d '{"user_id":"mr_rahul_001","product_id":1,"lot_number":"E2E-LOT-1","expiry_date":"2027-12-31","quantity":50,"notes":"E2E test allocation"}' \
      | jq '{movement_type: .data.movement.movement_type, qty: .data.movement.quantity, stock_after: .data.stock.quantity}'

    echo ""
    echo -e "${CYAN}POST /api/samples/return  (MR returns 10 units)${NC}"
    curl -s -X POST "$BASE_URL/api/samples/return" \
      -H "Authorization: Bearer $MR_TOKEN" -H "Content-Type: application/json" \
      -d '{"product_id":1,"lot_number":"E2E-LOT-1","quantity":10,"notes":"Surplus stock"}' \
      | jq '{movement_type: .data.movement.movement_type, qty: .data.movement.quantity, stock_after: .data.stock.quantity}'
  fi
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}All tests done.${NC}"
echo ""
