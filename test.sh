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
  '{"user_id":"mr_rahul_001","name":"Dr. Kapoor","date":"'"$(date +%Y-%m-%d)"'","product":"Cardiozen","samples":2,"callSummary":"Follow-up visit. Provided clinical trial data on elderly patients as requested. Dr. Kapoor now more confident about prescribing.","rating":4}'

# ── DCR: Fetch all reports ────────────────────────────────────────────────────
run_test "dcr-list" \
  GET \
  "$BASE_URL/api/dcr"

# ── AI 1: Pre-call briefing ───────────────────────────────────────────────────
# Rahul preparing to visit Dr. Kapoor (4 past visits, pending side-effect question)
run_test "precall" \
  POST \
  "$BASE_URL/api/ai/precall-briefing" \
  '{"user_id":"mr_rahul_001","doctor_name":"Dr. Kapoor"}'

# ── AI 1b: Pre-call briefing for a cold doctor ───────────────────────────────
# Rahul preparing to visit Dr. Nair (going cold, low ratings)
run_test "precall-cold" \
  POST \
  "$BASE_URL/api/ai/precall-briefing" \
  '{"user_id":"mr_rahul_001","doctor_name":"Dr. Nair"}'

# ── AI 2: Territory gap — Rahul ───────────────────────────────────────────────
# Dr. Nair not visited 40 days, Dr. Sinha is new but promising
run_test "territory-rahul" \
  GET \
  "$BASE_URL/api/ai/territory-gap/mr_rahul_001?threshold_days=30"

# ── AI 2b: Territory gap — Priya ─────────────────────────────────────────────
# Dr. Joshi cold for 50 days despite previously being high potential
run_test "territory-priya" \
  GET \
  "$BASE_URL/api/ai/territory-gap/mr_priya_002?threshold_days=30"

# ── AI 3: Manager query — team overview ───────────────────────────────────────
run_test "manager-query-overview" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"Which MR had the most low-rated calls and why?","user_ids":["mr_rahul_001","mr_priya_002"]}'

# ── AI 3b: Manager query — product specific ───────────────────────────────────
run_test "manager-query-product" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"How is Lipidex performing across the team? Are there common objections?","user_ids":["mr_rahul_001","mr_priya_002"]}'

# ── AI 3c: Manager query — date filtered ─────────────────────────────────────
run_test "manager-query-recent" \
  POST \
  "$BASE_URL/api/ai/manager-query" \
  '{"query":"What happened in the last 30 days? Summarise key wins and concerns.","user_ids":["mr_rahul_001","mr_priya_002"],"from_date":"'"$(date -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)"'","to_date":"'"$(date +%Y-%m-%d)"'"}'

# ── AI 4: Product signals — all products ─────────────────────────────────────
run_test "product-signals" \
  GET \
  "$BASE_URL/api/ai/product-signals"

# ── AI 4b: Product signals — date filtered ───────────────────────────────────
run_test "product-signals-recent" \
  GET \
  "$BASE_URL/api/ai/product-signals?from_date=$(date -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)&to_date=$(date +%Y-%m-%d)"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}All tests done.${NC}"
echo ""
