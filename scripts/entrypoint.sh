#!/bin/sh
set -e

echo "🚀 Iniciando KOYOSIAT S.R.L. en Dokploy..."

# Sincronizar esquema de Prisma con PostgreSQL en Dokploy
echo "📦 Aplicando migraciones y esquema de base de datos..."
npx prisma db push --skip-generate

# Opcional: si la base de datos está vacía, correr seed de datos demo
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Poblando datos iniciales de demostración..."
  npx tsx prisma/seed.ts || true
fi

echo "✨ Arrancando servidor Fastify en puerto ${PORT:-3001}..."
exec npx tsx src/server.ts
