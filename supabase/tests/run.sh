#!/usr/bin/env bash
# RLS smoke test against a throwaway local Postgres (not Supabase). Usage: PGURI=postgres://... ./supabase/tests/run.sh
# Expect two "violates row-level security" errors (cross-course progress, foreign-ticket file); counts: 2, 0, 1, 1, 1.
set -euo pipefail
cd "$(dirname "$0")/.."
psql "$PGURI" -v ON_ERROR_STOP=1 -q -f tests/00_auth_stub.sql
for f in migrations/*.sql; do psql "$PGURI" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql "$PGURI" -q -f tests/rls_smoke.sql
