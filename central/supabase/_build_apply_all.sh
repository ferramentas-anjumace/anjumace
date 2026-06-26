#!/usr/bin/env bash
# Concatena todas as migrations em _apply_all.sql, na ordem numérica.
# Rode da pasta central/: bash supabase/_build_apply_all.sh
set -euo pipefail
cd "$(dirname "$0")"

out="_apply_all.sql"
files=(migrations/[0-9]*.sql)
last="${files[-1]##*/}"; last="${last%%_*}"
first="${files[0]##*/}"; first="${first%%_*}"

{
  echo "-- ============================================================================"
  echo "-- Central Anju — TODAS as migrations (${first}→${last}) concatenadas para o SQL Editor"
  echo "-- Gerado automaticamente por _build_apply_all.sh. NÃO edite à mão."
  echo "-- Rode INTEIRO no Supabase → SQL Editor → New query → Run. Idempotente."
  echo "-- ============================================================================"
  echo
  for f in "${files[@]}"; do
    name="${f##*/}"
    echo
    echo "-- >>>>>>>>>>>>>>>>>>>> ${name} >>>>>>>>>>>>>>>>>>>>"
    echo
    cat "$f"
  done
} > "$out"

echo "Gerado $out a partir de ${#files[@]} migrations (${first}→${last})."
