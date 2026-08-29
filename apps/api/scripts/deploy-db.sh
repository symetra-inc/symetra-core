#!/usr/bin/env bash
# =============================================================================
# deploy-db.sh — Executa as migrations do Prisma em produção
#
# QUANDO RODAR:
#   - Uma vez após o primeiro deploy do container
#   - A cada deploy que contenha novas migrations em prisma/migrations/
#
# COMO RODAR (Railway / Render — via "Run Command" no painel):
#   bash scripts/deploy-db.sh
#
# VARIÁVEIS NECESSÁRIAS (devem estar no ambiente):
#   DATABASE_URL  → Transaction Pooler do Supabase (porta 6543, pgbouncer=true)
#   DIRECT_URL    → Conexão direta ao Postgres (porta 5432) — usada pelo migrate
#
# ATENÇÃO: "prisma migrate deploy" aplica SOMENTE migrations já geradas e
# commitadas. Nunca use "prisma migrate dev" em produção.
# =============================================================================

set -euo pipefail

echo "▶ Aplicando migrations..."
npx prisma migrate deploy

echo "▶ Gerando Prisma Client..."
npx prisma generate

echo "✓ Banco atualizado com sucesso."
