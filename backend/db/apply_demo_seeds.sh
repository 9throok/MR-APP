#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# apply_demo_seeds.sh — single-shot seeder for Phase B + Phase C demo data.
#
# Targets the local zenapp_local DB on the mrf-postgres docker container.
# Run from the repo root (parent of backend/) so the Node helper resolves
# its relative paths correctly.
#
# Usage:
#   bash backend/db/apply_demo_seeds.sh
#
# Override the target DB by exporting DATABASE_URL beforehand (currently
# unused — we shell out to docker exec — but kept here for symmetry with the
# canonical local-dev guide).
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-zenapp-postgres}"
DB_NAME="${POSTGRES_DB:-zenapp}"
DB_USER="${POSTGRES_USER:-postgres}"

# 1) Write placeholder regulatory PDFs (referenced by seed_regulatory_docs.sql)
echo "── Writing placeholder regulatory files ──"
node backend/scripts/seed_regulatory_files.js

# 1b) Write placeholder content-version files (referenced by seed_content.sql)
echo "── Writing placeholder content files ──"
node backend/scripts/seed_content_files.js

# 2) Apply SQL seeds in dependency order. Each is idempotent (TRUNCATE first).
SEEDS=(
  seed_institutions               # Institutions + HCP affiliations (FK base for KOLs/engagements)
  seed_territory_alignments       # MR ↔ territory history
  seed_consent                    # Per-doctor consent rows (drives compliance unconsented_contact)
  seed_kols                       # KOL profiles (referenced by engagements + audit_log)
  seed_medical_engagements        # Engagements + attendees
  seed_regulatory_docs            # Regulatory docs + versions (after Node helper writes files)
  seed_compliance_findings        # AI Watchdog inbox (references DCR/AE/expense ids)
  seed_audit_log                  # Audit ledger (references DCRs, MLR reviews, etc.)
  seed_medical_queries            # Medical query Q&A workflow
)

for seed in "${SEEDS[@]}"; do
  echo "── ${seed} ──"
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q \
    < "backend/db/${seed}.sql"
done

# 3) Generate + apply the 12-month synthetic activity history.
#    This step:
#      - TRUNCATEs and rebuilds dcr, rcpa, secondary_sales, mr_targets,
#        follow_up_tasks, content_views, nba_recommendations, adverse_events.
#      - APPENDs to compliance_findings, medical_queries, medical_engagements,
#        engagement_attendees, audit_log so the prior base seeds remain.
#    Re-running auto-rolls the date window forward — no rollover job needed.
echo "── seed_synthetic_activity (regenerating + applying) ──"
node backend/scripts/seed_synthetic_activity.js
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q \
  < "backend/db/seed_synthetic_activity.sql"

echo
echo "── Seed counts ──"
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
SELECT 'institutions'                AS t, COUNT(*) FROM institutions
UNION ALL SELECT 'hcp_affiliations',          COUNT(*) FROM hcp_affiliations
UNION ALL SELECT 'territory_alignments',      COUNT(*) FROM territory_alignments
UNION ALL SELECT 'consent_records',           COUNT(*) FROM consent_records
UNION ALL SELECT 'kol_profiles',              COUNT(*) FROM kol_profiles
UNION ALL SELECT 'medical_engagements',       COUNT(*) FROM medical_engagements
UNION ALL SELECT 'engagement_attendees',      COUNT(*) FROM engagement_attendees
UNION ALL SELECT 'regulatory_documents',      COUNT(*) FROM regulatory_documents
UNION ALL SELECT 'regulatory_doc_versions',   COUNT(*) FROM regulatory_document_versions
UNION ALL SELECT 'compliance_findings',       COUNT(*) FROM compliance_findings
UNION ALL SELECT 'audit_log',                 COUNT(*) FROM audit_log
UNION ALL SELECT 'medical_queries',           COUNT(*) FROM medical_queries
UNION ALL SELECT 'dcr',                       COUNT(*) FROM dcr
UNION ALL SELECT 'rcpa',                      COUNT(*) FROM rcpa
UNION ALL SELECT 'secondary_sales',           COUNT(*) FROM secondary_sales
UNION ALL SELECT 'mr_targets',                COUNT(*) FROM mr_targets
UNION ALL SELECT 'follow_up_tasks',           COUNT(*) FROM follow_up_tasks
UNION ALL SELECT 'content_views',             COUNT(*) FROM content_views
UNION ALL SELECT 'adverse_events',            COUNT(*) FROM adverse_events
UNION ALL SELECT 'nba_recommendations',       COUNT(*) FROM nba_recommendations
ORDER BY t;
SQL

echo
echo "✓ Demo seed applied to ${DB_NAME}"
